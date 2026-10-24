import { supabase } from '@/supabase';
import { KanbanCard } from '@/types/brandmesh';

export interface SubmissionRecord {
  id?: number | string;
  created_at?: string;
  content: string;
  score: number;
  status?: string | null;
  platform?: string | null;
  final_text?: string;
  trust_score?: number;
}

/**
 * Inserts a new copy audit submission into the Supabase 'submissions' table.
 * - Stores the final copy in the content column
 * - Stores the current Trust Score in the score column
 * - Applies smart initial status based on score >= 90 (Fast-Track) vs < 90 (Manager Review)
 */
export async function insertSubmission(
  finalText: string,
  trustScore: number
): Promise<{ data: SubmissionRecord | null; error: string | null }> {
  try {
    const smartStatus = trustScore >= 90 ? 'Fast-Track Approved' : 'Manager Review Queue';

    // Primary insert payload matching detected PostgreSQL schema:
    // id (int), created_at (timestamptz), content (text), score (int), status (text), platform (text)
    const payload: Record<string, unknown> = {
      content: finalText,
      score: Math.round(trustScore),
      status: smartStatus,
      platform: 'Co-Pilot Studio',
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('submissions')
      .insert([payload])
      .select();

    if (error) {
      console.warn('Supabase submissions insert attempt 1 failed, retrying with final_text alias:', error);
      // Fallback in case table has 'final_text' instead of 'content'
      const fallbackPayload: Record<string, unknown> = {
        final_text: finalText,
        score: Math.round(trustScore),
        status: smartStatus,
      };

      const fallbackResult = await supabase
        .from('submissions')
        .insert([fallbackPayload])
        .select();

      if (fallbackResult.error) {
        console.error('Supabase submissions insert fallback failed:', fallbackResult.error);
        return { data: null, error: fallbackResult.error.message };
      }

      const insertedRow = fallbackResult.data?.[0] as SubmissionRecord;
      return { data: insertedRow || (fallbackPayload as unknown as SubmissionRecord), error: null };
    }

    const insertedRow = data?.[0] as SubmissionRecord;
    return { data: insertedRow || (payload as unknown as SubmissionRecord), error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown insert error';
    console.error('Failed to insert submission into Supabase:', err);
    return { data: null, error: msg };
  }
}

/**
 * Fetches all submissions from the Supabase 'submissions' table,
 * sorted with the newest submissions first.
 */
export async function fetchSubmissions(): Promise<{ data: SubmissionRecord[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching submissions from Supabase:', error);
      return { data: [], error: error.message };
    }

    return { data: (data || []) as SubmissionRecord[], error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown fetch error';
    console.error('Failed to fetch submissions:', err);
    return { data: [], error: msg };
  }
}

/**
 * Formats ISO date into relative readable time string.
 */
function formatRelativeTime(dateString?: string): string {
  if (!dateString) return 'Just now';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return 'Just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    return `${Math.floor(diffSeconds / 86400)}d ago`;
  } catch {
    return 'Recently';
  }
}

/**
 * Maps a Supabase submission record into a KanbanCard.
 * Applies the Smart Routing Logic:
 * - If score >= 90: Map to 'fast-track' ('Fast-Track Approved' column)
 * - If score < 90: Map to 'review' ('Manager Review Queue' column)
 */
export function mapSubmissionToKanbanCard(
  sub: SubmissionRecord,
  index = 0
): KanbanCard {
  const rawScore = sub.score ?? sub.trust_score ?? 0;
  const score = Math.max(0, Math.min(100, Number(rawScore)));
  const text = sub.content || sub.final_text || '';

  // SMART ROUTING LOGIC:
  // score >= 90 -> 'fast-track'
  // score < 90 -> 'review'
  const status: 'fast-track' | 'review' = score >= 90 ? 'fast-track' : 'review';

  // Extract a brief, meaningful title from text or fallback
  const firstSentence = text.split(/[.\n]/)[0].trim();
  const titleSnippet = firstSentence.length > 55 ? firstSentence.slice(0, 52) + '...' : firstSentence;
  const title = titleSnippet || `Studio Submission #${sub.id || index + 1}`;

  return {
    id: `supabase-sub-${sub.id || Date.now()}-${index}`,
    title: title,
    assetType: 'Press Release',
    department: 'Product Marketing',
    author: {
      name: 'Elena Vance',
      role: 'Global Brand Director',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
    },
    timestamp: formatRelativeTime(sub.created_at),
    score: score,
    status: status,
    beforeText: text,
    afterText: text,
    diffSummary: {
      removed: score < 90 ? ['unhedged claim', 'superlative'] : [],
      added: score >= 90 ? ['certified SLA standard', 'benchmark verified'] : [],
    },
    criticalViolations: score < 90 ? Math.max(1, Math.ceil((90 - score) / 10)) : 0,
    notes:
      score >= 90
        ? 'Automated Fast-Track: Acrolinx Trust Score meets enterprise threshold (>= 90%).'
        : 'Manager Sign-Off Required: Trust Score is below 90%. Review highlighted terminology before publication.',
  };
}
