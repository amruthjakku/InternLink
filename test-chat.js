// Simple test script to verify chat functionality
const { connectToDatabase } = require('./utils/database');
const ChatRoom = require('./models/ChatRoom');
const Message = require('./models/Message');
const User = require('./models/User');

async function testChatFunctionality() {
  try {
    console.log('🔗 Connecting to database...');
    await connectToDatabase();
    console.log('✅ Database connected');

    // Check if default chat rooms exist
    console.log('\n📋 Checking default chat rooms...');
    const chatRooms = await ChatRoom.find({ visibility: 'public' });
    console.log(`Found ${chatRooms.length} public chat rooms:`);
    chatRooms.forEach(room => {
      console.log(`  - ${room.name} (${room.type}) - ${room.participants.length} participants`);
    });

    // Check if there are any users
    console.log('\n👥 Checking users...');
    const users = await User.find({ role: 'AI Developer Intern' }).limit(5);
    console.log(`Found ${users.length} AI Developer Interns`);

    // Check messages
    console.log('\n💬 Checking messages...');
    const messages = await Message.find().populate('sender', 'name').limit(10);
    console.log(`Found ${messages.length} messages`);
    messages.forEach(msg => {
      console.log(`  - ${msg.sender?.name || 'Unknown'}: ${msg.content.substring(0, 50)}...`);
    });

    console.log('\n✅ Chat functionality test completed');
  } catch (error) {
    console.error('❌ Error testing chat functionality:', error);
  } finally {
    process.exit(0);
  }
}

testChatFunctionality();