const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb+srv://amruthjakku:jS7fK5f2QwMZANut@cluster0.hc4q6ax.mongodb.net/';
const dbName = process.env.MONGODB_DB || 'test'; // Change 'test' if your DB is named differently

async function main() {
  const client = new MongoClient(uri, { useUnifiedTopology: true });
  try {
    await client.connect();
    const db = client.db(dbName);
    const tasks = await db.collection('tasks').find({}, { title: 1, isActive: 1, status: 1 }).toArray();
    console.log(`Found ${tasks.length} tasks:`);
    tasks.forEach(task => {
      console.log(`- ${task._id}: ${task.title} (isActive: ${task.isActive}, status: ${task.status}, cohortId: ${task.cohortId})`);
    });
  } catch (err) {
    console.error('Error fetching tasks:', err);
  } finally {
    await client.close();
  }
}

main(); 