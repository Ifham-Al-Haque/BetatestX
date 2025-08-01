// Application Configuration
const config = {
  // Supabase Configuration - Force use correct values
  supabase: {
    url: 'https://qtugowosurgecytgswuo.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0dWdvd29zdXJnZWN5dGdzd3VvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MDI4OTUsImV4cCI6MjA2NTM3ODg5NX0.x4gN4YO9xalo9y506l_mf6pzK_Km-SCVf9fuJxjyMLM',
  },

  // Application Settings
  app: {
    name: process.env.REACT_APP_APP_NAME || 'Uhub',
    version: process.env.REACT_APP_APP_VERSION || '1.0.0',
    adminEmail: process.env.REACT_APP_ADMIN_EMAIL || 'ifham@udrive.ae',
    supportEmail: process.env.REACT_APP_SUPPORT_EMAIL || 'support@udrive.ae',
  },

  // Feature Flags
  features: {
    enableAnalytics: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
    enableDebugMode: process.env.REACT_APP_ENABLE_DEBUG_MODE === 'true',
    enableUserRegistration: false, // Disabled for security
  },

  // UI Configuration
  ui: {
    theme: {
      primary: '#2563eb',
      secondary: '#7c3aed',
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626',
    },
    toast: {
      defaultDuration: 5000,
      errorDuration: 8000,
    },
  },

  // API Configuration
  api: {
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
  },

  // Validation Rules
  validation: {
    email: {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Please enter a valid email address',
    },
    password: {
      minLength: 6,
      message: 'Password must be at least 6 characters long',
    },
    name: {
      minLength: 2,
      maxLength: 50,
      message: 'Name must be between 2 and 50 characters',
    },
  },

  // Roles and Permissions
  roles: {
    admin: {
      name: 'admin',
      displayName: 'Administrator',
      permissions: ['all'],
    },
    employee: {
      name: 'employee',
      displayName: 'Employee',
      permissions: ['view_dashboard', 'view_own_profile', 'edit_own_profile'],
    },
    manager: {
      name: 'manager',
      displayName: 'Manager',
      permissions: ['view_dashboard', 'manage_employees', 'view_reports'],
    },
  },

  // Departments
  departments: [
    'IT',
    'HR',
    'Finance',
    'Marketing',
    'Sales',
    'Operations',
    'Customer Support',
    'Unassigned',
  ],

  // Status Options
  statuses: [
    'active',
    'inactive',
    'pending',
    'suspended',
  ],

  // Pagination
  pagination: {
    defaultPageSize: 10,
    pageSizeOptions: [5, 10, 20, 50],
  },

  // Date Formats
  dateFormats: {
    display: 'MMM dd, yyyy',
    input: 'yyyy-MM-dd',
    time: 'HH:mm',
    datetime: 'MMM dd, yyyy HH:mm',
  },

  // Currency
  currency: {
    code: 'AED',
    symbol: 'د.إ',
    position: 'right', // 'left' or 'right'
  },

  // Error Messages
  errors: {
    network: 'Network error. Please check your connection and try again.',
    unauthorized: 'You are not authorized to perform this action.',
    notFound: 'The requested resource was not found.',
    serverError: 'Server error. Please try again later.',
    validation: 'Please check your input and try again.',
    unknown: 'An unexpected error occurred. Please try again.',
  },

  // Success Messages
  success: {
    created: 'Item created successfully.',
    updated: 'Item updated successfully.',
    deleted: 'Item deleted successfully.',
    saved: 'Changes saved successfully.',
  },

  // Development/Production Settings
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};

// Validate required configuration
const validateConfig = () => {
  const required = [
    'supabase.url',
    'supabase.anonKey',
    'app.adminEmail',
  ];

  const missing = required.filter(key => {
    const value = key.split('.').reduce((obj, k) => obj?.[k], config);
    return !value;
  });

  if (missing.length > 0) {
    console.warn('⚠️ Missing required configuration:', missing);
  }
};

// Run validation in development
if (config.isDevelopment) {
  validateConfig();
}

// Debug: Log the actual config values
console.log('🔧 Config Debug:');
console.log('Config URL:', config.supabase.url);
console.log('Config Key Length:', config.supabase.anonKey.length);
console.log('Config Key Start:', config.supabase.anonKey.substring(0, 20) + '...');
console.log('🔍 Full Config Key:', config.supabase.anonKey);

export default config; 