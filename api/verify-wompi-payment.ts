import { createClient } from "@supabase/supabase-js";

// Inicializar Supabase con la SERVICE_ROLE_KEY (Para saltarse el RLS)
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(process.env.VITE_SUPABASE_URL!, supabaseKey!);

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const transactionId = payload.transactionId;

    if (!transactionId) {
      return res.status(400).json({ error: "transactionId es requerido" });
    }

    // Determinar entorno de Wompi
    const publicKey = process.env.VITE_WOMPI_PUBLIC_KEY || "";
    const isTest = publicKey.startsWith("pub_test_") || payload.env === "test";
    const wompiDomain = isTest ? "sandbox.wompi.co" : "production.wompi.co";

    console.log(`Verificando transacción ${transactionId} en ${wompiDomain}...`);

    // 1. Consultar directamente a Wompi
    const wompiRes = await fetch(`https://${wompiDomain}/v1/transactions/${transactionId}`);
    
    if (!wompiRes.ok) {
      console.error(`Wompi devolvió error al consultar transacción: ${wompiRes.status}`);
      return res.status(400).json({ error: "No se pudo consultar Wompi" });
    }

    const wompiData = await wompiRes.json();
    const data = wompiData.data;

    if (!data) {
      return res.status(400).json({ error: "Transacción no encontrada" });
    }

    // 2. Procesar solo si la transacción fue APROBADA
    if (data.status === "APPROVED") {
      // Extraemos el usuario y el plan de la referencia: USERID_PLANID_TIMESTAMP
      const referenceParts = data.reference.split("_");
      const user_id = referenceParts[0];
      const plan_id = parseInt(referenceParts[1], 10);

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30); // Asumiendo planes de 30 días

      // Actualizar el perfil del usuario
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          subscription_status: "active",
          current_plan_id: plan_id,
          plan_start_date: startDate.toISOString(),
          plan_end_date: endDate.toISOString(),
        })
        .eq("id", user_id);

      if (profileError) {
        console.error("Error actualizando profile:", profileError);
        throw profileError;
      }

      // Registrar el pago en el historial (Verificamos primero si no existe para evitar duplicados si el webhook ya pasó)
      const { data: existingPayment } = await supabase
        .from("payments")
        .select("id")
        .eq("wompi_transaction_id", data.id)
        .maybeSingle();

      if (!existingPayment) {
        const { error: paymentError } = await supabase.from("payments").insert({
          user_id: user_id,
          plan_id: plan_id,
          wompi_transaction_id: data.id,
          amount: data.amount_in_cents / 100,
          status: data.status,
          payment_method: data.payment_method_type,
        });

        if (paymentError) {
          console.error("Error insertando payment:", paymentError);
          throw paymentError;
        }
      }

      console.log(`Pago verificado sincrónicamente: Usuario ${user_id} - Plan ${plan_id}`);
      return res.status(200).json({ success: true, status: "APPROVED" });
    }

    // Si no está aprobada (ej. PENDING, DECLINED)
    return res.status(200).json({ success: true, status: data.status });

  } catch (error) {
    console.error("Error en validación síncrona:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
