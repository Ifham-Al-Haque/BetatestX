-- =====================================================
-- SETUP DRIVER STORAGE BUCKETS
-- Creates storage buckets for driver documents and profile pictures
-- =====================================================

-- Create storage bucket for driver profile pictures
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'driver-profiles',
    'driver-profiles',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for driver documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'driver-documents',
    'driver-documents',
    true,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'image/tiff']
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for driver-profiles bucket
CREATE POLICY "Anyone can view driver profile pictures" ON storage.objects
    FOR SELECT USING (bucket_id = 'driver-profiles');

CREATE POLICY "Authenticated users can upload driver profile pictures" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'driver-profiles' 
        AND auth.role() = 'authenticated'
        AND auth.uid() IN (
            SELECT id FROM employees WHERE role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Admins and managers can update driver profile pictures" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'driver-profiles' 
        AND auth.uid() IN (
            SELECT id FROM employees WHERE role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Admins can delete driver profile pictures" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'driver-profiles' 
        AND auth.uid() IN (
            SELECT id FROM employees WHERE role = 'admin'
        )
    );

-- Create RLS policies for driver-documents bucket
CREATE POLICY "Anyone can view driver documents" ON storage.objects
    FOR SELECT USING (bucket_id = 'driver-documents');

CREATE POLICY "Authenticated users can upload driver documents" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'driver-documents' 
        AND auth.role() = 'authenticated'
        AND auth.uid() IN (
            SELECT id FROM employees WHERE role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Admins and managers can update driver documents" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'driver-documents' 
        AND auth.uid() IN (
            SELECT id FROM employees WHERE role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Admins can delete driver documents" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'driver-documents' 
        AND auth.uid() IN (
            SELECT id FROM employees WHERE role = 'admin'
        )
    );

-- Verify the setup
SELECT '=== STORAGE BUCKETS CREATED ===' as info;
SELECT id, name, public, file_size_limit FROM storage.buckets WHERE id IN ('driver-profiles', 'driver-documents');

SELECT '=== STORAGE POLICIES CREATED ===' as info;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%driver%';

SELECT '=== DRIVER STORAGE SETUP COMPLETE ===' as info;
SELECT 'Your driver storage system is now ready!' as success_message;
