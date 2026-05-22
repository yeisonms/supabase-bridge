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
const ANON_KEY = env['VITE_SUPABASE_ANON_KEY'];

async function test() {
  const userIds = ['fd072a53-8b19-4a89-892c-40cd92450eee', 'b5eabd39-1cb0-48cc-88de-0561ad60a16a'];
  console.log("Calling get_checkin_profiles RPC...");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_checkin_profiles`, {
    method: 'POST',
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ p_user_ids: userIds })
  });
  console.log("Status:", res.status);
  const data = await res.json();
  console.log("RPC output:", data);
}

test();
