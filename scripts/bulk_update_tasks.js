const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'YOUR_MONGODB_ATLAS_CONNECTION_STRING';
const dbName = process.env.MONGODB_DB || 'test';

// Update all tasks: set status to 'active' and isActive to true
const filter = {}; // all tasks
const update = { $set: { status: 'active', isActive: true } };

async function main() {
  const client = new MongoClient(uri, { useUnifiedTopology: true });
  try {
    await client.connect();
    const db = client.db(dbName);
    const result = await db.collection('tasks').updateMany(filter, update);
    console.log(`Matched ${result.matchedCount} tasks, updated ${result.modifiedCount} tasks.`);
  } catch (err) {
    console.error('Error updating tasks:', err);
  } finally {
    await client.close();
  }
}

main(); 