import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function runQA() {
  console.log("==================================================");
  console.log("SPRINT 4 - ECONOMICS QA AUTOMATION");
  console.log("==================================================\n");

  // 1. VERIFY TABLES EXIST
  console.log("1. Verifying tables existence...");
  const tablesToVerify = [
    'payment_beneficiaries',
    'operator_payment_assignments',
    'registry_economic_rules',
    'registry_case_economics',
    'monthly_settlements',
    'settlement_items'
  ];

  for (const table of tablesToVerify) {
    const { error } = await supabase.from(table).select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      console.log(`❌ ERROR reading table ${table}: ${error.message}`);
    } else {
      console.log(`✅ Table ${table} exists and is accessible via Service Role.`);
    }
  }

  // 2. PRELAUNCH / DEMO BLOCK VERIFICATION
  console.log("\n2. Verifying PRELAUNCH / DEMO Block...");
  const { data: testCase, error: caseErr } = await supabase
    .from('ultreon_registry_cases')
    .select('id, status, is_prelaunch, is_demo')
    .limit(1)
    .single();

  if (testCase) {
    console.log(`Attempting to create economics for case: ${testCase.id} (status: ${testCase.status}, prelaunch: ${testCase.is_prelaunch}, demo: ${testCase.is_demo})`);
    
    // Switch to anon key for RLS testing
    const anonClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    const { data: rpcData, error: rpcError } = await anonClient.rpc('create_case_economics', {
      p_case_id: testCase.id,
      p_revenue_snapshot: 1500,
      p_product_cost: 700,
      p_gross_compensation: 117.65,
      p_withholding_rate: 15,
      p_other_variable_costs: 0
    });

    if (rpcError) {
      console.log(`✅ RPC properly rejected the creation: ${rpcError.message}`);
    } else {
      console.log(`❌ WARNING: RPC accepted the creation despite prelaunch/demo flag or admin check! Returned ID: ${rpcData}`);
    }
  } else {
    console.log("No cases found in DB to test prelaunch block.");
  }

  // 3. QA MATH VERIFICATION
  console.log("\n3. Verifying Math Logic Locally...");
  const revenue = 1500;
  const cost = 700;
  const grossComp = 117.65;
  const withholdingRate = 0.15;
  
  const withholdingAmount = Number((grossComp * withholdingRate).toFixed(2));
  const netComp = grossComp - withholdingAmount;
  const investment = cost + grossComp;
  const grossMargin = revenue - cost - grossComp;
  const roi = grossMargin / investment;

  console.log(`Revenue: ${revenue}`);
  console.log(`Cost: ${cost}`);
  console.log(`Gross Comp: ${grossComp}`);
  console.log(`Withholding Amount (Expected ~17.65): ${withholdingAmount}`);
  console.log(`Net Comp (Expected 100): ${netComp}`);
  console.log(`Investment (Expected 817.65): ${investment}`);
  console.log(`Gross Margin (Expected 682.35): ${grossMargin}`);
  console.log(`ROI (Expected ~83.45%): ${(roi * 100).toFixed(2)}%`);

  if (Math.abs(withholdingAmount - 17.65) < 0.01 && 
      Math.abs(netComp - 100.00) < 0.01 && 
      Math.abs(grossMargin - 682.35) < 0.01 &&
      Math.abs(roi - 0.8345) < 0.01) {
    console.log("✅ Math QA Passed.");
  } else {
    console.log("❌ Math QA Failed.");
  }

  console.log("\n==================================================");
  console.log("QA COMPLETED.");
}

runQA();
