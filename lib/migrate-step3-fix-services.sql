-- Paso 3: Arreglar tabla services
-- Agregar price_currency si no existe
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS price_currency TEXT NOT NULL DEFAULT 'VES';

-- Renombrar price a price_amount si existe
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'services' AND column_name = 'price') THEN
        ALTER TABLE public.services RENAME COLUMN price TO price_amount;
    END IF;
END $$;

-- Crear índice
CREATE INDEX IF NOT EXISTS idx_services_price_currency ON public.services(price_currency);
