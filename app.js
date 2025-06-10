const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 3002;

// ======================
// 1. SUPABASE SETUP & DEBUG
// ======================
require('dotenv').config();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

console.log('\n=== Supabase Initialization ===');
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase ANON KEY:', supabaseAnonKey ? '*** Loaded ***' : '❌ MISSING');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('FATAL: Missing Supabase credentials. Check .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Realtime debugger (logs all DB changes)
supabase
  .channel('supabase-debug')
  .on('postgres_changes', { event: '*' }, (payload) => {
    console.log('\n🔔 Supabase DB Change:', payload);
  })
  .subscribe();

// ======================
// 2. EXPRESS MIDDLEWARE
// ======================
app.use(express.json()); // For JSON bodies
app.use(express.urlencoded({ extended: true })); // For form data
app.use(express.static(path.join(__dirname, 'public')));

// Request logger middleware
app.use((req, res, next) => {
  console.log(`\n[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Request Body:', req.body);
  next();
});

// ======================
// 3. DEBUG ROUTES
// ======================

// Health Check
app.get('/health', (req, res) => {
  console.log('✅ Health check passed');
  res.json({ status: 'healthy', supabaseConnected: !!supabase });
});

// Supabase Connection Test
app.get('/supabase-status', async (req, res) => {
  console.log('\n=== Testing Supabase Connection ===');
  try {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Supabase Error:', error);
      return res.status(500).json({ 
        connected: false, 
        error: error.message 
      });
    }

    console.log('✅ Supabase Connected. Sample Data:', data);
    res.json({ connected: true, data });
  } catch (err) {
    console.error('❌ Unexpected Error:', err);
    res.status(500).json({ connected: false, error: err.message });
  }
});

// ======================
// 4. AUTH ROUTES (WITH DEBUG)
// ======================

// Login
app.post('/login', async (req, res) => {
  console.log('\n=== Login Attempt ===');
  console.log('Credentials:', { email: req.body.email, password: '***' });

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: req.body.email,
      password: req.body.password
    });

    if (error) {
      console.error('❌ Login Failed:', error.message);
      return res.render('login', { error: error.message });
    }

    console.log('✅ Login Success:', data.user.email);
    res.redirect('/');
  } catch (err) {
    console.error('❌ Login Crash:', err);
    res.render('login', { error: 'System error' });
  }
});

// Signup
app.post('/signup', async (req, res) => {
  console.log('\n=== Signup Attempt ===');
  console.log('Details:', { 
    email: req.body.email, 
    password: '***', 
    username: req.body.username 
  });

  try {
    const { data, error } = await supabase.auth.signUp({
      email: req.body.email,
      password: req.body.password,
      options: {
        data: { username: req.body.username }
      }
    });

    if (error) {
      console.error('❌ Signup Failed:', error.message);
      return res.render('signup', { error: error.message });
    }

    console.log('✅ Signup Success:', data.user?.email);
    res.redirect('/login');
  } catch (err) {
    console.error('❌ Signup Crash:', err);
    res.render('signup', { error: 'System error' });
  }
});

// ======================
// 5. RECIPE ROUTES (WITH DEBUG)
// ======================

// Add Recipe
app.post('/addrecip', async (req, res) => {
  console.log('\n=== New Recipe Submission ===');
  console.log('Form Data:', req.body);

  try {
    // Insert main recipe
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .insert({
        title: req.body.title,
        description: req.body.description,
        prep_time: req.body.prepTime,
        cook_time: req.body.cookTime,
        servings: req.body.servings
      })
      .select()
      .single();

    if (recipeError) {
      console.error('❌ Recipe Insert Failed:', recipeError);
      return res.render('addrecip', { error: recipeError.message });
    }

    console.log('✅ Recipe Created:', recipe.id);

    // Handle ingredients
    if (req.body['ingredient-name']) {
      const ingredients = Array.isArray(req.body['ingredient-name']) 
        ? req.body['ingredient-name'].map((name, i) => ({
            name,
            unit: req.body['ingredient-unit'][i]
          }))
        : [{ 
            name: req.body['ingredient-name'], 
            unit: req.body['ingredient-unit'] 
          }];

      const { error: ingError } = await supabase
        .from('recipe_ingredients')
        .insert(ingredients.map(ing => ({
          recipe_id: recipe.id,
          name: ing.name,
          unit: ing.unit
        })));

      if (ingError) {
        console.error('❌ Ingredients Insert Failed:', ingError);
        return res.render('addrecip', { error: 'Recipe saved but ingredients failed' });
      }

      console.log('✅ Ingredients Added:', ingredients.length);
    }

    res.redirect('/recipe');
  } catch (err) {
    console.error('❌ System Error:', err);
    res.render('addrecip', { error: 'Complete system failure' });
  }
});

// ======================
// 6. ERROR HANDLING
// ======================

// 404 Handler (MUST BE LAST)
app.use((req, res) => {
  console.error(`❌ 404: ${req.method} ${req.path} not found`);
  res.status(404).json({
    error: 'Not found',
    available_routes: [
      '/health',
      '/supabase-status',
      '/login (POST)',
      '/signup (POST)',
      '/addrecip (POST)'
    ]
  });
});

// ======================
// 7. START SERVER
// ======================
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log('Debug Endpoints:');
  console.log(`- http://localhost:${PORT}/health`);
  console.log(`- http://localhost:${PORT}/supabase-status`);
});