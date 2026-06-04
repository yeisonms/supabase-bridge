-- Eliminar políticas previas para evitar conflictos
DROP POLICY IF EXISTS "Admins can insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can update transactions" ON public.transactions;
DROP POLICY IF EXISTS "Auth users can insert transactions" ON public.transactions;

-- Política para permitir INSERT a cualquier usuario autenticado 
-- (La seguridad real ya la tienes en el frontend con la ruta protegida /admin)
CREATE POLICY "Auth users can insert transactions" 
ON public.transactions 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Opcional: Política para UPDATE si necesitas editar en el futuro
CREATE POLICY "Auth users can update transactions" 
ON public.transactions 
FOR UPDATE 
TO authenticated
USING (true);
