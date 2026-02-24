-- Setup Supabase Storage Buckets for Slice of Life
-- This script creates storage buckets and sets up policies for image uploads

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
('event-images', 'event-images', true),
('memory-images', 'memory-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for event-images bucket
CREATE POLICY "Users can view event images" ON storage.objects
FOR SELECT USING (bucket_id = 'event-images');

CREATE POLICY "Users can upload event images" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'event-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own event images" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'event-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own event images" ON storage.objects
FOR DELETE USING (
    bucket_id = 'event-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Create storage policies for memory-images bucket
CREATE POLICY "Users can view memory images" ON storage.objects
FOR SELECT USING (bucket_id = 'memory-images');

CREATE POLICY "Users can upload memory images" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'memory-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own memory images" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'memory-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own memory images" ON storage.objects
FOR DELETE USING (
    bucket_id = 'memory-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Admin policies for managing all images
CREATE POLICY "Admins can manage all event images" ON storage.objects
FOR ALL USING (
    bucket_id = 'event-images' AND
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('admin', 'hr_manager', 'manager')
    )
);

CREATE POLICY "Admins can manage all memory images" ON storage.objects
FOR ALL USING (
    bucket_id = 'memory-images' AND
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('admin', 'hr_manager', 'manager')
    )
);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Storage buckets created successfully!';
    RAISE NOTICE 'Buckets: event-images, memory-images';
    RAISE NOTICE 'Storage policies have been configured';
    RAISE NOTICE 'Users can upload images to their own folders';
    RAISE NOTICE 'Admins can manage all images';
END $$;
