import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)="?(.*)"?$/);
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/"$/, '');
  }
});

const SUPABASE_URL = env['VITE_SUPABASE_URL'];
const SUPABASE_KEY = env['VITE_SUPABASE_ANON_KEY'];

async function test() {
  console.log("Attempting to insert dummy payment...");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/payments`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      user_id: '00000000-0000-0000-0000-000000000000',
      plan_id: 1,
      wompi_transaction_id: 'fake',
      amount: 100,
      status: 'APPROVED',
      payment_method: 'CARD'
    })
  });
  
  const text = await res.text();
  console.log("Insert response:", res.status, text);
}

test();
