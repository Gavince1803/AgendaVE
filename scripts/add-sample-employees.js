// Sample script to add employees for testing the employee selector
// Run this in your browser console on the app page

async function addSampleEmployees() {
  // You need to replace 'YOUR_PROVIDER_ID' with an actual provider ID from your database
  const PROVIDER_ID = 'e7ba5f74-8b8c-4f99-9a37-d89e6c1db123'; // Replace with your provider ID
  
  const sampleEmployees = [
    {
      provider_id: PROVIDER_ID,
      name: 'María González',
      position: 'Estilista Senior',
      bio: 'Especialista en cortes modernos y coloración',
      is_owner: true,
      is_active: true,
      custom_schedule_enabled: false,
      profile_image_url: null
    },
    {
      provider_id: PROVIDER_ID,
      name: 'Carlos Rodríguez',
      position: 'Barbero',
      bio: 'Experto en cortes masculinos y afeitado clásico',
      is_owner: false,
      is_active: true,
      custom_schedule_enabled: false,
      profile_image_url: null
    },
    {
      provider_id: PROVIDER_ID,
      name: 'Ana Martínez',
      position: 'Colorista',
      bio: 'Especialista en técnicas de coloración y mechas',
      is_owner: false,
      is_active: true,
      custom_schedule_enabled: true,
      profile_image_url: null
    }
  ];

  console.log('🔴 [SAMPLE EMPLOYEES] Adding employees for provider:', PROVIDER_ID);

  for (const employee of sampleEmployees) {
    try {
      const response = await fetch('https://ldgxxrgdcerftlmeyrmi.supabase.co/rest/v1/employees', {
        method: 'POST',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZ3h4cmdkY2VyZnRsbWV5cm1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI3MzU1NDEsImV4cCI6MjA0ODMxMTU0MX0.pJgXjqUXOXpLg52JaiwCg4qUH3x0JgQYABOr2Y67t3E',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZ3h4cmdkY2VyZnRsbWV5cm1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI3MzU1NDEsImV4cCI6MjA0ODMxMTU0MX0.pJgXjqUXOXpLg52JaiwCg4qUH3x0JgQYABOr2Y67t3E',
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(employee)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ [SAMPLE EMPLOYEES] Added employee:', employee.name, result);
      } else {
        const error = await response.text();
        console.error('❌ [SAMPLE EMPLOYEES] Failed to add employee:', employee.name, error);
      }
    } catch (error) {
      console.error('❌ [SAMPLE EMPLOYEES] Error adding employee:', employee.name, error);
    }
  }

  console.log('🔴 [SAMPLE EMPLOYEES] Finished adding employees. Refresh the page to see them!');
}

// Instructions:
console.log('🔴 [SAMPLE EMPLOYEES] To add sample employees:');
console.log('1. Update the PROVIDER_ID in the script with your actual provider ID');
console.log('2. Run: addSampleEmployees()');