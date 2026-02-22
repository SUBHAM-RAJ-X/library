require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function createAdminUser() {
  try {
    console.log('Creating admin user...');
    
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'subhamrajx@gmail.com',
      password: '1234567890',
    });

    if (authError) {
      console.error('Auth error:', authError);
      return;
    }

    console.log('Auth user created:', authData.user?.id);

    if (authData.user) {
      // Create user profile in users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert([
          {
            id: authData.user.id,
            email: 'subhamrajx@gmail.com',
            role: 'admin'
          }
        ])
        .select()
        .single();

      if (userError) {
        console.error('User profile error:', userError);
        return;
      }

      console.log('✅ Admin user created successfully!');
      console.log('Email: subhamrajx@gmail.com');
      console.log('Password: 1234567890');
      console.log('Role: admin');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

createAdminUser();
