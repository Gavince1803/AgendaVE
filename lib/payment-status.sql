-- Add payment_status and payment_method columns to appointments table

ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial')),
ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('cash', 'zelle', 'pago_movil', 'card', 'other'));

-- Create index for payment_status for faster filtering
CREATE INDEX IF NOT EXISTS idx_appointments_payment_status ON public.appointments(payment_status);
