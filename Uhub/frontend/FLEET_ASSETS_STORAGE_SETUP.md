# Fleet assets storage (`fleet-assets` bucket)

Supabase **SQL Editor** cannot run `ALTER TABLE storage.objects` or create policies on `storage.objects` unless you are the table owner. You will see:

```text
ERROR: 42501: must be owner of table objects
```

Use the **Dashboard** for storage instead.

## 1. Run database SQL first

Run only:

- `create_fleet_vehicle_media_schema.sql` (tables + `fleet_image_url` + RLS on `fleet_vehicle_documents`)

## 2. Create the bucket

1. Supabase Dashboard → **Storage**
2. **New bucket**
   - Name: `fleet-assets`
   - **Public bucket**: ON (so fleet card/profile images load via public URL)
3. Save

## 3. Add policies (Dashboard → Storage → fleet-assets → Policies)

Create four policies for role **authenticated** (adjust if you use custom roles).

### Insert

- **Policy name:** `fleet_assets_insert`
- **Allowed operation:** INSERT
- **Target roles:** authenticated
- **WITH CHECK expression:**

```sql
bucket_id = 'fleet-assets' AND (storage.foldername(name))[1] = 'fleet'
```

### Select

- **Policy name:** `fleet_assets_select`
- **Allowed operation:** SELECT
- **Target roles:** authenticated
- **USING expression:**

```sql
bucket_id = 'fleet-assets'
```

### Update

- **Policy name:** `fleet_assets_update`
- **Allowed operation:** UPDATE
- **Target roles:** authenticated
- **USING / WITH CHECK:**

```sql
bucket_id = 'fleet-assets'
```

### Delete

- **Policy name:** `fleet_assets_delete`
- **Allowed operation:** DELETE
- **Target roles:** authenticated
- **USING expression:**

```sql
bucket_id = 'fleet-assets'
```

## 4. Upload path convention (app)

The frontend uploads under:

```text
fleet/{vehicle_id}/...
```

Keep that folder structure so the insert policy allows uploads.

## Optional: service role only (simpler, less secure)

For internal UHub only, you can use a single policy:

- **SELECT/INSERT/UPDATE/DELETE** for `authenticated` with `bucket_id = 'fleet-assets'`

Skip the `fleet` folder check if you trust all logged-in users with any path in that bucket.
