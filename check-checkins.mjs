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
  console.log("Using key prefix:", SERVICE_KEY ? SERVICE_KEY.substring(0, 10) + "..." : "undefined");
  console.log("Fetching recent checkins with service/anon key...");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/checkins?order=created_at.desc&limit=10`, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`
    }
  });
  const data = await res.json();
  console.log("Checkins output:", JSON.stringify(data, null, 2));
}

test();
