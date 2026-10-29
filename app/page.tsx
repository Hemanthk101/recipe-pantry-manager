import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import Dashboard from './ui/dashboard';

export const dynamic = 'force-dynamic';
export default async function Home() {
  const session = await getSession();
  if (!session) return <Dashboard initialUser={null} initialRecipes={[]} initialPantry={[]} initialIngredients={[]} />;
  try {
    const [recipes, pantry, ingredients] = await Promise.all([
      query(`SELECT r.recipe_id id,r.title,r.description,r.cuisine,r.prep_time "prepTime",r.difficulty, u.name "author", COALESCE(s.average_rating,0) rating,COALESCE(s.review_count,0) "reviewCount", EXISTS(SELECT 1 FROM favorites f WHERE f.recipe_id=r.recipe_id AND f.user_id=$1) favorite, NOT EXISTS(SELECT 1 FROM recipe_ingredients ri WHERE ri.recipe_id=r.recipe_id AND NOT EXISTS(SELECT 1 FROM pantry p WHERE p.user_id=$1 AND p.ingredient_id=ri.ingredient_id AND p.quantity>=ri.quantity AND (p.expiry_date IS NULL OR p.expiry_date>=CURRENT_DATE))) makeable FROM recipes r JOIN users u ON u.user_id=r.created_by LEFT JOIN recipe_rating_summary s ON s.recipe_id=r.recipe_id ORDER BY r.created_at DESC`, [session.userId]),
      query(`SELECT p.pantry_id id,p.ingredient_id "ingredientId",i.name,i.category,i.unit,p.quantity,p.expiry_date "expiryDate" FROM pantry p JOIN ingredients i USING(ingredient_id) WHERE p.user_id=$1 ORDER BY p.expiry_date NULLS LAST,i.name`, [session.userId]),
      query(`SELECT ingredient_id id,name,category,unit FROM ingredients ORDER BY category,name`),
    ]);
    return <Dashboard initialUser={session} initialRecipes={recipes.rows} initialPantry={pantry.rows} initialIngredients={ingredients.rows} />;
  } catch (error) {
    console.error('Dashboard data load failed:', error);
    return <main className="setup"><div className="setup-card"><div className="brand-mark">S</div><p className="eyebrow">SAVOR · SETUP NEEDED</p><h1>Your kitchen is almost ready.</h1><p>Start PostgreSQL, configure <code>DATABASE_URL</code> and <code>APP_SECRET</code>, then run the database setup commands in the README.</p><a className="button" href="/">Reload app</a></div></main>;
  }
}
