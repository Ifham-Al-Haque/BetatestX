# Customer Service Manager Role Implementation

## Overview
This document describes the implementation of a new role called "Customer Service Manager" that provides access to Customer Service Performance Analysis (CSPA) and related functionality.

## New Role Details

### Role Name
- **Value**: `customer_service_manager`
- **Display Name**: "Customer Service Manager"
- **Color Theme**: Purple (to distinguish from other roles)

### Permissions
The Customer Service Manager role includes the following permissions:
- `view_dashboard` - Access to main dashboard
- `view_cspa` - Access to CSPA system
- `manage_customer_service` - Customer service management capabilities
- `view_reports` - Ability to view reports
- `data_import` - Data import functionality

## Implementation Changes

### 1. Configuration Updates (`src/config/index.js`)
- Added new role definition in the `roles` configuration
- Positioned between admin and manager roles in the hierarchy

### 2. Role-Based Access Control (`src/components/RoleBasedSection.jsx`)
- Added new convenience component: `CustomerServiceManagerAndAbove`
- Allows access to users with `customer_service_manager` role and above (admin)
- Usage: `<CustomerServiceManagerAndAbove>...</CustomerServiceManagerAndAbove>`

### 3. Role Management (`src/components/RoleManager.jsx`)
- Added Customer Service Manager to the available roles list
- Includes description, color coding, and permissions list
- Purple theme to distinguish from other roles

### 4. Navigation Updates (`src/components/Sidebar.jsx`)
- Created dedicated "Customer Service" navigation section
- Shows CSPA and Call Center Demo links for Customer Service Managers and Admins
- Purple color scheme to match the role theme
- Moved CSPA and Call Center Demo from main navigation to Customer Service section

### 5. Page Protection (`src/pages/CSPA.jsx` & `src/pages/CallCenterDemo.jsx`)
- Wrapped both pages with `CustomerServiceManagerAndAbove` component
- Added access denied fallback pages for unauthorized users
- Maintains existing functionality while adding role-based access control

### 6. Access Management (`src/pages/AccessManagement.jsx`)
- Added Customer Service Manager role to invitation system
- Admins can now invite users with this role
- Role appears in the role selection dropdown

### 7. Testing Component (`src/components/RoleTest.jsx`)
- Created comprehensive role testing page
- Demonstrates all role-based access control components
- Shows current user role and permissions
- Accessible at `/role-test` route

## Role Hierarchy

```
Admin (Full access)
├── Customer Service Manager (CSPA + Customer Service access)
├── Manager (Department management)
└── Employee (Basic access)
```

## Usage Examples

### Protecting a Component
```jsx
import { CustomerServiceManagerAndAbove } from '../components/RoleBasedSection';

<CustomerServiceManagerAndAbove
  fallback={<AccessDeniedMessage />}
>
  <CSPAComponent />
</CustomerServiceManagerAndAbove>
```

### Checking Role in Code
```jsx
import { useAuth } from '../context/AuthContext';

const { userProfile } = useAuth();
const canAccessCSPA = userProfile?.role === 'admin' || 
                     userProfile?.role === 'customer_service_manager';
```

### Adding to Navigation
```jsx
{(userProfile?.role === 'admin' || userProfile?.role === 'customer_service_manager') && (
  <CustomerServiceSection />
)}
```

## Access Control Matrix

| Feature | Admin | Customer Service Manager | Manager | Employee |
|---------|-------|-------------------------|---------|----------|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| CSPA | ✅ | ✅ | ❌ | ❌ |
| Call Center Demo | ✅ | ✅ | ❌ | ❌ |
| User Management | ✅ | ❌ | ❌ | ❌ |
| Employee Management | ✅ | ❌ | ✅ | ❌ |
| Reports | ✅ | ✅ | ✅ | ❌ |

## Testing

### Test Route
- Navigate to `/role-test` to see the role testing page
- Shows different sections based on your current role
- Demonstrates all role-based access control components

### Testing Different Roles
1. **Admin**: Should see all sections
2. **Customer Service Manager**: Should see Customer Service, Manager, and Employee sections
3. **Manager**: Should see Manager and Employee sections only
4. **Employee**: Should see Employee section only

## Security Considerations

- Role-based access control is implemented at the component level
- Routes are protected with `ProtectedRoute` (authentication)
- Individual components use `CustomerServiceManagerAndAbove` (authorization)
- Access denied pages provide clear feedback to users
- Role information is stored in user profile, not client-side

## Future Enhancements

1. **Database Integration**: Add role-based database queries
2. **API Protection**: Implement role-based API endpoint protection
3. **Audit Logging**: Track role-based access attempts
4. **Dynamic Permissions**: Allow admins to customize role permissions
5. **Role Inheritance**: Implement more complex role hierarchies

## Troubleshooting

### Common Issues

1. **Role Not Showing**: Ensure user profile has been updated with new role
2. **Access Denied**: Check if user has correct role assigned
3. **Navigation Missing**: Verify role is properly set in user profile
4. **Permission Errors**: Check role configuration in config file

### Debug Steps

1. Check browser console for role information
2. Verify user profile role in database
3. Test with different user accounts
4. Use RoleTest component to verify access control

## Conclusion

The Customer Service Manager role has been successfully implemented with:
- Comprehensive role-based access control
- Dedicated navigation section
- Protected CSPA and Call Center functionality
- Easy-to-use convenience components
- Comprehensive testing and documentation

This implementation provides a secure and scalable foundation for role-based access control in the system.
