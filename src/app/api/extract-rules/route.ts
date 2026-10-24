import { NextRequest, NextResponse } from 'next/server';
import { extractBrandRules } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pdfText } = body;

    if (!pdfText || typeof pdfText !== 'string' || !pdfText.trim()) {
      return NextResponse.json(
        { error: 'pdfText is required and must be non-empty.' },
        { status: 400 }
      );
    }

    const brandData = await extractBrandRules(pdfText);

    return NextResponse.json({
      success: true,
      data: brandData,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown server error';
    console.error('API /api/extract-rules error:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
