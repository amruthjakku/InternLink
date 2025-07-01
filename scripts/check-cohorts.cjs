// CommonJS script to check cohort assignments
const mongoose = require('mongoose');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable is not set');
  process.exit(1);
}

console.log('Using MongoDB URI:', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Connected to MongoDB');
  checkCohorts();
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Define User model schema
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String,
  cohortId: String,
  college: String
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

async function checkCohorts() {
  try {
    // Get all interns
    const interns = await User.find({ role: 'intern' });
    console.log(`\nFound ${interns.length} interns`);
    
    console.log('\nIntern cohort assignments:');
    interns.forEach((intern, index) => {
      console.log(`${index + 1}. ${intern.name || intern.email}`);
      console.log(`   Cohort ID: ${intern.cohortId || 'No cohort assigned'}`);
      console.log(`   College: ${intern.college || 'No college assigned'}`);
      console.log('');
    });
    
    // Count interns with and without cohorts
    const internsWithCohort = interns.filter(intern => intern.cohortId);
    const internsWithoutCohort = interns.filter(intern => !intern.cohortId);
    
    console.log(`Interns with cohort: ${internsWithCohort.length}`);
    console.log(`Interns without cohort: ${internsWithoutCohort.length}`);
    
    // Get unique cohort IDs
    const uniqueCohortIds = [...new Set(interns.map(intern => intern.cohortId).filter(Boolean))];
    console.log(`\nUnique cohort IDs: ${uniqueCohortIds.length}`);
    uniqueCohortIds.forEach((cohortId, index) => {
      const internsInCohort = interns.filter(intern => intern.cohortId === cohortId);
      console.log(`${index + 1}. Cohort ${cohortId}: ${internsInCohort.length} interns`);
    });
    
    console.log('\nCohort check completed successfully');
    
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error checking cohorts:', error);
    process.exit(1);
  }
}