# IOT Record Management System - Setup Guide

## Overview
This guide explains how to set up and use the IOT Record Management System, which allows you to store, manage, import, and export IOT device records with vehicle ID, hardware ID, title, and SIM number.

## Setup Steps

### 1. Database Setup
Run the SQL script in your Supabase SQL Editor:

```sql
-- File: create_iot_records_table.sql
-- This creates the iot_records table with proper RLS policies
```

The script will:
- Create the `iot_records` table with columns: `vehicle_id`, `hardware_id`, `title`, `sim_number`
- Set up Row Level Security (RLS) policies for admin, it_management, and data_operator roles
- Create indexes for better query performance
- Add automatic timestamp updates

### 2. Access Control
The IOT Record panel is accessible to:
- **Admin** - Full access (create, read, update, delete)
- **IT Management** - Full access (create, read, update, delete)
- **Data Operator** - Full access (create, read, update, delete)

### 3. Features

#### CRUD Operations
- **Create**: Add new IOT records via the "Add Record" button
- **Read**: View all records in a searchable table
- **Update**: Edit existing records by clicking the edit icon
- **Delete**: Remove records by clicking the delete icon (admin only)

#### File Import (CSV/Excel)
1. Click the "Import File" button
2. Select a CSV (.csv) or Excel (.xlsx, .xls) file with the following columns:
   - `vehicle_id` (or `vehicle id`)
   - `hardware_id` (or `hardware id`)
   - `title`
   - `sim_number` (or `sim number` or `sim`)
3. Preview the data before importing
4. Click "Import" to save all records to the database

**CSV Format Example:**
```csv
vehicle_id,hardware_id,title,sim_number
V001,HW001,Device 1,1234567890
V002,HW002,Device 2,0987654321
```

**Excel Format:**
- Same column headers as CSV
- Supports .xlsx and .xls formats
- First sheet will be used for import

#### CSV Export
1. Click the "Export CSV" button
2. All records will be downloaded as a CSV file
3. File name format: `iot_records_YYYY-MM-DD.csv`

### 4. File Structure

```
src/
├── pages/
│   └── IOTRecord.jsx          # Main IOT Record page component
├── services/
│   └── iotService.js           # Service for database operations
└── create_iot_records_table.sql # Database schema file
```

### 5. Usage

#### Adding a Record
1. Click "Add Record" button
2. Fill in all required fields:
   - Vehicle ID
   - Hardware ID
   - Title
   - SIM Number
3. Click "Create" to save

#### Searching Records
- Use the search bar to filter records by:
  - Vehicle ID
  - Hardware ID
  - Title
  - SIM Number

#### Editing a Record
1. Click the edit icon (pencil) next to a record
2. Modify the fields
3. Click "Update" to save changes

#### Deleting a Record
1. Click the delete icon (trash) next to a record
2. Confirm deletion
3. Record will be permanently removed (admin only)

### 6. File Import Requirements (CSV/Excel)

Your file (CSV or Excel) must contain these columns (case-insensitive):
- `vehicle_id` or `vehicle id`
- `hardware_id` or `hardware id`
- `title`
- `sim_number` or `sim number` or `sim`

**Supported File Formats:**
- CSV (.csv)
- Excel (.xlsx, .xls)

**Important Notes:**
- All fields are required
- Empty rows will be skipped
- Records with missing required fields will be filtered out
- The system will show a preview before importing
- For Excel files, only the first sheet will be imported

### 7. Troubleshooting

#### Import Fails
- Check that your file (CSV or Excel) has the correct column headers
- Ensure all required fields are filled
- Verify the file is a valid CSV or Excel format (.csv, .xlsx, .xls)
- For Excel files, ensure the first sheet contains the data
- Check browser console for detailed error messages

#### Records Not Showing
- Verify RLS policies are correctly set up
- Check your user role has access (admin, it_management, or data_operator)
- Refresh the page or click the refresh button

#### Export Not Working
- Ensure you have records in the database
- Check browser download settings
- Try a different browser if issues persist

### 8. Database Schema

```sql
iot_records
├── id (UUID, Primary Key)
├── vehicle_id (VARCHAR)
├── hardware_id (VARCHAR)
├── title (VARCHAR)
├── sim_number (VARCHAR)
├── created_at (TIMESTAMP)
├── updated_at (TIMESTAMP)
├── created_by (UUID, Foreign Key)
└── updated_by (UUID, Foreign Key)
```

### 9. Security

- Row Level Security (RLS) is enabled
- Only authenticated users with appropriate roles can access
- Delete operations are restricted to admin only
- All operations are logged with user IDs

## Support

If you encounter any issues:
1. Check the browser console for error messages
2. Verify database table exists and RLS policies are set
3. Ensure your user role has the correct permissions
4. Check that Supabase connection is working

