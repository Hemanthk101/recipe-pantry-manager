import { NextResponse } from 'next/server';
import { db, query } from '@/lib/db';
import { requireUser, jsonError, isSameOrigin } from '@/lib/http';
import { recipeSchema } from '@/lib/validation';
export async function GET(request: Request) {
  const { user } = await requireUser(); if (!user) return jsonError('Sign in to continue.',401);
  const params = new URL(request.url).searchParams; const search = params.get('q')?.trim() ?? ''; const cuisine = params.get('cuisine')?.trim() ?? ''; const makeable = params.get('makeable') === 'true';
  try { const result = await query(`SELECT r.recipe_id id,r.title,r.description,r.cuisine,r.prep_time "prepTime",r.difficulty,u.name "author",COALESCE(s.average_rating,0) rating,COALESCE(s.review_count,0) "reviewCount",EXISTS(SELECT 1 FROM favorites f WHERE f.recipe_id=r.recipe_id AND f.user_id=$1) favorite,NOT EXISTS(SELECT 1 FROM recipe_ingredients ri WHERE ri.recipe_id=r.recipe_id AND NOT EXISTS(SELECT 1 FROM pantry p WHERE p.user_id=$1 AND p.ingredient_id=ri.ingredient_id AND p.quantity>=ri.quantity AND (p.expiry_date IS NULL OR p.expiry_date>=CURRENT_DATE))) makeable FROM recipes r JOIN users u ON u.user_id=r.created_by LEFT JOIN recipe_rating_summary s ON s.recipe_id=r.recipe_id WHERE ($2='' OR to_tsvector('english',r.title||' '||r.description||' '||r.cuisine) @@ plainto_tsquery('english',$2) OR r.title ILIKE '%'||$2||'%') AND ($3='' OR r.cuisine ILIKE $3) AND (NOT $4 OR NOT EXISTS(SELECT 1 FROM recipe_ingredients ri WHERE ri.recipe_id=r.recipe_id AND NOT EXISTS(SELECT 1 FROM pantry p WHERE p.user_id=$1 AND p.ingredient_id=ri.ingredient_id AND p.quantity>=ri.quantity AND (p.expiry_date IS NULL OR p.expiry_date>=CURRENT_DATE)))) ORDER BY r.created_at DESC LIMIT 100`,[user.userId,search,cuisine,makeable]); return NextResponse.json({ recipes:result.rows }); } catch(e) { console.error(e); return jsonError('Could not load recipes.',500); }
}
export async function POST(request: Request) {
  if (!(await isSameOrigin(request))) return jsonError('Invalid request origin.',403);
  const auth = await requireUser(); if (!auth.user) return auth.response;
  const parsed = recipeSchema.safeParse(await request.json().catch(()=>null)); if(!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? 'Invalid recipe.');
  const { title,description,cuisine,prepTime,difficulty,ingredients }=parsed.data; const client=await db.connect();
  try { await client.query('BEGIN'); const result=await client.query(`INSERT INTO recipes(title,description,cuisine,prep_time,created_by,difficulty) VALUES($1,$2,$3,$4,$5,$6) RETURNING recipe_id`,[title,description,cuisine,prepTime,auth.user.userId,difficulty]); const id=result.rows[0].recipe_id;
    for(const item of ingredients) await client.query('INSERT INTO recipe_ingredients(recipe_id,ingredient_id,quantity) VALUES($1,$2,$3)',[id,item.ingredientId,item.quantity]);
    await client.query('COMMIT'); return NextResponse.json({id},{status:201});
  } catch(e) { await client.query('ROLLBACK'); if((e as {code?:string}).code==='23505') return jsonError('You already have a recipe with that title.',409); if((e as {code?:string}).code==='23503') return jsonError('Choose valid ingredients.'); console.error(e); return jsonError('Could not save recipe.',500); } finally { client.release(); }
}
