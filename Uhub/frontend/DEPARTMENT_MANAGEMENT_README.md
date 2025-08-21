# Department Management System

This document explains how to use the new centralized department management system for SIM cards and other company resources.

## Overview

The department management system has been centralized to make it easy to add, modify, or remove departments across the entire application. This eliminates the need to update department lists in multiple files.

## Files Modified

### 1. `src/config/departments.js` (NEW)
- Centralized configuration file containing all department definitions
- Each department has a value, label, and color theme
- Includes helper functions for working with departments

### 2. `src/components/DepartmentManager.jsx` (NEW)
- Modal component for managing departments
- Allows adding, editing, and deleting departments
- Provides visual color themes for each department

### 3. `src/pages/Simcard.jsx` (UPDATED)
- Now uses centralized department configuration
- Added "Manage Departments" button
- Integrated DepartmentManager component

## Current Departments

The system currently includes these departments as requested:

| Department | Display Label | Color Theme |
|------------|---------------|-------------|
| TECHNOLOGY | TECHNOLOGY | Blue |
| HR | HR | Pink |
| CUSTOMER_SERVICE | CUSTOMER SERVICE | Cyan |
| MARKETING | MARKETING | Purple |
| FINANCE | FINANCE | Emerald |
| MANAGEMENT | MANAGEMENT | Indigo |
| OPERATION | OPERATION | Orange |
| OTHERS | OTHERS | Gray |

## How to Add New Departments

### Method 1: Using the Department Manager UI
1. Go to the SIM Card Management page
2. Click the "Manage Departments" button
3. Fill in the form:
   - **Department Value**: Internal identifier (e.g., `CUSTOMER_SUPPORT`)
   - **Display Label**: User-friendly name (e.g., `CUSTOMER SUPPORT`)
   - **Color Theme**: Choose from available color options
4. Click "Add Department"

### Method 2: Direct Code Modification
Edit `src/config/departments.js` and add a new department object:

```javascript
export const DEPARTMENTS = [
  // ... existing departments ...
  { value: 'CUSTOMER_SUPPORT', label: 'CUSTOMER SUPPORT', color: 'rose' },
  { value: 'TECHNICAL_SUPPORT', label: 'TECHNICAL SUPPORT', color: 'sky' }
];
```

## How to Modify Existing Departments

### Using the Department Manager UI
1. Open the Department Manager
2. Click the edit icon (pencil) next to the department
3. Modify the values as needed
4. Save changes

### Direct Code Modification
Edit the department object in `src/config/departments.js`:

```javascript
{ value: 'TECHNOLOGY', label: 'INFORMATION TECHNOLOGY', color: 'blue' }
```

## How to Remove Departments

### Using the Department Manager UI
1. Open the Department Manager
2. Click the delete icon (trash) next to the department
3. Confirm deletion

### Direct Code Modification
Remove the department object from the `DEPARTMENTS` array in `src/config/departments.js`

## Available Color Themes

The system supports these Tailwind CSS color themes:
- blue, green, purple, emerald, pink, orange, indigo
- cyan, amber, violet, red, teal, slate, zinc, gray

## Helper Functions

The `departments.js` file provides these utility functions:

```javascript
import { 
  getDepartmentLabel, 
  getDepartmentColor, 
  getDepartmentValues, 
  getDepartmentLabels, 
  isValidDepartment 
} from '../config/departments';

// Get display label for a department value
const label = getDepartmentLabel('TECHNOLOGY'); // Returns "TECHNOLOGY"

// Get color theme for a department
const color = getDepartmentColor('TECHNOLOGY'); // Returns "blue"

// Check if a department exists
const isValid = isValidDepartment('TECHNOLOGY'); // Returns true

// Get all department values
const values = getDepartmentValues(); // Returns array of values

// Get all department labels
const labels = getDepartmentLabels(); // Returns array of labels
```

## Integration with Other Components

To use this system in other components, simply import the configuration:

```javascript
import { DEPARTMENTS } from '../config/departments';

// Use in select options
<select>
  <option value="">Select Department</option>
  {DEPARTMENTS.map((dept) => (
    <option key={dept.value} value={dept.value}>
      {dept.label}
    </option>
  ))}
</select>
```

## Best Practices

1. **Department Values**: Use UPPER_CASE with underscores (e.g., `CUSTOMER_SERVICE`)
2. **Display Labels**: Use UPPER_CASE for consistency (e.g., `CUSTOMER SERVICE`)
3. **Color Themes**: Choose colors that provide good contrast and accessibility
4. **Consistency**: Use the same department values across all components
5. **Backup**: Keep a backup of your department configuration before making changes

## Troubleshooting

### Department Not Showing
- Check if the department is properly added to the `DEPARTMENTS` array
- Ensure the component is importing from the correct path
- Verify the department value matches exactly (case-sensitive)

### Color Not Applying
- Make sure the color theme is a valid Tailwind CSS color
- Check if the color classes are properly generated in your CSS

### Form Validation Issues
- Ensure department values don't contain special characters
- Check that both value and label are provided
- Verify the department value is unique

## Future Enhancements

Potential improvements for the department management system:
- Database storage for departments
- User permissions for department management
- Department hierarchy and sub-departments
- Bulk import/export of departments
- Department usage analytics
- Integration with employee management system
