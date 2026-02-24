# Employee Onboarding & Offboarding - Access Control Configuration

## 🔐 **Role-Based Access Control**

The Employee Onboarding and Offboarding sections are now restricted to **only 3 specific roles**:

### **✅ Authorized Roles:**
1. **`admin`** - Full system administrator
2. **`hr_manager`** - HR Manager with employee management access
3. **`it_management`** - IT Management role

### **❌ Restricted Roles:**
- `employee` - Standard employees
- `cs_manager` - Customer Service Manager
- `driver_management` - Driver Management
- `data_operator` - Data Operator
- `finance` - Finance role
- `manager` - General Manager (unless specifically granted)
- `operation_management` - Operation Management

## 🛡️ **Security Implementation**

### **Frontend Access Control:**
- **Navigation**: Only authorized roles see the onboarding/offboarding menu items
- **Routes**: Protected routes prevent unauthorized access
- **Components**: Role checks within components

### **Database Security (RLS Policies):**
- **Read Access**: All authenticated users can view records
- **Write Access**: Only `admin`, `hr_manager`, and `it_management` can create/modify
- **Delete Access**: Only `admin`, `hr_manager`, and `it_management` can delete

## 📋 **Features Available to Authorized Roles:**

### **Employee Onboarding:**
- ✅ Create new onboarding processes
- ✅ Manage onboarding templates
- ✅ Track progress and completion
- ✅ Assign stakeholders (HR contact, manager, buddy)
- ✅ Add comments and notes
- ✅ Upload documents
- ✅ View analytics and reports

### **Employee Offboarding:**
- ✅ Create new offboarding processes
- ✅ Track asset returns (laptops, phones, keys, etc.)
- ✅ Manage access revocation (email, systems, physical access)
- ✅ Conduct exit interviews
- ✅ Process final payroll and benefits
- ✅ Upload offboarding documents
- ✅ Generate completion reports

## 🔧 **Configuration Files Updated:**

### **Frontend Configuration:**
- `src/components/RoleBasedRoute.jsx` - Added feature access controls
- `src/components/Sidebar.jsx` - Updated navigation items
- `src/App.js` - Added protected routes

### **Database Configuration:**
- `quick_onboarding_offboarding_setup.sql` - Updated RLS policies
- All policies now restrict write access to: `['admin', 'hr_manager', 'it_management']`

## 🚀 **How to Apply Changes:**

### **Step 1: Update Database**
Run the updated `quick_onboarding_offboarding_setup.sql` in Supabase SQL Editor to apply the new RLS policies.

### **Step 2: Verify Access**
1. Login as different user roles
2. Check that only authorized roles can see onboarding/offboarding sections
3. Test that unauthorized roles cannot access the pages

### **Step 3: Test Functionality**
1. Create onboarding/offboarding records as authorized user
2. Verify database operations work correctly
3. Confirm unauthorized users cannot perform write operations

## 📊 **Access Matrix:**

| Role | View Onboarding | Create Onboarding | View Offboarding | Create Offboarding |
|------|----------------|-------------------|------------------|-------------------|
| admin | ✅ | ✅ | ✅ | ✅ |
| hr_manager | ✅ | ✅ | ✅ | ✅ |
| it_management | ✅ | ✅ | ✅ | ✅ |
| employee | ❌ | ❌ | ❌ | ❌ |
| cs_manager | ❌ | ❌ | ❌ | ❌ |
| driver_management | ❌ | ❌ | ❌ | ❌ |
| data_operator | ❌ | ❌ | ❌ | ❌ |
| finance | ❌ | ❌ | ❌ | ❌ |
| manager | ❌ | ❌ | ❌ | ❌ |
| operation_management | ❌ | ❌ | ❌ | ❌ |

## 🔒 **Security Benefits:**

1. **Principle of Least Privilege**: Only necessary roles have access
2. **Data Protection**: Sensitive employee data protected from unauthorized access
3. **Audit Trail**: All actions tracked by authorized users only
4. **Compliance**: Meets HR data privacy requirements
5. **Multi-layer Security**: Both frontend and database-level restrictions

## ⚠️ **Important Notes:**

- **IT Management Role**: Included because they handle system access, asset management, and technical aspects of onboarding/offboarding
- **HR Manager Role**: Primary role for managing employee lifecycle processes
- **Admin Role**: Full access for system administration and oversight
- **No Manager Role**: General managers do not have access unless specifically granted admin or hr_manager roles

This configuration ensures that only the most relevant and authorized personnel can access and manage employee onboarding and offboarding processes.
