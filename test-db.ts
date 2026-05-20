import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function test() {
  console.log("Testing profiles update...");
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("current_plan_id")
    .limit(1);
    
  console.log("Profiles current_plan_id exists:", !profileErr, profileErr || profile);

  console.log("Testing payments plan_id...");
  const { data: payment, error: paymentErr } = await supabase
    .from("payments")
    .select("plan_id")
    .limit(1);

  console.log("Payments plan_id exists:", !paymentErr, paymentErr || payment);
}

test();
