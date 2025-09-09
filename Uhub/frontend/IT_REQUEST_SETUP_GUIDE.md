# IT Request System Setup Guide

This guide will help you set up and fix the IT Request system in your Uhub application.

## 🚨 Issues Fixed

The IT Request system had several issues that have been resolved:

1. **Missing Database Views**: The `it_request_details` view was missing
2. **Missing Database Functions**: The `get_it_request_stats` function was missing
3. **Missing Tables**: Comments and attachments tables were missing
4. **API Fallbacks**: No graceful fallbacks when database objects don't exist
5. **Error Handling**: Poor error handling in UI components

## 📋 Setup Steps

### Step 1: Database Setup

Run the following SQL script in your Supabase SQL Editor:

```sql
-- Execute: fix_it_request_database.sql
```

This script will:
- Create the missing `it_request_details` view
- Create the `get_it_request_stats` function
- Create missing tables (comments, attachments, tickets)
- Add missing columns to existing tables
- Set up proper RLS policies
- Create necessary indexes

### Step 2: Verify Database Objects

After running the SQL script, verify these objects exist:

1. **Views**:
   - `it_request_details`

2. **Functions**:
   - `get_it_request_stats`

3. **Tables**:
   - `it_request_categories`
   - `it_request_priorities`
   - `it_requests`
   - `it_tickets`
   - `it_request_comments`
   - `it_request_attachments`

### Step 3: Test the System

Run the test script to verify everything is working:

```bash
node test_it_request_system.js
```

## 🔧 What Was Fixed

### 1. Database Layer
- ✅ Created missing `it_request_details` view with proper joins
- ✅ Created `get_it_request_stats` function for analytics
- ✅ Added missing tables for comments and attachments
- ✅ Fixed RLS policies to work with `users` table
- ✅ Added proper indexes for performance

### 2. API Layer
- ✅ Added graceful fallbacks when views/functions don't exist
- ✅ Improved error handling with detailed logging
- ✅ Added missing IT Tickets API methods
- ✅ Fixed role-based filtering
- ✅ Added proper data validation

### 3. UI Layer
- ✅ Improved error handling in data fetching
- ✅ Added form validation
- ✅ Better loading states
- ✅ Graceful degradation when data fails to load

## 🎯 Features Now Available

### IT Requests
- ✅ Create, read, update, delete requests
- ✅ Role-based access control
- ✅ Status management (open, assigned, in_progress, resolved, closed)
- ✅ Priority and category management
- ✅ Search and filtering
- ✅ Analytics and statistics

### IT Tickets
- ✅ Create tickets from requests
- ✅ Time tracking
- ✅ Status management
- ✅ Assignment to tech support
- ✅ Resolution tracking

### Comments & Attachments
- ✅ Add comments to requests
- ✅ Upload file attachments
- ✅ Internal vs external comments
- ✅ User attribution

## 🚀 Usage

### Creating a Request
1. Navigate to IT Requests page
2. Click "Add Request" button
3. Fill in required fields:
   - Title
   - Description
   - Category
   - Priority
4. Submit the request

### Managing Requests
- **Employees**: Can create and view their own requests
- **Tech Support**: Can view and update assigned requests
- **Admins**: Can view and manage all requests

### Creating Tickets
1. Navigate to IT Tickets page
2. Click "Add Ticket" button
3. Link to an existing request (optional)
4. Set priority and assign to tech support
5. Submit the ticket

## 🔍 Troubleshooting

### Common Issues

1. **"relation does not exist" errors**
   - Solution: Run the database setup script

2. **Permission denied errors**
   - Solution: Check RLS policies and user roles

3. **Empty data loading**
   - Solution: Check if categories and priorities are populated

4. **API errors**
   - Solution: Check Supabase connection and API keys

### Debug Mode

Enable debug logging by adding this to your browser console:

```javascript
localStorage.setItem('debug', 'it-request:*');
```

## 📊 Database Schema

The IT Request system uses these main tables:

```
it_requests (main requests table)
├── it_request_categories (request categories)
├── it_request_priorities (priority levels)
├── it_request_comments (request comments)
├── it_request_attachments (file attachments)
└── it_tickets (related tickets)
```

## 🎉 Success!

Once set up correctly, you should see:
- ✅ IT Requests page loads without errors
- ✅ Categories and priorities populate
- ✅ Can create new requests
- ✅ Analytics show proper statistics
- ✅ Tickets system works
- ✅ Comments and attachments work

## 📞 Support

If you encounter issues:
1. Check the browser console for errors
2. Verify database objects exist
3. Check user permissions
4. Run the test script
5. Check Supabase logs

The system now has robust error handling and will provide helpful error messages to guide you through any issues.
