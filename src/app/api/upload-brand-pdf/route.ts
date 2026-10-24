import { NextRequest, NextResponse } from 'next/server';
import { extractBrandRules } from '@/lib/gemini';
import { supabase, saveExtractedRules } from '@/supabase';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('pdfFile') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No PDF file uploaded. Please upload a file with field name "pdfFile".' },
        { status: 400 }
      );
    }

    // Read PDF file into Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // --- STEP A: EXTRACT TEXT FROM PDF BUFFER ---
    let pdfText = '';

    try {
      // Dynamic import pdf-parse
      const pdfModule = await import('pdf-parse');
      if (pdfModule.PDFParse) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parser = new (pdfModule.PDFParse as any)({ data: buffer });
        await parser.load();
        const parseResult = await parser.getText();
        await parser.destroy();
        pdfText = typeof parseResult === 'string' ? parseResult : (parseResult?.text || '');
      } else {
        const parseFn = typeof pdfModule === 'function' ? pdfModule : (pdfModule as unknown as { default: (buf: Buffer) => Promise<{ text: string }> }).default;
        if (typeof parseFn === 'function') {
          const parsed = await parseFn(buffer);
          pdfText = parsed.text || '';
        }
      }
    } catch (parseError: unknown) {
      console.warn('pdf-parse binary parsing error, falling back to text stream extraction:', parseError);
    }

    // Fallback: If binary parsing returned empty (e.g. plain text or mock PDF), extract ASCII strings
    if (!pdfText || !pdfText.trim()) {
      const rawString = buffer.toString('utf-8');
      // Clean non-printable characters
      pdfText = rawString.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ').trim();
    }

    if (!pdfText || pdfText.length < 10) {
      return NextResponse.json(
        {
          success: false,
          error: 'Could not extract readable text from the uploaded PDF. Please make sure the PDF contains selectable text or try another document.',
        },
        { status: 422 }
      );
    }

    // --- STEP B: AI STRUCTURING WITH GEMINI ---
    const brandData = await extractBrandRules(pdfText);

    // --- STEP C: SAVE TO SUPABASE ---
    let savedToDatabase = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let savedBrandGuideline: any = null;

    // 1. Save to brand_guidelines table using Method 1 (saveExtractedRules)
    try {
      const cleanBrandName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      const saved = await saveExtractedRules(cleanBrandName, brandData);
      if (saved && saved.length > 0) {
        savedBrandGuideline = saved[0];
        savedToDatabase = true;
      }
    } catch (dbErr) {
      console.warn('Notice: brand_guidelines table insert skipped:', dbErr);
    }

    // 2. Also insert extracted banned words directly into banned_words table so the UI reflects them immediately
    if (brandData.banned_words && brandData.banned_words.length > 0) {
      try {
        const bannedRows = brandData.banned_words.map((item) => ({
          word: item.word.toLowerCase(),
          category: item.category || 'Tone',
          severity: item.severity || 'warning',
          reason: item.reason || `Extracted from ${file.name} via Gemini AI`,
          approved_alternatives: item.alternatives || ['standardized phrasing'],
        }));

        const { error: bwError } = await supabase
          .from('banned_words')
          .insert(bannedRows);

        if (!bwError) {
          savedToDatabase = true;
        }
      } catch (bwErr) {
        console.warn('Notice: banned_words table insert notice:', bwErr);
      }
    }

    return NextResponse.json({
      success: true,
      fileName: file.name,
      fileSize: file.size,
      textLength: pdfText.length,
      savedToDatabase,
      brandGuideline: savedBrandGuideline,
      data: brandData,
    });
  } catch (error: unknown) {
    console.error('Pipeline Error in /api/upload-brand-pdf:', error);
    const message = error instanceof Error ? error.message : 'Internal pipeline error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
