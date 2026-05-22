import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)="?(.*)"?$/);
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/"$/, '').replace(/\r$/, '');
  }
});

const SUPABASE_URL = env['VITE_SUPABASE_URL'];
const SERVICE_KEY = env['SUPABASE_SERVICE_ROLE_KEY'] || env['VITE_SUPABASE_SERVICE_ROLE_KEY'] || env['VITE_SUPABASE_ANON_KEY'];

async function test() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/partners`, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`
    }
  });
  const data = await res.json();
  console.log("Partners:", JSON.stringify(data, null, 2));
}

test();
