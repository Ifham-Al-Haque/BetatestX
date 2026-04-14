import { createClient } from '@supabase/supabase-js';

// Use environment variables for security
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Security check: Ensure environment variables are set
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  throw new Error('Missing Supabase configuration. Please check your environment variables.');
}

if (process.env.NODE_ENV === 'development') {
  console.log('Supabase client: using environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Test the connection (only in development)
if (process.env.NODE_ENV === 'development') {
  supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
      console.error('❌ Supabase connection test failed:', error);
    } else {
      console.log('✅ Supabase connection test successful');
    }
  });
}
