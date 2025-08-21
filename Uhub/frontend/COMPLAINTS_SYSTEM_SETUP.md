# 🚨 Complaints Management System - Setup Guide

## Overview
This guide will help you set up a **real-time complaints management system** that stores actual user complaints in your database instead of using mock data.

## 🗄️ Database Setup

### 1. Run the SQL Script
Execute the `create_complaints_table.sql` script in your Supabase database:

```sql
-- Run this in your Supabase SQL editor
\i create_complaints_table.sql
```

### 2. Verify Table Creation
Check that the `complaints` table was created successfully:

```sql
-- Verify table exists
SELECT * FROM information_schema.tables 
WHERE table_name = 'complaints';

-- Check table structure
\d complaints;
```

## 🔐 Row Level Security (RLS) Policies

The system automatically creates RLS policies that ensure:

- **Employees** can only see and manage their own complaints
- **Admins, HR, and Managers** can see and manage all complaints
- **Users** can only update/delete complaints that are still "open"

## 📊 Table Structure

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key, auto-generated |
| `title` | VARCHAR(255) | Complaint title |
| `description` | TEXT | Detailed description |
| `category` | VARCHAR(100) | Complaint category |
| `priority` | VARCHAR(50) | Priority level (low/medium/high/urgent) |
| `status` | VARCHAR(50) | Current status (open/in_progress/resolved/closed) |
| `anonymous` | BOOLEAN | Whether complaint is anonymous |
| `complainant_id` | UUID | User who submitted the complaint |
| `complainant_name` | VARCHAR(255) | Name of complainant |
| `assigned_to` | UUID | User assigned to handle complaint |
| `assigned_at` | TIMESTAMP | When complaint was assigned |
| `resolved_at` | TIMESTAMP | When complaint was resolved |
| `resolution_notes` | TEXT | Notes about resolution |
| `created_at` | TIMESTAMP | When complaint was created |
| `updated_at` | TIMESTAMP | Last update timestamp |

## 🚀 Frontend Integration

### 1. API Service
The `complaintsApi.js` service provides these functions:

- `createComplaint()` - Submit new complaint
- `getComplaints()` - Fetch complaints with role-based filtering
- `getComplaintsWithFilters()` - Fetch complaints with search/filtering
- `updateComplaint()` - Update complaint details
- `updateComplaintStatus()` - Change complaint status
- `deleteComplaint()` - Delete complaint
- `getComplaintStats()` - Get complaint statistics

### 2. Real-time Data Flow
1. **User submits complaint** → Saved to database
2. **Data fetched** → Retrieved from database (not mock data)
3. **Updates applied** → Changes saved to database
4. **Real-time sync** → All users see current data

## 🔧 Configuration

### Environment Variables
Ensure these are set in your `.env` file:

```env
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### User Roles
The system recognizes these user roles:
- `employee` - Can only see own complaints
- `admin` - Can see and manage all complaints
- `hr` - Can see and manage all complaints
- `manager` - Can see and manage all complaints

## 📱 Features

### For Employees
- ✅ Submit new complaints
- ✅ View own complaints
- ✅ Edit own complaints (if status is "open")
- ✅ Delete own complaints (if status is "open")
- ✅ Anonymous submission option

### For Admins/HR/Managers
- ✅ View all complaints
- ✅ Update complaint status
- ✅ Assign complaints to team members
- ✅ Add resolution notes
- ✅ Delete any complaint
- ✅ Full complaint management

### System Features
- ✅ Real-time database storage
- ✅ Role-based access control
- ✅ Advanced filtering and search
- ✅ Status tracking
- ✅ Priority management
- ✅ Anonymous submissions
- ✅ Audit trail (created_at, updated_at)

## 🧪 Testing

### 1. Submit a Test Complaint
1. Navigate to Complaints page
2. Click "Submit Complaint"
3. Fill out the form
4. Submit and verify it appears in the list

### 2. Check Database
```sql
-- View all complaints
SELECT * FROM complaints ORDER BY created_at DESC;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'complaints';
```

### 3. Test Role-based Access
- Login as different user types
- Verify access restrictions work correctly

## 🚨 Troubleshooting

### Common Issues

#### 1. "Table doesn't exist"
- Run the SQL script in Supabase SQL editor
- Check for any syntax errors

#### 2. "Permission denied"
- Verify RLS policies are created
- Check user role in `user_profiles` table

#### 3. "API calls failing"
- Verify Supabase credentials
- Check browser console for errors
- Ensure table structure matches API expectations

### Debug Commands

```sql
-- Check table permissions
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'complaints';

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'complaints';

-- Check existing complaints
SELECT COUNT(*) FROM complaints;
```

## 📈 Performance Optimization

### Indexes
The system automatically creates indexes for:
- `complainant_id` - Fast user-based queries
- `status` - Fast status filtering
- `priority` - Fast priority filtering
- `category` - Fast category filtering
- `created_at` - Fast date-based sorting

### Query Optimization
- Uses Supabase's built-in query optimization
- Implements efficient filtering at database level
- Minimizes data transfer with selective queries

## 🔒 Security Features

- **Row Level Security (RLS)** - Data isolation by user role
- **Input Validation** - Server-side validation of all inputs
- **Role-based Access** - Different permissions for different user types
- **Audit Trail** - Complete history of all changes
- **Anonymous Submissions** - Protect user privacy when needed

## 🎯 Next Steps

1. **Run the SQL script** to create the table
2. **Test the system** with a few sample complaints
3. **Verify role-based access** works correctly
4. **Monitor performance** and adjust indexes if needed
5. **Train users** on the new system

## 📞 Support

If you encounter issues:
1. Check the browser console for errors
2. Verify database table structure
3. Check Supabase logs for API errors
4. Ensure all environment variables are set correctly

---

**🎉 Congratulations!** You now have a fully functional, real-time complaints management system that stores actual user data in your database.
