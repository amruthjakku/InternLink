// Copy and paste this into your browser console while logged in as admin
// This will create a cohort and assign interns to it

async function fixCohortIssue() {
    console.log('🚀 Starting cohort fix...');
    
    try {
        // Step 1: Create default cohort
        console.log('📝 Creating default cohort...');
        const cohortResponse = await fetch('/api/admin/setup-cohorts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const cohortResult = await cohortResponse.json();
        console.log('Cohort creation result:', cohortResult);
        
        if (!cohortResponse.ok) {
            throw new Error(cohortResult.error || 'Failed to create cohort');
        }
        
        // Step 2: Assign interns to cohort
        console.log('👥 Assigning interns to cohort...');
        const assignResponse = await fetch('/api/admin/quick-assign-cohorts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const assignResult = await assignResponse.json();
        console.log('Assignment result:', assignResult);
        
        // Show results
        console.log('✅ COHORT CREATED:', cohortResult.message);
        if (assignResponse.ok) {
            console.log('✅ INTERNS ASSIGNED:', assignResult.message);
        } else {
            console.log('⚠️ ASSIGNMENT WARNING:', assignResult.error);
        }
        
        console.log('🎉 FIX COMPLETE! Please refresh the page and try adding a new intern.');
        console.log('💡 The "Assigned Cohort" dropdown should now show "Default Cohort"');
        
        return {
            success: true,
            cohort: cohortResult,
            assignment: assignResult
        };
        
    } catch (error) {
        console.error('❌ Fix failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Run the fix
fixCohortIssue();