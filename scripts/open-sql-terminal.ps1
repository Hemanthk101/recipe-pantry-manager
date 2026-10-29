$ErrorActionPreference = 'Stop'
$Host.UI.RawUI.WindowTitle = 'Recipe Pantry SQL - All Tables'
Clear-Host
Write-Host 'ALL SEVEN TABLES - recipe_pantry database' -ForegroundColor Cyan
$tables = @(
    @{ Name = 'users'; Query = 'SELECT user_id, name, email, role FROM users ORDER BY user_id;' },
    @{ Name = 'ingredients'; Query = 'SELECT * FROM ingredients ORDER BY ingredient_id;' },
    @{ Name = 'recipes'; Query = 'SELECT * FROM recipes ORDER BY recipe_id;' },
    @{ Name = 'recipe_ingredients'; Query = 'SELECT * FROM recipe_ingredients ORDER BY recipe_id, ingredient_id;' },
    @{ Name = 'pantry'; Query = 'SELECT * FROM pantry ORDER BY pantry_id;' },
    @{ Name = 'favorites'; Query = 'SELECT * FROM favorites ORDER BY user_id, recipe_id;' },
    @{ Name = 'reviews'; Query = 'SELECT * FROM reviews ORDER BY review_id;' }
)
foreach ($table in $tables) {
    Write-Host "`nTABLE: $($table.Name)" -ForegroundColor Yellow
    & docker exec recipe-pantry-manager-db-1 psql -U postgres -d recipe_pantry -P pager=off -c $table.Query
    if ($LASTEXITCODE -ne 0) { throw "Could not read $($table.Name). Check that Docker and the database container are running." }
}
Write-Host '`nScroll up to see all seven tables.' -ForegroundColor Cyan
Write-Host '\dt lists tables. SELECT * FROM recipes; shows recipes. \q exits SQL.' -ForegroundColor Cyan
& docker exec -it recipe-pantry-manager-db-1 psql -U postgres -d recipe_pantry -P pager=off
