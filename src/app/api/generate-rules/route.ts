import { NextRequest, NextResponse } from 'next/server';
import { autoGenerateBrandRules } from '@/lib/gemini';
import { supabase } from '@/supabase';

export async function POST(req: NextRequest) {
  try {
    const { brandDescription } = await req.json();

    if (!brandDescription || typeof brandDescription !== 'string') {
      return NextResponse.json(
        { error: 'brandDescription string is required.' },
        { status: 400 }
      );
    }

    console.log(`[API /api/generate-rules] Generating brand rules for: "${brandDescription}"`);

    // Call Gemini with domain prompt
    const generatedData = await autoGenerateBrandRules(brandDescription);

    let savedCount = 0;
    let supabaseSuccess = false;

    // Optional: save to Supabase banned_words if connected
    if (generatedData.banned_words && generatedData.banned_words.length > 0) {
      try {
        const rowsToInsert = generatedData.banned_words.map((item) => ({
          word: item.word,
          category: item.category || 'Tone',
          severity: item.severity || 'warning',
          reason: item.reason || `Restricted per brand identity: ${brandDescription}`,
          approved_alternatives: Array.isArray(item.alternatives) ? item.alternatives : [],
          created_at: new Date().toISOString(),
        }));

        const { data, error } = await supabase
          .from('banned_words')
          .insert(rowsToInsert)
          .select();

        if (!error && data) {
          savedCount = data.length;
          supabaseSuccess = true;
        }
      } catch (dbErr: unknown) {
        console.warn('Supabase auto-save skipped or not configured:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      brandDescription,
      brandRules: generatedData,
      savedToSupabase: supabaseSuccess,
      savedCount,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to auto-generate brand rules';
    console.error('Error in /api/generate-rules:', error);
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
