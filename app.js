require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Set EJS as view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// User context middleware
app.use(async (req, res, next) => {
  const { data: { user } } = await supabase.auth.getUser();
  res.locals.user = user || null;
  next();
});

// Routes
app.get('/', (req, res) => {
  res.render('index', { title: 'Recipe Manager' });
});

app.get('/login', (req, res) => {
  if (res.locals.user) return res.redirect('/dashboard');
  res.render('login', { error: null });
});

// Add Recipe (GET)
app.get('/addrecip', (req, res) => {
  res.render('addrecip', { title: 'Add Recipe' });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Supabase Auth login
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (authError) {
    return res.render('login', { error: authError.message });
  }


  let profile = null;
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single();

  if (profileError && profileError.code !== 'PGRST116') { // PGRST116: No rows found
    return res.render('login', { error: 'Login successful, but failed to fetch user profile.' });
  }
  profile = profileData;


  res.redirect('/dashboard');
});

// Import and use the register router
const registerRouter = require('./routes/register');
const { title } = require('process');
app.use('/', registerRouter);

// Signup (GET)
app.get('/signup', (req, res) => {
  res.render('signup');
});

// Signup (POST)
app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;
  // Create user in Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {
    return res.render('signup', { error: error.message });
  }

  // Insert user into 'profiles' table after successful signup
  if (data && data.user && data.user.id) {
    const { error: profileError } = await supabase.from('profiles').insert([
      { id: data.user.id, username, email }
    ]);
    if (profileError) {
      console.error('Supabase profile insert error:', profileError);
      return res.render('signup', { error: 'Account created, but failed to save user profile. ' + profileError.message });
    }
  } else {
    console.error('No user ID returned from Supabase:', data);
    return res.render('signup', { error: 'Account creation failed. No user ID returned.' });
  }

  res.redirect('/login');
});

// Recipe (GET)
app.get(['/recipe', '/recipe/'], (req, res) => {
  res.render('recipe');
});

// Add Recipe (POST)
app.post('/addrecip', async (req, res) => {
  const { title, description, ingredients } = req.body;
  // You may want to add user authentication here
  try {
    const { data, error } = await supabase.from('recipes').insert([
      { title, description, ingredients } // Add other fields as needed
    ]);
    if (error) {
      return res.render('addrecip', { title: 'Add Recipe', error: error.message });
    }
    res.redirect('/recipe');
  } catch (err) {
    res.render('addrecip', { title: 'Add Recipe', error: 'Failed to add recipe.' });
  }
});

// Add other routes (dashboard, recipes, etc.)

// Error handling
app.use((req, res) => {
  res.status(404).render('404');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('500');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});