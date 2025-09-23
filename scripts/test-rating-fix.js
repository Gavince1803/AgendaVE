// 🧪 Test script to verify rating updates work correctly
// Run this in browser console while your app is loaded

async function testRatingFix() {
  console.log('🧪 Testing rating fix...');
  
  try {
    // First, let's test the new function approach
    console.log('1. Testing secure rating function...');
    
    const providerId = '302792e8-4c71-4827-ab0f-3961127c1ae3'; // Barberia Ouyea
    
    // Use the supabase client from your app
    if (typeof supabase === 'undefined') {
      console.error('❌ Supabase client not found. Make sure you run this while the app is loaded.');
      return;
    }
    
    // Test the secure rating function
    const { data, error } = await supabase.rpc('update_provider_rating_secure', {
      provider_uuid: providerId
    });
    
    if (error) {
      console.error('❌ Error calling rating function:', error);
    } else {
      console.log('✅ Rating function response:', data);
    }
    
    // Now check if the provider data shows the updated rating
    console.log('2. Checking provider data...');
    
    const { data: providerData, error: providerError } = await supabase
      .from('providers')
      .select('rating, total_reviews')
      .eq('id', providerId)
      .single();
    
    if (providerError) {
      console.error('❌ Error fetching provider:', providerError);
    } else {
      console.log('📊 Provider rating data:', providerData);
    }
    
    console.log('🎉 Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Alternative test using BookingService
async function testBookingServiceRating() {
  console.log('🧪 Testing BookingService rating update...');
  
  try {
    const providerId = '302792e8-4c71-4827-ab0f-3961127c1ae3';
    
    if (typeof BookingService === 'undefined') {
      console.error('❌ BookingService not available. Make sure you run this in the context of your app.');
      return;
    }
    
    await BookingService.updateProviderRating(providerId);
    console.log('✅ BookingService rating update completed!');
    
  } catch (error) {
    console.error('❌ BookingService test failed:', error);
  }
}

console.log('📋 RATING TEST INSTRUCTIONS:');
console.log('1. Make sure your app is loaded in the browser');
console.log('2. Open DevTools (F12) and go to Console');
console.log('3. Run: testRatingFix()');
console.log('4. Or run: testBookingServiceRating()');
console.log('');

// Make functions available in global scope
if (typeof window !== 'undefined') {
  window.testRatingFix = testRatingFix;
  window.testBookingServiceRating = testBookingServiceRating;
}