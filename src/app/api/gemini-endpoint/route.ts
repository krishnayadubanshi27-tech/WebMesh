import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt string is required.' },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured.' },
        { status: 500 }
      );
    }

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
      throw lastError || new Error('Failed to generate response from Gemini.');
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
