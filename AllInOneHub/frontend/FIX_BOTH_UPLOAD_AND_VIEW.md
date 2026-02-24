# Complete Fix: Upload AND View Documents

## Problem Summary
1. ❌ **Can't upload documents** - Getting RLS errors on INSERT
2. ❌ **Can't view documents** - Documents can't be loaded (RLS blocking SELECT)

Both issues are caused by missing or incorrect RLS policies.

---

## Root Cause
You're missing:
- ✅ INSERT policy (exists but might not work correctly)
- ✅ SELECT policy (exists but might not work correctly)  
- ❌ UPDATE policy (missing - needed for file operations)
- ❌ DELETE policy (missing - needed for cleanup)

Even if INSERT/SELECT policies exist, they might be configured incorrectly.

---

## Solution: Create ALL 4 Policies for Both Buckets

### Method 1: Via Schema Page (What You're Currently On)

Go to **Schema** page → **"OTHER POLICIES UNDER STORAGE.OBJECTS"** → Click **"New policy"**

Create **8 policies total** (exact configuration below):

---

### For `driver-profiles` bucket:

#### Policy 1: SELECT (View/Read)
- **Policy name:** `driver-profiles-select`
- **Operation:** `SELECT`
- **Roles:** `authenticated`
- **Table:** `storage.objects`
- **USING expression:**
  ```sql
  bucket_id = 'driver-profiles'
  ```
- **WITH CHECK:** (Leave empty for SELECT)

#### Policy 2: INSERT (Upload)
- **Policy name:** `driver-profiles-insert`
- **Operation:** `INSERT`
- **Roles:** `authenticated`
- **WITH CHECK expression:**
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

#### Policy 5: SELECT (View/Read)
- **Policy name:** `driver-documents-select`
- **Operation:** `SELECT`
- **Roles:** `authenticated`
- **USING expression:**
  ```sql
  bucket_id = 'driver-documents'
  ```

#### Policy 6: INSERT (Upload)
- **Policy name:** `driver-documents-insert`
- **Operation:** `INSERT`
- **Roles:** `authenticated`
- **WITH CHECK expression:**
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

## Important Notes

### 1. Policy Expressions Must Be Exact:
```
bucket_id = 'driver-profiles'
```
- ✅ Single quotes around bucket name
- ✅ No extra spaces
- ✅ No semicolons
- ✅ Exactly as shown above

### 2. Operations Needed:
- **SELECT** = View/download documents (Required for viewing!)
- **INSERT** = Upload documents (Required for uploading!)
- **UPDATE** = Modify/move files (Required for temp→permanent move)
- **DELETE** = Remove files (Required for cleanup)

### 3. Make Sure Buckets Are Public:
Even with policies, ensure:
- Storage → `driver-profiles` → Settings → **Public bucket** = ON
- Storage → `driver-documents` → Settings → **Public bucket** = ON

---

## Verify After Creating

Run this query:

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

You should see **8 rows**:
- driver-documents: DELETE, INSERT, SELECT, UPDATE
- driver-profiles: DELETE, INSERT, SELECT, UPDATE

---

## After Fixing Policies

1. **Try uploading a document** - Should work now ✅
2. **Try viewing a document** - Should open in browser ✅
3. **Check browser console** - No more RLS errors ✅

---

## Why View Documents Button Doesn't Work

Looking at your code, the "View Documents" button at line 206 doesn't have an `onClick` handler - it's just a static button. The actual document viewing happens in the "Documents & Identification" section below (lines 404-574).

If you want the button to scroll to documents or open a modal, we can add that functionality after fixing RLS.

---

## Quick Test After Policies

1. Upload a test image to a driver
2. Go to driver profile
3. Scroll to "Documents & Identification" section
4. Click "View Document" or "Front Side" links
5. Document should open in new tab ✅

If still not working, check browser console for specific error messages.

