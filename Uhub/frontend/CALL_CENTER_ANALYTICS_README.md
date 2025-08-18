# Call Center Analytics System

## Overview
Your Udrivehub application now includes a comprehensive call center analytics system that can process and analyze call center CSV data. The system automatically detects call center data and provides detailed analytics including agent performance, call patterns, and queue efficiency.

## Features

### 🎯 **Automatic Data Detection**
- Automatically identifies call center data based on column headers
- Supports flexible column naming (e.g., "Call ID", "CallID", "ID")
- Handles various time formats (HH:MM:SS, MM:SS)

### 📊 **Comprehensive Analytics**
- **Call Distribution**: Inbound vs Outbound calls
- **Agent Performance**: Individual agent metrics and rankings
- **Queue Analysis**: Queue efficiency and wait times
- **Time Metrics**: Average talk time, queue time, hold duration
- **Quality Metrics**: Survey ratings, repeat call rates
- **Trend Analysis**: Daily, weekly, and monthly patterns

### 🔧 **Data Processing**
- Validates required columns
- Processes time values in multiple formats
- Handles missing data gracefully
- Generates unique IDs for missing Call IDs

## Required CSV Columns

Your CSV must include these essential columns:

| Column | Required | Description | Example |
|--------|----------|-------------|---------|
| **Direction** | ✅ | Call direction | `inbound`, `outbound`, `internal` |
| **Start Date** | ✅ | Call start timestamp | `7/20/25 11:57:15 PM` |
| **Call Result** | ✅ | Call outcome | `answered`, `cancel`, `busy` |
| **Agent** | ✅ | Agent name | `Omar Abdelhamid` |
| **Queue** | ✅ | Queue name | `9PM-Emergency_Only_Queue` |
| **Talk Time** | ✅ | Call duration | `0:01:20` |
| **Call ID** | ✅ | Unique call identifier | `5cbbbca9-f8eb-4a54-8c2a-1e3e5dbb8007` |

### Optional Columns
- **Time spent in Queue**: `0:00:02`
- **Abandoned**: `TRUE/FALSE`
- **Lost in IVR**: `TRUE/FALSE`
- **Survey Rating**: `1-5` (numeric)
- **On hold Duration**: `0:00:00`
- **Repeats**: `0` (number of repeat calls)

## How to Use

### 1. **Access the Demo Page**
Navigate to `/call-center-demo` in your application to access the dedicated call center analytics demo.

### 2. **Import Your Data**
- Use the CSV importer component
- Drag and drop your CSV file or click to browse
- The system will automatically detect and process call center data

### 3. **View Analytics**
After import, you'll see:
- **Summary Cards**: Total calls, inbound/outbound counts
- **Agent Performance**: Individual agent metrics
- **Call Patterns**: Direction and result distributions
- **Time Analysis**: Average talk times and queue times

### 4. **Download Sample Data**
Use the "Download Sample CSV" button to get a properly formatted sample file for testing.

## Data Format Examples

### Time Formats Supported
```
0:01:20    → 1 minute 20 seconds
0:00:47    → 47 seconds
0:06:39    → 6 minutes 39 seconds
```

### Call Result Values
```
answered   → Call was successfully answered
cancel     → Call was cancelled
busy       → Line was busy
no-answer  → No answer received
```

### Direction Values
```
inbound    → Incoming calls
outbound   → Outgoing calls
internal   → Internal calls
```

## Sample Data

A sample CSV file (`call-center-sample-data.csv`) has been created with your actual data format. You can use this to test the system.

## Technical Details

### Data Processing Flow
1. **CSV Upload** → File validation and parsing
2. **Column Mapping** → Automatic detection of required columns
3. **Data Processing** → Time parsing, data cleaning, validation
4. **Analytics Generation** → Performance metrics calculation
5. **Storage** → Data stored in Supabase (if configured)
6. **Visualization** → Charts and metrics display

### Time Parsing
The system automatically converts time formats:
- `0:01:20` → 0.022 hours (1.33 minutes)
- `0:00:47` → 0.013 hours (0.78 minutes)

### Performance Metrics
- **Agent Efficiency**: Calls handled per agent
- **Queue Performance**: Average wait times
- **Call Quality**: Survey ratings and repeat rates
- **Operational Metrics**: Abandoned calls, IVR losses

## Troubleshooting

### Common Issues

**"Missing required columns" error**
- Ensure your CSV has the required columns listed above
- Check column names for typos
- Use the sample CSV as a reference

**Time parsing errors**
- Ensure time values are in HH:MM:SS or MM:SS format
- Check for extra spaces or special characters

**Data not displaying**
- Verify CSV format is correct
- Check browser console for errors
- Ensure file size is under 10MB

### Debug Information
The system logs detailed information to the browser console:
- Available columns detected
- Column mappings used
- Processing steps completed

## Integration

### With Existing System
- Uses your existing CSV importer component
- Integrates with CSPA performance analytics
- Compatible with your authentication system
- Works with your existing Supabase setup

### Customization
You can modify the analytics by editing:
- `src/utils/csvDataProcessor.js` - Data processing logic
- `src/components/CSPAPerformanceAnalytics.jsx` - Analytics display
- `src/components/CSVDataImporter.jsx` - Import functionality

## Support

For issues or questions:
1. Check the browser console for error messages
2. Verify your CSV format matches the requirements
3. Use the sample data as a reference
4. Check the debug information in the console

---

**Your call center data is perfectly formatted for this system!** 🎉

The system will automatically recognize your data structure and provide comprehensive analytics on agent performance, call patterns, and operational efficiency.


