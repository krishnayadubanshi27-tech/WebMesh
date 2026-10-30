import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, Schema, SchemaType } from '@google/generative-ai';
import { supabase } from '@/supabase';

export interface DoctorDiagnosis {
  finding: string;
  current_rule: string;
  prescribed_rule: string;
  risk_level: string;
  projected_impact: string;
}

// Strict JSON Schema required by Gemini
const doctorSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    finding: {
      type: SchemaType.STRING,
      description: 'Diagnosis of why this brand rule is failing, ambiguous, overly rigid, or causing high team friction.',
    },
    current_rule: {
      type: SchemaType.STRING,
      description: 'The original or current rule text evaluated.',
    },
    prescribed_rule: {
      type: SchemaType.STRING,
      description: 'The rewritten, crystal-clear, and enforceable brand rule standard.',
    },
    risk_level: {
      type: SchemaType.STRING,
      description: 'The risk level if this rule remains unfixed (e.g. Critical, High, Medium, Low).',
    },
    projected_impact: {
      type: SchemaType.STRING,
      description: 'The projected brand, legal, or operational impact of adopting the prescribed rewrite.',
    },
  },
  required: ['finding', 'current_rule', 'prescribed_rule', 'risk_level', 'projected_impact'],
};

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey || apiKey.trim() === '') {
      return NextResponse.json(
        {
          error:
            'Invalid API Key: GEMINI_API_KEY is not defined in environment variables (.env.local). Please configure a valid Google Gemini API key.',
        },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const rule_id = body.rule_id || body.ruleId || req.nextUrl.searchParams.get('rule_id') || req.nextUrl.searchParams.get('ruleId') || '';
    let current_rule =
      body.rule_text || body.ruleText || body.current_rule || body.text || body.rule || '';

    // If current_rule was not directly provided but rule_id was, attempt to fetch details from Supabase
    if (!current_rule && rule_id) {
      try {
        // 1. Try finding in brand_guidelines by id
        let guideline: any = null;
        const { data: gById } = await supabase
          .from('brand_guidelines')
          .select('*')
          .eq('id', rule_id)
          .maybeSingle();
        guideline = gById;

        // 2. If not found, try by rule_id
        if (!guideline) {
          const { data: gByRuleId } = await supabase
            .from('brand_guidelines')
            .select('*')
            .eq('rule_id', rule_id)
            .maybeSingle();
          guideline = gByRuleId;
        }

        if (guideline) {
          const parts: string[] = [];
          if (guideline.rule_text) parts.push(guideline.rule_text);
          if (guideline.brand_name) parts.push(`Brand/Policy: ${guideline.brand_name}`);
          if (Array.isArray(guideline.banned_words) && guideline.banned_words.length > 0) {
            parts.push(`Restricted Terms: ${guideline.banned_words.join(', ')}`);
          }
          if (Array.isArray(guideline.facts) && guideline.facts.length > 0) {
            parts.push(`Mandated Facts: ${guideline.facts.join('; ')}`);
          }
          current_rule = parts.join(' | ') || guideline.brand_name;
        }

        // 3. Check audit_events for context on what kind of copy is triggering violations
        const { data: violations } = await supabase
          .from('audit_events')
          .select('original_text')
          .eq('rule_id', rule_id)
          .limit(3);

        if (violations && violations.length > 0) {
          const sampleTexts = violations.map((v) => v.original_text).filter(Boolean).slice(0, 2);
          if (sampleTexts.length > 0) {
            current_rule += ` (Failing Copy Samples: "${sampleTexts.join('", "')}")`;
          }
        }
      } catch (dbErr) {
        console.warn('[API /api/doctor] Notice fetching rule from Supabase:', dbErr);
      }
    }

    // If neither current_rule nor rule_id was provided, fetch the active guideline or use the benchmark rule
    if (!current_rule && !rule_id) {
      try {
        const { data: topGuideline } = await supabase
          .from('brand_guidelines')
          .select('*')
          .eq('is_active', true)
          .limit(1)
          .maybeSingle();

        if (topGuideline) {
          current_rule =
            topGuideline.rule_text ||
            `Prohibit absolute guarantee claims (e.g., "100% foolproof", "unconditional SLA", "cheapest cloud") across public collateral.`;
        }
      } catch (dbErr) {
        console.warn('[API /api/doctor] Notice fetching active guideline fallback:', dbErr);
      }
    }

    if (!current_rule || typeof current_rule !== 'string' || current_rule.trim() === '') {
      current_rule =
        'Prohibit all absolute commercial guarantee claims and unverified superlatives (e.g., "100% uptime guarantee", "zero friction", "cheapest in market") across all marketing assets.';
    }

    console.log(
      `[API /api/doctor] Diagnosing rule (ID: "${rule_id || 'unknown'}"): "${current_rule.slice(0, 100)}..."`
    );

    const genAI = new GoogleGenerativeAI(apiKey);
    const candidateModels = [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.8-flash',
    ];

    const prompt = `
You are the Chief Brand Governance Architect and Brand Rule Doctor for BrandMesh.
Your mission is to perform a diagnostic audit on a failing or high-friction brand guideline rule and rewrite it to be clearer, enforceable, and aligned with enterprise excellence.

Rule ID: ${rule_id || 'unassigned'}
Current Rule Text:
"${current_rule}"

Diagnose:
1. "finding": Why is this rule currently failing or triggering team overrides/escalations? Identify ambiguity, overly punitive phrasing, lack of context, or missing approved alternatives.
2. "current_rule": The rule text being analyzed.
3. "prescribed_rule": A rewritten, crystal-clear, positive, and enforceable replacement standard that protects brand integrity while providing actionable guidance and alternatives.
4. "risk_level": Risk severity if the issue is ignored ("Critical", "High", "Medium", or "Low").
5. "projected_impact": The projected quantitative/qualitative benefit (e.g. reduction in review delays, improved team adoption, protected enterprise positioning).

You MUST return strictly valid JSON matching this exact schema:
{
  "finding": "string",
  "current_rule": "string",
  "prescribed_rule": "string",
  "risk_level": "string",
  "projected_impact": "string"
}
`;

    let diagnosis: DoctorDiagnosis | null = null;
    let lastError: unknown = null;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: doctorSchema,
            temperature: 0.2,
          },
        });

        const result = await model.generateContent(prompt);
        const rawResponse = result.response.text();
        if (rawResponse) {
          const cleaned = rawResponse.replace(/```(?:json)?/g, '').trim();
          const parsed = JSON.parse(cleaned);
          if (
            typeof parsed.finding === 'string' &&
            typeof parsed.current_rule === 'string' &&
            typeof parsed.prescribed_rule === 'string' &&
            typeof parsed.risk_level === 'string' &&
            typeof parsed.projected_impact === 'string'
          ) {
            diagnosis = parsed as DoctorDiagnosis;
            break;
          }
        }
      } catch (err: unknown) {
        console.warn(`[API /api/doctor] Model ${modelName} attempt failed:`, err);
        lastError = err;
      }
    }

    if (!diagnosis) {
      const rawMsg = lastError instanceof Error ? lastError.message : String(lastError);
      console.error('[API /api/doctor] Gemini failed to generate diagnosis:', rawMsg);
      return NextResponse.json(
        {
          error: `Gemini Diagnosis Failed: ${rawMsg}`,
        },
        { status: 502 }
      );
    }

    // Return the exact JSON structure required by the specification
    return NextResponse.json({
      finding: diagnosis.finding,
      current_rule: diagnosis.current_rule,
      prescribed_rule: diagnosis.prescribed_rule,
      risk_level: diagnosis.risk_level,
      projected_impact: diagnosis.projected_impact,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('[API /api/doctor] Unhandled error:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

// Support GET requests as well (e.g. /api/doctor?rule_id=...)
export async function GET(req: NextRequest) {
  return POST(req);
}
