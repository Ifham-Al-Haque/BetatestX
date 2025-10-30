# Fix Driver Storage RLS Policies

## Problem
You're getting this error when uploading driver pictures:
```
StorageApiError: new row violates row-level security policy
```

This means your storage buckets have Row Level Security (RLS) enabled, but no policies allow authenticated users to upload files.

## Solution Options

### Option 1: Run SQL Script (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Run the SQL script: `fix_driver_storage_rls_policies.sql`

This will create all necessary policies for both `driver-profiles` and `driver-documents` buckets.

### Option 2: Fix Through Supabase Dashboard

#### For `driver-profiles` bucket:

1. Go to **Storage** in Supabase Dashboard
2. Click on `driver-profiles` bucket
3. Go to **Policies** tab
4. Create these policies:

**Policy 1: Upload**
- Policy name: `Allow authenticated uploads`
- Allowed operation: `INSERT`
- Target roles: `authenticated`
- Policy definition:
  ```sql
  bucket_id = 'driver-profiles'
  ```

**Policy 2: Read**
- Policy name: `Allow authenticated reads`
- Allowed operation: `SELECT`
- Target roles: `authenticated`
- Policy definition:
  ```sql
  bucket_id = 'driver-profiles'
  ```

**Policy 3: Update**
- Policy name: `Allow authenticated updates`
- Allowed operation: `UPDATE`
- Target roles: `authenticated`
- Policy definition:
  ```sql
  bucket_id = 'driver-profiles'
  ```

**Policy 4: Delete**
- Policy name: `Allow authenticated deletes`
- Allowed operation: `DELETE`
- Target roles: `authenticated`
- Policy definition:
  ```sql
  bucket_id = 'driver-profiles'
  ```

#### For `driver-documents` bucket:

Repeat the same process for the `driver-documents` bucket, changing `bucket_id = 'driver-documents'` in each policy.

### Option 3: Quick Fix - Make Buckets Public (Less Secure)

If you want a quick fix (not recommended for production):

1. Go to **Storage** → Select bucket (`driver-profiles` or `driver-documents`)
2. Click **Settings**
3. Toggle **Public bucket** to ON

⚠️ **Warning**: This makes all files in the bucket publicly accessible without authentication. Only use if files don't contain sensitive information.

### Option 4: Simpler SQL (All Operations)

If you want a single policy per bucket that covers all operations:

```sql
-- For driver-profiles
CREATE POLICY IF NOT EXISTS "Driver profiles full access"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'driver-profiles')
WITH CHECK (bucket_id = 'driver-profiles');

-- For driver-documents
CREATE POLICY IF NOT EXISTS "Driver documents full access"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'driver-documents')
WITH CHECK (bucket_id = 'driver-documents');
```

## Verify Fix

After applying the policies:

1. Try uploading a driver picture again
2. Check browser console - errors should be gone
3. Verify the file appears in the `driver-profiles` bucket in Storage
4. Check the driver record in database - `profile_picture` column should have the URL

## Troubleshooting

If it still doesn't work:

1. **Check if buckets exist:**
   ```sql
   SELECT * FROM storage.buckets WHERE name IN ('driver-profiles', 'driver-documents');
   ```

2. **Check existing policies:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
   ```

3. **Check your authentication:**
   - Make sure you're logged in
   - Check if your user has the `authenticated` role

4. **Check bucket names:**
   - Ensure bucket names exactly match: `driver-profiles` and `driver-documents`
   - They are case-sensitive

## Next Steps

After fixing RLS policies:
- Test uploading a profile picture
- Test uploading documents
- Check that files are saved correctly to Supabase Storage
- Verify URLs are saved in the database

