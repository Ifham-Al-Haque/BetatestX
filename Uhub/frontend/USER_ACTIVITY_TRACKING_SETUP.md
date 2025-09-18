# User Activity Tracking System - Setup Guide

## Overview
The admin dashboard now includes comprehensive user activity tracking that allows administrators to monitor all user activities across the system in real-time.

## Features Implemented

### 1. Activity Logs Database Table
- **Table**: `activity_logs` with comprehensive tracking fields
- **Fields**: user_id, user_email, user_role, action, description, resource_type, resource_id, old_values, new_values, ip_address, user_agent, session_id, page_url, method, status_code, duration_ms, metadata, created_at
- **Indexes**: Optimized for fast querying and filtering
- **RLS Policies**: Secure access control based on user roles

### 2. Activity Service
- **File**: `src/services/activityService.js`
- **Features**:
  - Automatic activity logging
  - Real-time activity subscriptions
  - Activity statistics and analytics
  - Export functionality
  - Common activity logging methods (login, logout, CRUD operations, page views, etc.)

### 3. Enhanced Admin Dashboard
- **File**: `src/pages/AdminDashboard.jsx`
- **Features**:
  - Real-time activity monitoring
  - Advanced filtering (by action, user role, resource type, date range, search)
  - Pagination for large datasets
  - Activity statistics cards
  - Export to CSV functionality
  - User management overview
  - Real-time updates via Supabase subscriptions

### 4. Automatic Activity Tracking
- **Login/Logout**: Automatically tracked in authentication flow
- **Page Views**: Automatically tracked on route changes
- **User Actions**: Can be easily added throughout the application

## Database Setup

### Step 1: Run the Database Script
Execute the following SQL script in your Supabase SQL editor:

**Option 1 (Recommended): Complete Setup**
```sql
-- Run the contents of setup_complete_activity_system.sql
-- This will create both users and activity_logs tables, indexes, RLS policies, and helper functions
```

**Option 2: If you already have a users table**
```sql
-- Run the contents of create_activity_logs_table.sql
-- This will only create the activity_logs table, indexes, RLS policies, and helper functions
```

**IMPORTANT**: The system expects a `users` table (not `profiles`). If you have a `profiles` table instead, the complete setup script will create the correct `users` table structure.

### Step 2: Verify Table Creation
Check that the following were created:
- `activity_logs` table
- Indexes for performance
- RLS policies for security
- `log_user_activity()` function
- `get_user_activity_stats()` function

## Usage

### Accessing the Admin Dashboard
1. Navigate to `http://localhost:3000/admin/dashboard`
2. Login with admin credentials
3. View comprehensive user activity tracking

### Dashboard Features

#### Activity Statistics Cards
- **Total Activities**: Shows total activities in the last 30 days
- **Active Users**: Shows unique users with activity in the last 30 days
- **Today's Activity**: Shows activities for the current day
- **Login Sessions**: Shows login count in the last 30 days

#### Activity Filters
- **Search**: Search across activities, users, or descriptions
- **Action Filter**: Filter by specific action types (login, logout, create, update, delete, etc.)
- **User Role Filter**: Filter by user roles (admin, hr_manager, employee, etc.)
- **Resource Type Filter**: Filter by resource types (user, employee, complaint, etc.)
- **Date Range**: Filter by date range (from/to dates)

#### Activity Logs Table
- **Real-time Updates**: New activities appear automatically
- **Detailed Information**: Shows timestamp, user, action, description, resource, and status
- **Color-coded Actions**: Different colors for different action types
- **Status Indicators**: Visual indicators for HTTP status codes
- **Pagination**: Handle large datasets efficiently

#### Export Functionality
- **CSV Export**: Export filtered activity logs to CSV format
- **Comprehensive Data**: Includes all relevant fields for analysis

### Adding Custom Activity Logging

#### Basic Activity Logging
```javascript
import activityService from '../services/activityService';

// Log a custom activity
await activityService.logActivity('custom_action', 'User performed custom action', {
  resourceType: 'custom_resource',
  resourceId: 'resource_123',
  statusCode: 200
});
```

#### Resource-specific Logging
```javascript
// Log resource creation
await activityService.logResourceCreate('employee', employeeId, employeeData);

// Log resource update
await activityService.logResourceUpdate('employee', employeeId, oldData, newData);

// Log resource deletion
await activityService.logResourceDelete('employee', employeeId, employeeData);

// Log resource view
await activityService.logResourceView('employee', employeeId);
```

#### Error Logging
```javascript
try {
  // Some operation
} catch (error) {
  await activityService.logError(error, { context: 'user_creation' });
}
```

#### Search and Export Logging
```javascript
// Log search activity
await activityService.logSearch(searchTerm, results, 'employees');

// Log export activity
await activityService.logExport('employees', 'csv', recordCount);
```

## Security Features

### Row Level Security (RLS)
- **Admins**: Can view all activity logs
- **HR Managers**: Can view activity logs for their department
- **Users**: Can view their own activity logs only

### Data Privacy
- Sensitive data is not logged by default
- IP addresses and user agents are captured for security purposes
- Old/new values are stored as JSONB for flexibility

## Performance Optimizations

### Database Indexes
- Optimized indexes for common query patterns
- Composite indexes for filtering combinations
- Time-based indexes for date range queries

### Pagination
- Efficient pagination to handle large datasets
- Configurable page sizes
- Total count tracking

### Real-time Updates
- Supabase real-time subscriptions for live updates
- Minimal data transfer for efficiency
- Automatic cleanup of subscriptions

## Monitoring and Analytics

### Activity Statistics
- Total activity counts
- Unique user counts
- Daily activity trends
- Login/logout tracking
- Most active users
- Most common actions

### System Health
- Error tracking and monitoring
- Performance metrics (duration tracking)
- Status code monitoring
- User behavior analytics

## Troubleshooting

### Common Issues

1. **Activity logs not appearing**
   - Check if the activity_logs table exists
   - Verify RLS policies are correctly configured
   - Ensure the user has appropriate permissions

2. **Real-time updates not working**
   - Check Supabase real-time configuration
   - Verify subscription setup in the component
   - Check browser console for subscription errors

3. **Export not working**
   - Verify user has export permissions
   - Check CSV generation function
   - Ensure adequate browser memory for large exports

4. **Performance issues**
   - Check database indexes
   - Consider implementing data archiving for old logs
   - Optimize filter queries

### Debugging

Enable debug logging:
```javascript
// In browser console
localStorage.setItem('debug', 'activity:*');
```

Check activity service status:
```javascript
// In browser console
console.log('Activity service status:', activityService);
```

## Future Enhancements

### Planned Features
1. **Activity Dashboard Charts**: Visual charts for activity trends
2. **Alert System**: Notifications for suspicious activities
3. **Bulk Operations Tracking**: Track bulk operations with detailed logs
4. **Activity Archiving**: Automatic archiving of old activity logs
5. **Advanced Analytics**: Machine learning-based activity analysis
6. **Mobile App Integration**: Activity tracking for mobile applications

### Integration Opportunities
1. **Audit Compliance**: Integration with compliance reporting systems
2. **Security Monitoring**: Integration with security monitoring tools
3. **Business Intelligence**: Integration with BI tools for advanced analytics
4. **Notification Systems**: Integration with email/SMS notification systems

## Conclusion

The user activity tracking system provides comprehensive monitoring capabilities for the admin dashboard, enabling administrators to:
- Monitor all user activities in real-time
- Track system usage patterns
- Identify security issues
- Generate compliance reports
- Export activity data for analysis

The system is designed to be performant, secure, and extensible, making it easy to add new activity tracking throughout the application as needed.
