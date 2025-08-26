# Fleet Management System Setup Guide

This guide will help you set up the complete fleet management system for your Uhub application.

## 🚗 What's Included

The fleet management system provides:
- **Vehicle Management**: Add, edit, view, and delete fleet vehicles
- **Live Data**: Real-time data from your Supabase database
- **Comprehensive Tracking**: Maintenance records, fuel logs, incidents, and driver assignments
- **Advanced Features**: Search, filtering, statistics, and reporting
- **Role-Based Access**: Different permissions for managers and regular users

## 📋 Prerequisites

1. **Supabase Database**: Your existing Uhub database must be running
2. **React Application**: The frontend must be properly configured
3. **Authentication**: User authentication system must be working

## 🗄️ Database Setup

### Step 1: Run the Database Schema

Execute the SQL file `create_fleet_management_schema.sql` in your Supabase SQL editor:

```sql
-- Copy and paste the entire content of create_fleet_management_schema.sql
-- This will create all necessary tables, views, and functions
```

### Step 2: Verify Tables Created

After running the schema, you should see these new tables in your Supabase dashboard:

- `fleet_vehicles` - Main vehicle information
- `fleet_maintenance` - Maintenance records
- `fleet_fuel_logs` - Fuel consumption tracking
- `fleet_drivers` - Driver assignments
- `fleet_incidents` - Accident and incident reports
- `fleet_overview` - View for comprehensive vehicle data
- `get_fleet_statistics()` - Function for fleet statistics

### Step 3: Check Sample Data

The schema includes sample data for testing:
- 5 sample vehicles with different statuses
- Sample maintenance records
- Sample fuel logs

## 🔧 Frontend Setup

### Step 1: Verify File Structure

Ensure these files are in place:

```
src/
├── services/
│   └── fleetService.js          # API service for fleet operations
├── components/
│   └── fleet/
│       ├── VehicleModal.jsx      # Add/Edit vehicle modal
│       └── VehicleDetailsModal.jsx # View vehicle details modal
└── pages/
    └── FleetManagement.jsx       # Main fleet management page
```

### Step 2: Check Dependencies

Ensure these packages are installed:

```bash
npm install lucide-react
```

### Step 3: Verify Supabase Client

Ensure your `src/supabaseClient.js` is properly configured with your Supabase credentials.

## 🚀 Testing the System

### Step 1: Access Fleet Management

Navigate to `http://localhost:3000/fleet` in your browser.

### Step 2: Test Basic Operations

1. **View Vehicles**: You should see the sample vehicles loaded from the database
2. **Add Vehicle**: Click "Add Vehicle" and fill out the form
3. **Edit Vehicle**: Click the edit icon on any vehicle
4. **View Details**: Click the view icon to see comprehensive vehicle information
5. **Delete Vehicle**: Click the delete icon (with confirmation)

### Step 3: Test Search and Filters

1. **Search**: Use the search bar to find vehicles by number, license plate, make, or model
2. **Status Filter**: Filter by vehicle status (Active, Maintenance, Out of Service, Retired)
3. **Department Filter**: Filter by assigned department
4. **Make Filter**: Filter by vehicle make

## 📊 Understanding the Data

### Vehicle Information
- **Basic Details**: Make, model, year, license plate, VIN, color
- **Technical Specs**: Fuel type, transmission, engine size, mileage
- **Assignments**: Department and driver assignments
- **Financial**: Purchase price, fuel efficiency
- **Important Dates**: Insurance expiry, registration expiry, service dates

### Maintenance Records
- **Types**: Scheduled, Repair, Emergency, Inspection
- **Details**: Service provider, cost, mileage, technician notes
- **Status**: Scheduled, In Progress, Completed, Cancelled

### Fuel Logs
- **Tracking**: Quantity, cost per liter, total cost, mileage
- **Location**: Fuel station information
- **Efficiency**: Calculated fuel efficiency per fill-up

### Incidents
- **Types**: Accident, Breakdown, Theft, Vandalism, Other
- **Severity**: Minor, Moderate, Major, Critical
- **Cost Tracking**: Estimated vs. actual costs

## 🔐 Role-Based Access Control

### User Permissions

- **Regular Users**: Can view vehicles, maintenance, fuel logs, and incidents
- **Managers/Admins**: Can add, edit, and delete vehicles and records
- **Fleet Managers**: Full access to all fleet operations

### RLS Policies

The system includes Row Level Security (RLS) policies that:
- Allow all authenticated users to view fleet data
- Restrict modifications to managers and admins
- Ensure data security and proper access control

## 🛠️ Troubleshooting

### Common Issues

1. **"No vehicles found" message**
   - Check if the database schema was executed successfully
   - Verify sample data was inserted
   - Check browser console for API errors

2. **"Failed to save vehicle" error**
   - Verify user has manager/admin role
   - Check RLS policies are properly configured
   - Ensure all required fields are filled

3. **Statistics not loading**
   - Check if `get_fleet_statistics()` function exists
   - Verify function permissions are granted
   - Check browser console for errors

4. **Modal not opening**
   - Check if all component files are properly imported
   - Verify no JavaScript errors in console
   - Ensure all dependencies are installed

### Debug Steps

1. **Check Browser Console**: Look for JavaScript errors
2. **Verify Database**: Check Supabase dashboard for table creation
3. **Test API Calls**: Use browser dev tools to monitor network requests
4. **Check Permissions**: Verify user role and RLS policies

## 📈 Customization

### Adding New Fields

To add new vehicle fields:

1. **Database**: Add columns to `fleet_vehicles` table
2. **Service**: Update `fleetService.js` methods
3. **Modal**: Add form fields to `VehicleModal.jsx`
4. **Details**: Display new fields in `VehicleDetailsModal.jsx`
5. **Table**: Show new data in `FleetManagement.jsx`

### Modifying Status Options

To change vehicle statuses:

1. **Database**: Update the CHECK constraint in `fleet_vehicles` table
2. **Frontend**: Update status arrays in components
3. **Service**: Ensure API handles new statuses

### Adding New Features

The modular architecture makes it easy to add:
- New record types (e.g., inspections, repairs)
- Additional reporting features
- Integration with other systems
- Custom workflows and approvals

## 🔄 Maintenance

### Regular Tasks

1. **Database Backups**: Ensure regular backups of fleet data
2. **Performance Monitoring**: Monitor query performance for large fleets
3. **User Training**: Train users on proper data entry procedures
4. **Data Validation**: Regular checks for data integrity

### Updates

1. **Schema Updates**: Test schema changes in development first
2. **Frontend Updates**: Ensure compatibility with new database changes
3. **User Communication**: Inform users of new features or changes

## 📞 Support

If you encounter issues:

1. **Check this guide** for common solutions
2. **Review browser console** for error messages
3. **Verify database setup** in Supabase dashboard
4. **Test with sample data** to isolate issues

## 🎯 Next Steps

After successful setup, consider:

1. **Data Migration**: Import existing fleet data from other systems
2. **User Training**: Train fleet managers and drivers on the system
3. **Integration**: Connect with fuel card systems, maintenance providers
4. **Reporting**: Create custom reports for management
5. **Mobile App**: Develop mobile interface for field operations

---

**Congratulations!** 🎉 Your fleet management system is now ready to track and manage your vehicle fleet efficiently.
