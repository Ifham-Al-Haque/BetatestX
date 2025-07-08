import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qtugowosurgecytgswuo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0dWdvd29zdXJnZWN5dGdzd3VvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MDI4OTUsImV4cCI6MjA2NTM3ODg5NX0.x4gN4YO9xalo9y506l_mf6pzK_Km-SCVf9fuJxjyMLM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
