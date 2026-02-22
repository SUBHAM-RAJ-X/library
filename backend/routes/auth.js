const express = require('express');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const supabase = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAuthKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

// Use anon client for end-user auth flows (email/password), while service client handles table operations.
const authClient = createClient(supabaseUrl, supabaseAuthKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Generate JWT token
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Register new user
router.post('/register', async (req, res) => {
  try {
    const rawEmail = req.body?.email || '';
    const email = rawEmail.trim().toLowerCase();
    const { password, role = 'student' } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Email and password are required'
      });
    }

    // Create user in Supabase Auth
    let { data: authData, error: authError } = await authClient.auth.signUp({
      email,
      password,
    });

    if (authError) {
      const message = (authError.message || '').toLowerCase();
      const isRateLimit = message.includes('rate limit');

      // Fallback for local/dev onboarding when signup email throttling is hit.
      // This uses service-role admin API and confirms email immediately.
      if (isRateLimit) {
        const { data: adminAuthData, error: adminAuthError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true
        });

        if (adminAuthError) {
          const adminErrorMessage = (adminAuthError.message || '').toLowerCase();
          const alreadyRegistered = adminErrorMessage.includes('already');

          if (alreadyRegistered) {
            const { data: listUsersData, error: listUsersError } = await supabase.auth.admin.listUsers();

            if (listUsersError) {
              return res.status(500).json({
                error: 'Registration Error',
                message: 'Failed to resolve existing auth user'
              });
            }

            const existingAuthUser = listUsersData?.users?.find(
              (u) => (u.email || '').toLowerCase() === email
            );

            if (!existingAuthUser) {
              return res.status(400).json({
                error: 'Registration Error',
                message: 'User already exists, but could not resolve auth profile'
              });
            }

            const { data: existingProfile, error: existingProfileError } = await supabase
              .from('users')
              .select('id, email, role')
              .eq('id', existingAuthUser.id)
              .maybeSingle();

            if (existingProfileError) {
              return res.status(500).json({
                error: 'Registration Error',
                message: 'Failed to check existing user profile'
              });
            }

            if (existingProfile) {
              const token = generateToken(existingProfile.id, existingProfile.role);
              return res.status(200).json({
                message: 'User already registered',
                user: existingProfile,
                token
              });
            }

            const { data: insertedProfile, error: insertExistingProfileError } = await supabase
              .from('users')
              .insert([
                {
                  id: existingAuthUser.id,
                  email,
                  role
                }
              ])
              .select('id, email, role')
              .single();

            if (insertExistingProfileError) {
              return res.status(500).json({
                error: 'Registration Error',
                message: 'Failed to create profile for existing auth user'
              });
            }

            const token = generateToken(insertedProfile.id, insertedProfile.role);
            return res.status(201).json({
              message: 'User registered successfully',
              user: insertedProfile,
              token
            });
          }

          return res.status(400).json({
            error: 'Registration Error',
            message: adminAuthError.message || authError.message
          });
        }

        authData = { user: adminAuthData?.user || null };
      } else {
        return res.status(400).json({
          error: 'Registration Error',
          message: authError.message
        });
      }
    }

    if (authData.user) {
      // Check if user profile already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', authData.user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('User profile check error:', checkError);
        return res.status(500).json({
          error: 'Registration Error',
          message: 'Failed to check user profile'
        });
      }

      // Create user profile only if it doesn't exist
      if (!existingUser) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .insert([
            {
              id: authData.user.id,
              email: authData.user.email,
              role: role
            }
          ])
          .select()
          .single();

        if (userError) {
          console.error('User profile creation error:', userError);
          return res.status(500).json({
            error: 'Registration Error',
            message: 'Failed to create user profile'
          });
        }

        const token = generateToken(userData.id, userData.role);

        res.status(201).json({
          message: 'User registered successfully',
          user: {
            id: userData.id,
            email: userData.email,
            role: userData.role
          },
          token
        });
      } else {
        // User profile already exists, just return token
        const token = generateToken(existingUser.id, role);
        res.status(200).json({
          message: 'User already registered',
          user: {
            id: existingUser.id,
            email: authData.user.email,
            role: role
          },
          token
        });
      }
    } else {
      res.status(201).json({
        message: 'Registration successful. Please check your email to verify your account.',
        user: null,
        token: null
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to register user'
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const rawEmail = req.body?.email || '';
    const email = rawEmail.trim().toLowerCase();
    const { password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Email and password are required'
      });
    }

    // Authenticate with Supabase
    const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return res.status(401).json({
        error: 'Authentication Error',
        message: authError.message || 'Invalid email or password'
      });
    }

    // Get user profile from our users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (userError || !userData) {
      return res.status(401).json({
        error: 'Authentication Error',
        message: 'User profile not found'
      });
    }

    const token = generateToken(userData.id, userData.role);

    res.json({
      message: 'Login successful',
      user: {
        id: userData.id,
        email: userData.email,
        role: userData.role
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to login'
    });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const { data: userData, error } = await supabase
      .from('users')
      .select('id, email, role, created_at')
      .eq('id', req.user.id)
      .single();

    if (error) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User profile not found'
      });
    }

    res.json({
      user: userData
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch profile'
    });
  }
});

// Logout user
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Logout error:', error);
    }

    res.json({
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to logout'
    });
  }
});

module.exports = router;
