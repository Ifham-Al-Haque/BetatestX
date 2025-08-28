# Complaints System - Updated Implementation

## Overview

The Udrive Application complaints system has been updated to provide better role-based access control and improved user experience. The system now supports two main views: "All Complaints" and "All Concerns" for HR Managers and Admins, while regular employees can only see their own complaints.

## Key Features

### 🔐 **Role-Based Access Control**
- **HR Managers & Admins**: Can view and manage all complaints across the organization
- **Regular Employees**: Can only view and manage complaints they have submitted
- **Anonymous Submissions**: Users can submit complaints anonymously to protect their identity

### 📋 **Two Main View Modes (HR Managers & Admins Only)**

#### 1. **All Complaints**
- Shows all complaints from all employees
- Comprehensive overview for management purposes
- Ability to manage status, priority, and assign departments

#### 2. **All Concerns**
- Focuses on sensitive concerns requiring immediate attention
- Includes categories: Work Environment, Harassment, Discrimination, Safety Concerns
- Helps prioritize critical issues

### 👤 **Employee Access**
- Users can only see complaints they have submitted
- Ensures privacy and confidentiality
- No access to other employees' complaints

## System Architecture

### Database Schema

The complaints table includes the following fields:

```sql
CREATE TABLE complaints (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    priority VARCHAR(50) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    anonymous BOOLEAN DEFAULT FALSE,
    complainant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    complainant_name VARCHAR(255) NOT NULL,
    complainant_email VARCHAR(255),
    complainant_department VARCHAR(100),
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_department VARCHAR(100),
    assigned_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### API Endpoints

The system provides the following API methods:

- `getAllComplaintsIncludingCurrentUser(filters)` - For "All Complaints" view
- `getComplaintsByCategories(filters, categories)` - For "All Concerns" view
- `getCurrentUserComplaints(userId, filters)` - For employee personal view
- `updateComplaintStatus(complaintId, newStatus)` - Update complaint status
- `updateComplaintPriority(complaintId, newPriority)` - Update complaint priority
- `assignComplaintToDepartment(complaintId, department)` - Assign to department

## User Interface

### HR Manager & Admin Interface

1. **Header Section**
   - Clear indication of role and access level
   - Instructions for managing complaints

2. **Statistics Cards**
   - Total complaints/concerns count
   - Open complaints count
   - Resolved complaints count
   - Urgent complaints count

3. **View Mode Toggle**
   - "All Complaints" button
   - "All Concerns" button
   - Clear description of each view

4. **Complaint Management**
   - Status change controls
   - Priority adjustment
   - Department assignment
   - Detailed view modal

### Employee Interface

1. **Header Section**
   - Clear indication of limited access
   - Privacy notice

2. **Personal Complaints List**
   - Only shows user's own complaints
   - No management controls
   - Read-only view

## Security Features

### Row Level Security (RLS)
- Users can only view their own complaints
- HR Managers and Admins can view all complaints
- Anonymous complaints hide user identity

### Data Privacy
- Employee information is protected
- Anonymous submissions are fully anonymous
- Department assignments are role-based

## Implementation Details

### Frontend Components

- **ComplaintsInbox.jsx**: Main inbox component with role-based views
- **Complaints.jsx**: Complaint submission and personal management
- **Role-based access control**: Automatic UI adaptation based on user role

### Backend Services

- **complaintsApi.js**: API service layer with role-based filtering
- **Database queries**: Optimized with proper indexing
- **Error handling**: Comprehensive error handling and user feedback

## Setup Instructions

### 1. Database Setup
Run the updated schema:
```bash
psql -d your_database -f create_complaints_table_safe.sql
```

### 2. Add Missing Fields (if updating existing system)
```bash
psql -d your_database -f add_complaints_fields.sql
```

### 3. Verify Installation
Check that all required fields exist:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'complaints';
```

## Usage Examples

### HR Manager Viewing All Complaints
1. Navigate to Complaints Inbox
2. Select "All Complaints" view mode
3. Use filters to find specific complaints
4. Manage status, priority, and assignments

### HR Manager Viewing Sensitive Concerns
1. Navigate to Complaints Inbox
2. Select "All Concerns" view mode
3. Focus on harassment, discrimination, and safety issues
4. Prioritize urgent concerns

### Employee Submitting Complaint
1. Navigate to Complaints page
2. Fill out complaint form
3. Choose anonymous option if needed
4. Submit and track status

### Employee Viewing Own Complaints
1. Navigate to Complaints Inbox
2. View only personal complaints
3. Track status updates
4. No access to other complaints

## Benefits

### For HR Managers & Admins
- **Comprehensive Overview**: See all complaints across organization
- **Focused Management**: Separate view for sensitive concerns
- **Efficient Processing**: Bulk management capabilities
- **Better Decision Making**: Full context for complaint resolution

### For Employees
- **Privacy Protection**: Cannot see other employees' complaints
- **Anonymous Option**: Submit sensitive concerns safely
- **Status Tracking**: Monitor progress of own complaints
- **Confidentiality**: Personal information is protected

### For Organization
- **Better Compliance**: Proper handling of sensitive issues
- **Improved Efficiency**: Streamlined complaint management
- **Risk Mitigation**: Early identification of critical concerns
- **Employee Trust**: Confidential and fair complaint handling

## Troubleshooting

### Common Issues

1. **Access Denied Errors**
   - Verify user role in database
   - Check RLS policies
   - Ensure proper authentication

2. **Missing Fields**
   - Run the migration script
   - Check database schema
   - Verify column names

3. **Performance Issues**
   - Check database indexes
   - Optimize queries
   - Monitor query execution time

### Support

For technical support or questions about the complaints system, please refer to the system documentation or contact the development team.

## Future Enhancements

- **Email Notifications**: Automatic status update notifications
- **Escalation Workflows**: Automatic escalation for urgent complaints
- **Analytics Dashboard**: Complaint trends and patterns
- **Mobile App Support**: Mobile-optimized complaint submission
- **Integration**: Connect with HR and legal systems
