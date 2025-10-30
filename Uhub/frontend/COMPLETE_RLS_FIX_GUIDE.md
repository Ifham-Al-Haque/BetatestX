# Complete Fix for Driver Storage RLS Issues

## Problem
Still getting: `new row violates row-level security policy` when uploading

The file path shows: `drivers/a0396c16-68ea-48b3-8186-cdbed05a7228/documents/...`

This means:
- The driver ID exists ✅
- The path structure is correct ✅
- But RLS policy is still blocking ❌

## Solution: Create Policies via Schema Page

Since you're on the Schema page, here's how to create them there:

### Step 1: Create Policies in "OTHER POLICIES UNDER STORAGE.OBJECTS"

Click "New policy" and create **8 policies total** (4 per bucket):

---

### For `driver-profiles` bucket:

#### Policy 1: INSERT
- **Policy name:** `driver-profiles-insert`
- **Operation:** `INSERT`
- **Roles:** `authenticated`
- **Table:** `storage.objects`
- **WITH CHECK expression:**
  ```sql
  bucket_id = 'driver-profiles'
  ```

#### Policy 2: SELECT
- **Policy name:** `driver-profiles-select`
- **Operation:** `SELECT`
- **Roles:** `authenticated`
- **USING expression:**
  ```sql
  bucket_id = 'driver-profiles'
  ```

#### Policy 3: UPDATE
- **Policy name:** `driver-profiles-update`
- **Operation:** `UPDATE`
- **Roles:** `authenticated`
- **USING expression:**
  ```sql
  bucket_id = 'driver-profiles'
  ```
- **WITH CHECK expression:**
  ```sql
  bucket_id = 'driver-profiles'
  ```

#### Policy 4: DELETE
- **Policy name:** `driver-profiles-delete`
- **Operation:** `DELETE`
- **Roles:** `authenticated`
- **USING expression:**
  ```sql
  bucket_id = 'driver-profiles'
  ```

---

### For `driver-documents` bucket:

#### Policy 5: INSERT
- **Policy name:** `driver-documents-insert`
- **Operation:** `INSERT`
- **Roles:** `authenticated`
- **WITH CHECK expression:**
  ```sql
  bucket_id = 'driver-documents'
  ```

#### Policy 6: SELECT
- **Policy name:** `driver-documents-select`
- **Operation:** `SELECT`
- **Roles:** `authenticated`
- **USING expression:**
  ```sql
  bucket_id = 'driver-documents'
  ```

#### Policy 7: UPDATE
- **Policy name:** `driver-documents-update`
- **Operation:** `UPDATE`
- **Roles:** `authenticated`
- **USING expression:**
  ```sql
  bucket_id = 'driver-documents'
  ```
- **WITH CHECK expression:**
  ```sql
  bucket_id = 'driver-documents'
  ```

#### Policy 8: DELETE
- **Policy name:** `driver-documents-delete`
- **Operation:** `DELETE`
- **Roles:** `authenticated`
- **USING expression:**
  ```sql
  bucket_id = 'driver-documents'
  ```

---

## Important Notes:

1. **Policy Name Format:** Use simple names like `driver-profiles-insert` (hyphens, no spaces)
2. **Expression Syntax:** Must be exactly `bucket_id = 'driver-profiles'` (with single quotes)
3. **Operations:** Create separate policies for each operation (INSERT, SELECT, UPDATE, DELETE)
4. **Roles:** Always include `authenticated`

---

## Verify After Creating

After creating all 8 policies, run:

```sql
SELECT 
  policyname,
  cmd as operation,
  '✓' as status
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE 'driver-%'
ORDER BY policyname, cmd;
```

You should see 8 policies:
- driver-profiles: INSERT, SELECT, UPDATE, DELETE
- driver-documents: INSERT, SELECT, UPDATE, DELETE

---

## Alternative: Use Bucket-Specific Policies (Easier)

Instead of Schema page, try this:

1. Go to **Storage** (left sidebar)
2. Click **`driver-profiles`** bucket
3. Look for **"Policies"** tab (should be near Settings, Overview, etc.)
4. Create policies there - it's easier as it auto-fills bucket name

If you don't see a Policies tab at bucket level, use the Schema page method above.

