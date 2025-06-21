const { seedDemoData } = require('../utils/database');

async function setup() {
  console.log('🚀 Setting up GitLab Internship Tracker...');
  
  try {
    console.log('📊 Seeding demo data...');
    await seedDemoData();
    console.log('✅ Demo data seeded successfully!');
    
    console.log('\n🎉 Setup complete!');
    console.log('\nNext steps:');
    console.log('1. Update your GitLab OAuth app redirect URI to: http://localhost:3000');
    console.log('2. Make sure your .env.local file has the correct GitLab credentials');
    console.log('3. Run: npm run dev');
    console.log('4. Open: http://localhost:3000');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

setup();