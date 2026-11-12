import { MongoClient, Db, Collection, ObjectId } from 'mongodb';

const globalForMongo = globalThis as unknown as {
  mongoClient?: MongoClient;
  mongoDb?: Db;
};

function getUri() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI environment variable is required for NoSQL features.');
  return uri;
}

export async function getMongoClient(): Promise<MongoClient> {
  if (globalForMongo.mongoClient) return globalForMongo.mongoClient;
  const client = new MongoClient(getUri(), {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
  });
  await client.connect();
  if (process.env.NODE_ENV !== 'production') {
    globalForMongo.mongoClient = client;
  }
  return client;
}

export async function getMongoDb(): Promise<Db> {
  if (globalForMongo.mongoDb) return globalForMongo.mongoDb;
  const client = await getMongoClient();
  const db = client.db(process.env.MONGODB_DB || 'recipe_pantry');
  if (process.env.NODE_ENV !== 'production') {
    globalForMongo.mongoDb = db;
  }
  return db;
}

export type CookingLog = {
  _id?: ObjectId;
  userId: number;
  recipeId: number;
  recipeTitle: string;
  cuisine: string;
  cookedAt: Date;
  notes?: string;
  substitutions?: { original: string; used: string }[];
  ratingOfCook?: number;
  timeTakenMinutes?: number;
  servings?: number;
  success: boolean;
  ingredientsUsed?: { name: string; quantity: number; unit: string }[];
  tags?: string[];
  metadata?: Record<string, unknown>;
};

export async function getCookingLogsCollection(): Promise<Collection<CookingLog>> {
  const db = await getMongoDb();
  return db.collection<CookingLog>('cooking_logs');
}

/** Ensure indexes used by the application exist (idempotent). */
export async function ensureMongoIndexes() {
  const col = await getCookingLogsCollection();
  await col.createIndex({ userId: 1, cookedAt: -1 });
  await col.createIndex({ recipeId: 1 });
  await col.createIndex({ cuisine: 1 });
  await col.createIndex({ notes: 'text', recipeTitle: 'text', tags: 'text' });
  await col.createIndex({ cookedAt: -1 });
}
