import crypto from 'crypto';

export default function handler(req: any, res: any) {
    // Solo aceptamos método POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { reference, amountInCents, currency } = req.body;
        const secret = process.env.WOMPI_INTEGRITY_SECRET;

        if (!secret) {
            return res.status(500).json({ error: 'Falta el Secreto de Integridad en Vercel' });
        }

        // Fórmula estricta de Wompi: concatenar los valores + el secreto
        const stringToHash = `${reference}${amountInCents}${currency}${secret}`;
        const hash = crypto.createHash('sha256').update(stringToHash).digest('hex');

        // Devolvemos el hash seguro al frontend
        return res.status(200).json({ signature: hash });
    } catch (error) {
        console.error('Error generando firma:', error);
        return res.status(500).json({ error: 'Error generando firma' });
    }
}