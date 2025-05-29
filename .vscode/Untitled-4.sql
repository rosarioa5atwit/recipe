
CREATE TABLE recipes (
    recipe_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    servings INTEGER NOT NULL,
    prep_time INTERVAL,
    cook_time INTERVAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_public BOOLEAN DEFAULT FALSE
);

CREATE TABLE ingredients (
    ingredient_id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,  -- e.g., "all-purpose flour"
    category VARCHAR(50)                -- e.g., "dairy", "spices"
);

CREATE TABLE recipe_ingredients (
    recipe_ingredient_id SERIAL PRIMARY KEY,
    recipe_id INTEGER REFERENCES recipes(recipe_id) ON DELETE CASCADE,
    ingredient_id INTEGER REFERENCES ingredients(ingredient_id),
    quantity NUMERIC(10,2) NOT NULL,   -- e.g., 1.5
    unit VARCHAR(20) NOT NULL,         -- e.g., "cups", "grams"
    notes TEXT                         -- e.g., "chopped", "at room temperature"
);

CREATE TABLE instructions (
    instruction_id SERIAL PRIMARY KEY,
    recipe_id INTEGER REFERENCES recipes(recipe_id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    text TEXT NOT NULL,
    CHECK (step_number > 0)
);