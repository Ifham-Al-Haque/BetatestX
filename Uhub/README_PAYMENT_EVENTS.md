# Payment Events System Setup

## 🚀 Quick Setup Guide

### 1. Database Setup

Run the following SQL script in your Supabase SQL Editor:

```sql
-- Copy and paste the contents of setup_payment_events.sql
-- This will create the payment_events table and sample data
```

### 2. Features Implemented

✅ **Complete CRUD Operations:**
- ✅ Add new payment events
- ✅ Edit existing payment events  
- ✅ Delete payment events
- ✅ View all payment events

✅ **Enhanced Payment Calendar:**
- ✅ Color-coded events by priority and status
- ✅ Interactive calendar view
- ✅ Event details on hover/click

✅ **Upcoming Payment Events:**
- ✅ Real-time data from database
- ✅ Filter by status (All, Urgent, Upcoming, Overdue)
- ✅ Priority-based color coding
- ✅ Due date calculations
- ✅ Summary statistics

### 3. Database Tables Created

#### `payment_events` Table
- `id` - Unique identifier
- `title` - Payment event title
- `description` - Event description
- `amount` - Payment amount (decimal)
- `due_date` - Due date
- `status` - pending, paid, overdue, cancelled
- `category` - Software License, Communication, etc.
- `priority` - low, medium, high, urgent
- `service_provider` - Vendor name
- `invoice_number` - Invoice reference
- `payment_method` - Payment method
- `notes` - Additional notes
- `created_by` - User who created the event
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp
- `paid_at` - Payment completion timestamp
- `reminder_sent` - Reminder status

#### `payments` Table (for historical payments)
- `id` - Unique identifier
- `payment_event_id` - Reference to payment event
- `amount` - Payment amount
- `payment_date` - Date of payment
- `payment_method` - Method used
- `transaction_id` - Transaction reference
- `status` - Payment status
- `notes` - Payment notes
- `created_at` - Creation timestamp

### 4. How to Use

#### Adding a New Payment Event:
1. Click "Add New Payment Event" button
2. Fill in the required fields (Title, Amount, Due Date)
3. Select priority and category
4. Add optional details (service provider, invoice number, etc.)
5. Click "Create Event"

#### Editing a Payment Event:
1. Click the edit icon (pencil) next to any event
2. Modify the fields as needed
3. Click "Update Event"

#### Deleting a Payment Event:
1. Click the delete icon (trash) next to any event
2. Confirm the deletion

#### Filtering Events:
- Use the filter buttons to view specific event types
- All Events - Shows all payment events
- Urgent - Shows high priority events
- Upcoming - Shows pending events
- Overdue - Shows overdue events

### 5. Calendar Features

The payment calendar shows:
- **Color-coded events** based on priority and status
- **Event details** including amount and service provider
- **Interactive calendar** with month/week/day views
- **Legend** explaining the color coding

### 6. Status Management

Events automatically update their status:
- **Pending** - Default status for new events
- **Overdue** - Automatically set when due date passes
- **Paid** - Manually set when payment is completed
- **Cancelled** - For cancelled payments

### 7. Priority Levels

- **Low** - Green color, non-urgent payments
- **Medium** - Blue color, standard priority
- **High** - Amber color, important payments
- **Urgent** - Red color, critical payments

### 8. Categories Available

- Software License
- Communication
- Infrastructure
- Marketing
- HR
- Finance
- Other

### 9. Troubleshooting

If you encounter the 406/400 errors:
1. Make sure the `payment_events` table exists in your database
2. Run the setup script in Supabase SQL Editor
3. Check that your Supabase connection is working
4. Verify that RLS (Row Level Security) is disabled for the tables

### 10. Next Steps

After setup, you can:
- Add real payment events
- Customize categories and priorities
- Set up email reminders (future feature)
- Add payment tracking functionality
- Integrate with accounting systems

---

**Note:** The system is now fully functional with real database integration. All CRUD operations work with the Supabase backend. 