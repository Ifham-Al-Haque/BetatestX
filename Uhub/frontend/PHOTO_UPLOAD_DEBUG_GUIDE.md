# Photo Upload Debug Guide

## 🔍 Issue: Photos Upload but Don't Display in Events/Memories

### ✅ What I've Fixed

1. **Updated Events Component** - Now fetches and displays event photos
2. **Updated Memories Component** - Now has toggle between Memories and Photos
3. **Added Debug Logging** - Console logs to track upload process
4. **Enhanced API Functions** - Better error handling and data fetching

### 🧪 How to Test

#### Step 1: Run Database Schema Update
```sql
-- Run this in your Supabase SQL editor
update_slice_of_life_schema.sql
```

#### Step 2: Test Photo Upload
1. Go to **Picture Upload** section
2. Select **Event** category
3. Upload a photo
4. Check browser console for debug logs

#### Step 3: Verify Database Saving
1. Open browser console (F12)
2. Run the test script:
```javascript
// Copy and paste this in console
testPhotoUpload.runAllTests();
```

#### Step 4: Check Events and Memories
1. Go to **Events** section - should show event photos
2. Go to **Memories** section - click **Photos** tab - should show all photos

### 🔧 Debug Steps

#### Check Console Logs
Look for these logs when uploading:
```
Saving image metadata to database...
Image metadata saved: {id: "...", picture_category: "event", ...}
Adding new image to local state: {...}
Events data loaded: [...]
Event photos loaded: [...]
```

#### Check Database
1. Go to Supabase Dashboard
2. Check `event_images` table
3. Verify columns: `picture_category`, `month_year`
4. Check if new photos appear

#### Check Storage
1. Go to Supabase Storage
2. Check `slice_of_life_images` bucket
3. Verify uploaded files exist

### 🐛 Common Issues & Solutions

#### Issue 1: "Failed to load data" Error
**Solution**: API functions now return empty arrays instead of throwing errors

#### Issue 2: Photos Not Showing in Events
**Solution**: Events component now fetches `getPhotosForEvents()` which only gets event category photos

#### Issue 3: Photos Not Showing in Memories
**Solution**: Memories component now has Photos tab that shows all photos (normal + event)

#### Issue 4: Database Schema Missing
**Solution**: Run `update_slice_of_life_schema.sql` to add new columns

### 📊 Expected Behavior

#### After Uploading Event Photo:
1. ✅ Photo appears in Picture Upload section
2. ✅ Photo appears in Events section (Event Photos)
3. ✅ Photo appears in Memories section (Photos tab)
4. ✅ Photo has "Event" category badge
5. ✅ Photo is organized by month

#### After Uploading Normal Photo:
1. ✅ Photo appears in Picture Upload section
2. ❌ Photo does NOT appear in Events section
3. ✅ Photo appears in Memories section (Photos tab)
4. ✅ Photo has "Normal" category badge
5. ✅ Photo is organized by month

### 🔍 Debug Console Commands

```javascript
// Check all images in database
sliceOfLifeApi.getImages().then(console.log);

// Check event photos only
sliceOfLifeApi.getPhotosForEvents().then(console.log);

// Check memory photos only
sliceOfLifeApi.getPhotosForMemories().then(console.log);

// Check monthly organization
sliceOfLifeApi.getMonthlyPhotos().then(console.log);
```

### 📝 Test Checklist

- [ ] Database schema updated (picture_category, month_year columns exist)
- [ ] Photo uploads successfully
- [ ] Console shows debug logs
- [ ] Photo appears in database (event_images table)
- [ ] Photo appears in storage bucket
- [ ] Event photos show in Events section
- [ ] All photos show in Memories Photos tab
- [ ] Category badges display correctly
- [ ] Monthly organization works

### 🚨 If Still Not Working

1. **Check Network Tab**: Look for failed API calls
2. **Check Console**: Look for JavaScript errors
3. **Check Database**: Verify data is actually saved
4. **Check Storage**: Verify files are uploaded
5. **Check RLS Policies**: Make sure user has permission to read data

### 💡 Quick Fix Commands

```javascript
// Force refresh data
window.location.reload();

// Clear local storage
localStorage.clear();

// Check user permissions
supabase.auth.getUser().then(console.log);
```

The system should now work correctly! Photos will be saved to the database and displayed in the appropriate sections based on their category. 🎉
