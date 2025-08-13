# Driver Management System Setup Guide

This guide will help you set up and use the new Driver Management System in your Uhub application.

## Overview

The Driver Management System provides comprehensive management of driver records with the following features:

- **Driver Records Management**: Create, view, edit, and delete driver records
- **Document Upload System**: Upload and manage driver documents (Emirates ID, Driving License, Passport)
- **Team Management**: Organize drivers into teams with shift management
- **Search and Filtering**: Advanced search and sorting capabilities
- **Responsive Design**: Modern UI with dark mode support

## Database Setup

### 1. Run the Database Migration

Execute the SQL script to create the necessary tables:

```sql
-- Run this in your Supabase SQL editor
\i create_drivers_table.sql
```

This will create:
- `drivers` table - Main driver information
- `driver_documents` table - Document storage
- Indexes for performance
- Row Level Security (RLS) policies
- Sample data for testing

### 2. Storage Buckets Setup

Create the following storage buckets in Supabase:

```bash
# Driver profile pictures
supabase storage create driver-images

# Driver documents
supabase storage create driver-documents
```

Set bucket policies to allow authenticated users to upload:

```sql
-- Allow authenticated users to upload to driver-images
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES (
  'Allow authenticated uploads to driver-images',
  'driver-images',
  '{"name": "Allow authenticated uploads", "definition": {"role": "authenticated", "policy": "INSERT"}}'
);

-- Allow authenticated users to upload to driver-documents
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES (
  'Allow authenticated uploads to driver-documents',
  'driver-documents',
  '{"name": "Allow authenticated uploads", "definition": {"role": "authenticated", "policy": "INSERT"}}'
);
```

## Features

### Driver Information Fields

Each driver record includes:

- **Basic Information**: Full Name, Employee ID, Designation, Nationality
- **Contact Details**: Company Mobile, Personal Mobile
- **Identification**: Emirates ID Number, Driving License Number
- **Company Details**: Udrive Customer Account ID, Service Car Plate
- **Team Information**: Team Type, Team Name, Team Members
- **Work Details**: Shift Type (Day/Night), Status
- **Media**: Profile Picture

### Document Management

The system supports uploading and managing:

- **Emirates ID**: Front and Back sides
- **Driving License**: Front and Back sides
- **Passport**: Copy and Passport Number

### Team Management

- Organize drivers into teams (e.g., Delivery, Transport)
- Assign team names and members
- Manage shift types (Day/Night)
- Track team assignments

## Usage

### 1. Accessing Driver Management

Navigate to `/driver` in your application to access the main driver listing page.

### 2. Creating a New Driver

1. Click "Add Driver" button
2. Fill in the required fields (marked with *)
3. Upload profile picture (optional)
4. Upload required documents
5. Click "Create Driver"

### 3. Editing Driver Information

1. Click the edit (pencil) icon on any driver record
2. Modify the required fields
3. Update documents if needed
4. Click "Update Driver"

### 4. Viewing Driver Profile

1. Click the view (arrow) icon on any driver record
2. View comprehensive driver information
3. Access uploaded documents
4. Edit driver information

### 5. Deleting Drivers

1. Click the delete (trash) icon on any driver record
2. Confirm deletion in the popup
3. Driver and associated documents will be removed

## API Endpoints

The system provides the following API endpoints:

### Drivers
- `GET /api/drivers` - List all drivers with pagination
- `GET /api/drivers/:id` - Get specific driver
- `POST /api/drivers` - Create new driver
- `PUT /api/drivers/:id` - Update driver
- `DELETE /api/drivers/:id` - Delete driver

### Driver Documents
- `GET /api/driver-documents/:driverId` - Get driver documents
- `POST /api/driver-documents` - Upload documents
- `PUT /api/driver-documents/:id` - Update documents

## File Structure

```
frontend/src/pages/
├── Driver.jsx              # Main driver listing page
├── DriverForm.jsx          # Create/edit driver form
└── DriverProfile.jsx       # Driver profile view page

frontend/src/hooks/
└── useApi.js               # Driver API hooks

frontend/src/services/
└── api.js                  # Driver API service methods

SQL Files/
└── create_drivers_table.sql # Database setup script
```

## Security Features

### Row Level Security (RLS)
- **View Access**: Admins, managers, HR, and the driver themselves
- **Create/Update**: Admins and managers only
- **Delete**: Admins only

### File Upload Security
- File type validation (images and PDFs)
- Secure storage in Supabase Storage
- Access control through RLS policies

## Customization

### Adding New Fields

To add new fields to driver records:

1. **Database**: Add columns to the `drivers` table
2. **API**: Update the API service methods
3. **Frontend**: Add form fields and display elements
4. **Validation**: Update form validation rules

### Modifying Document Types

To add new document types:

1. **Database**: Add columns to `driver_documents` table
2. **Frontend**: Add upload fields and display elements
3. **Storage**: Update storage bucket policies if needed

## Troubleshooting

### Common Issues

1. **Upload Failures**
   - Check storage bucket permissions
   - Verify file size limits
   - Ensure file type is supported

2. **Permission Errors**
   - Verify user role assignments
   - Check RLS policies
   - Ensure proper authentication

3. **Data Not Loading**
   - Check database connection
   - Verify table existence
   - Check RLS policy configuration

### Debug Mode

Enable debug logging in the browser console to troubleshoot issues:

```javascript
// In browser console
localStorage.setItem('debug', 'true');
```

## Performance Considerations

### Database Optimization
- Indexes on frequently searched fields
- Pagination for large datasets
- Efficient query patterns

### File Storage
- Image compression for profile pictures
- PDF optimization for documents
- Regular cleanup of unused files

## Support

For technical support or questions about the Driver Management System:

1. Check the application logs
2. Review database RLS policies
3. Verify storage bucket configurations
4. Contact the development team

## Future Enhancements

Potential improvements for future versions:

- **Bulk Operations**: Import/export driver data
- **Advanced Reporting**: Driver performance analytics
- **Integration**: Connect with external HR systems
- **Mobile App**: Native mobile application
- **Notifications**: Document expiry alerts
- **Audit Trail**: Track all changes and access
