-- 1. Add price_amount to appointments table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'price_amount') THEN
        ALTER TABLE public.appointments ADD COLUMN price_amount DECIMAL(10, 2);
    END IF;
END $$;

-- 2. Update atomic booking RPC to resolve and store the correct price
CREATE OR REPLACE FUNCTION book_appointment_atomic(
  p_client_id UUID,
  p_provider_id UUID,
  p_service_id UUID,
  p_employee_id UUID,
  p_appointment_date DATE,
  p_appointment_time TIME,
  p_notes TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_service_duration INT;
  v_price_amount DECIMAL(10, 2);
  v_start_ts TIMESTAMPTZ;
  v_end_ts TIMESTAMPTZ;
  v_conflict_count INT;
  v_new_appointment JSONB;
BEGIN
  -- 1. Get Service Duration & Default Price
  SELECT duration_minutes, price_amount INTO v_service_duration, v_price_amount
  FROM services
  WHERE id = p_service_id;

  IF v_service_duration IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Servicio no encontrado');
  END IF;

  -- 1b. Check for Employee Custom Price override
  IF p_employee_id IS NOT NULL THEN
    SELECT price INTO v_price_amount
    FROM service_employee_pricing
    WHERE service_id = p_service_id 
      AND employee_id = p_employee_id 
      AND is_active = true
    LIMIT 1;
    
    -- If found, v_price_amount is updated. If not found, it stays as base service price.
    -- Re-check if v_price_amount became NULL (shouldn't if logic is correct, but let's be safe)
    IF v_price_amount IS NULL THEN
        SELECT price_amount INTO v_price_amount FROM services WHERE id = p_service_id;
    END IF;
  END IF;

  -- 2. Calculate Timestamps
  v_start_ts := (p_appointment_date || ' ' || p_appointment_time)::TIMESTAMPTZ;
  v_end_ts := v_start_ts + (v_service_duration || ' minutes')::INTERVAL;

  -- 3. Lock entries for this provider and date to prevent race conditions
  PERFORM 1 FROM appointments 
  WHERE provider_id = p_provider_id 
    AND appointment_date = p_appointment_date
  FOR UPDATE; 

  -- 4. Check for Overlaps
  SELECT COUNT(*) INTO v_conflict_count
  FROM appointments
  WHERE provider_id = p_provider_id
    AND appointment_date = p_appointment_date
    AND status IN ('pending', 'confirmed')
    AND (
      (p_employee_id IS NOT NULL AND employee_id = p_employee_id) OR
      (p_employee_id IS NULL)
    )
    AND (
       (start_ts < v_end_ts AND end_ts > v_start_ts)
    );

  IF v_conflict_count > 0 THEN
     RETURN jsonb_build_object('success', false, 'message', 'El horario ya fue ocupado por otra persona.');
  END IF;

  -- 5. Insert Appointment with PRICE
  INSERT INTO appointments (
    client_id,
    provider_id,
    service_id,
    employee_id,
    appointment_date,
    appointment_time,
    start_ts,
    end_ts,
    status,
    notes,
    price_amount
  ) VALUES (
    p_client_id,
    p_provider_id,
    p_service_id,
    p_employee_id,
    p_appointment_date,
    p_appointment_time,
    v_start_ts,
    v_end_ts,
    'pending',
    p_notes,
    v_price_amount
  ) RETURNING to_jsonb(appointments.*) INTO v_new_appointment;

  RETURN jsonb_build_object('success', true, 'data', v_new_appointment);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
