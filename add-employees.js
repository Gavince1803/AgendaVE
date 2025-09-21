// Run this in your browser console while on the app page
// This will add sample employees to the Elite Barbershop provider

async function addSampleEmployees() {
  const PROVIDER_ID = '650e8400-e29b-41d4-a716-446655440001'; // Elite Barbershop ID from logs
  
  const employees = [
    {
      provider_id: PROVIDER_ID,
      name: 'Carlos Mendoza',
      position: 'Barbero Senior',
      bio: 'Especialista en cortes clásicos y modernos con 15 años de experiencia',
      is_owner: true,
      is_active: true,
      custom_schedule_enabled: false,
      profile_image_url: null
    },
    {
      provider_id: PROVIDER_ID,
      name: 'Miguel Rodriguez',
      position: 'Estilista',
      bio: 'Experto en fades, diseños y tratamientos capilares',
      is_owner: false,
      is_active: true,
      custom_schedule_enabled: false,
      profile_image_url: null
    },
    {
      provider_id: PROVIDER_ID,
      name: 'Antonio Silva',
      position: 'Barbero',
      bio: 'Especialista en barba y bigote, cortes tradicionales',
      is_owner: false,
      is_active: true,
      custom_schedule_enabled: true,
      profile_image_url: null
    }
  ];

  console.log('🔴 [ADD EMPLOYEES] Starting to add employees for Elite Barbershop...');

  for (const employee of employees) {
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
        console.log('✅ [ADD EMPLOYEES] Added employee:', employee.name, result[0]);
      } else {
        const errorText = await response.text();
        console.error('❌ [ADD EMPLOYEES] Failed to add employee:', employee.name, response.status, errorText);
      }
    } catch (error) {
      console.error('❌ [ADD EMPLOYEES] Error adding employee:', employee.name, error);
    }
  }

  console.log('🔴 [ADD EMPLOYEES] Finished adding employees. Refresh the page to see them!');
}

// Run the function
addSampleEmployees();