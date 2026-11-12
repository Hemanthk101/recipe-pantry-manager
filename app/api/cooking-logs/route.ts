import { NextResponse } from 'next/server';
import { requireUser, jsonError, isSameOrigin } from '@/lib/http';
import { getCookingLogsCollection, ensureMongoIndexes } from '@/lib/mongo';

/** GET /api/cooking-logs — list current user's cooking history (MongoDB) */
export async function GET(request: Request) {
  const a = await requireUser();
  if (!a.user) return a.response;

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get('limit') || 50), 100);
  const skip = Math.max(Number(url.searchParams.get('skip') || 0), 0);
  const cuisine = url.searchParams.get('cuisine');
  const q = url.searchParams.get('q');

  try {
    await ensureMongoIndexes();
    const col = await getCookingLogsCollection();

    const filter: Record<string, unknown> = { userId: a.user.userId };
    if (cuisine) filter.cuisine = cuisine;
    if (q) filter.$text = { $search: q };

    const [logs, total] = await Promise.all([
      col
        .find(filter)
        .sort({ cookedAt: -1 })
        .skip(skip)
        .limit(limit)
        .project({ metadata: 0 })
        .toArray(),
      col.countDocuments(filter),
    ]);

    return NextResponse.json({
      logs: logs.map((doc) => ({
        id: doc._id?.toString(),
        userId: doc.userId,
        recipeId: doc.recipeId,
        recipeTitle: doc.recipeTitle,
        cuisine: doc.cuisine,
        cookedAt: doc.cookedAt,
        notes: doc.notes,
        substitutions: doc.substitutions,
        ratingOfCook: doc.ratingOfCook,
        timeTakenMinutes: doc.timeTakenMinutes,
        servings: doc.servings,
        success: doc.success,
        ingredientsUsed: doc.ingredientsUsed,
        tags: doc.tags,
      })),
      total,
      limit,
      skip,
    });
  } catch (e) {
    console.error(e);
    return jsonError('Could not load cooking history from MongoDB.', 500);
  }
}

/** POST /api/cooking-logs — manually add a cooking log (optional notes after the fact) */
export async function POST(request: Request) {
  if (!(await isSameOrigin(request))) return jsonError('Invalid request origin.', 403);
  const a = await requireUser();
  if (!a.user) return a.response;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body.');
  }

  const recipeId = Number(body.recipeId);
  if (!Number.isSafeInteger(recipeId) || recipeId <= 0) {
    return jsonError('recipeId is required and must be a positive integer.');
  }

  try {
    await ensureMongoIndexes();
    const col = await getCookingLogsCollection();
    const doc = {
      userId: a.user.userId,
      recipeId,
      recipeTitle: String(body.recipeTitle || 'Unknown recipe').slice(0, 180),
      cuisine: String(body.cuisine || 'Other').slice(0, 80),
      cookedAt: body.cookedAt ? new Date(String(body.cookedAt)) : new Date(),
      notes: typeof body.notes === 'string' ? body.notes.slice(0, 2000) : undefined,
      substitutions: Array.isArray(body.substitutions) ? body.substitutions : undefined,
      ratingOfCook:
        typeof body.ratingOfCook === 'number' && body.ratingOfCook >= 1 && body.ratingOfCook <= 5
          ? Math.round(body.ratingOfCook)
          : undefined,
      timeTakenMinutes:
        typeof body.timeTakenMinutes === 'number' && body.timeTakenMinutes > 0
          ? body.timeTakenMinutes
          : undefined,
      servings:
        typeof body.servings === 'number' && body.servings > 0 ? body.servings : undefined,
      success: body.success !== false,
      ingredientsUsed: Array.isArray(body.ingredientsUsed) ? body.ingredientsUsed : undefined,
      tags: Array.isArray(body.tags) ? body.tags.map(String).slice(0, 10) : undefined,
      metadata: { source: 'manual', version: 1 },
    };
    const result = await col.insertOne(doc);
    return NextResponse.json({ ok: true, id: result.insertedId.toString() }, { status: 201 });
  } catch (e) {
    console.error(e);
    return jsonError('Could not save cooking log.', 500);
  }
}
