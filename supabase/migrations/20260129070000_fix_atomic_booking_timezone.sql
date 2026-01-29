-- Fix timezone handling in atomic booking
-- We must explicitly interpret the input date/time as 'America/Caracas' (UTC-4) 
-- so that 09:00 input becomes 13:00 UTC, regardless of the server's timezone setting.

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
  
  -- Variables for resolving pricing linkage
  v_profile_id UUID;
  v_pricing_employee_id UUID;
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
    SELECT profile_id INTO v_profile_id FROM employees WHERE id = p_employee_id;
    
    IF v_profile_id IS NOT NULL THEN
       SELECT id INTO v_pricing_employee_id 
       FROM provider_team_members 
       WHERE profile_id = v_profile_id AND provider_id = p_provider_id
       LIMIT 1;
    END IF;
    
    IF v_pricing_employee_id IS NULL THEN
       v_pricing_employee_id := p_employee_id;
    END IF;

    DECLARE 
       v_custom_price DECIMAL(10, 2);
    BEGIN
        SELECT price INTO v_custom_price
        FROM service_employee_pricing
        WHERE service_id = p_service_id 
          AND employee_id = v_pricing_employee_id 
          AND is_active = true
        LIMIT 1;
        
        IF v_custom_price IS NOT NULL THEN
            v_price_amount := v_custom_price;
        END IF;
    END;
  END IF;

  -- 2. Calculate Timestamps (Fixing Timezone to America/Caracas)
  -- Concatenate Date and Time, cast to TIMESTAMP (abstract), then specify it is in 'America/Caracas'
  v_start_ts := (p_appointment_date || ' ' || p_appointment_time)::TIMESTAMP AT TIME ZONE 'America/Caracas';
  v_end_ts := v_start_ts + (v_service_duration || ' minutes')::INTERVAL;

  -- 3. Lock entries
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

  -- 5. Insert Appointment
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
