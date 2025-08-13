# Driver Management System Setup Guide

## Overview
This guide will help you set up the Driver Management System in your Uhub application. The system includes driver records management, document uploads, and profile management.

## Prerequisites
- Supabase project with authentication enabled
- `employees` table with `role` column (admin, manager, hr, employee)
- Basic understanding of SQL and Supabase

## Setup Steps

### Step 1: Create Storage Buckets
First, run the storage setup script to create the necessary buckets for driver documents and profile pictures.

**File:** `setup_driver_storage.sql`
**Location:** Supabase SQL Editor

This script will:
- Create `driver-profiles` bucket for profile pictures (5MB limit)
- Create `driver-documents` bucket for documents (10MB limit)
- Set up RLS policies for secure access

### Step 2: Create Database Tables
Next, create the main database tables for drivers and driver documents.

**File:** `create_drivers_table.sql`
**Location:** Supabase SQL Editor

This script will:
- Create `drivers` table with all required fields
- Create `driver_documents` table for document management
- Set up indexes for performance
- Create RLS policies for secure access control
- Insert sample data for testing

### Step 3: Verify Setup
After running both scripts, verify that everything is working correctly:

```sql
-- Check if tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('drivers', 'driver_documents');

-- Check if storage buckets exist
SELECT id, name FROM storage.buckets 
WHERE id IN ('driver-profiles', 'driver-documents');

-- Check sample data
SELECT COUNT(*) as driver_count FROM drivers;
SELECT COUNT(*) as document_count FROM driver_documents;
```

## Database Schema

### Drivers Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| full_name | TEXT | Driver's full name |
| employee_id | TEXT | Unique employee ID |
| designation | TEXT | Job title/position |
| nationality | TEXT | Nationality |
| company_mobile | TEXT | Company phone number |
| personal_mobile | TEXT | Personal phone number |
| emirates_id_no | TEXT | Emirates ID number |
| driving_license_no | TEXT | Driving license number |
| udrive_customer_account_id | TEXT | Udrive account ID |
| service_car_plate | TEXT | Vehicle plate number |
| team_type | TEXT | Type of team |
| team_name | TEXT | Team name |
| team_members | TEXT | Team member names |
| shift_type | TEXT | Day/Night shift |
| profile_picture | TEXT | Profile picture URL |
| status | TEXT | Active/Inactive status |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### Driver Documents Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| driver_id | UUID | Reference to driver |
| document_type | TEXT | Type of document |
| document_url | TEXT | Document file URL |
| passport_number | TEXT | Passport number |
| uploaded_at | TIMESTAMP | Upload timestamp |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

## Document Types
The system supports the following document types:
- `emirates_id_front` - Emirates ID front side
- `emirates_id_back` - Emirates ID back side
- `driving_license_front` - Driving license front side
- `driving_license_back` - Driving license back side
- `passport_copy` - Passport copy

## Access Control

### Role-Based Permissions
- **Admin**: Full access (create, read, update, delete)
- **Manager**: Create, read, update access
- **HR**: Read access only
- **Employee**: Read access to own records only

### RLS Policies
The system uses Row Level Security (RLS) to ensure:
- Only authorized users can access driver records
- Users can only perform actions allowed by their role
- Data is protected at the database level

## Frontend Integration

### Routes
The following routes are available:
- `/drivers` - List all drivers
- `/driver/new` - Create new driver
- `/driver/:id` - View driver profile
- `/driver/:id/edit` - Edit driver

### Navigation
Drivers are accessible from the main sidebar navigation under "Drivers".

## File Upload

### Profile Pictures
- Stored in `driver-profiles` bucket
- Supported formats: JPEG, PNG, WebP, GIF
- Maximum size: 5MB
- Public access for viewing

### Documents
- Stored in `driver-documents` bucket
- Supported formats: JPEG, PNG, WebP, PDF, TIFF
- Maximum size: 10MB
- Public access for viewing

## Troubleshooting

### Common Issues

1. **"relation 'user_roles' does not exist"**
   - **Solution**: The script has been updated to use the correct `employees` table structure
   - **Cause**: This was referencing a non-existent table

2. **Storage bucket creation fails**
   - **Solution**: Ensure you have storage enabled in your Supabase project
   - **Check**: Go to Storage in your Supabase dashboard

3. **RLS policies not working**
   - **Solution**: Verify that RLS is enabled on the tables
   - **Check**: Run `ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;`

4. **Permission denied errors**
   - **Solution**: Check user role in employees table
   - **Verify**: Ensure user has appropriate role (admin, manager, hr)

### Verification Commands

```sql
-- Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('drivers', 'driver_documents');

-- Check policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename IN ('drivers', 'driver_documents');

-- Check user role
SELECT id, full_name, role FROM employees WHERE id = auth.uid();
```

## Testing

### Sample Data
The setup script includes sample driver data:
- Ahmed Al Mansouri (DRV001) - Senior Driver
- Fatima Al Zaabi (DRV002) - Driver  
- Mohammed Al Falasi (DRV003) - Lead Driver

### Test Scenarios
1. **Create Driver**: Navigate to `/driver/new` and create a test driver
2. **Upload Documents**: Test document upload functionality
3. **View Profile**: Navigate to `/driver/:id` to view driver details
4. **Edit Driver**: Test editing functionality at `/driver/:id/edit`
5. **Delete Driver**: Test deletion (admin only)

## Security Considerations

- All file uploads are validated for type and size
- RLS policies ensure data access control
- Document URLs are publicly accessible but uploads are restricted
- User authentication is required for all operations

## Performance Notes

- Indexes are created on frequently queried columns
- File size limits prevent excessive storage usage
- Pagination is implemented for large datasets
- React Query provides efficient caching

## Support

If you encounter any issues during setup:
1. Check the troubleshooting section above
2. Verify your Supabase project configuration
3. Ensure all prerequisites are met
4. Check the browser console for JavaScript errors

## Next Steps

After successful setup:
1. Test all functionality with sample data
2. Customize the UI as needed
3. Add additional fields if required
4. Configure backup and monitoring
5. Train users on the new system

---

**Note**: This system is designed to work with your existing employee management infrastructure. Ensure that the `employees` table exists and contains the necessary role information before proceeding with the setup.
