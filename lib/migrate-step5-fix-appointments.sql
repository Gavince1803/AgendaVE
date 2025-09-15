-- Paso 5: Arreglar tabla appointments
-- Renombrar start_time a appointment_time si existe
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'appointments' AND column_name = 'start_time') THEN
        ALTER TABLE public.appointments RENAME COLUMN start_time TO appointment_time;
    END IF;
END $$;

-- Eliminar end_time si existe
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'appointments' AND column_name = 'end_time') THEN
        ALTER TABLE public.appointments DROP COLUMN end_time;
    END IF;
END $$;

-- Cambiar 'completed' a 'done' en status
UPDATE public.appointments SET status = 'done' WHERE status = 'completed';
