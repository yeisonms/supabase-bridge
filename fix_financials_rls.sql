DROP POLICY IF EXISTS "Superadmins can view all financial data" ON public.partner_financials;
DROP POLICY IF EXISTS "Auth users can view all financial data" ON public.partner_financials;

-- Permitir a los usuarios autenticados leer los datos financieros (para que el Admin pueda verlos)
CREATE POLICY "Auth users can view all financial data"
ON public.partner_financials
FOR SELECT
TO authenticated
USING (true);
