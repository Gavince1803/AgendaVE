// Debug script for testing service deletion
// Run this in the browser console on the My Business page

console.log('🔍 DEBUGGING SERVICE DELETE FUNCTIONALITY');

async function debugServiceDeletion() {
  try {
    console.log('📋 Testing service deletion...');
    
    // Check if BookingService is available
    if (typeof window !== 'undefined' && window.BookingService) {
      console.log('✅ BookingService is available');
      
      // Get current user
      const { data: { user } } = await window.supabase.auth.getUser();
      if (!user) {
        console.error('❌ No user found');
        return;
      }
      console.log('👤 Current user:', user.email);
      
      // Get provider
      const provider = await window.BookingService.getProviderById(user.id);
      if (!provider) {
        console.error('❌ No provider found');
        return;
      }
      console.log('🏪 Provider found:', provider.business_name);
      
      // Get all services
      const services = await window.BookingService.getAllProviderServices(provider.id);
      console.log('📄 Services found:', services.length);
      services.forEach((service, index) => {
        console.log(`  ${index + 1}. ${service.name} (${service.is_active ? 'Active' : 'Inactive'}) - ID: ${service.id}`);
      });
      
      if (services.length === 0) {
        console.log('ℹ️ No services to delete');
        return;
      }
      
      // Try to delete the first service (just as a test)
      const serviceToDelete = services[0];
      console.log('🔍 Testing deletion for service:', serviceToDelete.name);
      
      // Check for existing appointments
      const { data: appointments, error } = await window.supabase
        .from('appointments')
        .select('id, status')
        .eq('service_id', serviceToDelete.id);
        
      if (error) {
        console.error('❌ Error checking appointments:', error);
        return;
      }
      
      console.log(`📅 Found ${appointments?.length || 0} appointments for this service`);
      if (appointments && appointments.length > 0) {
        appointments.forEach((apt, i) => {
          console.log(`  ${i + 1}. Appointment ${apt.id} - Status: ${apt.status}`);
        });
        
        const activeAppointments = appointments.filter(apt => 
          apt.status === 'pending' || apt.status === 'confirmed'
        );
        
        if (activeAppointments.length > 0) {
          console.log('⚠️ Cannot delete: Service has active appointments');
          return;
        }
      }
      
      console.log('✅ Service can be deleted (no active appointments)');
      console.log('💡 To manually test deletion, call:');
      console.log(`   await window.BookingService.deleteService('${serviceToDelete.id}')`);
      
    } else {
      console.error('❌ BookingService not available in global scope');
    }
    
  } catch (error) {
    console.error('❌ Error debugging service deletion:', error);
  }
}

// Run the debug function
debugServiceDeletion();

console.log('💡 To run this again, call: debugServiceDeletion()');