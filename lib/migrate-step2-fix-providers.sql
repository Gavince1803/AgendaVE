-- Paso 2: Arreglar tabla providers
-- Agregar user_id si no existe
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Agregar website si no existe
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS website TEXT;

-- Agregar category si no existe
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'general';

-- Migrar datos existentes: asignar user_id = id donde sea NULL
UPDATE public.providers 
SET user_id = id 
WHERE user_id IS NULL;

-- Crear índice
CREATE INDEX IF NOT EXISTS idx_providers_user_id ON public.providers(user_id);
CREATE INDEX IF NOT EXISTS idx_providers_category ON public.providers(category);
