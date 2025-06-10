// server.js
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const app = express();
const PORT = 3000;

// SUPABASE SETUP
require('dotenv').config();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Debug: Check if Supabase is linked and .env is loaded
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase ANON KEY:', supabaseAnonKey ? 'Loaded' : 'Missing');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ ERROR: SUPABASE_URL or SUPABASE_ANON_KEY is missing. Check your .env file.');
  process.exit(1);
}

// Test Supabase connection route
app.get('/supabase-test', async (req, res) => {
  try {
    const { data, error } = await supabase.from('recipes').select('*').limit(1);
    if (error) {
      return res.status(500).json({ connected: false, error: error.message });
    }
    res.json({ connected: true, example: data });
  } catch (err) {
    res.status(500).json({ connected: false, error: err.message });
  }
});

// Example route to check if Supabase is receiving user input
app.post('/supabase-debug', express.json(), async (req, res) => {
  // Log the incoming request body
  console.log('Received POST /supabase-debug:', req.body);

  // Try to insert the user input into a test table (e.g., 'debug_input')
  // Uncomment and adjust the table name/fields as needed:
  // const { data, error } = await supabase
  //   .from('debug_input')
  //   .insert([req.body]);
  // if (error) return res.status(500).json({ error: error.message });

  res.json({ received: req.body });
});

// Example: Add a POST /add-recipe endpoint to insert a recipe into Supabase
app.post('/add-recipe', express.json(), async (req, res) => {
  try {
    const { title, ingredients, instructions } = req.body;
    const { data, error } = await supabase
      .from('recipes')
      .insert([{ title, ingredients, instructions }])
      .select();
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json({ recipe: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/recipes', express.json(), async (req, res) => {
  try {
    const { title, ingredients, instructions } = req.body;
    const { data, error } = await supabase
      .from('recipes')
      .insert([{ title, ingredients, instructions }])
      .select();
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json({ recipe: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Test route
app.get('/test', (req, res) => {
  res.send('Basic test route is working');
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', time: new Date() });
});

// 404 handler (MUST BE LAST)
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested endpoint does not exist.',
    available_routes: [
      '/test',
      '/health',
      '/supabase-test',
      '/supabase-debug',
      '/add-recipe',
      '/recipes'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Test these endpoints:');
  console.log(`http://localhost:${PORT}/test`);
  console.log(`http://localhost:${PORT}/health`);
  console.log(`http://localhost:${PORT}/supabase-test`);
  console.log(`http://localhost:${PORT}/supabase-debug`);
  console.log(`http://localhost:${PORT}/add-recipe`);
  console.log(`http://localhost:${PORT}/recipes`);
});