import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import fs from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runQA() {
  let report = '# QA END-TO-END — PRELAUNCH OPERATIVO\n\n';

  // Create test user or get admin profile ID to assign 'created_by'
  const { data: prof } = await supabase.from('profiles').select('id').eq('role', 'admin').limit(1).single();

  const { data: authUser } = await supabase.auth.admin.getUserById(prof.id);
  await supabase.auth.admin.updateUserById(prof.id, { password: 'QAPassword123!' });

  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: authUser.user.email,
    password: 'QAPassword123!'
  });
  if (authErr) throw authErr;

  const { data: hosp } = await supabase.from('hospitals').select('id').limit(1).single();
  const { data: op } = await supabase.from('operators').select('id').limit(1).single();
  
  // prof is already retrieved above

  report += `## 1. CREAR CASO QA NO DEMO\n`;
  const caseId = crypto.randomUUID();
  const { data: newCase, error: caseErr } = await supabase.from('ultreon_registry_cases').insert({
    id: caseId,
    hospital_id: hosp.id,
    operator_id: op.id,
    created_by: prof.id,
    anonymous_code: `QA-PRELAUNCH-${crypto.randomUUID().slice(0, 8)}`,
    procedure_date: new Date().toISOString(),
    is_demo: false,
    status: 'COMPLETED'
  }).select().single();

  if (caseErr) throw caseErr;
  
  report += `- Case ID: \`${newCase.id}\`\n`;
  report += `- is_demo: \`${newCase.is_demo}\`\n`;
  report += `- is_prelaunch: \`${newCase.is_prelaunch}\`\n\n`;

  report += `## 3. CONSUMO PENDING\n`;
  // Get a product
  let { data: prod } = await supabase.from('registry_products').select('id, product_name, default_unit_cost').eq('active', true).limit(1).single();
  
  if (!prod) {
    const { data: insertedProd } = await supabase.from('registry_products').insert({
      product_name: 'Catéter QA',
      product_code: 'QA-CAT-01',
      description: 'CATHETER',
      default_unit_cost: 1500.00
    }).select('id, product_name, default_unit_cost').single();
    prod = insertedProd;
  }
  
  const { data: consumption, error: consErr } = await supabase.from('registry_case_consumption').insert({
    case_id: caseId,
    hospital_id: hosp.id,
    operator_id: op.id,
    product_id: prod.id,
    created_by: prof.id,
    quantity: 1,
    status: 'PENDING',
    consumption_date: new Date().toISOString(),
    is_prelaunch: true
  }).select().single();

  if (consErr) throw consErr;

  report += `- Consumption ID: \`${consumption.id}\`\n`;
  report += `- Status: \`${consumption.status}\`\n`;
  report += `- is_prelaunch: \`${consumption.is_prelaunch}\`\n`;
  report += `- unit_cost_snapshot: \`${consumption.unit_cost_snapshot}\`\n\n`;

  report += `## 4. CONFIRMAR CONSUMO\n`;
  const { error: confErr } = await supabase.rpc('confirm_registry_consumption', { p_consumption_id: consumption.id });
  if (confErr) throw confErr;

  const { data: confConsumption } = await supabase.from('registry_case_consumption').select('*').eq('id', consumption.id).single();
  const { data: stockMovements } = await supabase.from('registry_stock_movements').select('*').eq('case_id', caseId).eq('movement_type', 'CONSUMPTION');
  
  report += `- Nuevo estado: \`${confConsumption.status}\`\n`;
  report += `- unit_cost_snapshot fijado: \`${confConsumption.unit_cost_snapshot}\`\n`;
  report += `- Movimientos creados: \`${stockMovements.length}\`\n\n`;

  report += `## 5. IDEMPOTENCIA\n`;
  const { data: idempData, error: idempErr } = await supabase.rpc('confirm_registry_consumption', { p_consumption_id: consumption.id });
  const isRejected = idempErr || (idempData && idempData.success === false);
  const errMsg = idempErr ? idempErr.message : (idempData ? idempData.message : 'No error');
  report += `- Intento de re-confirmar: ${isRejected ? 'Rechazado correctamente' : 'Aceptado (Fallo de idempotencia)'}\n`;
  report += `- Mensaje de error/respuesta: \`${errMsg}\`\n\n`;

  report += `## 6. PEDIDO\n`;
  const { data: order, error: orderErr } = await supabase.from('registry_orders').insert({
    hospital_id: hosp.id,
    order_number: `QA-ORD-${crypto.randomUUID().slice(0, 8)}`,
    order_date: new Date().toISOString(),
    created_by: prof.id,
    status: 'SHIPPED', // jump directly to shipped for receiving
    is_prelaunch: true
  }).select().single();
  
  if (orderErr) throw orderErr;

  const { data: orderItem } = await supabase.from('registry_order_items').insert({
    order_id: order.id,
    product_id: prod.id,
    quantity: 10,
    unit_cost_snapshot: prod.default_unit_cost
  }).select().single();

  report += `- Order ID: \`${order.id}\`\n`;
  report += `- Order Item ID: \`${orderItem.id}\` con cantidad \`10\`\n\n`;

  report += `## 7. RECEPCIÓN\n`;
  const { error: recvErr } = await supabase.rpc('receive_registry_order', { p_order_id: order.id });
  if (recvErr) throw recvErr;

  const { data: recvOrder } = await supabase.from('registry_orders').select('status').eq('id', order.id).single();
  const { data: recvMovements } = await supabase.from('registry_stock_movements').select('*').eq('order_id', order.id).eq('movement_type', 'RECEIPT');
  const { data: centerStock } = await supabase.from('registry_center_stock').select('quantity_on_hand').eq('hospital_id', hosp.id).eq('product_id', prod.id).single();

  report += `- Estado de orden tras recepción: \`${recvOrder.status}\`\n`;
  report += `- Movimientos RECEIPT creados: \`${recvMovements.length}\`\n`;
  report += `- Stock actual del centro: \`${centerStock.quantity_on_hand}\`\n\n`;

  report += `## 11. COSTE (MANTENIMIENTO DEL SNAPSHOT)\n`;
  // Cambiar default_unit_cost
  await supabase.from('registry_products').update({ default_unit_cost: 999.99 }).eq('id', prod.id);
  
  const { data: checkConsumption } = await supabase.from('registry_case_consumption').select('unit_cost_snapshot').eq('id', consumption.id).single();
  report += `- Coste snapshot del consumo original: \`${checkConsumption.unit_cost_snapshot}\` (esperado: no cambia a 999.99)\n\n`;

  // Restaurar coste
  await supabase.from('registry_products').update({ default_unit_cost: prod.default_unit_cost }).eq('id', prod.id);

  fs.writeFileSync('ULTREON_PRELAUNCH_OPERATIONAL_E2E_QA.md', report);
  console.log("QA E2E completado. Reporte generado.");
}

runQA().catch(console.error);
