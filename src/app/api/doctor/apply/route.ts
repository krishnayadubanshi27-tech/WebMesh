import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/supabase';

export const maxDuration = 30;

export interface ApplyDoctorRequest {
  rule_id?: string;
  ruleId?: string;
  new_rule_text?: string;
  newRuleText?: string;
  prescribed_rule?: string;
  new_rule?: string;
  rule_text?: string;
  action?: 'apply' | 'undo';
  undo?: boolean;
  is_undo?: boolean;
}

/**
 * Reverses a previously applied guideline modification:
 * Finds the newly activated version (e.g. v2), sets its is_active to false,
 * and restores the previous version (e.g. v1) with is_active = true.
 */
async function performUndo(targetRuleId?: string) {
  console.log(`[API /api/doctor/apply] Executing Undo for rule_id="${targetRuleId || 'latest'}"`);

  // Step 1: Locate the active rule to deactivate (e.g. v2)
  let activeRule: any = null;

  if (targetRuleId) {
    // Check if targetRuleId points directly to the active rule
    const { data: directActive } = await supabase
      .from('brand_guidelines')
      .select('*')
      .eq('id', targetRuleId)
      .eq('is_active', true)
      .maybeSingle();

    if (directActive) {
      activeRule = directActive;
    } else {
      // If targetRuleId was the original v1 ID, find the active row for the same brand/rule
      const { data: targetRecord } = await supabase
        .from('brand_guidelines')
        .select('*')
        .eq('id', targetRuleId)
        .maybeSingle();

      if (targetRecord?.brand_name) {
        const { data: brandActive } = await supabase
          .from('brand_guidelines')
          .select('*')
          .eq('brand_name', targetRecord.brand_name)
          .eq('is_active', true)
          .order('version', { ascending: false })
          .limit(1)
          .maybeSingle();
        activeRule = brandActive;
      }
    }
  }

  // Fallback: If not found by ID, locate the highest active version
  if (!activeRule) {
    const { data: latestActive } = await supabase
      .from('brand_guidelines')
      .select('*')
      .eq('is_active', true)
      .gt('version', 1)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    activeRule = latestActive;
  }

  // If still not found, check any active rule
  if (!activeRule) {
    const { data: anyActive } = await supabase
      .from('brand_guidelines')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    activeRule = anyActive;
  }

  if (!activeRule) {
    return {
      success: false,
      error: 'No active brand guideline was found to undo.',
      status: 404,
    };
  }

  const currentVersionNum = typeof activeRule.version === 'number'
    ? activeRule.version
    : parseInt(String(activeRule.version || '2').replace(/\D/g, ''), 10) || 2;

  const currentVersionTag = `v${currentVersionNum}`;
  const previousVersionNum = Math.max(1, currentVersionNum - 1);
  const previousVersionTag = `v${previousVersionNum}`;

  // Step 2: Set the current active rule's is_active status to false (e.g. set v2 to false)
  const { error: deactivateError } = await supabase
    .from('brand_guidelines')
    .update({ is_active: false })
    .eq('id', activeRule.id);

  if (deactivateError) {
    console.error('[API /api/doctor/apply] Error deactivating current rule during undo:', deactivateError);
    return {
      success: false,
      error: `Failed to deactivate ${currentVersionTag}: ${deactivateError.message}`,
      status: 500,
    };
  }

  // Step 3: Find the previous version (e.g. v1) to restore
  let previousRule: any = null;

  if (targetRuleId) {
    const { data: candidateTarget } = await supabase
      .from('brand_guidelines')
      .select('*')
      .eq('id', targetRuleId)
      .maybeSingle();

    if (candidateTarget && candidateTarget.id !== activeRule.id) {
      previousRule = candidateTarget;
    }
  }

  if (!previousRule) {
    const { data: prevRules } = await supabase
      .from('brand_guidelines')
      .select('*')
      .eq('brand_name', activeRule.brand_name)
      .eq('version', previousVersionNum)
      .order('created_at', { ascending: false })
      .limit(1);

    previousRule = prevRules?.[0];
  }

  // If not found by exact brand_name + version, find any inactive version 1
  if (!previousRule) {
    const { data: fallbackV1 } = await supabase
      .from('brand_guidelines')
      .select('*')
      .eq('version', 1)
      .eq('is_active', false)
      .order('created_at', { ascending: false })
      .limit(1);
    previousRule = fallbackV1?.[0];
  }

  // Step 4: Reactivate the previous rule (e.g. set v1 back to true)
  if (previousRule) {
    const { error: reactivateError } = await supabase
      .from('brand_guidelines')
      .update({ is_active: true })
      .eq('id', previousRule.id);

    if (reactivateError) {
      console.error('[API /api/doctor/apply] Error reactivating v1 during undo:', reactivateError);
      return {
        success: false,
        error: `Deactivated ${currentVersionTag}, but failed to reactivate ${previousVersionTag}: ${reactivateError.message}`,
        status: 500,
      };
    }
  }

  return {
    success: true,
    message: `Undo successful: Reverted ${currentVersionTag} and restored ${previousVersionTag} to active status.`,
    action: 'undo',
    rule_id: targetRuleId || activeRule.id,
    restored_version: previousVersionTag,
    restored_version_number: previousVersionNum,
    deactivated_version: currentVersionTag,
    deactivated_rule_id: activeRule.id,
    restored_rule_id: previousRule?.id || null,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body: ApplyDoctorRequest = await req.json().catch(() => ({}));
    const rule_id = body.rule_id || body.ruleId || '';
    const new_rule_text =
      body.new_rule_text ||
      body.newRuleText ||
      body.prescribed_rule ||
      body.new_rule ||
      body.rule_text ||
      '';
    const isUndo =
      body.action === 'undo' ||
      body.undo === true ||
      body.is_undo === true ||
      req.nextUrl.searchParams.get('action') === 'undo';

    // Handle Undo action
    if (isUndo) {
      const undoResult = await performUndo(rule_id);
      return NextResponse.json(undoResult, { status: undoResult.status || 200 });
    }

    // Validate parameters for apply action
    if (!new_rule_text || typeof new_rule_text !== 'string' || new_rule_text.trim() === '') {
      return NextResponse.json(
        {
          error:
            'Missing parameter: Please provide "new_rule_text" (or "prescribed_rule") in the request body.',
        },
        { status: 400 }
      );
    }

    console.log(
      `[API /api/doctor/apply] Applying Doctor prescription for rule_id="${rule_id || 'unspecified'}"`
    );

    // 1. Connect to Supabase and find the current active rule in brand_guidelines
    let activeRule: any = null;

    if (rule_id) {
      // Try finding the active rule with this specific ID
      const { data: directMatch } = await supabase
        .from('brand_guidelines')
        .select('*')
        .eq('id', rule_id)
        .maybeSingle();

      if (directMatch) {
        activeRule = directMatch;
      }
    }

    // If no direct ID match, find the currently active rule
    if (!activeRule) {
      const { data: activeMatches } = await supabase
        .from('brand_guidelines')
        .select('*')
        .eq('is_active', true)
        .order('version', { ascending: false })
        .limit(1);

      if (activeMatches && activeMatches.length > 0) {
        activeRule = activeMatches[0];
      }
    }

    // Fallback: If no row is flagged is_active=true, fetch the latest guideline
    if (!activeRule) {
      const { data: latestRows } = await supabase
        .from('brand_guidelines')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (latestRows && latestRows.length > 0) {
        activeRule = latestRows[0];
      }
    }

    if (!activeRule) {
      return NextResponse.json(
        {
          error:
            'No existing brand guidelines found in the database. Please initialize brand guidelines first.',
        },
        { status: 404 }
      );
    }

    const currentVersionNum = typeof activeRule.version === 'number'
      ? activeRule.version
      : parseInt(String(activeRule.version || '1').replace(/\D/g, ''), 10) || 1;
    const currentVersionTag = `v${currentVersionNum}`;

    const nextVersionNum = currentVersionNum + 1;
    const nextVersionTag = `v${nextVersionNum}`;

    // 2. Set the current active rule's is_active status to false
    const { error: deactivateError } = await supabase
      .from('brand_guidelines')
      .update({ is_active: false })
      .eq('id', activeRule.id);

    if (deactivateError) {
      console.error('[API /api/doctor/apply] Error deactivating active rule:', deactivateError);
      return NextResponse.json(
        {
          error: `Failed to deactivate current rule (${currentVersionTag}): ${deactivateError.message}`,
        },
        { status: 500 }
      );
    }

    // 3. Insert a new row for the new rule with the same rule_id, incremented version (v2), and is_active: true
    // Prepare facts array with the new prescribed rule text prioritized
    const existingFacts = Array.isArray(activeRule.facts) ? activeRule.facts : [];
    const updatedFacts = [
      new_rule_text.trim(),
      ...existingFacts.filter((f: string) => f && f.trim() !== new_rule_text.trim()),
    ];

    const baseInsertData: Record<string, any> = {
      brand_name: activeRule.brand_name || 'Brand Guidelines',
      banned_words: Array.isArray(activeRule.banned_words) ? activeRule.banned_words : [],
      facts: updatedFacts,
      hex_colors: Array.isArray(activeRule.hex_colors) ? activeRule.hex_colors : [],
      version: nextVersionNum,
      is_active: true,
    };

    // Attempt insert (with graceful handling if rule_id column exists or if table schema relies on id)
    let newInsertedRow: any = null;
    let insertError: any = null;

    // Check if table supports rule_id column
    const { data: withRuleIdData, error: withRuleIdErr } = await supabase
      .from('brand_guidelines')
      .insert([{ ...baseInsertData, rule_id: rule_id || activeRule.id }])
      .select()
      .maybeSingle();

    if (!withRuleIdErr && withRuleIdData) {
      newInsertedRow = withRuleIdData;
    } else {
      // Fallback insert without rule_id column if rule_id is not in PostgreSQL schema
      const { data: standardData, error: standardErr } = await supabase
        .from('brand_guidelines')
        .insert([baseInsertData])
        .select()
        .maybeSingle();

      if (standardErr) {
        insertError = standardErr;
      } else {
        newInsertedRow = standardData;
      }
    }

    if (insertError || !newInsertedRow) {
      console.error('[API /api/doctor/apply] Error inserting new rule version:', insertError);
      // Attempt rollback of deactivation if insert failed
      await supabase
        .from('brand_guidelines')
        .update({ is_active: true })
        .eq('id', activeRule.id);

      return NextResponse.json(
        {
          error: `Failed to insert new rule version (${nextVersionTag}): ${insertError?.message || 'Unknown database error'}`,
        },
        { status: 500 }
      );
    }

    console.log(
      `[API /api/doctor/apply] Successfully applied ${nextVersionTag} (New Row ID: ${newInsertedRow.id}). Previous ${currentVersionTag} deactivated.`
    );

    // 4. Return success message so the frontend can trigger a toast notification
    return NextResponse.json({
      success: true,
      message: `Prescription applied successfully! Rule updated to ${nextVersionTag} and activated.`,
      action: 'apply',
      rule_id: rule_id || activeRule.id,
      new_rule_id: newInsertedRow.id,
      previous_rule_id: activeRule.id,
      version: nextVersionTag,
      version_number: nextVersionNum,
      previous_version: currentVersionTag,
      is_active: true,
      rule_text: new_rule_text.trim(),
      applied_rule: newInsertedRow,
    });
  } catch (error: any) {
    console.error('[API /api/doctor/apply] Unhandled error:', error);
    return NextResponse.json(
      {
        error: error?.message || 'Internal server error while applying doctor prescription.',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/doctor/apply
 * Dedicated REST endpoint to execute undo action
 */
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rule_id = body.rule_id || body.ruleId || req.nextUrl.searchParams.get('rule_id') || '';
    const undoResult = await performUndo(rule_id);
    return NextResponse.json(undoResult, { status: undoResult.status || 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to execute undo.' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/doctor/apply
 * Also supports undo action via PATCH
 */
export async function PATCH(req: NextRequest) {
  return DELETE(req);
}
