// Script to manually confirm a user's email in Supabase
// Run this in your browser console or as a Node.js script

const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // Replace with your actual Supabase URL
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Replace with your actual anon key

// Function to confirm user email
async function confirmUserEmail(userEmail) {
  try {
    // First, get the user by email
    const { data: { users }, error: fetchError } = await supabase.auth.admin.listUsers();
    
    if (fetchError) {
      console.error('Error fetching users:', fetchError);
      return;
    }
    
    // Find the specific user
    const user = users.find(u => u.email === userEmail);
    
    if (!user) {
      console.error('User not found:', userEmail);
      return;
    }
    
    console.log('Found user:', user);
    
    // Update the user to confirm their email
    const { data, error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { email_confirm: true }
    );
    
    if (updateError) {
      console.error('Error confirming user:', updateError);
      return;
    }
    
    console.log('User email confirmed successfully:', data);
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Usage: Run this in browser console when logged into Supabase
// confirmUserEmail('nagma@udrive.ae');

// Alternative: Direct database update (if you have access)
async function confirmUserEmailDirect(userEmail) {
  try {
    // This requires direct database access
    const { data, error } = await supabase
      .from('auth.users')
      .update({ email_confirmed_at: new Date().toISOString() })
      .eq('email', userEmail);
    
    if (error) {
      console.error('Error updating user:', error);
      return;
    }
    
    console.log('User email confirmed in database:', data);
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

console.log('Email confirmation script loaded. Use confirmUserEmail("nagma@udrive.ae") to confirm user.');
