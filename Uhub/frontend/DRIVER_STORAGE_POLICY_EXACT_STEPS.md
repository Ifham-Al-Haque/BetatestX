# Exact Steps to Fix Driver Storage RLS Policies

## The Issue
You're still getting: `new row violates row-level security policy`

This means the policy wasn't configured correctly or there's a syntax issue.

## Solution: Use This EXACT Policy Definition

### For `driver-profiles` bucket:

1. Go to **Storage** → Click `driver-profiles` bucket → **Policies** tab
2. Click **"New Policy"** → **"For full customization"**
3. Fill in EXACTLY as shown:

**Policy Name:**
```
Allow authenticated access to driver-profiles
```

**Allowed operation:**
- ✅ Check: **INSERT**
- ✅ Check: **SELECT**  
- ✅ Check: **UPDATE**
- ✅ Check: **DELETE**
(All four should be checked)

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

4. Click **"Review"** → **"Save policy"**

---

### For `driver-documents` bucket:

Repeat the same steps, but:

**Policy Name:**
```
Allow authenticated access to driver-documents
```

**Policy definition (USING expression):**
```sql
bucket_id = 'driver-documents'
```

**WITH CHECK expression:**
```sql
bucket_id = 'driver-documents'
```

---

## Alternative: Make Buckets Public (If Policies Don't Work)

If policies still don't work:

1. Go to **Storage** → Click `driver-profiles` bucket
2. Click **"Settings"** tab (not Policies)
3. Find **"Public bucket"** toggle
4. Make sure it's **ON** (enabled)
5. Repeat for `driver-documents`

⚠️ Note: Even with public buckets, if RLS is enabled on storage.objects, you still need policies OR need to disable RLS on storage.objects (not recommended).

---

## Verify Policies Are Working

After creating policies:

1. Check the **Policies** tab - you should see your new policy listed
2. Try uploading a driver picture again
3. Check browser console - should NOT see RLS errors
4. Check Storage → `driver-profiles` → should see uploaded files

---

## If Still Not Working: Check Policy Scope

Make sure you're creating policies at the **bucket level** (not table level). The policy should be:
- **Table:** `objects` (or automatically set to storage.objects)
- **Schema:** `storage`

If the policy creation form asks for table/schema, it should be:
- Schema: `storage`
- Table: `objects`

---

## Troubleshooting

If you still see errors, check:

1. **Policy exists?** Go to Policies tab and verify the policy is listed
2. **Correct bucket?** Make sure policy is for correct bucket (`driver-profiles` or `driver-documents`)
3. **All operations?** Ensure INSERT, SELECT, UPDATE, DELETE are all checked
4. **Authenticated role?** Make sure `authenticated` is in target roles
5. **Syntax correct?** Policy definition should be exactly: `bucket_id = 'driver-profiles'` (with quotes around bucket name)

