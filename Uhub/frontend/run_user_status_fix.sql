-- Quick fix for user_status table
-- Run this in your Supabase SQL editor

-- Create user_status table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_online BOOLEAN DEFAULT false,
    status_message TEXT,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_status_user_id ON public.user_status(user_id);
CREATE INDEX IF NOT EXISTS idx_user_status_is_online ON public.user_status(is_online);

-- Enable RLS
ALTER TABLE public.user_status ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies
DROP POLICY IF EXISTS "Users can view own status" ON public.user_status;
CREATE POLICY "Users can view own status" ON public.user_status
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own status" ON public.user_status;
CREATE POLICY "Users can update own status" ON public.user_status
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own status" ON public.user_status;
CREATE POLICY "Users can insert own status" ON public.user_status
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.user_status TO authenticated;

-- Insert status for current user (optional)
INSERT INTO public.user_status (user_id, is_online, status_message, last_seen)
SELECT 
    u.id,
    false,
    'Just joined',
    NOW()
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_status us WHERE us.user_id = u.id
);

-- Verify
SELECT 'user_status table created successfully' as status, COUNT(*) as total_records FROM public.user_status;
