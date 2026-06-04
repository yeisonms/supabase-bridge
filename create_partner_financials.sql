-- Crear tabla de datos bancarios para los centros aliados
CREATE TABLE IF NOT EXISTS public.partner_financials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE UNIQUE,
  bank_name TEXT NOT NULL,
  account_type TEXT NOT NULL,
  account_number TEXT NOT NULL,
  document_type TEXT NOT NULL,
  document_number TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.partner_financials ENABLE ROW LEVEL SECURITY;

-- Política 1: El administrador del centro puede ver sus propios datos bancarios
CREATE POLICY "Partner admins can view their own financial data"
ON public.partner_financials
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.partners p
    WHERE p.id = partner_financials.partner_id
    AND p.admin_user_id = auth.uid()
  )
);

-- Política 2: El administrador del centro puede insertar sus datos bancarios
CREATE POLICY "Partner admins can insert their own financial data"
ON public.partner_financials
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.partners p
    WHERE p.id = partner_financials.partner_id
    AND p.admin_user_id = auth.uid()
  )
);

-- Política 3: El administrador del centro puede actualizar sus datos bancarios
CREATE POLICY "Partner admins can update their own financial data"
ON public.partner_financials
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.partners p
    WHERE p.id = partner_financials.partner_id
    AND p.admin_user_id = auth.uid()
  )
);

-- Política 4: Los superadmins (perfiles con role = 'admin') pueden ver todo
CREATE POLICY "Superadmins can view all financial data"
ON public.partner_financials
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles pr
    WHERE pr.id = auth.uid()
    AND pr.role = 'admin'
  )
);

-- Trigger para actualizar el timestamp updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_partner_financials_updated_at ON public.partner_financials;
CREATE TRIGGER update_partner_financials_updated_at
BEFORE UPDATE ON public.partner_financials
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();
