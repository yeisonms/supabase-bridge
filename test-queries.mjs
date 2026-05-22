import fs from 'fs';
import { format, startOfMonth, endOfMonth } from 'date-fns';

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
  const today = format(new Date(), 'yyyy-MM-dd');
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');

  const partnerId = 'b38a3170-9a9f-4c78-9532-dad8244ad039'; // we saw checkins for this
  console.log(`today = ${today}, monthStart = ${monthStart}, monthEnd = ${monthEnd}`);
  console.log(`Querying for partnerId = ${partnerId}`);

  // Query A: todayAllRes
  const urlA = `${SUPABASE_URL}/rest/v1/checkins?partner_id=eq.${partnerId}&checkin_date=eq.${today}&status=in.(confirmed,reserved)&select=status`;
  const resA = await fetch(urlA, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }
  });
  const dataA = await resA.json();
  console.log("todayAllRes count:", dataA.length, dataA);

  // Query B: monthConfirmedRes
  const urlB = `${SUPABASE_URL}/rest/v1/checkins?partner_id=eq.${partnerId}&checkin_date=gte.${monthStart}&checkin_date=lte.${monthEnd}&status=eq.confirmed&select=checkin_date`;
  const resB = await fetch(urlB, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }
  });
  const dataB = await resB.json();
  console.log("monthConfirmedRes count:", dataB.length);

  // Query C: todayListRes
  const urlC = `${SUPABASE_URL}/rest/v1/checkins?partner_id=eq.${partnerId}&checkin_date=eq.${today}&select=id,user_id,checkin_date,created_at,status&order=created_at.desc&limit=20`;
  const resC = await fetch(urlC, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }
  });
  const dataC = await resC.json();
  console.log("todayListRes count:", dataC.length, dataC);
}

test();
