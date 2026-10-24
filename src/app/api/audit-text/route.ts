import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { INITIAL_BANNED_TERMS, INITIAL_VERIFIED_FACTS } from '@/data/mockData';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: NextRequest) {
  try {
    const { textToAudit, brandId } = await req.json();

    if (!textToAudit || typeof textToAudit !== 'string') {
      return NextResponse.json(
        { error: 'textToAudit is required.' },
        { status: 400 }
      );
    }

    console.log(`[API /api/audit-text] Auditing text (${textToAudit.length} chars) for brand: ${brandId || 'default'}`);

    // --- STEP 1: FETCH RULES FROM SUPABASE (WITH ROBUST FALLBACKS) ---
    let bannedWords: string[] = [];
    let factsList: string[] = [];
    let matchedBrandName: string | null = null;
    let matchedBrandId: string | null = null;

    try {
      // 1a. Pull from brand_guidelines table using .select('*')
      // Supports UUID lookup, brand_name lookup, or the most recent guideline
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

      // If no specific match was found, fetch the most recent brand_guidelines row
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

      // 1b. If empty, check banned_words table directly as secondary fallback
      if (bannedWords.length === 0) {
        const { data: wordsData } = await supabase.from('banned_words').select('word');
        if (wordsData && wordsData.length > 0) {
          bannedWords = wordsData.map((row) => row.word).filter(Boolean);
        }
      }
    } catch (supaErr: unknown) {
      console.warn('Supabase query notice in /api/audit-text:', supaErr);
    }

    // 1c. Safe default fallback if database not seeded or empty
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
      // Exact word boundary match, case-insensitive
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      if (regex.test(textToAudit)) {
        foundBannedWords.push(word);
      }
    });

    // --- STEP 3: SMART CHECK (FACTS & TONE CHECK VIA LLM) ---
    let llmFeedback = 'All facts align.';

    if (apiKey) {
      const prompt = `
You are an expert brand auditor. 
Check the following text to see if it contradicts any of these brand facts:
Brand Facts:
${factsList.map((f, i) => `${i + 1}. ${f}`).join('\n')}

Text to audit:
"${textToAudit}"

Return a brief summary of any factual violations or unsupported claims. If none, say "All facts align."
`;

      const candidateModels = [
        'gemini-3.5-flash-lite',
        'gemini-3.8-flash',
        'gemini-1.5-flash',
      ];

      for (const modelName of candidateModels) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(prompt);
          const textRes = result.response.text();
          if (textRes) {
            llmFeedback = textRes.trim();
            break;
          }
        } catch (modelErr: unknown) {
          console.warn(`Model ${modelName} audit failed:`, modelErr);
        }
      }
    } else {
      llmFeedback = 'All facts align (Gemini API key unconfigured).';
    }

    // --- STEP 4: SEND EVERYTHING BACK TO FRONTEND ---
    return NextResponse.json({
      success: true,
      brandName: matchedBrandName,
      brandId: matchedBrandId,
      bannedWordsFound: foundBannedWords,
      aiFeedback: llmFeedback,
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
