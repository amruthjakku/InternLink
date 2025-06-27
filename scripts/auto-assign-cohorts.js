import { connectToDatabase } from '../utils/database.js';
import User from '../models/User.js';
import Cohort from '../models/Cohort.js';

async function autoAssignCohorts() {
  try {
    console.log('🚀 Starting auto-assignment of interns to cohorts...');
    
    await connectToDatabase();
    
    // Get all interns without cohort assignments
    const internsWithoutCohorts = await User.find({ 
      role: 'intern',
      $or: [
        { cohortId: { $exists: false } },
        { cohortId: null }
      ]
    });
    
    console.log(`📊 Found ${internsWithoutCohorts.length} interns without cohort assignments`);
    
    if (internsWithoutCohorts.length === 0) {
      console.log('✅ All interns are already assigned to cohorts');
      return;
    }
    
    // Get the first active cohort
    const activeCohort = await Cohort.findOne({ isActive: true });
    
    if (!activeCohort) {
      console.log('❌ No active cohorts found. Please create a cohort first.');
      return;
    }
    
    console.log(`🎯 Using cohort: ${activeCohort.name} (${activeCohort._id})`);
    
    // Assign each intern to the cohort
    let assignedCount = 0;
    for (const intern of internsWithoutCohorts) {
      try {
        await intern.assignToCohort(activeCohort._id, 'auto-assignment');
        console.log(`✅ Assigned ${intern.name} (${intern.email}) to cohort ${activeCohort.name}`);
        assignedCount++;
      } catch (error) {
        console.error(`❌ Failed to assign ${intern.name}:`, error.message);
      }
    }
    
    console.log(`🎉 Successfully assigned ${assignedCount} interns to cohort ${activeCohort.name}`);
    
    // Show summary
    const updatedInterns = await User.find({ 
      role: 'intern',
      cohortId: activeCohort._id
    }).populate('cohortId', 'name');
    
    console.log(`📈 Total interns now in ${activeCohort.name}: ${updatedInterns.length}`);
    
  } catch (error) {
    console.error('❌ Error in auto-assignment:', error);
  } finally {
    process.exit(0);
  }
}

// Run the script
autoAssignCohorts();