// Test script to verify photo upload and database saving
// Run this in your browser console after uploading a photo

console.log('🔍 Testing Photo Upload and Database Saving...');

// Test 1: Check if images are in the database
async function testDatabaseImages() {
  try {
    console.log('📊 Testing database image retrieval...');
    
    // Import the API (you'll need to adjust the path)
    const { sliceOfLifeApi } = await import('./src/services/sliceOfLifeApi.js');
    
    // Get all images
    const allImages = await sliceOfLifeApi.getImages();
    console.log('📸 All images in database:', allImages);
    
    // Get event photos
    const eventPhotos = await sliceOfLifeApi.getPhotosForEvents();
    console.log('🎉 Event photos:', eventPhotos);
    
    // Get memory photos
    const memoryPhotos = await sliceOfLifeApi.getPhotosForMemories();
    console.log('💭 Memory photos:', memoryPhotos);
    
    // Get monthly photos
    const monthlyPhotos = await sliceOfLifeApi.getMonthlyPhotos();
    console.log('📅 Monthly photos:', monthlyPhotos);
    
    return {
      allImages: allImages.length,
      eventPhotos: eventPhotos.length,
      memoryPhotos: memoryPhotos.length,
      monthlyPhotos: monthlyPhotos.length
    };
  } catch (error) {
    console.error('❌ Error testing database images:', error);
    return null;
  }
}

// Test 2: Check Supabase Storage
async function testStorageImages() {
  try {
    console.log('☁️ Testing Supabase Storage...');
    
    const { supabase } = await import('./src/supabaseClient.js');
    
    // List files in the storage bucket
    const { data: files, error } = await supabase.storage
      .from('slice_of_life_images')
      .list('', {
        limit: 100,
        offset: 0
      });
    
    if (error) {
      console.error('❌ Error listing storage files:', error);
      return null;
    }
    
    console.log('📁 Files in storage:', files);
    return files.length;
  } catch (error) {
    console.error('❌ Error testing storage:', error);
    return null;
  }
}

// Test 3: Check database schema
async function testDatabaseSchema() {
  try {
    console.log('🗄️ Testing database schema...');
    
    const { supabase } = await import('./src/supabaseClient.js');
    
    // Check if event_images table has the new columns
    const { data, error } = await supabase
      .from('event_images')
      .select('id, picture_category, month_year, created_at')
      .limit(1);
    
    if (error) {
      console.error('❌ Error checking schema:', error);
      return false;
    }
    
    console.log('✅ Schema check passed - new columns exist');
    return true;
  } catch (error) {
    console.error('❌ Error testing schema:', error);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting comprehensive photo upload tests...\n');
  
  const results = {
    databaseImages: await testDatabaseImages(),
    storageFiles: await testStorageImages(),
    schemaValid: await testDatabaseSchema()
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  console.log(`Database Images: ${results.databaseImages ? results.databaseImages.allImages : 'Failed'}`);
  console.log(`Event Photos: ${results.databaseImages ? results.databaseImages.eventPhotos : 'Failed'}`);
  console.log(`Memory Photos: ${results.databaseImages ? results.databaseImages.memoryPhotos : 'Failed'}`);
  console.log(`Storage Files: ${results.storageFiles || 'Failed'}`);
  console.log(`Schema Valid: ${results.schemaValid ? 'Yes' : 'No'}`);
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  if (!results.schemaValid) {
    console.log('❌ Run the update_slice_of_life_schema.sql script first');
  }
  if (results.databaseImages && results.databaseImages.allImages === 0) {
    console.log('📸 Upload some photos to test the system');
  }
  if (results.storageFiles === 0) {
    console.log('☁️ Check if photos are being uploaded to storage');
  }
  
  return results;
}

// Export for use
window.testPhotoUpload = {
  runAllTests,
  testDatabaseImages,
  testStorageImages,
  testDatabaseSchema
};

console.log('✅ Test functions loaded! Run testPhotoUpload.runAllTests() to start testing.');
