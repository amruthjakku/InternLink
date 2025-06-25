const { getDatabase } = require('./utils/database');

async function testAttendance() {
  try {
    console.log('Testing attendance system...');
    
    // Test database connection
    const db = await getDatabase();
    console.log('✅ Database connected successfully');
    
    // Test sample attendance record
    const testRecord = {
      userId: 'test-user-123',
      userEmail: 'test@example.com',
      userName: 'Test User',
      userRole: 'intern',
      action: 'checkin',
      timestamp: new Date(),
      date: new Date().toISOString().split('T')[0],
      ipAddress: '127.0.0.1',
      location: null,
      deviceInfo: { userAgent: 'test', timestamp: new Date().toISOString() },
      college: null,
      status: 'present'
    };
    
    const result = await db.collection('attendance').insertOne(testRecord);
    console.log('✅ Test attendance record created:', result.insertedId);
    
    // Clean up test record
    await db.collection('attendance').deleteOne({ _id: result.insertedId });
    console.log('✅ Test record cleaned up');
    
    console.log('🎉 Attendance system test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

testAttendance();