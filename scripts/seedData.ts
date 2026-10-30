import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

/**
 * Lightweight environment variable loader for .env.local and .env
 */
function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      content.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const idx = trimmed.indexOf('=');
          const key = trimmed.slice(0, idx).trim();
          const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      });
    }
  }
}

loadEnv();

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://dbtdczvlwhpjjqxilsdf.supabase.co';

// Prefers service role key (to bypass RLS for administrative seeding) or falls back to anon key
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRidGRjenZsd2hwampxeGlsc2RmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4NDA3OTMsImV4cCI6MjEwODQxNjc5M30.JqLDxHKErU32XyPxevJLIiuPuyqu5gn9OrMSOC7GfK0';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export type AuditOutcome = 'fixed' | 'overridden' | 'escalated_approved';

export interface AuditEventRecord {
  rule_id: string;
  outcome: AuditOutcome;
  created_at: string;
  original_text?: string;
}

const sampleViolationTexts = [
  'We offer an unconditional 100% guarantee on all uptime SLAs without exceptions.',
  'Our cheap cloud solution completely replaces legacy manpower with zero friction.',
  'Revolutionary magic engine that eliminates all competitors effortlessly.',
  'Our platform is foolproof and guarantees double productivity across all tiers.',
  'Guaranteed zero downtime and unlimited storage capacity for enterprise customers.',
  'The best and fastest system in the world with no maintenance required.',
  'Clunky legacy architectures cannot compete with our instant AI wizardry.',
  'We promise dirt cheap pricing with 100% risk-free money-back coverage.',
  'Our proprietary algorithm is 1000x superior to all market competitors.',
  'Unrestricted throughput with zero throttling and free hardware replacements.',
  'Disparaging competitor platforms as obsolete and incompetent in public marketing.',
  'Non-certified compliance claims regarding HIPAA BAA and SOC 2 Type II audit scopes.'
];

function getRandomDateInLast90Days(): string {
  const now = Date.now();
  const ninetyDaysInMs = 90 * 24 * 60 * 60 * 1000;
  const randomPastTime = now - Math.floor(Math.random() * ninetyDaysInMs);
  return new Date(randomPastTime).toISOString();
}

function getRandomViolationText(): string {
  const index = Math.floor(Math.random() * sampleViolationTexts.length);
  return sampleViolationTexts[index];
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function seed() {
  console.log('====================================================');
  console.log('🚀 WebMesh Supabase Database Seeder: audit_events');
  console.log('====================================================');
  console.log(`🌐 Supabase Target URL: ${supabaseUrl}`);

  // 1. Fetch existing rule IDs from brand_guidelines
  console.log('\n📡 STEP 1: Fetching existing rule IDs from "brand_guidelines"...');
  const { data: guidelines, error: fetchError } = await supabase
    .from('brand_guidelines')
    .select('id, brand_name, version');

  if (fetchError) {
    console.error('❌ Error querying brand_guidelines:', fetchError);
    process.exit(1);
  }

  if (!guidelines || guidelines.length === 0) {
    console.error('❌ No records found in brand_guidelines table. Please add brand guidelines first.');
    process.exit(1);
  }

  console.log(`✓ Successfully retrieved ${guidelines.length} existing rules:`);
  guidelines.forEach((g, i) => {
    console.log(`   [${i + 1}] ID: ${g.id} | Brand/Rule: "${g.brand_name}"`);
  });

  // 2. Designate one specific rule as the "High Friction" rule
  const highFrictionRule = guidelines[0];
  const otherRules = guidelines.length > 1 ? guidelines.slice(1) : [highFrictionRule];

  console.log('\n🎯 STEP 2: Selected High-Friction Rule:');
  console.log(`   ID: ${highFrictionRule.id}`);
  console.log(`   Name: "${highFrictionRule.brand_name}"`);

  // 3. Generate exactly 200 mock events over the last 90 days
  console.log('\n🎲 STEP 3: Generating exactly 200 mock events...');

  const events: AuditEventRecord[] = [];

  // Group A: Exactly 15 events for the High Friction Rule
  // Requirement: outcome is 'overridden' or 'escalated_approved' 70% of the time (approx. 10 to 11 of 15)
  // 6 overridden + 5 escalated_approved = 11 (73.3%), 4 fixed = (26.7%)
  const highFrictionOutcomes: AuditOutcome[] = [
    'overridden',
    'overridden',
    'overridden',
    'overridden',
    'overridden',
    'overridden',
    'escalated_approved',
    'escalated_approved',
    'escalated_approved',
    'escalated_approved',
    'escalated_approved',
    'fixed',
    'fixed',
    'fixed',
    'fixed',
  ];

  const shuffledHighFriction = shuffle(highFrictionOutcomes);
  let highFrictionOverridden = 0;
  let highFrictionEscalated = 0;
  let highFrictionFixed = 0;

  for (let i = 0; i < 15; i++) {
    const outcome = shuffledHighFriction[i];
    if (outcome === 'overridden') highFrictionOverridden++;
    else if (outcome === 'escalated_approved') highFrictionEscalated++;
    else highFrictionFixed++;

    events.push({
      rule_id: highFrictionRule.id,
      outcome,
      created_at: getRandomDateInLast90Days(),
      original_text: getRandomViolationText(),
    });
  }

  // Group B: Exactly 185 events for other rules (mostly defaulting to 'fixed')
  // e.g. 150 fixed (~81%), 20 overridden (~11%), 15 escalated_approved (~8%)
  const otherOutcomesList: AuditOutcome[] = [];
  for (let i = 0; i < 150; i++) otherOutcomesList.push('fixed');
  for (let i = 0; i < 20; i++) otherOutcomesList.push('overridden');
  for (let i = 0; i < 15; i++) otherOutcomesList.push('escalated_approved');

  const shuffledOtherOutcomes = shuffle(otherOutcomesList);
  let otherFixed = 0;
  let otherOverridden = 0;
  let otherEscalated = 0;

  for (let i = 0; i < 185; i++) {
    const targetRule = otherRules[Math.floor(Math.random() * otherRules.length)];
    const outcome = shuffledOtherOutcomes[i];

    if (outcome === 'fixed') otherFixed++;
    else if (outcome === 'overridden') otherOverridden++;
    else otherEscalated++;

    events.push({
      rule_id: targetRule.id,
      outcome,
      created_at: getRandomDateInLast90Days(),
      original_text: getRandomViolationText(),
    });
  }

  // Sort all 200 events chronologically by created_at
  events.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  console.log(`✓ Total Mock Events Generated: ${events.length}`);
  console.log(`   - High Friction Rule (${highFrictionRule.brand_name}): 15 events`);
  console.log(`     • Overridden: ${highFrictionOverridden}`);
  console.log(`     • Escalated Approved: ${highFrictionEscalated}`);
  console.log(`     • Fixed: ${highFrictionFixed}`);
  console.log(
    `     • Overridden / Escalated Ratio: ${(
      ((highFrictionOverridden + highFrictionEscalated) / 15) *
      100
    ).toFixed(1)}% (Target: ~70%)`
  );
  console.log(`   - Other Rules: 185 events`);
  console.log(`     • Fixed: ${otherFixed} (${((otherFixed / 185) * 100).toFixed(1)}%)`);
  console.log(`     • Overridden: ${otherOverridden}`);
  console.log(`     • Escalated Approved: ${otherEscalated}`);

  const oldestDate = events[0].created_at.split('T')[0];
  const newestDate = events[events.length - 1].created_at.split('T')[0];
  console.log(`   - Date Span: ${oldestDate} to ${newestDate} (last 90 days)`);

  // 4. Insert records into Supabase in batches
  console.log('\n💾 STEP 4: Inserting 200 events into "audit_events" in batches of 50...');
  const BATCH_SIZE = 50;
  let totalInserted = 0;

  for (let i = 0; i < events.length; i += BATCH_SIZE) {
    const batch = events.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(events.length / BATCH_SIZE);

    const { data, error } = await supabase
      .from('audit_events')
      .insert(batch)
      .select('id');

    if (error) {
      console.error(`\n❌ Error inserting batch ${batchNum}/${totalBatches}:`, error.message);

      // Handle Row Level Security notice
      if (error.code === '42501' || error.message.includes('row-level security')) {
        console.log('\n🔒 ROW LEVEL SECURITY (RLS) NOTICE:');
        console.log('The "audit_events" table in Supabase has Row Level Security (RLS) enabled without an open insert policy.');
        console.log('To allow this script to insert into your live database, choose one of these two options:\n');
        console.log('Option 1 (Recommended): Run the script with your Supabase Service Role Key (bypasses RLS):');
        console.log('  Windows PowerShell:');
        console.log('    $env:SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"; npx tsx scripts/seedData.ts');
        console.log('  Command Prompt / Bash:');
        console.log('    SUPABASE_SERVICE_ROLE_KEY=your_service_role_key npx tsx scripts/seedData.ts\n');
        console.log('Option 2: Run this SQL in your Supabase SQL Editor (Dashboard -> SQL Editor):');
        console.log('  ALTER TABLE public.audit_events DISABLE ROW LEVEL SECURITY;');
        console.log('  -- OR:');
        console.log('  CREATE POLICY "Allow all operations" ON public.audit_events FOR ALL USING (true) WITH CHECK (true);');
      }

      process.exit(1);
    }

    const count = data ? data.length : batch.length;
    totalInserted += count;
    console.log(`   ✓ Batch ${batchNum}/${totalBatches}: Inserted ${count} records (${totalInserted}/${events.length})`);
  }

  console.log('\n====================================================');
  console.log(`✨ SUCCESS: Successfully populated ${totalInserted} records into "audit_events"!`);
  console.log('====================================================\n');
}

seed().catch((err) => {
  console.error('Fatal Seeder Error:', err);
  process.exit(1);
});
