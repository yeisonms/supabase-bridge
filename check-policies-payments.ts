import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('payments').select('*', { count: 'exact' });
  console.log('Total payments with service_role:', data?.length);

  // Check policies
  const { data: policies, error: polErr } = await supabase.rpc('get_policies', { table_name: 'payments' });
  if (polErr) {
    // maybe rpc doesn't exist, let's query raw sql or just check if RLS is on via a rest request
    console.error('RPC error:', polErr);
  } else {
    console.log('Policies:', policies);
  }
}
check();
