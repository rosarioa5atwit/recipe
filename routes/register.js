// Import required modules
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Registration route
router.post('/register', async (req, res) => {
  const { email, password, confirmPassword } = req.body;

  // Basic validation
  if (password !== confirmPassword) {
    return res.status(400).render('register', {
      error: 'Passwords do not match'
    });
  }

  try {
    // 1. Create user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password
      // Removed options.emailRedirectTo to disable email confirmation
    });

    if (error) throw error;

    // 2. Add to custom profiles table (optional)
    const { error: dbError } = await supabase
      .from('profiles')
      .insert([
        { 
          id: data.user.id,
          email: data.user.email,
          created_at: new Date().toISOString()
        }
      ]);

    if (dbError) throw dbError;

    // 3. Redirect with success message
    res.redirect('/login?registration=success');
    
  } catch (error) {
    console.error('Registration error:', error);
    let errorMessage = 'Registration failed';
    
    if (error.message.includes('already registered')) {
      errorMessage = 'Email already in use';
    } else if (error.message.includes('password')) {
      errorMessage = 'Password too weak (min 6 chars)';
    }

    res.status(400).render('register', { error: errorMessage });
  }
});

module.exports = router;
