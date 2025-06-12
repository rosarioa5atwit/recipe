// app.js - Complete Supabase + EJS Implementation

// 1. Setup ================================================
require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.set('view engine', 'ejs');

// 2. Supabase Client ======================================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// 3. Authentication Middleware ============================
app.use(async (req, res, next) => {
  try {
    if (req.cookies['sb-access-token']) {
      // Verify the token and get user data
      const { data: { user }, error } = await supabase.auth.getUser(
        req.cookies['sb-access-token']
      );
      
      if (!error && user) {
        req.user = user;        // Create authenticated Supabase client
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

// 4. Routes ===============================================

// Home Page
app.get('/', (req, res) => {
  res.render('index', { user: req.user });
});

// Login Page
app.get('/login', (req, res) => {
  if (req.user) return res.redirect('/recipes');
  res.render('login', { error: null });
});

// Signup Page
app.get('/signup', (req, res) => {
  if (req.user) return res.redirect('/recipes');
  res.render('signup', { error: null });
});

// Login Handler
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt for:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.log('Login error:', error.message);
      return res.render('login', { error: error.message });
    }

    console.log('Login successful');
    
    // Set secure HTTP-only cookie
    res.cookie('sb-access-token', data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600000 // 1 hour
    });

    res.redirect('/recipes');
  } catch (err) {
    console.error('Login error:', err);
    res.render('login', { error: err.message });
  }
});

// Signup Handler
app.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Signup attempt:', { email, password: password ? '[HIDDEN]' : 'missing' });
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      console.log('Supabase signup error:', error.message);
      return res.render('signup', { error: error.message });
    }

    console.log('Signup successful');
    // Redirect to login with success message
    res.redirect('/login?message=Please check your email to confirm your account');
  } catch (err) {
    console.error('Signup exception:', err);
    res.render('signup', { error: 'Internal server error during sign up.' });
  }
});

// Logout Handler
app.get('/logout', (req, res) => {
  res.clearCookie('sb-access-token');
  res.redirect('/');
});

// Recipes List
app.get('/recipes', async (req, res) => {
  if (!req.user) return res.redirect('/login');

  try {
    // Simplified query - just get basic recipe data for now
    const { data: recipes, error } = await req.supabase
      .from('recipes')
      .select('id, title, base_servings, prep_time, cook_time, created_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.log('Recipes fetch error:', error);
      // If recipes table doesn't exist, just show empty state
      return res.render('recipes', {
        user: req.user,
        recipes: []
      });
    }

    res.render('recipes', {
      user: req.user,
      recipes: recipes || []
    });
  } catch (err) {
    console.error('Recipes fetch error:', err);
    // Show empty recipes instead of error page
    res.render('recipes', {
      user: req.user,
      recipes: []
    });
  }
});

// Add Recipe Form
app.get('/recipes/new', (req, res) => {
  if (!req.user) return res.redirect('/login');
  res.render('add-recipe', { user: req.user });
});

// Save Recipe
app.post('/recipes', async (req, res) => {
  if (!req.user) return res.status(401).send('Unauthorized');

  try {
    console.log('Attempting to save recipe:', req.body.title);
    
    // Simple recipe save - just basic info for now
    const recipeData = {
      title: req.body.title,
      instructions: req.body.instructions,
      base_servings: parseInt(req.body.servings) || 1,
      prep_time: parseInt(req.body.prep_time) || 0,
      cook_time: parseInt(req.body.cook_time) || 0,
      user_id: req.user.id
    };

    const { data: recipe, error: recipeError } = await req.supabase
      .from('recipes')
      .insert(recipeData)
      .select()
      .single();

    if (recipeError) {
      console.log('Recipe save error:', recipeError);
      return res.render('add-recipe', {
        user: req.user,
        error: 'Could not save recipe. Database table may not exist yet.',
        formData: req.body
      });
    }

    console.log('Recipe saved successfully:', recipe.id);
    res.redirect('/recipes');
  } catch (err) {
    console.error('Save recipe error:', err);
    res.render('add-recipe', {
      user: req.user,
      error: 'Failed to save recipe. Please try again.',
      formData: req.body
    });
  }
});

// Legacy routes for compatibility
app.get('/recipe', (req, res) => {
  res.redirect('/recipes');
});

app.get('/addrecipe', (req, res) => {
  res.redirect('/recipes/new');
});

app.get('/private', (req, res) => {
  if (!req.user) return res.redirect('/login');
  res.render('private', { userEmail: req.user.email });
});

// Error page
app.get('/error', (req, res) => {
  res.render('error', { message: req.query.msg || 'Unknown error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('404');
});

// 5. Server Startup ======================================
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Supabase connected to:', process.env.SUPABASE_URL);
});