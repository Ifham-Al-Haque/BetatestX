# Fleet Maintenance Record Section - Database Tables

## Overview
The Fleet Maintenance Record section fetches **real data** from your Supabase database. If you're seeing sample data, it exists in your database tables.

## Database Tables Used

### 1. **`fleet_maintenance`** (Main Table)
   - **Purpose**: Stores all maintenance records
   - **Key Columns**:
     - `id` - Unique identifier
     - `vehicle_id` - References `fleet_vehicles.id`
     - `maintenance_type` - Type of maintenance (Scheduled, Repair, Inspection, Emergency)
     - `description` - Description of the maintenance work
     - `service_date` - Date when service was performed
     - `service_provider` - Name of service provider
     - `cost` - Cost of maintenance
     - `mileage_at_service` - Vehicle mileage at time of service
     - `status` - Status (Completed, In Progress, Scheduled, Cancelled)
     - `created_by` - References `employees.id` (who created the record)
     - `next_service_date` - Next scheduled service date
     - `labor_hours` - Hours of labor
     - `parts_replaced` - Array of parts replaced
     - `technician_notes` - Additional notes
     - `invoice_number` - Invoice number

### 2. **`fleet_maintenance_tickets`** (Tickets Table)
   - **Purpose**: Stores maintenance tickets/requests
   - **Key Columns**:
     - `id` - Unique identifier
     - `ticket_number` - Auto-generated ticket number
     - `vehicle_id` - References `fleet_vehicles.id`
     - `title` - Ticket title
     - `description` - Detailed description
     - `maintenance_type` - Type of maintenance needed
     - `priority` - Priority level (Low, Medium, High, Urgent)
     - `status` - Status (Open, Assigned, In Progress, Completed, Cancelled, Closed)
     - `requested_by` - References `employees.id` (who requested)
     - `assigned_to` - References `employees.id` (assigned technician)
     - `estimated_cost` - Estimated cost
     - `actual_cost` - Actual cost after completion
     - `maintenance_record_id` - References `fleet_maintenance.id` (if converted to record)
     - `created_at` - When ticket was created
     - `completed_at` - When ticket was completed

### 3. **`fleet_vehicles`** (Vehicles Table)
   - **Purpose**: Stores fleet vehicle information
   - **Used For**: Joining vehicle details with maintenance records
   - **Key Columns**:
     - `id` - Unique identifier
     - `vehicle_number` - Vehicle number (e.g., FLEET-003)
     - `make` - Vehicle make (e.g., Mercedes)
     - `model` - Vehicle model (e.g., Sprinter)
     - `license_plate` - License plate number
     - `status` - Vehicle status

### 4. **`employees`** (Employees Table)
   - **Purpose**: Stores employee information
   - **Used For**: 
     - `created_by` - Who created the maintenance record
     - `requested_by` - Who requested the maintenance ticket
     - `assigned_to` - Who is assigned to work on the ticket
   - **Key Columns**:
     - `id` - Unique identifier (UUID)
     - `full_name` - Employee full name
     - `email` - Employee email

### 5. **`fleet_maintenance_ticket_stats`** (View - Optional)
   - **Purpose**: Aggregated statistics for tickets
   - **Note**: If this view doesn't exist, statistics are calculated manually from `fleet_maintenance_tickets` table

## How to Check for Sample Data

### Check Maintenance Records:
```sql
-- View all maintenance records
SELECT * FROM fleet_maintenance ORDER BY created_at DESC;

-- Count records
SELECT COUNT(*) FROM fleet_maintenance;

-- View records with vehicle details
SELECT 
  fm.*,
  fv.vehicle_number,
  fv.make,
  fv.model
FROM fleet_maintenance fm
LEFT JOIN fleet_vehicles fv ON fm.vehicle_id = fv.id
ORDER BY fm.service_date DESC;
```

### Check Maintenance Tickets:
```sql
-- View all tickets
SELECT * FROM fleet_maintenance_tickets ORDER BY created_at DESC;

-- Count tickets
SELECT COUNT(*) FROM fleet_maintenance_tickets;
```

## How to Remove Sample Data

### Option 1: Delete All Sample Records (Use with caution!)
```sql
-- Delete all maintenance records
DELETE FROM fleet_maintenance;

-- Delete all maintenance tickets
DELETE FROM fleet_maintenance_tickets;
```

### Option 2: Delete Specific Sample Records
```sql
-- Delete records with specific descriptions (adjust as needed)
DELETE FROM fleet_maintenance 
WHERE description IN ('Brake system repair', 'Engine overheating repair');

-- Or delete by date range if you know when sample data was created
DELETE FROM fleet_maintenance 
WHERE created_at < '2024-01-01'; -- Adjust date as needed
```

### Option 3: Keep Data but Verify It's Real
If the data shown is actually real data you want to keep, no action needed. The system will only show what's in your database.

## Code Flow

1. **Loading Records**: 
   - `FleetMaintenanceRecord.jsx` → calls `fleetService.getMaintenanceRecords()`
   - `fleetService.js` → queries `fleet_maintenance` table
   - Joins with `fleet_vehicles` and `employees` tables

2. **Loading Tickets**:
   - `FleetMaintenanceRecord.jsx` → calls `fleetService.getMaintenanceTickets()`
   - `fleetService.js` → queries `fleet_maintenance_tickets` table
   - Joins with `fleet_vehicles` and `employees` tables

3. **Creating Records**:
   - User fills form → `MaintenanceRecordModal.jsx`
   - Saves to → `fleet_maintenance` table via `fleetService.createMaintenanceRecord()`

4. **Auto-Creation from Tickets**:
   - When ticket status changes to "Completed" → automatically creates record in `fleet_maintenance` table

## Verification

The code is correctly configured to:
- ✅ Fetch only real data from database (no hardcoded sample data)
- ✅ Show empty state when no records exist
- ✅ Return empty arrays when database is empty
- ✅ Handle errors gracefully

If you're seeing sample data, it exists in your `fleet_maintenance` or `fleet_maintenance_tickets` tables in your Supabase database.

