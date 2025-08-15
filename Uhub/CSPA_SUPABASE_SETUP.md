# CSPA Supabase Setup Guide

This guide will help you set up the Customer Service Performance Analysis (CSPA) system with Supabase integration for real data storage and retrieval.

## Prerequisites

- A Supabase project (free tier works fine)
- React application with authentication
- CSV/Excel files with call center or customer service data

## Step 1: Supabase Database Setup

### 1.1 Run the Database Script

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase_cspa_setup.sql`
4. Click "Run" to execute the script

This will create:
- `cspa_imports` table for storing imported data
- `cspa_call_analytics` table for performance analytics
- Proper indexes and RLS policies
- Helper functions and views

### 1.2 Verify Setup

After running the script, you should see:
- Success message: "CSPA database setup completed successfully!"
- New tables in your database schema
- RLS policies enabled

## Step 2: Environment Configuration

### 2.1 Add Supabase Environment Variables

Create or update your `.env` file:

```env
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2.2 Get Your Supabase Credentials

1. Go to your Supabase project settings
2. Copy the Project URL and anon/public key
3. Paste them in your `.env` file

## Step 3: Install Dependencies

Make sure you have the required packages:

```bash
npm install @supabase/supabase-js
```

## Step 4: Test the System

### 4.1 Import Your CSV Data

1. Navigate to the CSPA section in your app
2. Go to the "Data Import" tab
3. Upload your call center CSV file
4. The system will automatically detect the data type
5. Click "Import Data" to store in Supabase

### 4.2 View Analytics

1. After successful import, go to "Performance Analytics"
2. You should see real data from your CSV file
3. All mock data has been removed
4. Analytics are generated from your actual data

## Data Format Requirements

### Call Center Data (Recommended for Ziwo)

Your CSV should include these columns:
- **Call ID** (or ID, Call Number)
- **Direction** (Inbound/Outbound)
- **Agent** (or Agent Name)
- **Call Result** (or Result, Status)
- **Talk Time** (or Duration)
- **Queue** (or Department)

Optional columns:
- Start Date
- Time spent in Queue
- Survey Rating
- Abandoned
- Lost in IVR
- On hold Duration
- Repeats

### Customer Service Ticket Data

Your CSV should include:
- **Ticket ID** (or ID, Case ID)
- **Customer Name** (or Customer, Client)
- **Issue Type** (or Issue, Category)
- **Priority** (or Severity, Urgency)
- **Status** (or State)

## Features

### ✅ What's Working Now

1. **Real Data Import**: CSV files are processed and stored in Supabase
2. **Automatic Data Detection**: System recognizes call center vs ticket data
3. **Persistent Storage**: All imports are saved and can be retrieved
4. **Import History**: View, search, and manage all imported files
5. **Real Analytics**: Charts and metrics based on actual data
6. **User Isolation**: Each user only sees their own data (RLS enabled)

### 🔄 Data Flow

1. **Upload CSV** → File validation and parsing
2. **Data Processing** → Automatic column mapping and data cleaning
3. **Supabase Storage** → Data stored with user association
4. **Analytics Generation** → Real-time metrics calculation
5. **Visualization** → Charts and graphs from real data

## Troubleshooting

### Common Issues

1. **"Missing required columns" error**
   - Check your CSV has the required columns
   - Use the column requirements guide above

2. **"Error storing data in Supabase"**
   - Verify your environment variables
   - Check Supabase connection
   - Ensure user is authenticated

3. **"No data imported yet"**
   - Complete the import process first
   - Check the Data Import tab

### Debug Steps

1. Check browser console for errors
2. Verify Supabase tables exist
3. Confirm RLS policies are active
4. Test with a simple CSV file first

## Performance Tips

1. **Large Files**: CSV files up to 10MB are supported
2. **Data Processing**: Analytics are calculated once during import
3. **Storage**: Data is compressed in JSONB format
4. **Caching**: Import history is cached for better performance

## Security Features

- **Row Level Security (RLS)**: Users can only access their own data
- **User Authentication**: Required for all data operations
- **Data Validation**: CSV data is validated before storage
- **Secure Storage**: All data stored in Supabase with proper access controls

## Next Steps

### Immediate
1. Test with your call center data
2. Verify analytics are working
3. Check import history functionality

### Future Enhancements
1. **Live Data Integration**: Connect to Ziwo API for real-time data
2. **Advanced Analytics**: More sophisticated metrics and insights
3. **Data Export**: Export processed data in various formats
4. **Team Collaboration**: Share analytics with team members

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify your Supabase setup
3. Test with sample data first
4. Check browser console for error messages

## Sample Data

For testing, you can create a simple CSV with these columns:
```csv
Call ID,Direction,Agent,Call Result,Talk Time,Queue
C001,Inbound,John Smith,Resolved,5.2,Support
C002,Outbound,Sarah Johnson,Completed,3.8,Sales
C003,Inbound,Mike Davis,Resolved,7.1,Technical
```

This setup will give you a fully functional CSPA system with real data storage, analytics, and no mock data!
