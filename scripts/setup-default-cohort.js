// Simple script to create a default cohort if none exist
// This can be run from the browser console or as a standalone script

async function setupDefaultCohort() {
  try {
    console.log('🚀 Setting up default cohort...');
    
    const response = await fetch('/api/admin/setup-cohorts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Failed to setup cohort:', error);
      return;
    }
    
    const result = await response.json();
    console.log('✅ Setup result:', result);
    
    // Now assign interns to the cohort
    console.log('🔄 Assigning interns to cohort...');
    
    const assignResponse = await fetch('/api/admin/quick-assign-cohorts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (assignResponse.ok) {
      const assignResult = await assignResponse.json();
      console.log('✅ Assignment result:', assignResult);
    } else {
      const assignError = await assignResponse.json();
      console.log('⚠️ Assignment result:', assignError);
    }
    
    console.log('🎉 Setup complete! Please refresh the page.');
    
  } catch (error) {
    console.error('❌ Error in setup:', error);
  }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.setupDefaultCohort = setupDefaultCohort;
}

// Run if called directly
if (typeof require !== 'undefined' && require.main === module) {
  setupDefaultCohort();
}