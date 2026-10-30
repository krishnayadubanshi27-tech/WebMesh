import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { INITIAL_BANNED_TERMS, INITIAL_VERIFIED_FACTS } from '@/data/mockData';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || '';
    const { textToAudit, brandId, isCloudMode = true } = await req.json();

    if (!textToAudit || typeof textToAudit !== 'string') {
      return NextResponse.json(
        { error: 'textToAudit is required.' },
        { status: 400 }
      );
    }

    console.log(`[API /api/audit-text] Auditing text (${textToAudit.length} chars) | Mode: ${isCloudMode ? 'Cloud (Gemini)' : 'Local (Ollama: phi4-mini)'}`);

    // --- STEP 1: FETCH RULES FROM SUPABASE (WITH ROBUST FALLBACKS) ---
    let bannedWords: string[] = [];
    let factsList: string[] = [];
    let matchedBrandName: string | null = null;
    let matchedBrandId: string | null = null;

    try {
      const isUuid =
        typeof brandId === 'string' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(brandId);

      let guidelineRecord: any = null;

      if (isUuid) {
        const { data } = await supabase
          .from('brand_guidelines')
          .select('*')
          .eq('id', brandId)
          .maybeSingle();
        guidelineRecord = data;
      } else if (brandId && typeof brandId === 'string' && isNaN(Number(brandId))) {
        const { data } = await supabase
          .from('brand_guidelines')
          .select('*')
          .eq('brand_name', brandId)
          .maybeSingle();
        guidelineRecord = data;
      }

      if (!guidelineRecord) {
        const { data } = await supabase
          .from('brand_guidelines')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        guidelineRecord = data;
      }

      if (guidelineRecord) {
        matchedBrandName = guidelineRecord.brand_name || null;
        matchedBrandId = guidelineRecord.id || null;

        if (Array.isArray(guidelineRecord.banned_words)) {
          bannedWords = guidelineRecord.banned_words.map((w: unknown) =>
            typeof w === 'string' ? w : (w as { word?: string })?.word || ''
          ).filter(Boolean);
        }
        if (Array.isArray(guidelineRecord.facts)) {
          factsList = guidelineRecord.facts.map((f: unknown) =>
            typeof f === 'string' ? f : (f as { claim?: string })?.claim || ''
          ).filter(Boolean);
        }
      }

      if (bannedWords.length === 0) {
        const { data: wordsData } = await supabase.from('banned_words').select('word');
        if (wordsData && wordsData.length > 0) {
          bannedWords = wordsData.map((row) => row.word).filter(Boolean);
        }
      }
    } catch (supaErr: unknown) {
      console.warn('Supabase query notice in /api/audit-text:', supaErr);
    }

    if (bannedWords.length === 0) {
      bannedWords = INITIAL_BANNED_TERMS.map((t) => t.term);
    }
    if (factsList.length === 0) {
      factsList = INITIAL_VERIFIED_FACTS.map((f) => f.claim);
    }

    // --- STEP 2: FAST CHECK (FIND BANNED WORDS USING REGEX) ---
    const foundBannedWords: string[] = [];
    bannedWords.forEach((word) => {
      if (!word) return;
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      if (regex.test(textToAudit)) {
        foundBannedWords.push(word);
      }
    });

    // --- STEP 3: SMART CHECK (FACTS & TONE CHECK VIA LLM: GEMINI OR OLLAMA) ---
    let llmFeedback: string | null = null;
    let aiError: string | null = null;

    const auditPrompt = `
You are an expert brand auditor. 
Check the following text to see if it contradicts any of these brand facts:
Brand Facts:
${factsList.map((f, i) => `${i + 1}. ${f}`).join('\n')}

Text to audit:
"${textToAudit}"

Return a brief summary of any factual violations or unsupported claims. If none, say "All facts align."
`;

    if (isCloudMode) {
      // --- ROUTE TO CLOUD GEMINI ---
      if (!apiKey || apiKey.trim() === '') {
        aiError =
          'Invalid API Key: GEMINI_API_KEY is not configured in .env.local. Please add a valid Google AI Studio key starting with AIza...';
      } else {
        const genAI = new GoogleGenerativeAI(apiKey);
        const candidateModels = [
          'gemini-3.5-flash-lite',
          'gemini-3.8-flash',
          'gemini-1.5-flash',
        ];

        let lastError: unknown = null;

        for (const modelName of candidateModels) {
          try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(auditPrompt);
            const textRes = result.response.text();
            if (textRes) {
              llmFeedback = textRes.trim();
              break;
            }
          } catch (modelErr: unknown) {
            console.warn(`Model ${modelName} audit failed:`, modelErr);
            lastError = modelErr;
          }
        }

        if (!llmFeedback && lastError) {
          const rawMsg = lastError instanceof Error ? lastError.message : String(lastError);
          if (rawMsg.includes('API key not valid') || rawMsg.includes('API_KEY_INVALID')) {
            aiError =
              'Invalid API Key: The GEMINI_API_KEY in .env.local is invalid or not recognized by Google AI Studio. Please verify your key at https://aistudio.google.com/app/apikey.';
          } else if (rawMsg.includes('RESOURCE_EXHAUSTED') || rawMsg.includes('quota') || rawMsg.includes('429')) {
            aiError = 'Gemini Quota Exceeded: Your Google Gemini API rate limit or project quota has been reached.';
          } else {
            aiError = `Gemini API Error: ${rawMsg}`;
          }
        }
      }
    } else {
      // --- ROUTE TO LOCAL OLLAMA (phi4-mini) ---
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const ollamaRes = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'phi4-mini',
            prompt: auditPrompt,
            stream: false,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!ollamaRes.ok) {
          const errText = await ollamaRes.text().catch(() => '');
          aiError = `Ollama Error (phi4-mini HTTP ${ollamaRes.status}): ${errText || ollamaRes.statusText}`;
        } else {
          const ollamaData = await ollamaRes.json();
          llmFeedback = ollamaData.response ? ollamaData.response.trim() : 'All facts align.';
        }
      } catch (ollamaErr: unknown) {
        const rawMsg = ollamaErr instanceof Error ? ollamaErr.message : String(ollamaErr);
        const isConnRefused =
          rawMsg.toLowerCase().includes('econnrefused') ||
          rawMsg.toLowerCase().includes('fetch failed') ||
          rawMsg.toLowerCase().includes('connection refused') ||
          rawMsg.toLowerCase().includes('abort') ||
          rawMsg.toLowerCase().includes('timeout') ||
          rawMsg.toLowerCase().includes('networkerror');

        if (isConnRefused) {
          aiError =
            'Connection Refused: Local Ollama daemon is not running at http://localhost:11434. Please start it with "ollama serve" and verify model "phi4-mini" is installed ("ollama run phi4-mini").';
        } else {
          aiError = `Ollama Connection Error (phi4-mini): ${rawMsg}`;
        }
      }
    }

    // --- STEP 4: SEND RESPONSE WITH HIGH-PRECISION ERROR REPORTING ---
    return NextResponse.json({
      success: true,
      brandName: matchedBrandName,
      brandId: matchedBrandId,
      bannedWordsFound: foundBannedWords,
      aiFeedback: llmFeedback,
      aiError: aiError,
      isCloudMode: isCloudMode,
      factsCheckedCount: factsList.length,
      bannedWordsCheckedCount: bannedWords.length,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Audit failed';
    console.error('Error in /api/audit-text:', error);
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
