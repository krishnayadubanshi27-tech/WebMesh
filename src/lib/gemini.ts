import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini with server environment variable
const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export interface ExtractedBannedWord {
  word: string;
  category?: 'Tone' | 'Legal' | 'Superlative' | 'Jargon' | string;
  severity?: 'critical' | 'warning' | 'discouraged' | 'suggestion';
  reason?: string;
  alternatives?: string[];
}

export interface ExtractedFact {
  claim: string;
  source?: string;
  category?: string;
}

export interface ExtractedColor {
  name: string;
  hex: string;
  role?: string;
}

export interface ExtractedBrandData {
  banned_words: ExtractedBannedWord[];
  facts: ExtractedFact[];
  hex_colors: ExtractedColor[];
}

function formatGeminiError(error: unknown, fallbackMessage: string): Error {
  if (!error) return new Error(fallbackMessage);
  const rawMsg = error instanceof Error ? error.message : String(error);

  if (rawMsg.includes('API key not valid') || rawMsg.includes('API_KEY_INVALID')) {
    return new Error(
      'Invalid API Key: The GEMINI_API_KEY in .env.local is invalid or not recognized by Google AI Studio. Please add a valid key starting with "AIzaSy..." at https://aistudio.google.com/app/apikey.'
    );
  }
  if (rawMsg.includes('RESOURCE_EXHAUSTED') || rawMsg.includes('quota') || rawMsg.includes('429')) {
    return new Error('Gemini Quota Exceeded: Your Google Gemini API rate limit or project quota has been reached.');
  }
  if (rawMsg.includes('FETCH_ERROR') || rawMsg.includes('Failed to fetch') || rawMsg.includes('ENOTFOUND')) {
    return new Error(`Gemini Network Error: Could not connect to Google Generative AI servers. (${rawMsg})`);
  }

  return new Error(`Gemini Error: ${rawMsg}`);
}

/**
 * Sends PDF or guideline text to Gemini, forces JSON output, and parses the extracted brand governance rules.
 */
export async function extractBrandRules(pdfText: string): Promise<ExtractedBrandData> {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error(
      'Invalid API Key: GEMINI_API_KEY is not defined in environment variables (.env.local). Please add a valid Google AI Studio key starting with AIzaSy...'
    );
  }

  // Model fallback chain: try available Gemini models
  const candidateModels = [
    'gemini-3.5-flash-lite',
    'gemini-3.8-flash',
    'gemini-1.5-flash',
  ];

  let lastError: unknown = null;

  for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const prompt = `
You are an expert enterprise brand governance and legal compliance AI for BrandMesh.
Analyze the provided brand guidelines / styleguide text and extract key governance rules.

Return ONLY a valid JSON object with this exact structure:
{
  "banned_words": [
    {
      "word": "prohibited word or phrase",
      "category": "Tone | Legal | Superlative | Jargon",
      "severity": "critical | warning | discouraged | suggestion",
      "reason": "Clear explanation of why this word or phrase is restricted",
      "alternatives": ["approved alternative 1", "approved alternative 2"]
    }
  ],
  "facts": [
    {
      "claim": "Verified factual or empirical claim (e.g. 99.99% SLA, SOC 2, headquarters location)",
      "source": "Source document, audit schedule or department signoff"
    }
  ],
  "hex_colors": [
    {
      "name": "Color name (e.g. Cobalt Blue, Slate Gray)",
      "hex": "#HEXCODE"
    }
  ]
}

Text to analyze:
${pdfText}
`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const parsedData: ExtractedBrandData = JSON.parse(responseText);

      return {
        banned_words: Array.isArray(parsedData.banned_words) ? parsedData.banned_words : [],
        facts: Array.isArray(parsedData.facts) ? parsedData.facts : [],
        hex_colors: Array.isArray(parsedData.hex_colors) ? parsedData.hex_colors : [],
      };
    } catch (err: unknown) {
      console.warn(`Model ${modelName} failed, trying next candidate...`, err);
      lastError = err;
    }
  }

  throw formatGeminiError(lastError, 'Failed to extract brand rules with Gemini.');
}

/**
 * AI Auto-Generation: Generates tailored banned words, brand facts, and color tokens from a brand description.
 * Example prompt: "We are a luxury watch brand."
 */
export async function autoGenerateBrandRules(brandDescription: string): Promise<ExtractedBrandData> {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error(
      'Invalid API Key: GEMINI_API_KEY is not defined in environment variables (.env.local). Please add a valid Google AI Studio key starting with AIzaSy...'
    );
  }

  const candidateModels = [
    'gemini-3.5-flash-lite',
    'gemini-3.8-flash',
    'gemini-1.5-flash',
  ];

  let lastError: unknown = null;

  for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      const prompt = `
You are the world's leading Brand Governance and Verbal Identity Architect for BrandMesh.
The user is defining brand rules for their company/product:
"${brandDescription}"

Based on this industry and positioning, auto-generate a comprehensive brand governance standard:
1. Generate 15-20 prohibited words or phrases (words that erode the brand's premium value, create legal exposure, or misrepresent their identity).
   Examples for luxury watch brand: cheap, plastic, fake, bargain, knockoff, discount, replica, imitation, mass-produced, hack, flimsy.
2. Generate 4-6 authoritative verified brand facts/commitments (e.g., Swiss certified movement, sapphire crystal glass, 5-year manufacture warranty).
3. Generate 3-5 luxury/brand-appropriate HEX color codes with semantic names.

Return ONLY a JSON object matching this exact schema:
{
  "banned_words": [
    {
      "word": "prohibited word or phrase",
      "category": "Tone | Legal | Superlative | Jargon",
      "severity": "critical | warning | discouraged",
      "reason": "Why this specific word degrades or risks this brand",
      "alternatives": ["approved high-tier replacement 1", "approved replacement 2"]
    }
  ],
  "facts": [
    {
      "claim": "Verified brand fact or claim",
      "source": "Brand Architecture Standard"
    }
  ],
  "hex_colors": [
    {
      "name": "Color name",
      "hex": "#HEX"
    }
  ]
}
`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const parsedData: ExtractedBrandData = JSON.parse(responseText);

      return {
        banned_words: Array.isArray(parsedData.banned_words) ? parsedData.banned_words : [],
        facts: Array.isArray(parsedData.facts) ? parsedData.facts : [],
        hex_colors: Array.isArray(parsedData.hex_colors) ? parsedData.hex_colors : [],
      };
    } catch (err: unknown) {
      console.warn(`Model ${modelName} auto-generate failed, trying next candidate...`, err);
      lastError = err;
    }
  }

  throw formatGeminiError(lastError, 'Failed to auto-generate brand rules with Gemini.');
}

