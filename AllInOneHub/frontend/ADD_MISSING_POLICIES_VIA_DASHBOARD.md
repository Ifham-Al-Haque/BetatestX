# Add Missing UPDATE and DELETE Policies via Dashboard

## Issue Found
Your policies are missing:
- ✗ **UPDATE** operation
- ✗ **DELETE** operation

These are needed for:
- Moving files from temp folders to driver folders
- Updating file metadata
- Cleaning up old files

## Solution: Add Policies via Dashboard

### Step 1: Add UPDATE Policy for driver-profiles

1. Go to **Storage** → Click `driver-profiles` bucket
2. Click **"Policies"** tab
3. Click **"New Policy"** → **"For full customization"**
4. Fill in:

   **Policy Name:**
   ```
   Driver profiles UPDATE access
   ```

   **Allowed operation:**
   - ✅ Check only: **UPDATE**

   **Target roles:**
   - Type: `authenticated`

   **Policy definition (USING expression):**
   ```sql
   bucket_id = 'driver-profiles'
   ```

   **WITH CHECK expression:**
   ```sql
   bucket_id = 'driver-profiles'
   ```

5. Click **"Review"** → **"Save policy"**

---

### Step 2: Add DELETE Policy for driver-profiles

1. Still in `driver-profiles` → **Policies** tab
2. Click **"New Policy"** again
3. Fill in:

   **Policy Name:**
   ```
   Driver profiles DELETE access
   ```

   **Allowed operation:**
   - ✅ Check only: **DELETE**

   **Target roles:**
   - Type: `authenticated`

   **Policy definition (USING expression):**
   ```sql
   bucket_id = 'driver-profiles'
   ```

   **WITH CHECK:** (Leave empty or same as USING)

4. Click **"Review"** → **"Save policy"**

---

### Step 3: Add UPDATE Policy for driver-documents

1. Go to **Storage** → Click `driver-documents` bucket
2. Click **"Policies"** tab
3. Click **"New Policy"** → **"For full customization"**
4. Fill in:

   **Policy Name:**
   ```
   Driver documents UPDATE access
   ```

   **Allowed operation:**
   - ✅ Check only: **UPDATE**

   **Target roles:**
   - Type: `authenticated`

   **Policy definition (USING expression):**
   ```sql
   bucket_id = 'driver-documents'
   ```

   **WITH CHECK expression:**
   ```sql
   bucket_id = 'driver-documents'
   ```

5. Click **"Review"** → **"Save policy"**

---

### Step 4: Add DELETE Policy for driver-documents

1. Still in `driver-documents` → **Policies** tab
2. Click **"New Policy"** again
3. Fill in:

   **Policy Name:**
   ```
   Driver documents DELETE access
   ```

   **Allowed operation:**
   - ✅ Check only: **DELETE**

   **Target roles:**
   - Type: `authenticated`

   **Policy definition (USING expression):**
   ```sql
   bucket_id = 'driver-documents'
   ```

   **WITH CHECK:** (Leave empty or same as USING)

4. Click **"Review"** → **"Save policy"**

---

## Alternative: Use SQL (If You Have Permissions)

If you get "must be owner" error with SQL, you can try this (requires service role):

```sql
-- UPDATE policy for driver-profiles
CREATE POLICY "Driver profiles UPDATE access"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'driver-profiles')
WITH CHECK (bucket_id = 'driver-profiles');

-- DELETE policy for driver-profiles
CREATE POLICY "Driver profiles DELETE access"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'driver-profiles');

-- UPDATE policy for driver-documents
CREATE POLICY "Driver documents UPDATE access"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'driver-documents')
WITH CHECK (bucket_id = 'driver-documents');

-- DELETE policy for driver-documents
CREATE POLICY "Driver documents DELETE access"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'driver-documents');
```

---

## Verify After Adding

Run this query to verify all policies exist:

```sql
SELECT 
  policyname,
  cmd as operation,
  CASE 
    WHEN 'authenticated' = ANY(roles) THEN '✓'
    ELSE '✗'
  END as has_authenticated
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (
    qual::text LIKE '%driver-profiles%'
    OR with_check::text LIKE '%driver-profiles%'
    OR qual::text LIKE '%driver-documents%'
    OR with_check::text LIKE '%driver-documents%'
  )
ORDER BY policyname, cmd;
```

After adding, you should see:
- ✓ INSERT
- ✓ SELECT  
- ✓ UPDATE
- ✓ DELETE

---

## Why UPDATE and DELETE Are Needed

- **UPDATE**: Needed when the code moves files from `drivers/temp/` to `drivers/{driver_id}/`
- **DELETE**: Needed to clean up temporary files after moving them
- Without these, file operations will fail even if INSERT works

After adding these policies, try uploading a driver picture again!

