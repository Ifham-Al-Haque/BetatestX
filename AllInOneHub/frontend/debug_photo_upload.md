# Debug Photo Upload Issue

## Step 1: Check Database Schema
First, make sure you've run the database schema update:

1. Go to your Supabase Dashboard
2. Go to SQL Editor
3. Run this script:
```sql
-- Run this in Supabase SQL editor
update_slice_of_life_schema.sql
```

## Step 2: Check Browser Console
1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Upload a photo and check for these logs:
   - "Saving image metadata to database..."
   - "Image metadata saved: {...}"
   - "Adding new image to local state: {...}"
   - "Events data loaded: [...]"
   - "Event photos loaded: [...]"

## Step 3: Check Database
1. Go to Supabase Dashboard
2. Go to Table Editor
3. Check the `event_images` table
4. Look for:
   - New columns: `picture_category`, `month_year`
   - Your uploaded photos in the table

## Step 4: Check Storage
1. Go to Supabase Dashboard
2. Go to Storage
3. Check the `slice_of_life_images` bucket
4. Verify your uploaded files are there

## Step 5: Test API Calls
Open browser console and run:
```javascript
// Test if API is working
sliceOfLifeApi.getImages().then(console.log);
sliceOfLifeApi.getPhotosForEvents().then(console.log);
sliceOfLifeApi.getPhotosForMemories().then(console.log);
```

## Common Issues:

### Issue 1: Database Schema Not Updated
**Solution**: Run the `update_slice_of_life_schema.sql` script

### Issue 2: RLS Policies Blocking Access
**Solution**: Check if user has proper permissions

### Issue 3: API Errors
**Solution**: Check console for error messages

### Issue 4: Photos Not Categorized
**Solution**: Make sure you select "Event" category when uploading

## Quick Fix Commands:
```javascript
// Force refresh data
window.location.reload();

// Check user permissions
supabase.auth.getUser().then(console.log);

// Test database connection
supabase.from('event_images').select('*').limit(5).then(console.log);
```

Let me know what you find in the console and database!
