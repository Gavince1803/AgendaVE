-- 📊 Trigger para actualizar automáticamente el rating de proveedores
-- Se ejecuta cuando se insertan, actualizan o eliminan reseñas

-- Crear función para actualizar rating del proveedor
CREATE OR REPLACE FUNCTION update_provider_rating()
RETURNS TRIGGER AS $$
DECLARE
    target_provider_id UUID;
    avg_rating NUMERIC;
    review_count INTEGER;
BEGIN
    -- Determinar el provider_id según el tipo de operación
    IF TG_OP = 'DELETE' THEN
        target_provider_id = OLD.provider_id;
    ELSE
        target_provider_id = NEW.provider_id;
    END IF;
    
    -- Calcular nuevo rating promedio y contar reseñas
    SELECT 
        COALESCE(AVG(rating), 0),
        COUNT(*)
    INTO avg_rating, review_count
    FROM reviews 
    WHERE provider_id = target_provider_id;
    
    -- Actualizar el proveedor con el nuevo rating
    UPDATE providers 
    SET 
        rating = ROUND(avg_rating, 2),
        total_reviews = review_count,
        updated_at = NOW()
    WHERE id = target_provider_id;
    
    -- Log de debug (opcional)
    RAISE LOG 'Updated provider % rating to % with % reviews', 
        target_provider_id, ROUND(avg_rating, 2), review_count;
    
    -- Retornar el registro apropiado
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger para INSERT/UPDATE/DELETE en reviews
DROP TRIGGER IF EXISTS reviews_update_provider_rating ON public.reviews;
CREATE TRIGGER reviews_update_provider_rating
    AFTER INSERT OR UPDATE OR DELETE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_provider_rating();

-- Comentario para documentación
COMMENT ON FUNCTION update_provider_rating() IS 'Actualiza automáticamente el rating y total_reviews del proveedor cuando cambian las reseñas';
COMMENT ON TRIGGER reviews_update_provider_rating ON public.reviews IS 'Trigger que mantiene actualizado el rating del proveedor basado en las reseñas';

-- Verificación
SELECT 'Trigger de rating creado exitosamente' as status;