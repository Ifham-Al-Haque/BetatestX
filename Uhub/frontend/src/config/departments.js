// Department configuration for the application
// This file centralizes all department definitions to make them easy to maintain and update

export const DEPARTMENTS = [
  { value: 'TECHNOLOGY', label: 'TECHNOLOGY', color: 'blue' },
  { value: 'HR', label: 'HR', color: 'pink' },
  { value: 'CUSTOMER_SERVICE', label: 'CUSTOMER SERVICE', color: 'cyan' },
  { value: 'MARKETING', label: 'MARKETING', color: 'purple' },
  { value: 'FINANCE', label: 'FINANCE', color: 'emerald' },
  { value: 'MANAGEMENT', label: 'MANAGEMENT', color: 'indigo' },
  { value: 'OPERATION', label: 'OPERATION', color: 'orange' },
  { value: 'OTHERS', label: 'OTHERS', color: 'gray' }
];

// Helper function to get department label by value
export const getDepartmentLabel = (value) => {
  const dept = DEPARTMENTS.find(d => d.value === value);
  return dept ? dept.label : value;
};

// Helper function to get department color by value
export const getDepartmentColor = (value) => {
  const dept = DEPARTMENTS.find(d => d.value === value);
  return dept ? dept.color : 'gray';
};

// Helper function to get all department values
export const getDepartmentValues = () => DEPARTMENTS.map(d => d.value);

// Helper function to get all department labels
export const getDepartmentLabels = () => DEPARTMENTS.map(d => d.label);

// Helper function to check if a department exists
export const isValidDepartment = (value) => DEPARTMENTS.some(d => d.value === value);
