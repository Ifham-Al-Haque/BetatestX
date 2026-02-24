// Quick Debug Script for Photo Upload Issues
// Copy and paste this in your browser console

console.log('🔍 Starting Photo Upload Debug...');

// Test 1: Check if database schema is updated
async function checkDatabaseSchema() {
  try {
    const { supabase } = await import('./src/supabaseClient.js');
    
    console.log('📊 Checking database schema...');
    
    // Try to select the new columns
    const { data, error } = await supabase
      .from('event_images')
      .select('id, picture_category, month_year, created_at')
      .limit(1);
    
    if (error) {
      console.error('❌ Schema check failed:', error);
      console.log('💡 Solution: Run update_slice_of_life_schema.sql in Supabase');
      return false;
    }
    
    console.log('✅ Schema check passed - new columns exist');
    return true;
  } catch (error) {
    console.error('❌ Error checking schema:', error);
    return false;
  }
}

// Test 2: Check if photos exist in database
async function checkPhotosInDatabase() {
  try {
    const { supabase } = await import('./src/supabaseClient.js');
    
    console.log('📸 Checking photos in database...');
    
    const { data, error } = await supabase
      .from('event_images')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching photos:', error);
      return [];
    }
    
    console.log(`📊 Found ${data.length} photos in database:`, data);
    return data;
  } catch (error) {
    console.error('❌ Error checking photos:', error);
    return [];
  }
}

// Test 3: Check API functions
async function testAPIFunctions() {
  try {
    console.log('🔌 Testing API functions...');
    
    const { sliceOfLifeApi } = await import('./src/services/sliceOfLifeApi.js');
    
    const [allImages, eventPhotos, memoryPhotos] = await Promise.all([
      sliceOfLifeApi.getImages(),
      sliceOfLifeApi.getPhotosForEvents(),
      sliceOfLifeApi.getPhotosForMemories()
    ]);
    
    console.log('📊 API Results:', {
      allImages: allImages.length,
      eventPhotos: eventPhotos.length,
      memoryPhotos: memoryPhotos.length
    });
    
    return { allImages, eventPhotos, memoryPhotos };
  } catch (error) {
    console.error('❌ Error testing API:', error);
    return null;
  }
}

// Test 4: Check storage bucket
async function checkStorageBucket() {
  try {
    const { supabase } = await import('./src/supabaseClient.js');
    
    console.log('☁️ Checking storage bucket...');
    
    const { data: files, error } = await supabase.storage
      .from('slice_of_life_images')
      .list('', { limit: 10 });
    
    if (error) {
      console.error('❌ Error checking storage:', error);
      return [];
    }
    
    console.log(`📁 Found ${files.length} files in storage:`, files);
    return files;
  } catch (error) {
    console.error('❌ Error checking storage:', error);
    return [];
  }
}

// Run all tests
async function runDebugTests() {
  console.log('🚀 Running comprehensive debug tests...\n');
  
  const results = {
    schemaValid: await checkDatabaseSchema(),
    photosInDB: await checkPhotosInDatabase(),
    apiResults: await testAPIFunctions(),
    storageFiles: await checkStorageBucket()
  };
  
  console.log('\n📊 Debug Results Summary:');
  console.log('========================');
  console.log(`Database Schema: ${results.schemaValid ? '✅ Valid' : '❌ Invalid'}`);
  console.log(`Photos in DB: ${results.photosInDB.length}`);
  console.log(`API Working: ${results.apiResults ? '✅ Yes' : '❌ No'}`);
  console.log(`Storage Files: ${results.storageFiles.length}`);
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  if (!results.schemaValid) {
    console.log('❌ CRITICAL: Run update_slice_of_life_schema.sql in Supabase SQL Editor');
  }
  if (results.photosInDB.length === 0) {
    console.log('📸 No photos found in database - try uploading again');
  }
  if (results.storageFiles.length === 0) {
    console.log('☁️ No files in storage - check upload process');
  }
  if (results.apiResults && results.apiResults.allImages.length === 0) {
    console.log('🔌 API not returning photos - check RLS policies');
  }
  
  return results;
}

// Export for easy use
window.debugPhotoUpload = {
  runDebugTests,
  checkDatabaseSchema,
  checkPhotosInDatabase,
  testAPIFunctions,
  checkStorageBucket
};

console.log('✅ Debug functions loaded!');
console.log('Run: debugPhotoUpload.runDebugTests()');
