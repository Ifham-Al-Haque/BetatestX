# Database Fix for Uhub Frontend

## Issues Identified

You're experiencing several database-related errors when accessing `http://localhost:3000/suggestions`:

1. **Chat Service RPC Function Error**: `get_user_conversations RPC function not available: column reference "conversation_id" is ambiguous`
2. **User Status Table Error**: `user_status table not available: Could not find a relationship between 'user_status' and 'user_profiles'`
3. **Suggestions Table**: May not exist or have proper Row Level Security (RLS) policies

## Root Causes

- Multiple conflicting database schema files exist
- Chat system tables are missing or have incorrect relationships
- Suggestions table may not be properly set up
- RLS policies reference non-existent tables

## Solution

### Step 1: Run the Comprehensive Database Fix

1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Copy and paste the entire contents of `fix_all_database_issues.sql`
4. Click **Run** to execute the script

This script will:
- ✅ Create the `user_profiles` table if it doesn't exist
- ✅ Create the `suggestions` table with proper structure
- ✅ Create the `suggestion_categories` table with default categories
- ✅ Fix all chat system tables (`conversations`, `messages`, `conversation_participants`, `user_status`, `typing_indicators`)
- ✅ Create proper RLS policies for all tables
- ✅ Create RPC functions for the chat system
- ✅ Set up proper foreign key relationships
- ✅ Create necessary indexes for performance
- ✅ Grant proper permissions to authenticated users

### Step 2: Verify the Fix

After running the script, you should see:
```
NOTICE: Database setup completed successfully! All tables and functions have been created.
NOTICE: You can now access the suggestions page and chat system without errors.
```

### Step 3: Test the Suggestions Page

1. Refresh your browser
2. Navigate to `http://localhost:3000/suggestions`
3. The page should now load without database errors

## What the Fix Does

### 1. User Profiles Table
- Creates a unified `user_profiles` table for user information
- Fixes the relationship issues between tables
- Sets up proper RLS policies

### 2. Suggestions System
- Creates the `suggestions` table with all required fields
- Sets up role-based access control (employees see their own + general, admins see all)
- Creates default suggestion categories
- Sets up proper indexing for performance

### 3. Chat System
- Recreates all chat-related tables with proper relationships
- Fixes the `conversation_id` ambiguity issue
- Creates RPC functions for getting conversations
- Sets up real-time messaging infrastructure

### 4. Security & Performance
- Enables Row Level Security (RLS) on all tables
- Creates proper RLS policies for role-based access
- Sets up database indexes for better performance
- Grants appropriate permissions to authenticated users

## Tables Created/Modified

- `user_profiles` - User profile information
- `suggestions` - User suggestions and feedback
- `suggestion_categories` - Predefined suggestion categories
- `conversations` - Chat conversations
- `conversation_participants` - Users in conversations
- `messages` - Chat messages
- `user_status` - User online status
- `typing_indicators` - Real-time typing indicators

## RPC Functions Created

- `get_user_conversations()` - Get user's conversations
- `create_direct_conversation(other_user_id)` - Create direct message
- `create_group_conversation(group_name, participant_ids)` - Create group chat

## Default Suggestion Categories

- Process Improvement
- Technology
- Communication
- Work Environment
- Training & Development
- Customer Service
- Safety & Security
- Other

## Troubleshooting

### If you still get errors:

1. **Check Supabase Logs**: Look for any error messages in the SQL execution
2. **Verify Table Creation**: Check if all tables were created in the Supabase dashboard
3. **Check RLS Policies**: Ensure RLS policies are properly set up
4. **Verify Permissions**: Make sure authenticated users have proper access

### Common Issues:

- **Permission Denied**: Make sure you're running the script as a database owner
- **Table Already Exists**: The script uses `CREATE TABLE IF NOT EXISTS` to avoid conflicts
- **RLS Policy Conflicts**: The script drops and recreates policies to avoid conflicts
- **Syntax Errors**: The script now properly handles policy creation by dropping existing policies first
- **Function Return Type Conflicts**: The script drops existing functions before recreating them to avoid return type conflicts

## Next Steps

After running the fix:

1. **Test the suggestions page** - should work without errors
2. **Test the chat system** - should work without database errors
3. **Create some test suggestions** to verify the system works
4. **Test user roles** to ensure proper access control

## Support

If you continue to experience issues after running the fix:

1. Check the Supabase SQL editor for any error messages
2. Verify all tables were created successfully
3. Check the browser console for any remaining JavaScript errors
4. Ensure your Supabase connection is working properly

The comprehensive fix should resolve all the database issues you're experiencing with the suggestions page and chat system.
