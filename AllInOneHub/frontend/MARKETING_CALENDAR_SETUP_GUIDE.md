# 📅 Marketing Calendar System - Complete Setup Guide

## 🎯 Overview

The Marketing Calendar system provides a comprehensive solution for marketing teams to plan, collaborate, and manage marketing activities. It includes:

- **Shared Calendar View** - All marketing team members can see and manage events
- **Event Management** - Create, update, delete marketing events with categories
- **Comment System** - Team collaboration through event comments
- **Role-based Access** - Different permissions for managers vs specialists
- **Event Categories** - Organize events by type (campaigns, social media, etc.)

## 🚀 Quick Setup

### Step 1: Database Setup

Run these SQL scripts in your Supabase SQL editor in order:

1. **Create Marketing Calendar Schema:**
```bash
# Run this first
create_marketing_calendar_schema.sql
```

2. **Setup Marketing Roles:**
```bash
# Run this second
create_marketing_role_setup.sql
```

### Step 2: Frontend Integration

The frontend components have been automatically integrated:

✅ **Role-based Access Control** - Updated `RoleBasedRoute.jsx`
✅ **Navigation Menu** - Updated `Sidebar.jsx` 
✅ **Routing** - Updated `App.js`
✅ **Calendar Component** - Created `MarketingCalendar.jsx`

### Step 3: Create Marketing Users

To test the system, create marketing role users:

```sql
-- Create a marketing manager
INSERT INTO user_profiles (id, user_id, full_name, email, role, department)
VALUES (
    gen_random_uuid(),
    'your-user-id-here',
    'Marketing Manager',
    'marketing.manager@company.com',
    'marketing_manager',
    'Marketing'
);

-- Create a marketing specialist
INSERT INTO user_profiles (id, user_id, full_name, email, role, department)
VALUES (
    gen_random_uuid(),
    'your-user-id-here',
    'Marketing Specialist',
    'marketing.specialist@company.com',
    'marketing_specialist',
    'Marketing'
);
```

## 🎨 Features Overview

### 📊 Marketing Calendar Interface

- **Monthly Calendar View** - Visual calendar with event indicators
- **Event Categories** - Color-coded categories for different marketing activities
- **Priority Levels** - Visual priority indicators (urgent, high, medium, low)
- **Search & Filter** - Find events by title, description, or category
- **Responsive Design** - Works on desktop and mobile devices

### 🎯 Event Management

- **Create Events** - Add new marketing activities with full details
- **Edit Events** - Update event information, timing, and status
- **Delete Events** - Remove events (manager permissions required)
- **Event Categories** - Pre-defined categories for organization
- **Status Tracking** - Track event progress (scheduled, in progress, completed, etc.)

### 💬 Collaboration Features

- **Event Comments** - Team members can comment on events
- **Real-time Updates** - Comments appear instantly for all team members
- **User Attribution** - See who created events and comments
- **Comment History** - Track all discussions on events

### 🔐 Role-based Access

#### **Marketing Manager** (`marketing_manager`)
- ✅ Full access to marketing calendar
- ✅ Create, edit, and delete events
- ✅ Manage event categories
- ✅ View marketing dashboard and analytics
- ✅ Full comment access

#### **Marketing Specialist** (`marketing_specialist`)
- ✅ View marketing calendar
- ✅ Create and edit events
- ✅ Add comments to events
- ❌ Cannot delete events
- ❌ Cannot manage categories

#### **Admin** (`admin`)
- ✅ Full access to all marketing features
- ✅ Can manage all events and categories
- ✅ Can access marketing analytics

## 📋 Default Event Categories

The system comes with pre-configured categories:

1. **Campaign Launch** - New marketing campaigns and product launches
2. **Social Media** - Social media posts, campaigns, and content creation
3. **Email Marketing** - Email campaigns and newsletters
4. **Content Creation** - Blog posts, articles, videos, and other content
5. **SEO & Analytics** - SEO optimization and analytics reviews
6. **Events & Webinars** - Live events, webinars, and conferences
7. **Partnerships** - Partnership announcements and collaborations
8. **PR & Media** - Press releases and media outreach
9. **Research & Planning** - Market research and strategy planning
10. **Other** - Other marketing activities

## 🗄️ Database Schema

### Core Tables

#### `marketing_event_categories`
- Stores event categories with colors and icons
- Used for organizing and filtering events

#### `marketing_calendar_events`
- Main events table with all event details
- Links to categories, creators, and participants

#### `marketing_event_comments`
- Comments system for event collaboration
- Links to events and comment authors

#### `marketing_event_attachments`
- File attachments for events (future feature)
- Supports documents, images, etc.

#### `marketing_event_participants`
- Event participant management (future feature)
- Track who's involved in events

### Helper Tables

#### `marketing_notifications`
- Notification system for event updates
- Alerts for new events, comments, reminders

## 🔧 API Functions

### Database Functions

#### `get_marketing_events_for_date_range(start_date, end_date)`
- Retrieves events for a specific date range
- Includes category information and comment counts

#### `get_marketing_event_with_comments(event_id)`
- Gets event details with all comments
- Used for event detail views

#### `is_marketing_user(user_id)`
- Checks if user has marketing role access
- Used for permission validation

#### `get_marketing_team()`
- Returns all marketing team members
- Shows online status and role information

#### `can_manage_marketing_events(user_id)`
- Checks if user can manage (create/edit/delete) events
- Marketing managers and admins only

#### `get_marketing_dashboard_stats()`
- Returns dashboard statistics
- Event counts, upcoming events, most active categories

## 🎨 UI Components

### MarketingCalendar.jsx Features

- **Calendar Grid** - Monthly view with event indicators
- **Event Modal** - Create/edit event form
- **Event Details** - View event with comments
- **Search & Filter** - Find events quickly
- **Responsive Design** - Mobile-friendly interface
- **Dark Mode Support** - Theme-aware styling

### Key UI Elements

- **Event Cards** - Color-coded by category and priority
- **Comment Threads** - Real-time collaboration
- **Navigation Controls** - Month navigation and filters
- **Modal Forms** - Clean event creation/editing
- **Status Indicators** - Visual event status representation

## 🔒 Security Features

### Row Level Security (RLS)

- **Marketing Team Only** - Only marketing roles can access calendar
- **Role-based Permissions** - Different access levels for managers vs specialists
- **User Isolation** - Users can only modify their own comments
- **Admin Override** - Admins have full access to all features

### Data Validation

- **Required Fields** - Event title and date are mandatory
- **Date Validation** - Prevents invalid date entries
- **Category Validation** - Ensures valid category selection
- **Permission Checks** - Server-side validation for all operations

## 🚀 Getting Started

### For Marketing Managers

1. **Access the Calendar** - Navigate to Marketing → Marketing Calendar
2. **Create Categories** - Set up custom categories if needed
3. **Plan Events** - Create marketing events with details
4. **Collaborate** - Use comments to discuss events with team
5. **Track Progress** - Update event status as work progresses

### For Marketing Specialists

1. **View Calendar** - See all marketing events and activities
2. **Create Events** - Add new marketing activities
3. **Comment on Events** - Provide feedback and updates
4. **Update Events** - Modify event details as needed

### For Admins

1. **Full Access** - Manage all marketing calendar features
2. **User Management** - Assign marketing roles to users
3. **System Configuration** - Modify categories and settings
4. **Analytics** - View marketing activity reports

## 📱 Mobile Experience

The Marketing Calendar is fully responsive and works great on mobile devices:

- **Touch-friendly** - Easy to tap and navigate
- **Optimized Layout** - Calendar adapts to small screens
- **Quick Actions** - Fast event creation and editing
- **Offline Ready** - Basic functionality works offline

## 🔄 Future Enhancements

### Planned Features

1. **Event Recurrence** - Support for recurring events
2. **Event Reminders** - Email and in-app notifications
3. **File Attachments** - Attach documents to events
4. **Event Templates** - Pre-defined event templates
5. **Integration** - Connect with external calendar systems
6. **Analytics Dashboard** - Marketing activity insights
7. **Team Scheduling** - Availability and scheduling features

### Integration Opportunities

- **Email Marketing Tools** - Connect with Mailchimp, etc.
- **Social Media Platforms** - Link with social media scheduling
- **Project Management** - Integration with tools like Trello, Asana
- **CRM Systems** - Connect with customer relationship management

## 🐛 Troubleshooting

### Common Issues

#### "Access Denied" Error
- **Cause**: User doesn't have marketing role
- **Solution**: Assign `marketing_manager` or `marketing_specialist` role

#### Events Not Showing
- **Cause**: Date range or filter issues
- **Solution**: Check date range and clear filters

#### Comments Not Saving
- **Cause**: Permission or database issues
- **Solution**: Verify user has marketing role and database connection

#### Calendar Not Loading
- **Cause**: Database schema not created
- **Solution**: Run the SQL setup scripts

### Debug Steps

1. **Check User Role** - Verify user has marketing role in `user_profiles`
2. **Verify Database** - Ensure all tables are created
3. **Check Permissions** - Verify RLS policies are active
4. **Browser Console** - Look for JavaScript errors
5. **Network Tab** - Check for API call failures

## 📞 Support

For technical support or feature requests:

1. **Check Documentation** - Review this guide and code comments
2. **Database Logs** - Check Supabase logs for errors
3. **Browser DevTools** - Use browser console for frontend issues
4. **Test with Admin Role** - Verify system works with admin access

## 🎉 Success!

Your Marketing Calendar system is now ready! The marketing team can:

- ✅ Plan and organize marketing activities
- ✅ Collaborate through comments and discussions
- ✅ Track event progress and status
- ✅ Filter and search events efficiently
- ✅ Access role-appropriate features

The system provides a solid foundation for marketing team collaboration and can be extended with additional features as needed.
