-- Tabla para notas privadas de proveedores sobre clientes
CREATE TABLE IF NOT EXISTS public.provider_client_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(provider_id, client_id)
);

-- Habilitar RLS
ALTER TABLE public.provider_client_notes ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS

-- Los proveedores pueden ver sus propias notas
CREATE POLICY "Providers can view their own notes"
ON public.provider_client_notes
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.providers
        WHERE id = provider_client_notes.provider_id
        AND user_id = auth.uid()
    )
);

-- Los proveedores pueden insertar sus propias notas
CREATE POLICY "Providers can insert their own notes"
ON public.provider_client_notes
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.providers
        WHERE id = provider_client_notes.provider_id
        AND user_id = auth.uid()
    )
);

-- Los proveedores pueden actualizar sus propias notas
CREATE POLICY "Providers can update their own notes"
ON public.provider_client_notes
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.providers
        WHERE id = provider_client_notes.provider_id
        AND user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.providers
        WHERE id = provider_client_notes.provider_id
        AND user_id = auth.uid()
    )
);

-- Los proveedores pueden eliminar sus propias notas
CREATE POLICY "Providers can delete their own notes"
ON public.provider_client_notes
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.providers
        WHERE id = provider_client_notes.provider_id
        AND user_id = auth.uid()
    )
);
