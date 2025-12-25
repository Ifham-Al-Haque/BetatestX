# IOT Management Role Setup Guide

## Overview
This guide explains the IOT Management role that has been added to the system with specific access permissions.

## Role Details

**Role Name:** `iot_management`  
**Display Name:** IOT Management  
**Level:** 3  
**Color:** Cyan

## Access Permissions

### 1. Home Panel
- ✅ **Home** - Access to home page
- ✅ **Calendar View** - Access to calendar view
- ✅ **Organizational Hierarchy** - Access to organizational hierarchy

### 2. Slice of Life Panel (All Sections)
- ✅ **Events** - Access to events
- ✅ **Memories** - Access to memories
- ✅ **Collections** - Access to collections

### 3. User Profile Panel (All)
- ✅ **User Profile** - Full access to user profile
- ✅ **Settings** - Access to user settings

### 4. HR Panel
- ✅ **Complaints** - Access to complaints
- ✅ **Complaints Inbox** - Access to complaints inbox
- ✅ **Suggestions** - Access to suggestions

### 5. IT Services Panel
- ✅ **IT Requests** - Access to IT requests

### 6. To Do List Panel (All Sections)
- ✅ **Todo List** - Access to todo list
- ✅ **Task Management** - Access to task management
- ✅ **My Tasks** - Access to my tasks

### 7. IOT Panel (All)
- ✅ **IOT Record** - Full access to IOT record management

## Files Updated

### 1. Configuration (`src/config/index.js`)
- Added `iot_management` role with permissions array

### 2. Role-Based Route (`src/components/RoleBasedRoute.jsx`)
- Added `iot_management` to `ROLE_PERMISSIONS`
- Added `iot_management` to `FEATURE_ACCESS` for all relevant features
- Added `iot_management` to `getRoleNavigationAccess` function
- Added `isIOTManagement` helper to `useRoleAccess` hook

### 3. Role Manager (`src/components/RoleManager.jsx`)
- Added `iot_management` role option to the role selection list

### 4. Sidebar (`src/components/Sidebar.jsx`)
- Collections added to Slice of Life panel items
- IOT panel already configured and accessible

## Database Setup

To assign this role to users, update the `users` table in Supabase:

```sql
-- Example: Assign IOT Management role to a user
UPDATE users 
SET role = 'iot_management' 
WHERE email = 'user@example.com';
```

## Usage

1. **Assign Role**: Use the Role Manager component or update the database directly
2. **Access IOT Panel**: Users with this role will see the IOT panel in the sidebar
3. **Full IOT Access**: Users can create, read, update, and delete IOT records
4. **Limited HR Access**: Only complaints and suggestions (no employee management)
5. **IT Access**: Can submit IT requests but cannot manage IT assets

## Role Comparison

| Feature | IOT Management | IT Management | Data Operator |
|---------|---------------|---------------|---------------|
| IOT Panel | ✅ Full | ✅ Full | ✅ Full |
| IT Requests | ✅ Submit | ✅ Full | ✅ Submit |
| IT Assets | ❌ | ✅ | ❌ |
| HR Complaints | ✅ | ✅ | ✅ |
| HR Employees | ❌ | ❌ | ❌ |
| Slice of Life | ✅ All | ✅ All | ✅ All |
| Collections | ✅ | ❌ | ❌ |

## Notes

- This role is specifically designed for IOT device management
- Has access to organizational hierarchy for better context
- Can manage complaints and suggestions but not full HR operations
- Full access to IOT record management including import/export

