# Slice of Life Setup Guide

## Quick Setup Instructions

### 1. Database Setup
Run these SQL scripts in your Supabase SQL Editor in this order:

```sql
-- 1. Create the database schema
-- Copy and paste the contents of create_slice_of_life_schema.sql

-- 2. Setup storage buckets
-- Copy and paste the contents of setup_slice_of_life_storage.sql
```

### 2. Test Image Upload
1. Navigate to the Event Picture Upload page
2. Try uploading an image (drag & drop or click to browse)
3. Check your Supabase Storage dashboard to see the uploaded image
4. Verify the image metadata is saved in the `event_images` table

### 3. Test Database Integration
Check these tables in your Supabase database:
- `events` - Should have sample events
- `memories` - Should have sample memories  
- `event_images` - Will contain uploaded image metadata
- `image_likes` - Will track user likes
- `image_favorites` - Will track user favorites

### 4. Verify Storage Buckets
In Supabase Storage, you should see:
- `event-images` bucket
- `memory-images` bucket
- Images organized by user ID folders

## Testing Checklist

### ✅ Image Upload
- [ ] Can upload images via drag & drop
- [ ] Can upload images via file picker
- [ ] File validation works (type and size)
- [ ] Upload progress shows correctly
- [ ] Images appear in the gallery after upload

### ✅ Database Storage
- [ ] Images are stored in Supabase Storage
- [ ] Image metadata is saved to `event_images` table
- [ ] Public URLs are generated correctly
- [ ] File paths are organized by user ID

### ✅ UI Features
- [ ] Search functionality works
- [ ] Filter buttons work (All, Favorites, Recent)
- [ ] View mode switching works (Grid/List)
- [ ] Image preview modal opens correctly
- [ ] Like and favorite buttons work

### ✅ Permissions
- [ ] Only authorized users can upload
- [ ] Users can only delete their own images
- [ ] RLS policies are working correctly

## Troubleshooting

### If images don't upload:
1. Check Supabase Storage bucket permissions
2. Verify RLS policies are set up correctly
3. Check browser console for errors
4. Ensure user is authenticated

### If database errors occur:
1. Verify all tables were created successfully
2. Check RLS policies are not blocking operations
3. Ensure user has proper role in `user_profiles` table

### If UI doesn't load:
1. Check that all dependencies are installed
2. Verify environment variables are set
3. Check browser console for JavaScript errors

## Success Indicators

You'll know everything is working when:
- ✅ Images upload successfully to Supabase Storage
- ✅ Image metadata appears in the database
- ✅ Images display in the gallery with proper styling
- ✅ Search, filter, and view mode switching work
- ✅ Like and favorite functionality works
- ✅ No console errors appear

## Next Steps

Once basic functionality is working:
1. Test with different user roles
2. Upload multiple images
3. Test the search and filter features
4. Try the different view modes
5. Test the image preview and management features

The system is now ready for production use! 🎉
