/**
 * Create MongoDB indexes for the cooking_logs collection.
 * Run: npm run mongo:setup
 */
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DB || 'recipe_pantry';

async function main() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const col = db.collection('cooking_logs');

    await col.createIndex({ userId: 1, cookedAt: -1 });
    await col.createIndex({ recipeId: 1 });
    await col.createIndex({ cuisine: 1 });
    await col.createIndex({ notes: 'text', recipeTitle: 'text', tags: 'text' });
    await col.createIndex({ cookedAt: -1 });

    console.log('MongoDB indexes created on cooking_logs.');
    const indexes = await col.indexes();
    console.log(JSON.stringify(indexes, null, 2));
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
