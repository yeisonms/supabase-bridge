-- ==============================================================
-- Migración: Poblar first_name / last_name desde user_metadata
-- Ejecutar UNA VEZ en el SQL Editor de Supabase (como superadmin)
-- ==============================================================

UPDATE public.profiles p
SET
  first_name = COALESCE(
    NULLIF(TRIM(p.first_name), ''),
    au.raw_user_meta_data->>'first_name',
    SPLIT_PART(au.raw_user_meta_data->>'full_name', ' ', 1)
  ),
  last_name = COALESCE(
    NULLIF(TRIM(p.last_name), ''),
    au.raw_user_meta_data->>'last_name',
    SUBSTRING(
      au.raw_user_meta_data->>'full_name'
      FROM POSITION(' ' IN au.raw_user_meta_data->>'full_name') + 1
    )
  )
FROM auth.users au
WHERE au.id = p.id
  AND (
    p.first_name IS NULL
    OR TRIM(p.first_name) = ''
    OR p.last_name IS NULL
    OR TRIM(p.last_name) = ''
  );

-- Verifica cuántos registros quedaron aún sin nombre (deberían ser 0 o usuarios sin metadata):
SELECT COUNT(*) AS pendientes
FROM public.profiles
WHERE first_name IS NULL OR TRIM(first_name) = '';
