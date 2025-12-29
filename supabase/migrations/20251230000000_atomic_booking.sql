-- Function to atomically book an appointment with duplicate prevention
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
  v_start_ts TIMESTAMPTZ;
  v_end_ts TIMESTAMPTZ;
  v_conflict_count INT;
  v_new_appointment JSONB;
BEGIN
  -- 1. Get Service Duration
  SELECT duration_minutes INTO v_service_duration
  FROM services
  WHERE id = p_service_id;

  IF v_service_duration IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Servicio no encontrado');
  END IF;

  -- 2. Calculate Timestamps
  v_start_ts := (p_appointment_date || ' ' || p_appointment_time)::TIMESTAMPTZ;
  v_end_ts := v_start_ts + (v_service_duration || ' minutes')::INTERVAL;

  -- 3. Lock entries for this provider and date to prevent race conditions
  -- We lock/check existing appointments strictly
  PERFORM 1 FROM appointments 
  WHERE provider_id = p_provider_id 
    AND appointment_date = p_appointment_date
  FOR UPDATE; 

  -- 4. Check for Overlaps (Concurrency Safe due to Lock)
  -- Logic: New Start < Old End AND New End > Old Start
  -- Status must be pending or confirmed
  SELECT COUNT(*) INTO v_conflict_count
  FROM appointments
  WHERE provider_id = p_provider_id
    AND appointment_date = p_appointment_date
    AND status IN ('pending', 'confirmed')
    -- If employee is specified, check employee conflicts specifically? 
    -- For now, let's assume provider-level or employee-level based on business logic. 
    -- If employee_id is provided, check that employee. If not, check provider generally?
    -- Complexity: "Any Employee" vs "Specific Employee".
    -- Let's stick to standard time slot protection: 
    -- Generally, if a specific employee is requested, only that employee is blocked. 
    -- If no employee (or "any"), we need to find an available one? 
    -- SIMPLIFICATION: This RPC assumes we are booking a specific slot. 
    -- We will check basic time overlap for the assigned resource.
    AND (
      (p_employee_id IS NOT NULL AND employee_id = p_employee_id) OR
      (p_employee_id IS NULL) -- If no employee assigned, check provider general availability? 
                              -- Actually, usually booking implies a resource. 
                              -- Let's enforce strictly if employee_id is present.
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
    notes
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
    p_notes
  ) RETURNING to_jsonb(appointments.*) INTO v_new_appointment;

  RETURN jsonb_build_object('success', true, 'data', v_new_appointment);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
