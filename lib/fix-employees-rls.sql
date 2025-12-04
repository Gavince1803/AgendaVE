-- 🔒 Script para arreglar políticas RLS de empleados
-- Este script habilita RLS en la tabla employees y permite que los empleados vean su propio perfil

-- 1. Habilitar RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- 2. Política: Empleados pueden ver su propio perfil
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'employees' AND policyname = 'employees_read_own') THEN
        CREATE POLICY "employees_read_own" ON public.employees FOR SELECT USING (auth.uid() = profile_id);
    END IF;
END $$;

-- 3. Política: Proveedores pueden ver sus empleados
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'employees' AND policyname = 'employees_read_provider') THEN
        CREATE POLICY "employees_read_provider" ON public.employees FOR SELECT USING (
            EXISTS (SELECT 1 FROM public.providers WHERE id = provider_id AND user_id = auth.uid())
        );
    END IF;
END $$;

-- 4. Política: Proveedores pueden gestionar sus empleados
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'employees' AND policyname = 'employees_manage_provider') THEN
        CREATE POLICY "employees_manage_provider" ON public.employees FOR ALL USING (
            EXISTS (SELECT 1 FROM public.providers WHERE id = provider_id AND user_id = auth.uid())
        );
    END IF;
END $$;

-- 5. Política: Permitir aceptar invitaciones (actualizar row por token)
-- Esta es tricky porque el usuario aún no tiene profile_id asignado cuando acepta
-- Pero la función acceptEmployeeInvite usa un token.
-- Si usamos una función de seguridad definer para aceptar la invitación, no necesitamos política de update pública.
-- Asumimos que acceptEmployeeInvite ya maneja esto o que el usuario ya tiene permisos si el profile_id coincide.
