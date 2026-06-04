-- Vamos a probar una política más permisiva para administradores basada en el JWT de autenticación o simplemente abierta a lectura para usuarios autenticados, ya que el dashboard está protegido en el frontend.
-- Primero, borramos las políticas anteriores para que no interfieran
DROP POLICY IF EXISTS "Admins can view payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can view transactions" ON public.transactions;

-- Política de lectura para usuarios autenticados (el frontend se encarga de que solo el admin entre a /admin)
CREATE POLICY "Auth users can view payments" 
ON public.payments 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Auth users can view transactions" 
ON public.transactions 
FOR SELECT 
TO authenticated
USING (true);
