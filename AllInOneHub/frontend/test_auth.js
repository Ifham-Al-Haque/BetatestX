// Test Authentication Script
// Run this in your browser console to test authentication

import { supabase } from './src/supabaseClient.js';

// Test 1: Check if we can connect to Supabase
console.log('🔧 Testing Supabase connection...');

// Test 2: Check current auth state
const { data: { user }, error: authError } = await supabase.auth.getUser();
console.log('Current user:', user);
console.log('Auth error:', authError);

// Test 3: Try to access a table directly
try {
  const { data, error } = await supabase
    .from('employees')
    .select('count')
    .limit(1);
  
  console.log('✅ Table access successful:', data);
  console.log('❌ Table access error:', error);
} catch (err) {
  console.log('❌ Exception accessing table:', err);
}

// Test 4: Check if we have a valid session
const { data: { session }, error: sessionError } = await supabase.auth.getSession();
console.log('Current session:', session);
console.log('Session error:', sessionError);

// Test 5: List all tables to see what's available
try {
  const { data: tables, error: tablesError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public');
  
  console.log('Available tables:', tables);
  console.log('Tables error:', tablesError);
} catch (err) {
  console.log('❌ Exception listing tables:', err);
} 