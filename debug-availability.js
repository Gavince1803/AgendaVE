// Debug script for checking provider availability
// Run this in the browser console while on the booking page

console.log('🔍 DEBUGGING PROVIDER AVAILABILITY');

// Check provider availability directly
async function debugAvailability() {
  try {
    // Get the provider ID from the URL or current context
    const urlParams = new URLSearchParams(window.location.search);
    const providerId = urlParams.get('providerId');
    
    if (!providerId) {
      console.error('❌ No providerId found in URL');
      return;
    }
    
    console.log('🔍 Provider ID:', providerId);
    
    // Access the BookingService from global scope (if available)
    if (typeof window !== 'undefined' && window.BookingService) {
      const availability = await window.BookingService.getProviderAvailability(providerId);
      console.log('📅 Provider Availability:', availability);
      
      // Check each day
      const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      weekdays.forEach((day, index) => {
        const dayAvailability = availability.find(a => a.weekday === index);
        console.log(`${day} (${index}):`, dayAvailability || 'Not available');
      });
      
      // Test Saturday specifically (day 6)
      const saturdayAvailability = availability.find(a => a.weekday === 6);
      console.log('🔍 Saturday availability (day 6):', saturdayAvailability);
      
      // Test today's date
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      const todayDay = today.getDay();
      
      console.log('📅 Today:', {
        date: todayString,
        dayOfWeek: todayDay,
        dayName: weekdays[todayDay]
      });
      
      // Test getting available slots for today
      const slots = await window.BookingService.getAvailableSlots(providerId, todayString);
      console.log('⏰ Available slots for today:', slots);
      
    } else {
      console.error('❌ BookingService not available in global scope');
    }
    
  } catch (error) {
    console.error('❌ Error debugging availability:', error);
  }
}

// Run the debug function
debugAvailability();

console.log('💡 To run this again, call: debugAvailability()');