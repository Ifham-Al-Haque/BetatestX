-- Create user_status table for chat system
-- This table tracks user online/offline status

-- Drop table if it exists (for clean recreation)
DROP TABLE IF EXISTS public.user_status CASCADE;

-- Create the user_status table
CREATE TABLE public.user_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_online BOOLEAN DEFAULT false,
    status_message TEXT,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_status_user_id ON public.user_status(user_id);
CREATE INDEX IF NOT EXISTS idx_user_status_is_online ON public.user_status(is_online);
CREATE INDEX IF NOT EXISTS idx_user_status_last_seen ON public.user_status(last_seen);

-- Create RLS policies
ALTER TABLE public.user_status ENABLE ROW LEVEL SECURITY;

-- Users can view their own status
CREATE POLICY "Users can view own status" ON public.user_status
    FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own status
CREATE POLICY "Users can update own status" ON public.user_status
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can insert their own status
CREATE POLICY "Users can insert own status" ON public.user_status
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own status
CREATE POLICY "Users can delete own status" ON public.user_status
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_user_status_updated_at
    BEFORE UPDATE ON public.user_status
    FOR EACH ROW
    EXECUTE FUNCTION update_user_status_updated_at();

-- Grant permissions
GRANT ALL ON public.user_status TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Insert sample data for existing users (optional)
-- This will create status records for users who are currently online
INSERT INTO public.user_status (user_id, is_online, status_message, last_seen)
SELECT 
    u.id,
    false, -- Start as offline
    'Just joined',
    NOW()
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_status us WHERE us.user_id = u.id
);

-- Verify the table was created
SELECT 
    'user_status table created successfully' as status,
    COUNT(*) as total_records,
    COUNT(CASE WHEN is_online = true THEN 1 END) as online_users
FROM public.user_status;
