import { NextResponse } from 'next/server';
import { requireUser, jsonError } from '@/lib/http';
import { getCookingLogsCollection, ensureMongoIndexes } from '@/lib/mongo';

/**
 * GET /api/cooking-logs/stats
 * Demonstrates MongoDB aggregation pipelines:
 *  - most cooked recipes
 *  - cuisine frequency
 *  - average cook rating & time
 *  - recent activity count
 */
export async function GET() {
  const a = await requireUser();
  if (!a.user) return a.response;

  try {
    await ensureMongoIndexes();
    const col = await getCookingLogsCollection();
    const userId = a.user.userId;

    const [byRecipe, byCuisine, summary, recent] = await Promise.all([
      // Aggregation 1: top recipes cooked by this user
      col
        .aggregate([
          { $match: { userId } },
          {
            $group: {
              _id: { recipeId: '$recipeId', recipeTitle: '$recipeTitle' },
              timesCooked: { $sum: 1 },
              avgRating: { $avg: '$ratingOfCook' },
              lastCooked: { $max: '$cookedAt' },
            },
          },
          { $sort: { timesCooked: -1 } },
          { $limit: 10 },
          {
            $project: {
              _id: 0,
              recipeId: '$_id.recipeId',
              recipeTitle: '$_id.recipeTitle',
              timesCooked: 1,
              avgRating: { $round: ['$avgRating', 1] },
              lastCooked: 1,
            },
          },
        ])
        .toArray(),

      // Aggregation 2: cuisine breakdown
      col
        .aggregate([
          { $match: { userId } },
          { $group: { _id: '$cuisine', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $project: { _id: 0, cuisine: '$_id', count: 1 } },
        ])
        .toArray(),

      // Aggregation 3: overall summary stats
      col
        .aggregate([
          { $match: { userId } },
          {
            $group: {
              _id: null,
              totalCooks: { $sum: 1 },
              avgRating: { $avg: '$ratingOfCook' },
              avgTimeMinutes: { $avg: '$timeTakenMinutes' },
              successCount: {
                $sum: { $cond: [{ $eq: ['$success', true] }, 1, 0] },
              },
            },
          },
          {
            $project: {
              _id: 0,
              totalCooks: 1,
              avgRating: { $round: ['$avgRating', 2] },
              avgTimeMinutes: { $round: ['$avgTimeMinutes', 1] },
              successCount: 1,
            },
          },
        ])
        .toArray(),

      // Aggregation 4: cooks in last 30 days
      col.countDocuments({
        userId,
        cookedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }),
    ]);

    return NextResponse.json({
      topRecipes: byRecipe,
      cuisineBreakdown: byCuisine,
      summary: summary[0] || {
        totalCooks: 0,
        avgRating: null,
        avgTimeMinutes: null,
        successCount: 0,
      },
      cooksLast30Days: recent,
    });
  } catch (e) {
    console.error(e);
    return jsonError('Could not compute cooking statistics from MongoDB.', 500);
  }
}
