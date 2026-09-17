-- Migration: Sprint 1 - USER <-> OPERATOR Link
-- Separates access identity (profiles) from clinical role (operators).

CREATE TABLE IF NOT EXISTS public.operator_user_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID UNIQUE NOT NULL REFERENCES public.operators(id) ON DELETE RESTRICT,
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.operator_user_links ENABLE ROW LEVEL SECURITY;

-- ADMIN: read, insert, update, delete
CREATE POLICY "Admins have full access to operator_user_links"
    ON public.operator_user_links
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- HOSPITAL_USER / COORDINATOR: read links for their hospital operators
CREATE POLICY "Hospital users can read links for their operators"
    ON public.operator_user_links
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.hospital_operators ho
            WHERE ho.operator_id = operator_user_links.operator_id
            AND ho.hospital_id = public.get_current_user_hospital_id()
        )
    );

-- OPERATOR-USER: read their own link
CREATE POLICY "Users can read their own operator link"
    ON public.operator_user_links
    FOR SELECT
    USING (user_id = auth.uid());

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS idx_operator_user_links_user_id ON public.operator_user_links(user_id);

-- Index for fast lookup by operator
CREATE INDEX IF NOT EXISTS idx_operator_user_links_operator_id ON public.operator_user_links(operator_id);
