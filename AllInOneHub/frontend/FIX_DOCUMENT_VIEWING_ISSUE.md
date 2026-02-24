# Fix: Documents Not Showing in Driver Profile UI

## Problem Identified ✅

Your system is correctly configured:
- ✅ **Upload**: Files upload to `driver-documents` bucket (DriverForm.jsx line 234)
- ✅ **Storage**: Files are stored in `driver-documents` bucket (you can see them in Supabase)
- ✅ **Database**: URLs are saved in `driver_documents` table (DriverForm.jsx line 410)
- ✅ **Display**: DriverProfile reads URLs from database (DriverProfile.jsx line 49-52)

**BUT**: Documents don't display because **RLS policies block SELECT operations**

Even though the bucket is "Public", RLS policies on `storage.objects` still control access for authenticated users.

---

## Solution: Create SELECT Policy for driver-documents

You need to create a **SELECT** policy so authenticated users can view/download documents.

---

## Step-by-Step Fix

### On Supabase Schema Page:

1. **Go to Schema page** → "OTHER POLICIES UNDER STORAGE.OBJECTS"
2. **Click "New policy"**
3. **Create SELECT policy:**

   **Policy Name:** `driver-documents-select`
   
   **Operation:** `SELECT`
   
   **Target Roles:** `authenticated`
   
   **USING expression:**
   ```sql
   bucket_id = 'driver-documents'
   ```
   
   **WITH CHECK:** (Leave empty for SELECT)

4. **Save policy**

---

## Verify the Fix

After creating the SELECT policy:

1. **Go to a driver profile page** in your app
2. **Scroll to "Documents & Identification" section**
3. **Click on any document link** (e.g., "Front Side", "Back Side", "View Document")
4. **Document should open in a new tab** ✅

---

## Complete Policy Checklist

For full functionality, you need these policies for `driver-documents`:

- ✅ **SELECT** - View/download documents (THIS FIXES VIEWING!)
- ✅ **INSERT** - Upload documents  
- ✅ **UPDATE** - Move/update documents
- ✅ **DELETE** - Delete documents

Currently, you likely have:
- ✅ INSERT (upload works partially)
- ❌ SELECT (viewing doesn't work)
- ❌ UPDATE (file operations may fail)
- ❌ DELETE (cleanup may fail)

---

## Quick Test

1. Create the SELECT policy above
2. Go to driver profile
3. Try viewing a document
4. Should work now! ✅

If it still doesn't work, check:
- Browser console for errors
- Network tab to see if the request is blocked (status 400/403)
- Verify the policy was actually created

---

## Why This Happens

Supabase Storage has two layers of security:
1. **Bucket-level**: "Public" bucket setting
2. **Row-level**: RLS policies on `storage.objects` table

Even if bucket is public, RLS policies can still block authenticated users. The SELECT policy is what allows viewing/downloading the files via the URLs stored in your database.



