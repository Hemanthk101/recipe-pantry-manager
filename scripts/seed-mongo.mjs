/**
 * Seed a few sample cooking_logs documents for the demo student user.
 * Requires the SQL seed to have been run first (student.demo@example.test → user_id 1 typically).
 * Run: npm run mongo:seed
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

    // Assume demo student is user_id 1 after SQL seed (common for identity start).
    // If different, update via the UI after first cook.
    const userId = Number(process.env.SEED_USER_ID || 1);

    const samples = [
      {
        userId,
        recipeId: 1,
        recipeTitle: 'Tomato Basil Pasta',
        cuisine: 'Italian',
        cookedAt: new Date(Date.now() - 3 * 86400000),
        notes: 'Used leftover cherry tomatoes. Family loved it.',
        substitutions: [{ original: 'fresh basil', used: 'dried oregano' }],
        ratingOfCook: 5,
        timeTakenMinutes: 28,
        servings: 2,
        success: true,
        ingredientsUsed: [
          { name: 'Pasta', quantity: 200, unit: 'g' },
          { name: 'Tomato', quantity: 3, unit: 'piece' },
        ],
        tags: ['weeknight', 'quick'],
        metadata: { source: 'seed', version: 1 },
      },
      {
        userId,
        recipeId: 2,
        recipeTitle: 'Vegetable Stir Fry',
        cuisine: 'Asian',
        cookedAt: new Date(Date.now() - 1 * 86400000),
        notes: 'Added extra soy sauce. Next time reduce salt.',
        ratingOfCook: 4,
        timeTakenMinutes: 22,
        servings: 3,
        success: true,
        ingredientsUsed: [
          { name: 'Broccoli', quantity: 1, unit: 'piece' },
          { name: 'Soy sauce', quantity: 2, unit: 'tbsp' },
        ],
        tags: ['healthy'],
        metadata: { source: 'seed', version: 1 },
      },
      {
        userId,
        recipeId: 1,
        recipeTitle: 'Tomato Basil Pasta',
        cuisine: 'Italian',
        cookedAt: new Date(Date.now() - 10 * 86400000),
        notes: 'First attempt. Overcooked pasta a little.',
        ratingOfCook: 3,
        timeTakenMinutes: 35,
        servings: 2,
        success: true,
        tags: ['practice'],
        metadata: { source: 'seed', version: 1 },
      },
    ];

    // Clear previous seed docs for this user that came from seed
    await col.deleteMany({ userId, 'metadata.source': 'seed' });
    const result = await col.insertMany(samples);
    console.log(`Inserted ${result.insertedCount} cooking log documents for userId=${userId}.`);
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
