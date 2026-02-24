# Driver Storage RLS Policies Setup Guide

## Problem
You're getting: `ERROR: 42501: must be owner of table objects`

This happens because the `storage.objects` table is protected. We need to create policies through the Supabase Dashboard UI instead of SQL.

## Solution: Use Supabase Dashboard

### Option 1: Dashboard UI (Recommended - Easiest)

#### For `driver-profiles` bucket:

1. **Go to Supabase Dashboard**
2. **Navigate to Storage** (left sidebar)
3. **Click on `driver-profiles` bucket** (or create it if it doesn't exist)
4. **Click on "Policies" tab** at the top
5. **Click "New Policy"** button
6. **Choose "For full customization"** or use "Create a policy from scratch"
7. **Fill in the policy:**

   **Policy Name:** `Allow authenticated uploads and reads`
   
   **Allowed operation:** Select `ALL` (or create separate policies for INSERT, SELECT, UPDATE, DELETE)
   
   **Target roles:** `authenticated`
   
   **USING expression:** 
   ```sql
   bucket_id = 'driver-profiles'
   ```
   
   **WITH CHECK expression:**
   ```sql
   bucket_id = 'driver-profiles'
   ```

8. **Click "Review" then "Save policy"**

#### For `driver-documents` bucket:

Repeat the same steps for `driver-documents` bucket, changing:
- Policy Name: `Allow authenticated uploads and reads documents`
- USING expression: `bucket_id = 'driver-documents'`
- WITH CHECK expression: `bucket_id = 'driver-documents'`

---

### Option 2: Create Buckets First (If They Don't Exist)

If the buckets don't exist:

1. **Go to Storage** in Supabase Dashboard
2. **Click "New bucket"**
3. **Bucket name:** `driver-profiles`
   - ✅ **Public bucket:** Check this (or leave unchecked if you want private)
   - Click "Create bucket"
4. **Repeat for `driver-documents`**

---

### Option 3: Alternative SQL Approach (Requires Service Role Key)

If you have access to the Service Role key (⚠️ **Only use in secure environment**):

```sql
-- This requires service_role permissions
-- Not recommended unless you're an admin

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Driver profiles access" ON storage.objects;
DROP POLICY IF EXISTS "Driver documents access" ON storage.objects;

-- Create policies
CREATE POLICY "Driver profiles access"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'driver-profiles')
WITH CHECK (bucket_id = 'driver-profiles');

CREATE POLICY "Driver documents access"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'driver-documents')
WITH CHECK (bucket_id = 'driver-documents');
```

---

### Option 4: Make Buckets Public (Quick but Less Secure)

If you just want it to work quickly:

1. **Go to Storage** → Select bucket (`driver-profiles`)
2. **Click "Settings"** tab
3. **Toggle "Public bucket"** to **ON**
4. **Repeat for `driver-documents`**

⚠️ **Warning:** This makes all files publicly accessible. Only use if files aren't sensitive.

---

## Verify It's Working

After creating policies:

1. Try uploading a driver picture in your app
2. Check browser console - no more RLS errors
3. Verify files appear in Storage buckets
4. Check database - `profile_picture` column should have URLs

## Troubleshooting

### Still getting errors?
- Make sure buckets `driver-profiles` and `driver-documents` exist
- Check that policies were created (visible in Policies tab)
- Verify you're logged in (authenticated user)
- Check browser console for specific error messages

### Buckets don't exist?
Create them first:
1. Storage → New bucket
2. Name: `driver-profiles` (then `driver-documents`)
3. Choose public or private
4. Create

---

## Recommended Setup

1. **Create buckets** (if needed):
   - `driver-profiles` (can be public or private)
   - `driver-documents` (should be private)

2. **Create policies via Dashboard:**
   - For each bucket, create policy allowing `authenticated` users `ALL` operations
   - Policy expression: `bucket_id = 'bucket-name'`

This should fix the upload issue!

