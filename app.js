require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3050;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));
app.set('view engine', 'ejs');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

app.use(async (req, res, next) => {
  try {
    if (req.cookies['sb-access-token']) {
      const { data: { user }, error } = await supabase.auth.getUser(
        req.cookies['sb-access-token']
      );
      
      if (!error && user) {
        req.user = user;
        req.supabase = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_KEY,
          {
            global: {
              headers: {
                Authorization: `Bearer ${req.cookies['sb-access-token']}`
              }
            }
          }
        );
      }
    }
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    next(err);
  }
});

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.get('/hello', (req, res) => {
  res.send('Hello World! Server is working.');
});

app.get('/test', (req, res) => {
  console.log('Basic test endpoint hit!');
  res.send(`
    <h2>Basic Test</h2>
    <p>Routing is working!</p>
    <p>Try: <a href="/test/supabase">Supabase Test</a></p>
    <p>User: ${req.user ? req.user.email : 'Not logged in'}</p>
  `);
});

app.get('/test/supabase', async (req, res) => {
  console.log('Supabase test endpoint hit!');
  
  try {
    console.log('Testing Supabase connection...');
    console.log('User authenticated:', req.user ? 'Yes' : 'No');
    
    if (!req.user) {
      return res.send(`
        <h2>Supabase Test - Not Authenticated</h2>
        <p>Please <a href="/login">login</a> first to test database connectivity.</p>
        <p>Current path: ${req.path}</p>
        <p>User: ${req.user ? 'Authenticated' : 'Not authenticated'}</p>
      `);
    }

    const { data: ingredients, error: ingredientsError } = await req.supabase
      .from('ingredient')
      .select('*')
      .limit(5);

    const { data: units, error: unitsError } = await req.supabase
      .from('measurement_units')
      .select('*')
      .limit(5);

    const html = `
      <h2>Supabase Database Test Results</h2>
      
      <h3>Environment:</h3>
      <ul>
        <li><strong>Supabase URL:</strong> ${process.env.SUPABASE_URL}</li>
        <li><strong>User ID:</strong> ${req.user.id}</li>
        <li><strong>User Email:</strong> ${req.user.email}</li>
      </ul>

      <h3>Ingredients Table Test:</h3>
      ${ingredientsError ? 
        `<p style="color: red;"><strong>Error:</strong> ${JSON.stringify(ingredientsError, null, 2)}</p>` :
        `<p style="color: green;"><strong>Success!</strong> Found ${ingredients?.length || 0} ingredients</p>
         <pre>${JSON.stringify(ingredients, null, 2)}</pre>`
      }

      <h3>Measurement Units Table Test:</h3>
      ${unitsError ? 
        `<p style="color: red;"><strong>Error:</strong> ${JSON.stringify(unitsError, null, 2)}</p>` :
        `<p style="color: green;"><strong>Success!</strong> Found ${units?.length || 0} units</p>
         <pre>${JSON.stringify(units, null, 2)}</pre>`
      }

      <hr>
      <p><a href="/recipes/new">Back to Add Recipe</a> | <a href="/recipes">Recipes List</a></p>
    `;
    
    res.send(html);
  } catch (err) {
    console.error('Supabase test error:', err);
    res.send(`<h2>Error:</h2><pre>${err.message}\n\n${err.stack}</pre>`);
  }
});

app.get('/test/recipe', async (req, res) => {
  console.log('Recipe test endpoint hit!');
  
  try {
    if (!req.user) {
      return res.send(`
        <h2>Recipe Test - Not Authenticated</h2>
        <p>Please <a href="/login">login</a> first to test recipe display.</p>
      `);
    }

    const { data: recipe, error } = await req.supabase
      .from('recipes')
      .select('*')
      .eq('user_id', req.user.id)
      .limit(1)
      .single();

    if (error || !recipe) {
      return res.send(`
        <h2>Recipe Test - No Recipe Found</h2>
        <p>No recipes found in database for user: ${req.user.email}</p>
        <p><a href="/recipes/new">Create a recipe first</a></p>
        <p>Error: ${error ? JSON.stringify(error) : 'No data returned'}</p>
      `);
    }

    console.log('*** RECIPE FROM DATABASE ***');
    console.log('Recipe ID:', recipe.id);
    console.log('Title:', recipe.title);
    console.log('Servings:', recipe.base_servings);
    console.log('Prep Time:', recipe.prep_time);
    console.log('Cook Time:', recipe.cook_time);
    console.log('Instructions:', recipe.instructions);
    console.log('Created:', recipe.created_at);
    console.log('User ID:', recipe.user_id);
    console.log('*** END RECIPE ***');

    const html = `
      <h2>Recipe Test - Database Recipe Display</h2>
      
      <div style="border: 1px solid #ccc; padding: 20px; margin: 20px 0;">
        <h3>${recipe.title}</h3>
        <p><strong>Servings:</strong> ${recipe.base_servings}</p>
        <p><strong>Prep Time:</strong> ${recipe.prep_time || 0} minutes</p>
        <p><strong>Cook Time:</strong> ${recipe.cook_time || 0} minutes</p>
        <p><strong>Instructions:</strong></p>
        <div style="background: #f5f5f5; padding: 10px; white-space: pre-line;">${recipe.instructions}</div>
        <p><strong>Created:</strong> ${new Date(recipe.created_at).toLocaleString()}</p>
        <p><strong>Recipe ID:</strong> ${recipe.id}</p>
      </div>

      <hr>
      <p><a href="/recipes/${recipe.id}">View Full Recipe Page</a></p>
      <p><a href="/recipes">All Recipes</a> | <a href="/recipes/new">Add New Recipe</a></p>
      
      <script>
        console.log('*** RECIPE DATA IN BROWSER ***');
        console.log('Title: ${recipe.title}');
        console.log('Servings: ${recipe.base_servings}');
        console.log('Instructions: ${recipe.instructions.replace(/\n/g, '\\n')}');
        console.log('*** END BROWSER RECIPE ***');
      </script>
    `;
    
    res.send(html);
  } catch (err) {
    console.error('Recipe test error:', err);
    res.send(`<h2>Error:</h2><pre>${err.message}\n\n${err.stack}</pre>`);
  }
});

app.get('/api/ingredients', async (req, res) => {
  console.log('API ingredients endpoint hit');
  console.log('User authenticated:', req.user ? 'Yes' : 'No');
  
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { data: ingredients, error } = await req.supabase
      .from('ingredient')
      .select('id, name')
      .order('name');

    if (error) throw error;

    res.json(ingredients || []);
  } catch (err) {
    console.error('Ingredients fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch ingredients' });
  }
});

app.get('/api/units', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { data: units, error } = await req.supabase
      .from('measurement_units')
      .select('id, name')
      .order('name');

    if (error) throw error;

    res.json(units || []);
  } catch (err) {
    console.error('Units fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch units' });
  }
});

app.get('/', (req, res) => {
  res.render('index', { user: req.user });
});

app.get('/login', (req, res) => {
  if (req.user) return res.redirect('/recipes');
  res.render('login', { error: null });
});

app.get('/signup', (req, res) => {
  if (req.user) return res.redirect('/recipes');
  res.render('signup', { error: null });
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.warn(`Login failed for ${email}: ${error.message}`);
      return res.render('login', { 
        error: 'Invalid credentials'
      });
    }

    res.cookie('sb-access-token', data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600000,
      sameSite: 'strict'
    });

    res.redirect('/recipes');
  } catch (err) {
    console.error(`Login error: ${err.message}`);
    res.render('login', { 
      error: 'Internal server error'
    });
  }
});

app.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      console.warn(`Signup failed for ${email}: ${error.message}`);
      return res.render('signup', { 
        error: error.message
      });
    }

    res.redirect('/login?message=Please check your email to confirm your account');
  } catch (err) {
    console.error(`Signup error: ${err.message}`);
    res.render('signup', { 
      error: 'Internal server error'
    });
  }
});

app.get('/logout', (req, res) => {
  res.clearCookie('sb-access-token');
  res.redirect('/');
});

app.get('/recipes', async (req, res) => {
  if (!req.user) return res.redirect('/login');

  try {
    const { data: recipes, error } = await req.supabase
      .from('recipes')
      .select('id, title, base_servings, prep_time, cook_time, created_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`Recipes fetch error: ${error.message}`);
      return res.render('recipes', { user: req.user, recipes: [] });
    }

    res.render('recipes', { user: req.user, recipes: recipes || [] });
  } catch (err) {
    console.error(`Recipes fetch error: ${err.message}`);
    res.render('recipes', { user: req.user, recipes: [] });
  }
});

app.get('/recipes/new', (req, res) => {
  if (!req.user) return res.redirect('/login');
  res.render('addrecip', { user: req.user });
});

app.get('/recipes/:id', async (req, res) => {
  if (!req.user) return res.redirect('/login');

  try {
    const { data: recipe, error: recipeError } = await req.supabase
      .from('recipes')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (recipeError || !recipe) {
      return res.status(404).render('error', { message: 'Recipe not found' });
    }

    const { data: ingredients, error: ingredientsError } = await req.supabase
      .from('recipe_ingredients')
      .select(`
        *,
        ingredient:ingredient_id(name),
        unit:unit_id(name)
      `)
      .eq('recipe_id', req.params.id)
      .order('id');

    if (ingredientsError) {
      console.error('Ingredients fetch error:', ingredientsError);
      recipe.ingredients = [];
    } else {
      recipe.ingredients = ingredients || [];
    }

    console.log('*** RECIPE WITH INGREDIENTS ***');
    console.log('Recipe:', recipe.title);
    console.log('Ingredients count:', recipe.ingredients.length);
    recipe.ingredients.forEach((ing, index) => {
      const unitName = ing.unit ? ing.unit.name : 'no unit';
      const ingredientName = ing.ingredient ? ing.ingredient.name : ing.name;
      console.log(`  ${index + 1}. ${ing.amount} ${unitName} ${ingredientName}`);
    });
    console.log('*** END RECIPE ***');

    res.render('recipe-detail', { user: req.user, recipe: recipe });
  } catch (err) {
    console.error('Recipe view error:', err);
    res.status(500).render('error', { message: 'Failed to load recipe' });
  }
});

app.get('/recipes/:id/adjust', async (req, res) => {
  if (!req.user) return res.redirect('/login');

  try {
    console.log('*** RECIPE ADJUST ROUTE HIT ***');
    console.log('Recipe ID:', req.params.id);
    console.log('User ID:', req.user.id);
    
    const { data: recipe, error: recipeError } = await req.supabase
      .from('recipes')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (recipeError || !recipe) {
      console.error('Recipe not found:', recipeError);
      return res.status(404).render('error', { message: 'Recipe not found' });
    }

    console.log('Recipe found:', recipe.title);

    const { data: ingredients, error: ingredientsError } = await req.supabase
      .from('recipe_ingredients')
      .select(`
        *,
        ingredient:ingredient_id(name),
        unit:unit_id(name)
      `)
      .eq('recipe_id', req.params.id)
      .order('id');

    if (ingredientsError) {
      console.error('Ingredients fetch error:', ingredientsError);
      recipe.ingredients = [];
    } else {
      recipe.ingredients = ingredients || [];
      
      for (let i = 0; i < recipe.ingredients.length; i++) {
        const ingredient = recipe.ingredients[i];
        
        if (ingredient.ingredient_id) {
          console.log(`Looking for substitutions for ingredient_id: ${ingredient.ingredient_id}, name: ${ingredient.name}`);
          
          const { data: substitutionItems, error: subItemError } = await req.supabase
            .from('substitution_items')
            .select(`
              id,
              ratio,
              units,
              substitute_ingredient:substitute_ingredient_id(name)
            `)
            .eq('ingredient_id', ingredient.ingredient_id);

          if (!subItemError && substitutionItems && substitutionItems.length > 0) {
            ingredient.substitutions = substitutionItems.map(item => ({
              name: item.substitute_ingredient.name,
              ratio: item.ratio || 1,
              units: item.units || null
            }));
            console.log(`Found ${ingredient.substitutions.length} substitutions for ingredient: ${ingredient.name}`);
            console.log('Substitutions:', ingredient.substitutions);
          } else {
            ingredient.substitutions = [];
            console.log(`No substitutions found for ingredient: ${ingredient.name}`);
            if (subItemError) {
              console.log('Substitution query error:', subItemError);
            }
          }
        } else {
          ingredient.substitutions = [];
          console.log(`No ingredient_id for: ${ingredient.name}`);
        }
      }
      
      console.log('Ingredients with substitutions found:', recipe.ingredients.length);
    }

    console.log('*** RENDERING RECIPE ADJUST PAGE ***');
    res.render('recipe-adjust', { user: req.user, recipe: recipe });
  } catch (err) {
    console.error('Recipe adjust view error:', err);
    res.status(500).render('error', { message: 'Failed to load recipe adjustment page' });
  }
});

app.get('/recipes/:id/edit', async (req, res) => {
  if (!req.user) return res.redirect('/login');

  try {
    const { data: recipe, error: recipeError } = await req.supabase
      .from('recipes')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (recipeError || !recipe) {
      return res.status(404).render('error', { message: 'Recipe not found' });
    }

    const { data: ingredients, error: ingredientsError } = await req.supabase
      .from('recipe_ingredients')
      .select(`
        *,
        ingredient:ingredient_id(name),
        unit:unit_id(name)
      `)
      .eq('recipe_id', req.params.id)
      .order('id');

    if (ingredientsError) {
      console.error('Ingredients fetch error:', ingredientsError);
      recipe.ingredients = [];
    } else {
      recipe.ingredients = ingredients || [];
    }

    res.render('edit-recipe', { user: req.user, recipe: recipe });
  } catch (err) {
    console.error('Recipe edit view error:', err);
    res.status(500).render('error', { message: 'Failed to load recipe for editing' });
  }
});

app.post('/recipes/:id', async (req, res) => {
  if (!req.user) return res.status(401).send('Unauthorized');

  try {
    const { title, instructions, servings, prep_time, cook_time, ingredients } = req.body;
    
    if (!title || !instructions || !servings) {
      return res.status(400).render('edit-recipe', {
        user: req.user,
        recipe: { id: req.params.id, title, instructions, base_servings: servings, prep_time, cook_time },
        error: 'Missing required fields'
      });
    }

    const { data: recipe, error: recipeError } = await req.supabase
      .from('recipes')
      .update({
        title: title,
        instructions: instructions,
        base_servings: parseInt(servings),
        prep_time: parseInt(prep_time) || 0,
        cook_time: parseInt(cook_time) || 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (recipeError) throw recipeError;
    
    console.log('Recipe updated with ID:', recipe.id);

    const { error: deleteError } = await req.supabase
      .from('recipe_ingredients')
      .delete()
      .eq('recipe_id', req.params.id);

    if (deleteError) {
      console.error('Error deleting existing ingredients:', deleteError);
    }

    if (ingredients && Array.isArray(ingredients)) {
      const ingredientInserts = [];
      
      for (let index = 0; index < ingredients.length; index++) {
        const ingredient = ingredients[index];
        
        if (ingredient.name && ingredient.amount && ingredient.amount.trim() !== '') {
          console.log(`Processing ingredient ${index + 1}: ${ingredient.amount} ${ingredient.unit} ${ingredient.name}`);
          
          const { data: ingredientRecord, error: ingredientError } = await req.supabase
            .from('ingredient')
            .select('id')
            .eq('name', ingredient.name)
            .single();
          
          if (ingredientError) {
            console.warn(`Could not find ingredient "${ingredient.name}":`, ingredientError);
          }
          
          let unitRecord = null;
          if (ingredient.unit && ingredient.unit.trim() !== '') {
            const { data: unitData, error: unitError } = await req.supabase
              .from('measurement_units')
              .select('id')
              .eq('name', ingredient.unit)
              .single();
            
            if (unitError) {
              console.warn(`Could not find unit "${ingredient.unit}":`, unitError);
            } else {
              unitRecord = unitData;
            }
          }
          
          ingredientInserts.push({
            recipe_id: recipe.id,
            name: ingredient.name,
            amount: parseFloat(ingredient.amount),
            ingredient_id: ingredientRecord ? ingredientRecord.id : null,
            unit_id: unitRecord ? unitRecord.id : null
          });
        }
      }

      if (ingredientInserts.length > 0) {
        console.log('Inserting updated ingredients:', ingredientInserts);
        
        const { data: insertedIngredients, error: ingredientError } = await req.supabase
          .from('recipe_ingredients')
          .insert(ingredientInserts)
          .select();

        if (ingredientError) {
          console.error('Ingredient insert error:', ingredientError);
        } else {
          console.log('Successfully updated ingredients:', insertedIngredients);
        }
      }
    }

    res.redirect(`/recipes/${recipe.id}`);
  } catch (err) {
    console.error(`Update recipe error: ${err.message}`);
    res.status(500).render('edit-recipe', {
      user: req.user,
      recipe: { id: req.params.id },
      error: 'Failed to update recipe: ' + err.message
    });
  }
});

app.post('/recipes', async (req, res) => {
  if (!req.user) return res.status(401).send('Unauthorized');

  try {
    const { title, instructions, servings, prep_time, cook_time, ingredients } = req.body;
    
    console.log('*** RECIPE SUBMISSION RECEIVED ***');
    console.log('Title:', title);
    console.log('Servings:', servings);
    console.log('Raw body:', req.body);
    console.log('Ingredients received:', ingredients);
    console.log('Ingredients type:', typeof ingredients);
    console.log('Ingredients is array:', Array.isArray(ingredients));
    
    if (ingredients) {
      console.log('Ingredients breakdown:');
      if (Array.isArray(ingredients)) {
        ingredients.forEach((ing, index) => {
          console.log(`  ${index + 1}. Amount: "${ing.amount}", Unit: "${ing.unit}", Name: "${ing.name}"`);
        });
      } else {
        console.log('Ingredients is not an array:', ingredients);
      }
    }
    console.log('*** END SUBMISSION RECEIVED ***');
    
    if (!title || !instructions || !servings) {
      return res.status(400).render('addrecip', {
        user: req.user,
        error: 'Missing required fields'
      });
    }

    const { data: recipe, error: recipeError } = await req.supabase
      .from('recipes')
      .insert({
        title: title,
        instructions: instructions,
        base_servings: parseInt(servings),
        prep_time: parseInt(prep_time) || 0,
        cook_time: parseInt(cook_time) || 0,
        user_id: req.user.id
      })
      .select()
      .single();

    if (recipeError) throw recipeError;
    
    console.log('Recipe created with ID:', recipe.id);

    if (ingredients && Array.isArray(ingredients)) {
      const ingredientInserts = [];
      
      for (let index = 0; index < ingredients.length; index++) {
        const ingredient = ingredients[index];
        
        if (ingredient.name && ingredient.amount && ingredient.amount.trim() !== '') {
          console.log(`Processing ingredient ${index + 1}: ${ingredient.amount} ${ingredient.unit} ${ingredient.name}`);
          
          const { data: ingredientRecord, error: ingredientError } = await req.supabase
            .from('ingredient')
            .select('id')
            .eq('name', ingredient.name)
            .single();
          
          if (ingredientError) {
            console.warn(`Could not find ingredient "${ingredient.name}":`, ingredientError);
          }
          
          let unitRecord = null;
          if (ingredient.unit && ingredient.unit.trim() !== '') {
            const { data: unitData, error: unitError } = await req.supabase
              .from('measurement_units')
              .select('id')
              .eq('name', ingredient.unit)
              .single();
            
            if (unitError) {
              console.warn(`Could not find unit "${ingredient.unit}":`, unitError);
            } else {
              unitRecord = unitData;
            }
          }
          
          ingredientInserts.push({
            recipe_id: recipe.id,
            name: ingredient.name,
            amount: parseFloat(ingredient.amount),
            ingredient_id: ingredientRecord ? ingredientRecord.id : null,
            unit_id: unitRecord ? unitRecord.id : null
          });
        } else {
          console.log(`Skipping incomplete ingredient ${index + 1}:`, ingredient);
        }
      }

      if (ingredientInserts.length > 0) {
        console.log('Inserting ingredients:', ingredientInserts);
        
        const { data: insertedIngredients, error: ingredientError } = await req.supabase
          .from('recipe_ingredients')
          .insert(ingredientInserts)
          .select();

        if (ingredientError) {
          console.error('Ingredient insert error:', ingredientError);
          console.log('Recipe saved but ingredients failed to save');
        } else {
          console.log('Successfully inserted ingredients:', insertedIngredients);
        }
      } else {
        console.log('No valid ingredients to insert');
      }
    } else {
      console.log('No ingredients array found or ingredients is not an array');
    }

    res.redirect(`/recipes/${recipe.id}`);
  } catch (err) {
    console.error(`Save recipe error: ${err.message}`);
    res.status(500).render('addrecip', {
      user: req.user,
      error: 'Failed to save recipe: ' + err.message
    });
  }
});

app.delete('/recipes/:id', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { error } = await req.supabase
      .from('recipes')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) {
      console.log('Recipe delete error:', error);
      return res.status(500).json({ error: 'Failed to delete recipe' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Recipe delete error:', err);
    res.status(500).json({ error: 'Failed to delete recipe' });
  }
});

app.use((req, res) => {
  res.status(404).render('404');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Supabase connected to:', process.env.SUPABASE_URL);
});

if (process.env.NODE_ENV !== 'production') {
  try {
    const livereload = require('livereload');
    const connectLivereload = require('connect-livereload');
    
    const liveReloadServer = livereload.createServer({
      exts: ['css', 'js', 'html', 'ejs'],
      port: 35729
    });
    
    liveReloadServer.watch([
      __dirname + '/public',
      __dirname + '/views'
    ]);
    
    app.use(connectLivereload());
    
    console.log('🔄 Live reload enabled on port 35729');
    console.log('📁 Watching: public/ and views/ for CSS, JS, and template changes');
    console.log('💡 Browser will auto-refresh when you save style.css or any view files');
    
  } catch (err) {
    console.log('⚠️  Live reload packages not installed. Run: npm install livereload connect-livereload');
  }
}