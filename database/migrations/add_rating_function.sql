-- 📊 Función con privilegios elevados para actualizar ratings de proveedores
-- Esta función puede ser llamada por cualquier usuario autenticado y bypassa RLS

-- Función para actualizar rating de proveedor (con privilegios de seguridad)
CREATE OR REPLACE FUNCTION update_provider_rating_secure(provider_uuid UUID)
RETURNS JSON AS $$
DECLARE
    avg_rating NUMERIC;
    review_count INTEGER;
    result JSON;
BEGIN
    -- Verificar que el proveedor existe
    IF NOT EXISTS (SELECT 1 FROM providers WHERE id = provider_uuid) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Provider not found'
        );
    END IF;
    
    -- Calcular nuevo rating promedio y contar reseñas
    SELECT 
        COALESCE(AVG(rating), 0),
        COUNT(*)
    INTO avg_rating, review_count
    FROM reviews 
    WHERE provider_id = provider_uuid;
    
    -- Actualizar el proveedor (esta función tiene privilegios para hacerlo)
    UPDATE providers 
    SET 
        rating = ROUND(avg_rating, 2),
        total_reviews = review_count,
        updated_at = NOW()
    WHERE id = provider_uuid;
    
    -- Retornar resultado
    result := json_build_object(
        'success', true,
        'provider_id', provider_uuid,
        'new_rating', ROUND(avg_rating, 2),
        'review_count', review_count
    );
    
    -- Log de debug
    RAISE LOG 'Provider rating updated: %', result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dar permisos para que usuarios autenticados puedan ejecutar esta función
GRANT EXECUTE ON FUNCTION update_provider_rating_secure(UUID) TO authenticated;

-- Comentarios para documentación
COMMENT ON FUNCTION update_provider_rating_secure(UUID) IS 'Actualiza el rating promedio y total_reviews de un proveedor basado en sus reseñas. Esta función tiene privilegios elevados para bypesar RLS.';

-- Test de la función (opcional)
-- SELECT update_provider_rating_secure('your-provider-id-here');

-- Verificación
SELECT 'Rating function created successfully' as status;