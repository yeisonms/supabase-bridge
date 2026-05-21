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
  console.log("Checking profiles columns...");
  const profilesRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?limit=1`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    }
  });
  const profiles = await profilesRes.json();
  console.log("Profiles output:", profiles.length > 0 ? Object.keys(profiles[0]) : profiles);

  console.log("Checking payments columns...");
  const paymentsRes = await fetch(`${SUPABASE_URL}/rest/v1/payments?limit=1`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    }
  });
  const payments = await paymentsRes.json();
  console.log("Payments output:", payments.length > 0 ? Object.keys(payments[0]) : payments);
}

test();
