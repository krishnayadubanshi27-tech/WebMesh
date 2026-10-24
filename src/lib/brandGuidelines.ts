import { supabase } from '@/supabase';

export interface BrandGuidelineRecord {
  id: string;
  brand_name: string;
  banned_words: string[];
  facts: string[];
  hex_colors: string[];
  created_at?: string;
}

export interface ExtractedInput {
  banned_words?: Array<string | { word?: string }>;
  facts?: Array<string | { claim?: string; fact?: string }>;
  hex_colors?: Array<string | { hex?: string; code?: string; name?: string }>;
}

/**
 * Method 1: Saving from the PDF (Gemini Output)
 * Accepts Gemini JSON output (either string arrays or object arrays) and inserts
 * into the Supabase brand_guidelines table.
 */
export async function saveExtractedRules(
  brandName: string,
  geminiJsonOutput: ExtractedInput | any
): Promise<BrandGuidelineRecord[] | null> {
  // Normalize banned words to clean string array (compatible with PostgreSQL TEXT[])
  const bannedWords: string[] = Array.isArray(geminiJsonOutput?.banned_words)
    ? geminiJsonOutput.banned_words
        .map((item: any) => (typeof item === 'string' ? item : item?.word || ''))
        .filter((w: string) => Boolean(w && w.trim()))
    : [];

  // Normalize facts to clean string array
  const facts: string[] = Array.isArray(geminiJsonOutput?.facts)
    ? geminiJsonOutput.facts
        .map((item: any) => (typeof item === 'string' ? item : item?.claim || item?.fact || ''))
        .filter((f: string) => Boolean(f && f.trim()))
    : [];

  // Normalize hex colors to clean string array
  const hexColors: string[] = Array.isArray(geminiJsonOutput?.hex_colors)
    ? geminiJsonOutput.hex_colors
        .map((item: any) => (typeof item === 'string' ? item : item?.hex || item?.code || ''))
        .filter((c: string) => Boolean(c && c.trim()))
    : [];

  const { data, error } = await supabase
    .from('brand_guidelines')
    .insert([
      {
        brand_name: brandName,
        banned_words: bannedWords,
        facts: facts,
        hex_colors: hexColors,
      },
    ])
    .select(); // .select() returns the saved data back to you

  if (error) {
    console.error('Error saving to Supabase (brand_guidelines):', error);
    return null;
  }

  return data as BrandGuidelineRecord[];
}

/**
 * Method 2: Saving a Pre-built Template
 * If a user clicks a button to use the "Premium Brand Template", sends hardcoded
 * arrays to the Supabase brand_guidelines table.
 */
export async function applyPremiumTemplate(
  brandName: string = 'Premium Brand'
): Promise<BrandGuidelineRecord[] | null> {
  const { data, error } = await supabase
    .from('brand_guidelines')
    .insert([
      {
        brand_name: brandName,
        banned_words: ['cheap', 'bargain', 'discount', 'hack'],
        facts: ['We emphasize value over price', 'Our products are luxury grade'],
        hex_colors: ['#000000', '#FFD700'],
      },
    ])
    .select();

  if (error) {
    console.error('Error saving template to Supabase:', error);
    return null;
  }

  return data as BrandGuidelineRecord[];
}

/**
 * Method 3: Updating Rules Manually (Adding a new word)
 * If a user is typing a new banned word into a dashboard, uses .update()
 * to add it to their existing list in the Supabase brand_guidelines table.
 */
export async function addManualBannedWord(
  brandId: string,
  existingWords: string[],
  newWord: string
): Promise<BrandGuidelineRecord[] | null> {
  const trimmed = newWord.trim().toLowerCase();
  if (!trimmed) return null;

  // Combine the old words with the new word (avoiding exact duplicates)
  const updatedWordsList = existingWords.includes(trimmed)
    ? existingWords
    : [...existingWords, trimmed];

  const { data, error } = await supabase
    .from('brand_guidelines')
    .update({ banned_words: updatedWordsList })
    .eq('id', brandId)
    .select(); // Make sure you update the correct brand

  if (error) {
    console.error('Error updating word in Supabase:', error);
    return null;
  }

  return data as BrandGuidelineRecord[];
}

/**
 * Pull brand guidelines back out whenever text is audited or viewed in the UI.
 * Uses .select('*') to retrieve guidelines by ID or the most recent entry.
 */
export async function getBrandGuidelines(
  brandId?: string
): Promise<BrandGuidelineRecord | null> {
  try {
    let query = supabase.from('brand_guidelines').select('*');

    if (brandId) {
      query = query.eq('id', brandId);
    } else {
      query = query.order('created_at', { ascending: false }).limit(1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching brand guidelines:', error);
      return null;
    }

    if (data && data.length > 0) {
      return data[0] as BrandGuidelineRecord;
    }

    return null;
  } catch (err) {
    console.error('Failed to get brand guidelines:', err);
    return null;
  }
}

/**
 * Fetch all saved brand guidelines for brand switching and management.
 */
export async function getAllBrandGuidelines(): Promise<BrandGuidelineRecord[]> {
  try {
    const { data, error } = await supabase
      .from('brand_guidelines')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all brand guidelines:', error);
      return [];
    }

    return (data || []) as BrandGuidelineRecord[];
  } catch (err) {
    console.error('Failed to get all brand guidelines:', err);
    return [];
  }
}
