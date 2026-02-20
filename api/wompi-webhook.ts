import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Inicializar Supabase con la SERVICE_ROLE_KEY (Para saltarse el RLS, ya que es el servidor actuando)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export default async function handler(req: any, res: any) {
  // 1. Solo aceptar peticiones POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const payload = req.body;
    const signature = payload.signature;
    const event = payload.event;
    const data = payload.data.transaction;

    // 2. Seguridad: Validar la firma de Wompi para asegurar que nadie más mande peticiones falsas
    // Wompi concatena los valores de las propiedades + el timestamp + el secreto de eventos
    const secret = process.env.WOMPI_EVENTS_SECRET!;
    let concatenatedValues = '';
    
    signature.properties.forEach((prop: string) => {
      const keys = prop.split('.');
      let value = payload.data;
      keys.forEach(k => value = value[k]);
      concatenatedValues += value;
    });

    const timestamp = payload.timestamp.toString();
    const stringToHash = concatenatedValues + timestamp + secret;
    
    const hash = crypto.createHash('sha256').update(stringToHash).digest('hex');

    if (hash !== signature.checksum) {
      console.error('Alerta de Seguridad: Firma de Wompi inválida');
      return res.status(401).json({ error: 'Firma inválida' });
    }

    // 3. Procesar solo si la transacción fue APROBADA
    if (event === 'transaction.updated' && data.status === 'APPROVED') {
      const user_id = data.reference; // Asumiendo que mandaste el user_id como 'reference' en el frontend
      
      // Calcular la nueva fecha de fin de suscripción (30 días a partir de hoy)
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      // 4. Actualizar el perfil del usuario
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'active',
          subscription_end_date: endDate.toISOString()
        })
        .eq('id', user_id);

      if (profileError) throw profileError;

      // 5. Registrar el pago en el historial
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          user_id: user_id,
          wompi_transaction_id: data.id,
          amount: data.amount_in_cents / 100, // Convertir centavos a pesos
          status: data.status,
          payment_method: data.payment_method_type
        });

      if (paymentError) throw paymentError;

      console.log(`Pago aprobado y procesado para el usuario: ${user_id}`);
    }

    // Siempre responder 200 OK a Wompi para que no reintente enviar el evento
    return res.status(200).json({ received: true });

  } catch (error) {
    console.error('Error procesando el webhook:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}