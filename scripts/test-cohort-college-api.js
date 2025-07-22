const { connectToDatabase } = require('../utils/database');
const Cohort = require('../models/Cohort');
const College = require('../models/College');
const User = require('../models/User');

async function testCohortCollegeAPI() {
  try {
    console.log('Connecting to database...');
    await connectToDatabase();
    console.log('✅ Database connected');

    // Test 1: Check if cohorts have college relationships
    console.log('\n📊 Testing cohort-college relationships...');
    
    const cohorts = await Cohort.find({ isActive: true })
      .populate('collegeId', 'name location')
      .populate('mentorId', 'name gitlabUsername')
      .limit(5);

    console.log(`Found ${cohorts.length} active cohorts`);
    
    for (const cohort of cohorts) {
      console.log(`\n🎯 Cohort: ${cohort.name}`);
      console.log(`   Primary College: ${cohort.collegeId?.name || 'Not assigned'}`);
      console.log(`   Tech Lead: ${cohort.mentorId?.name || 'No mentor'}`);

      // Get users assigned to this cohort
      const users = await User.find({ 
        cohortId: cohort._id, 
        isActive: true 
      }).populate('college', 'name');

      console.log(`   Total Users: ${users.length}`);
      
      // Group by college
      const collegeGroups = users.reduce((acc, user) => {
        if (user.college) {
          const collegeName = user.college.name;
          if (!acc[collegeName]) {
            acc[collegeName] = { interns: 0, mentors: 0, others: 0 };
          }
          if (user.role === 'AI Developer Intern') acc[collegeName].interns++;
          else if (user.role === 'Tech Lead') acc[collegeName].mentors++;
          else acc[collegeName].others++;
        }
        return acc;
      }, {});

      console.log('   Colleges in this cohort:');
      for (const [collegeName, counts] of Object.entries(collegeGroups)) {
        console.log(`     • ${collegeName}: ${counts.interns} interns, ${counts.mentors} mentors, ${counts.others} others`);
      }
    }

    // Test 2: Check colleges without cohorts
    console.log('\n🏫 Testing colleges...');
    const colleges = await College.find({ isActive: true }).limit(5);
    console.log(`Found ${colleges.length} active colleges`);

    for (const college of colleges) {
      const usersInCollege = await User.countDocuments({
        college: college._id,
        isActive: true
      });

      const usersWithCohorts = await User.countDocuments({
        college: college._id,
        isActive: true,
        cohortId: { $exists: true }
      });

      console.log(`\n🏫 ${college.name}:`);
      console.log(`   Total Users: ${usersInCollege}`);
      console.log(`   Users with Cohorts: ${usersWithCohorts}`);
      console.log(`   Users without Cohorts: ${usersInCollege - usersWithCohorts}`);
    }

    console.log('\n✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    process.exit(0);
  }
}

// Run the test
testCohortCollegeAPI();