# IT Request Deletion Architecture

## Database Architecture

### Tables Structure:
- **`employees` table**: Stores employee records with roles (primary source of roles)
- **`users` table**: Stores Uhub application accounts linked to employees via `employee_id`
- **`it_requests` table**: Stores IT requests with `requester_id` pointing to employee IDs

### Relationship Flow:
```
Supabase Auth User (auth.uid())
    ↓
users table (auth_user_id = auth.uid())
    ↓
employees table (id = users.employee_id)
    ↓
Role stored in employees.role
```

## RLS Policies

### Policy 1: Users can delete their own open requests
```sql
CREATE POLICY "Users can delete own open requests" ON it_requests
    FOR DELETE USING (
        auth.uid() = requester_id 
        AND status IN ('open', 'pending_user')
    );
```

### Policy 2: IT roles and admins can delete any request
```sql
CREATE POLICY "IT roles and admins can delete any request" ON it_requests
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN employees e ON u.employee_id = e.id
            WHERE u.auth_user_id = auth.uid() 
            AND e.role IN ('admin', 'it_manager', 'it_support', 'tech_support')
        )
    );
```

### Policy 3: Direct employee check (fallback)
```sql
CREATE POLICY "Employees with IT roles can delete requests" ON it_requests
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE employees.id = auth.uid() 
            AND employees.role IN ('admin', 'it_manager', 'it_support', 'tech_support')
        )
    );
```

## Permission Check Function

The `can_delete_it_request(request_id UUID)` function checks permissions in this order:

1. **Is user the requester?** → Check role via `users` → `employees` relationship
2. **Is user admin/tech?** → Check role via `users` → `employees` relationship  
3. **Fallback** → Direct check in `employees` table

## Delete Function

The `delete_it_request(request_id UUID)` function:
1. Checks if request exists
2. Validates permissions using the same logic as above
3. Deletes the request if authorized
4. Returns boolean indicating success

## API Service

The `itServicesApi.requests.delete(id)` function:
1. Tries custom delete function first (bypasses RLS)
2. Falls back to standard Supabase delete if custom function fails
3. Provides detailed error logging

## Key Points

- **Roles are stored in `employees` table**
- **`users` table links Supabase auth to employee records**
- **RLS policies check both direct employee access and user→employee relationship**
- **Custom functions bypass RLS with proper permission validation**
- **Fallback mechanisms ensure compatibility with different setups**

## Troubleshooting

Use `debug_deletion_issue.js` to check:
- User authentication status
- User record in `users` table
- Linked employee record
- Direct employee record (fallback)
- RLS policy effectiveness
- Delete operation results
