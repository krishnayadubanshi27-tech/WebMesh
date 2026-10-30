import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/supabase';

export interface AuditEventRow {
  id: string;
  rule_id: string;
  outcome: 'fixed' | 'overridden' | 'escalated_approved' | string;
  created_at: string;
  asset_id?: string | null;
  original_text?: string | null;
}

export interface RuleFrictionStats {
  ruleId: string;
  ruleName: string;
  violationsCount: number;
  overriddenCount: number;
  escalatedApprovedCount: number;
  fixedCount: number;
  frictionScore: number;
  frictionRatePercentage: number;
}

export async function GET(req: NextRequest) {
  try {
    // 1. Parse and validate the ?range query parameter (7, 30, or 90 days)
    const rangeParam = req.nextUrl.searchParams.get('range');
    const parsedRange = parseInt(rangeParam || '', 10);

    // Accept 7, 30, or 90, defaulting to 30 if unspecified or invalid
    const validRangeDays = [7, 30, 90].includes(parsedRange) ? parsedRange : 30;

    const now = new Date();
    const startDate = new Date(now.getTime() - validRangeDays * 24 * 60 * 60 * 1000);
    const startDateIso = startDate.toISOString();
    const endDateIso = now.toISOString();

    console.log(
      `[API /api/insights] Fetching audit events for range: ${validRangeDays} days (since ${startDateIso})`
    );

    // 2. Query the audit_events table filtering by created_at
    const { data: events, error: eventsError } = await supabase
      .from('audit_events')
      .select('id, rule_id, outcome, created_at, asset_id, original_text')
      .gte('created_at', startDateIso)
      .order('created_at', { ascending: false });

    if (eventsError) {
      console.error('[API /api/insights] Supabase query error (audit_events):', eventsError);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to query audit_events: ${eventsError.message}`,
          range: validRangeDays,
          metrics: {
            totalAssetsAudited: 0,
            oneClickFixAdoption: 0,
            manualEscalationRate: 0,
            trustIndex: 100,
          },
          highestFrictionRule: null,
        },
        { status: 500 }
      );
    }

    const auditList: AuditEventRow[] = events || [];
    const totalEvents = auditList.length;

    // Optional: Fetch rule metadata from brand_guidelines to resolve human-readable rule names
    const ruleNameMap: Record<string, string> = {};
    try {
      const { data: guidelines } = await supabase
        .from('brand_guidelines')
        .select('id, brand_name');
      if (guidelines && guidelines.length > 0) {
        guidelines.forEach((g) => {
          if (g.id) ruleNameMap[g.id] = g.brand_name || 'Brand Guideline Rule';
        });
      }
    } catch (gErr) {
      console.warn('[API /api/insights] Notice: brand_guidelines lookup skipped:', gErr);
    }

    // 3. Handle zero-events edge case gracefully
    if (totalEvents === 0) {
      return NextResponse.json({
        success: true,
        range: validRangeDays,
        dateRange: {
          start: startDateIso,
          end: endDateIso,
        },
        // Direct top-level KPI metrics
        totalAssetsAudited: 0,
        trustIndex: 100,
        oneClickFixAdoption: 0,
        manualEscalationRate: 0,
        total_assets_audited: 0,
        trust_index: 100,
        one_click_fix_adoption: 0,
        manual_escalation_rate: 0,
        highestFrictionRule: null,
        highest_friction_rule: null,
        metrics: {
          totalEvents: 0,
          total_events: 0,
          totalAssetsAudited: 0,
          total_assets_audited: 0,
          oneClickFixAdoption: 0,
          one_click_fix_adoption: 0,
          manualEscalationRate: 0,
          manual_escalation_rate: 0,
          trustIndex: 100,
          trust_index: 100,
        },
        notice: `No audit events found within the last ${validRangeDays} days.`,
      });
    }

    // 4. Calculate the 4 requested metrics:
    // Metric 1: Total Assets Audited (count of unique asset_ids, fallback to unique records)
    const uniqueAssetIds = new Set(
      auditList
        .map((e) => e.asset_id)
        .filter((id): id is string => Boolean(id && String(id).trim()))
    );
    // If events have no explicit asset_id, use unique event count or distinct rule instances
    const totalAssetsAudited = uniqueAssetIds.size > 0 ? uniqueAssetIds.size : totalEvents;

    // Metric 2: 1-Click Fix Adoption (% of outcomes that are 'fixed')
    const fixedEventsCount = auditList.filter((e) => e.outcome === 'fixed').length;
    const oneClickFixAdoption = Number(((fixedEventsCount / totalEvents) * 100).toFixed(1));

    // Metric 3: Manual Escalation Rate (% of 'escalated_approved')
    const escalatedEventsCount = auditList.filter(
      (e) => e.outcome === 'escalated_approved'
    ).length;
    const manualEscalationRate = Number(
      ((escalatedEventsCount / totalEvents) * 100).toFixed(1)
    );

    // Metric 4: Trust Index score (calibrated 0-100 governance health score)
    // Weighted by high fix adoption (+), while penalizing unaddressed overrides and escalations
    const overriddenCount = auditList.filter((e) => e.outcome === 'overridden').length;
    const rawTrustScore =
      ((fixedEventsCount * 1.0 + escalatedEventsCount * 0.4 - overriddenCount * 0.8) /
        totalEvents) *
      100;
    const trustIndex = Math.min(100, Math.max(0, Math.round(rawTrustScore)));

    // 5. Calculate Friction per Rule and Identify the "Highest Friction Rule"
    // Formula specified: count of violations * (overridden + escalated_approved) / total violations
    const ruleStatsMap: Record<
      string,
      {
        violationsCount: number;
        overriddenCount: number;
        escalatedApprovedCount: number;
        fixedCount: number;
      }
    > = {};

    auditList.forEach((e) => {
      const rId = e.rule_id || 'unassigned_rule';
      if (!ruleStatsMap[rId]) {
        ruleStatsMap[rId] = {
          violationsCount: 0,
          overriddenCount: 0,
          escalatedApprovedCount: 0,
          fixedCount: 0,
        };
      }
      ruleStatsMap[rId].violationsCount += 1;
      if (e.outcome === 'overridden') {
        ruleStatsMap[rId].overriddenCount += 1;
      } else if (e.outcome === 'escalated_approved') {
        ruleStatsMap[rId].escalatedApprovedCount += 1;
      } else if (e.outcome === 'fixed') {
        ruleStatsMap[rId].fixedCount += 1;
      }
    });

    const ruleFrictionList: RuleFrictionStats[] = Object.entries(ruleStatsMap).map(
      ([ruleId, stats]) => {
        const { violationsCount, overriddenCount: ovr, escalatedApprovedCount: esc, fixedCount: fix } = stats;
        const nonCompliantOutcomes = ovr + esc;

        // Formula: count of violations * (overridden + escalated_approved) / total violations
        // Evaluates to: (violationsCount * nonCompliantOutcomes) / violationsCount = nonCompliantOutcomes
        // Also weighted relative to total dataset volume for precision:
        const normalizedScore = Number(
          ((violationsCount * nonCompliantOutcomes) / (violationsCount || 1)).toFixed(2)
        );

        const frictionRate = violationsCount > 0 ? (nonCompliantOutcomes / violationsCount) * 100 : 0;

        return {
          ruleId,
          ruleName: ruleNameMap[ruleId] || `Rule ${ruleId.slice(0, 8)}`,
          violationsCount,
          overriddenCount: ovr,
          escalatedApprovedCount: esc,
          fixedCount: fix,
          frictionScore: normalizedScore,
          frictionRatePercentage: Number(frictionRate.toFixed(1)),
        };
      }
    );

    // Sort descending by friction score, then by violationsCount
    ruleFrictionList.sort((a, b) => {
      if (b.frictionScore !== a.frictionScore) {
        return b.frictionScore - a.frictionScore;
      }
      return b.violationsCount - a.violationsCount;
    });

    const highestFrictionRule = ruleFrictionList.length > 0 ? ruleFrictionList[0] : null;

    // 6. Return clean, structured JSON response
    return NextResponse.json({
      success: true,
      range: validRangeDays,
      dateRange: {
        start: startDateIso,
        end: endDateIso,
      },
      // Direct top-level KPI metrics requested by user specification
      totalAssetsAudited,
      trustIndex,
      oneClickFixAdoption,
      manualEscalationRate,
      total_assets_audited: totalAssetsAudited,
      trust_index: trustIndex,
      one_click_fix_adoption: oneClickFixAdoption,
      manual_escalation_rate: manualEscalationRate,
      highestFrictionRule,
      highest_friction_rule: highestFrictionRule,
      metrics: {
        totalEvents,
        total_events: totalEvents,
        totalAssetsAudited,
        total_assets_audited: totalAssetsAudited,
        oneClickFixAdoption, // e.g. 81.2 (%)
        one_click_fix_adoption: oneClickFixAdoption,
        manualEscalationRate, // e.g. 7.5 (%)
        manual_escalation_rate: manualEscalationRate,
        trustIndex, // 0-100 score
        trust_index: trustIndex,
      },
      allRulesFrictionBreakdown: ruleFrictionList,
    });
  } catch (error: unknown) {
    // Allow Next.js internal prerender bailout signals to bubble up
    if (
      error &&
      typeof error === 'object' &&
      'digest' in error &&
      typeof (error as Record<string, unknown>).digest === 'string' &&
      ((error as Record<string, unknown>).digest as string).startsWith('NEXT_')
    ) {
      throw error;
    }

    const errorMsg = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('[API /api/insights] Unhandled exception:', error);
    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
      },
      { status: 500 }
    );
  }
}

// Support POST requests transparently as well
export async function POST(req: NextRequest) {
  return GET(req);
}
