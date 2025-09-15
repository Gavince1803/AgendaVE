-- Paso 4: Arreglar tabla availabilities
-- Renombrar day_of_week a weekday si existe
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'availabilities' AND column_name = 'day_of_week') THEN
        ALTER TABLE public.availabilities RENAME COLUMN day_of_week TO weekday;
    END IF;
END $$;

-- Crear índice
CREATE INDEX IF NOT EXISTS idx_availabilities_weekday ON public.availabilities(weekday);
