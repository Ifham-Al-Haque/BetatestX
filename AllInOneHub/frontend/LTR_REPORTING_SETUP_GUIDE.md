# LTR Reporting Setup Guide

This guide will help you set up and use the LTR Reporting feature in the Subscribe Now Panel.

## Overview

The LTR Reporting feature allows you to:
- Store and manage LTR (Long-Term Rental) reporting data
- Import data from CSV or Excel files
- Export data to CSV or Excel formats
- Search and filter records
- Add, edit, and delete records manually

## Database Setup

### Step 1: Create the Database Table

Run the SQL script `create_ltr_reporting_table.sql` in your Supabase SQL Editor:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `create_ltr_reporting_table.sql`
4. Click "Run" to execute the script

This will create:
- `ltr_reporting` table with the following fields:
  - `customer_id` (required)
  - `name` (required)
  - `plate_reservation` (optional)
  - `title` (optional)
  - `amount` (optional, decimal)
  - `period` (optional)
  - `start_time` (optional, timestamp)
  - `created_at`, `updated_at` (automatic)
  - `created_by`, `updated_by` (automatic)

- Row Level Security (RLS) policies for:
  - `admin`
  - `subscribe_now`
  - `cs_manager`
  - `operation_management`
  - `collections`

## File Structure

The following files have been created/updated:

1. **`create_ltr_reporting_table.sql`** - Database schema and RLS policies
2. **`src/services/ltrReportingService.js`** - Service layer for database operations
3. **`src/pages/SubscribeNow.jsx`** - Updated with full LTR Reporting component

## Features

### 1. Manual Data Entry

- Click "Add Record" button
- Fill in the form:
  - **Customer ID** (required)
  - **Name** (required)
  - **Plate Reservation** (optional)
  - **Title** (optional)
  - **Amount** (optional)
  - **Period** (optional)
  - **Start Time** (optional)
- Click "Create Record" to save

### 2. Import Data

#### Supported Formats
- CSV files (`.csv`)
- Excel files (`.xlsx`, `.xls`)

#### File Format Requirements

Your CSV/Excel file should have a header row with column names. The following column names are recognized (case-insensitive):

**Required Columns:**
- `customer_id` or `customer id`
- `name`

**Optional Columns:**
- `plate_reservation` or `plate reservation`
- `title`
- `amount`
- `period`
- `start_time` or `start time` or `start`

#### Example CSV Format:
```csv
customer_id,name,plate_reservation,title,amount,period,start_time
CUST001,John Doe,PLATE123,Monthly Rental,1500.00,12 months,2024-01-01T00:00:00
CUST002,Jane Smith,PLATE456,Quarterly Rental,4500.00,3 months,2024-02-15T00:00:00
```

#### Import Steps:
1. Click "Import File" button
2. Select your CSV or Excel file
3. Review the preview (shows first 10 records)
4. Click "Import X Record(s)" to confirm
5. Records will be imported into the database

### 3. Export Data

#### Export as CSV:
1. Click "Export CSV" button
2. File will be downloaded with name: `ltr_reporting_YYYY-MM-DD.csv` (or `ltr_reporting_filtered_YYYY-MM-DD.csv` if filters are active)

#### Export as Excel:
1. Click "Export Excel" button
2. File will be downloaded with name: `ltr_reporting_YYYY-MM-DD.xlsx` (or `ltr_reporting_filtered_YYYY-MM-DD.xlsx` if filters are active)

**Note:** If you have active search or filters, only the filtered records will be exported.

### 4. Search and Filter

#### Search:
- Use the search bar to search across all fields (customer_id, name, plate_reservation, title, period)
- Search is case-insensitive and searches within field values

#### Filters:
- Click "Filters" button to expand filter panel
- Filter by individual fields:
  - Customer ID
  - Name
  - Plate Reservation
  - Title
  - Period
- Multiple filters can be applied simultaneously
- Click "Clear Filters" to remove all filters

### 5. Edit and Delete Records

- **Edit:** Click the edit icon (pencil) next to a record
- **Delete:** Click the delete icon (trash) next to a record
  - Confirmation dialog will appear before deletion

## Access Control

The following roles have access to LTR Reporting:
- `admin` - Full access
- `subscribe_now` - Full access
- `cs_manager` - Full access
- `operation_management` - Full access
- `collections` - Full access

## Navigation

- Navigate to **Subscribe Now** panel in the sidebar
- Click on **LTR Reporting** menu item
- Or use the tab navigation within the Subscribe Now page

## Troubleshooting

### Import Errors

1. **"Invalid CSV/Excel Format"**
   - Ensure your file has a header row
   - Check that required columns (`customer_id` and `name`) are present
   - Column names should match the supported formats (case-insensitive)

2. **"No valid data rows found"**
   - Ensure at least one row has data in `customer_id` and `name` columns
   - Check for empty rows or formatting issues

3. **"Failed to parse CSV/Excel"**
   - Ensure file is not corrupted
   - Check file encoding (should be UTF-8 for CSV)
   - For Excel, ensure it's a valid `.xlsx` or `.xls` file

### Database Errors

1. **"Failed to fetch LTR records"**
   - Check RLS policies are correctly set up
   - Verify your user role has access
   - Check Supabase connection

2. **"Failed to save record"**
   - Ensure required fields (`customer_id` and `name`) are filled
   - Check database connection
   - Verify RLS policies allow INSERT/UPDATE operations

## Best Practices

1. **Data Consistency:**
   - Use consistent formats for `customer_id` and `name`
   - Use standard date/time formats for `start_time`

2. **Import:**
   - Always preview data before importing
   - Validate data in Excel/CSV before importing
   - Keep backup of original files

3. **Export:**
   - Use filters to export specific subsets of data
   - Export regularly for backup purposes

4. **Performance:**
   - Use filters instead of broad searches when possible
   - Import large datasets in batches if needed

## Support

If you encounter any issues:
1. Check the browser console for error messages
2. Verify database setup and RLS policies
3. Ensure your user role has the correct permissions
4. Check that all required dependencies are installed (`xlsx` package)

