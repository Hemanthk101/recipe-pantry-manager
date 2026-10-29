-- Demonstration records only. scripts/seed-db.mjs replaces these credentials
-- with bcrypt hashes generated from the documented local demo passwords.
INSERT INTO users(name,email,password_hash,role) VALUES
 ('Demo Student','student.demo@example.test','seed-placeholder','student'),
 ('Demo Admin','admin.demo@example.test','seed-placeholder','admin')
ON CONFLICT(email) DO NOTHING;

INSERT INTO ingredients(name,category,unit) VALUES
 ('Tomato','veg','piece'),('Onion','veg','piece'),('Rice','grain','g'),
 ('Cumin','spice','tsp'),('Yogurt','dairy','g'),('Lentils','protein','g'),
 ('Garlic','veg','clove'),('Olive oil','oil','ml'),('Coriander','spice','g')
ON CONFLICT(name,category,unit) DO NOTHING;

INSERT INTO recipes(title,description,cuisine,prep_time,created_by,difficulty)
SELECT 'Tomato Cumin Rice','A quick, comforting rice dish with ripe tomato and toasted cumin.','Indian',25,user_id,'easy'
FROM users WHERE email='student.demo@example.test'
ON CONFLICT(title,created_by) DO NOTHING;
INSERT INTO recipe_ingredients(recipe_id,ingredient_id,quantity)
SELECT r.recipe_id,i.ingredient_id,v.quantity FROM recipes r
JOIN users u ON u.user_id=r.created_by AND u.email='student.demo@example.test'
JOIN (VALUES('Tomato',2.00::numeric),('Rice',200.00::numeric),('Cumin',1.00::numeric),('Onion',1.00::numeric)) v(name,quantity) ON TRUE
JOIN ingredients i ON i.name=v.name WHERE r.title='Tomato Cumin Rice'
ON CONFLICT(recipe_id,ingredient_id) DO NOTHING;
INSERT INTO recipes(title,description,cuisine,prep_time,created_by,difficulty)
SELECT 'Golden Lentil Bowl','A bright bowl of lentils with garlic and a little olive oil.','Indian',35,user_id,'medium'
FROM users WHERE email='student.demo@example.test'
ON CONFLICT(title,created_by) DO NOTHING;
INSERT INTO recipe_ingredients(recipe_id,ingredient_id,quantity)
SELECT r.recipe_id,i.ingredient_id,v.quantity FROM recipes r
JOIN users u ON u.user_id=r.created_by AND u.email='student.demo@example.test'
JOIN (VALUES('Lentils',180.00::numeric),('Garlic',2.00::numeric),('Olive oil',10.00::numeric)) v(name,quantity) ON TRUE
JOIN ingredients i ON i.name=v.name WHERE r.title='Golden Lentil Bowl'
ON CONFLICT(recipe_id,ingredient_id) DO NOTHING;
INSERT INTO recipes(title,description,cuisine,prep_time,created_by,difficulty)
SELECT 'Coriander Yogurt Dip','Cool yogurt with fresh coriander and toasted cumin.','Indian',10,user_id,'easy'
FROM users WHERE email='student.demo@example.test'
ON CONFLICT(title,created_by) DO NOTHING;
INSERT INTO recipe_ingredients(recipe_id,ingredient_id,quantity)
SELECT r.recipe_id,i.ingredient_id,v.quantity FROM recipes r
JOIN users u ON u.user_id=r.created_by AND u.email='student.demo@example.test'
JOIN (VALUES('Yogurt',150.00::numeric),('Coriander',5.00::numeric),('Cumin',0.50::numeric)) v(name,quantity) ON TRUE
JOIN ingredients i ON i.name=v.name WHERE r.title='Coriander Yogurt Dip'
ON CONFLICT(recipe_id,ingredient_id) DO NOTHING;

INSERT INTO pantry(user_id,ingredient_id,quantity,expiry_date)
SELECT u.user_id,i.ingredient_id,v.quantity,CURRENT_DATE+v.days FROM users u
JOIN (VALUES('Tomato',4.00::numeric,5),('Rice',500.00::numeric,180),('Cumin',3.00::numeric,365),('Onion',3.00::numeric,12),('Lentils',350.00::numeric,120),('Garlic',8.00::numeric,25),('Olive oil',100.00::numeric,300),('Yogurt',300.00::numeric,8),('Coriander',20.00::numeric,4)) v(name,quantity,days) ON TRUE
JOIN ingredients i ON i.name=v.name WHERE u.email='student.demo@example.test'
ON CONFLICT(user_id,ingredient_id,expiry_date) DO UPDATE SET quantity=EXCLUDED.quantity,updated_at=CURRENT_TIMESTAMP;

INSERT INTO favorites(user_id,recipe_id) SELECT u.user_id,r.recipe_id FROM users u JOIN recipes r ON r.title='Tomato Cumin Rice' WHERE u.email='student.demo@example.test' ON CONFLICT DO NOTHING;
INSERT INTO reviews(user_id,recipe_id,rating,comment) SELECT u.user_id,r.recipe_id,5,'A lovely, simple weeknight meal.' FROM users u JOIN recipes r ON r.title='Tomato Cumin Rice' WHERE u.email='student.demo@example.test' ON CONFLICT(user_id,recipe_id) DO UPDATE SET rating=EXCLUDED.rating,comment=EXCLUDED.comment;
