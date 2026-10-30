import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || '';
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt string is required.' },
        { status: 400 }
      );
    }

    if (!apiKey || apiKey.trim() === '') {
      return NextResponse.json(
        {
          error:
            'Invalid API Key: GEMINI_API_KEY is not configured in environment variables (.env.local). Please add a valid Google AI Studio key starting with AIza...',
        },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const candidateModels = [
      'gemini-3.5-flash-lite',
      'gemini-3.8-flash',
      'gemini-1.5-flash',
    ];

    let resultText = '';
    let lastError: unknown = null;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        resultText = result.response.text();
        if (resultText) break;
      } catch (err: unknown) {
        lastError = err;
      }
    }

    if (!resultText) {
      const rawMsg = lastError instanceof Error ? lastError.message : String(lastError);
      let humanMsg = rawMsg;

      if (rawMsg.includes('API key not valid') || rawMsg.includes('API_KEY_INVALID')) {
        humanMsg =
          'Invalid API Key: The GEMINI_API_KEY in .env.local is invalid or not recognized by Google AI Studio. Please verify your key at https://aistudio.google.com/app/apikey.';
      } else if (rawMsg.includes('RESOURCE_EXHAUSTED') || rawMsg.includes('quota') || rawMsg.includes('429')) {
        humanMsg = 'Gemini Quota Exceeded: Your Google Gemini API rate limit or project quota has been reached.';
      }

      return NextResponse.json(
        { error: humanMsg, rawError: rawMsg },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      result: resultText,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal Gemini endpoint error';
    console.error('Error in /api/gemini-endpoint:', error);
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
