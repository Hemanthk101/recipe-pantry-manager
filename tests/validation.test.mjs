import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const schema=await readFile(new URL('../db/schema.sql',import.meta.url),'utf8');
test('database schema defines required relations and integrity constraints',()=>{
 for(const name of ['users','ingredients','recipes','recipe_ingredients','pantry','favorites','reviews']) assert.match(schema,new RegExp(`CREATE TABLE IF NOT EXISTS ${name}`));
 assert.match(schema,/PRIMARY KEY \(recipe_id, ingredient_id\)/i);assert.match(schema,/REFERENCES users\(user_id\)/i);assert.match(schema,/rating BETWEEN 1 AND 5/i);assert.match(schema,/CREATE OR REPLACE VIEW recipe_rating_summary/i);assert.match(schema,/CREATE OR REPLACE FUNCTION find_makeable_recipes/i);
});
test('database schema demonstrates DDL advanced features',()=>{assert.match(schema,/CREATE INDEX IF NOT EXISTS/i);assert.match(schema,/CREATE TRIGGER reviews_set_updated_at/i);assert.match(schema,/ALTER TABLE recipes ADD COLUMN IF NOT EXISTS difficulty/i);assert.match(schema,/DROP TRIGGER IF EXISTS/i);});
test('demo seed includes two roles and sample food data',async()=>{const seed=await readFile(new URL('../db/seed.sql',import.meta.url),'utf8');assert.match(seed,/'student'\)/);assert.match(seed,/'admin'\)/);assert.match(seed,/Tomato Cumin Rice/);assert.match(seed,/INSERT INTO pantry/);});
