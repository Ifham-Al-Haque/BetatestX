// Application Configuration
const config = {
  // Supabase Configuration - Use environment variables only
  supabase: {
    url: process.env.REACT_APP_SUPABASE_URL,
    anonKey: process.env.REACT_APP_SUPABASE_ANON_KEY,
  },

  // Application Settings - Corevanta
  app: {
    name: process.env.REACT_APP_APP_NAME || 'Corevanta',
    version: process.env.REACT_APP_APP_VERSION || '1.0.0',
    adminEmail: process.env.REACT_APP_ADMIN_EMAIL || '',
    supportEmail: process.env.REACT_APP_SUPPORT_EMAIL || '',
    // Comma-separated list for admin access (e.g. REACT_APP_ADMIN_EMAILS=admin@company.com,other@company.com)
    adminEmails: (process.env.REACT_APP_ADMIN_EMAILS || process.env.REACT_APP_ADMIN_EMAIL || '')
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean),
  },

  // Feature Flags
  features: {
    enableAnalytics: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
    enableDebugMode: process.env.REACT_APP_ENABLE_DEBUG_MODE === 'false', // Disabled for production
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
      minLength: 8, // Increased for security
      message: 'Password must be at least 8 characters long',
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
    data_operator: {
      name: 'data_operator',
      displayName: 'Data Operator',
      permissions: ['home', 'calendar_view', 'slice_of_life', 'communication', 'user_profile', 'hr_view', 'it_requests', 'fleet_records', 'expense_tracker', 'todo_list'],
    },
    finance: {
      name: 'finance',
      displayName: 'Finance',
      permissions: ['home', 'calendar_view', 'slice_of_life', 'communication', 'user_profile', 'hr_view', 'it_requests', 'simcards', 'payment_calendar', 'upcoming_payments', 'vouchers', 'todo_list'],
    },
    it_management: {
      name: 'it_management',
      displayName: 'IT Management',
      permissions: ['home', 'calendar_view', 'slice_of_life', 'communication', 'user_profile', 'hr_view', 'it_requests', 'request_inbox', 'assets', 'simcards', 'payment_calendar', 'upcoming_payments', 'analytics', 'todo_list'],
    },
    customer_service_manager: {
      name: 'customer_service_manager',
      displayName: 'Customer Service Manager',
      permissions: ['view_dashboard', 'view_cspa', 'manage_customer_service', 'view_reports', 'data_import', 'analytics'],
    },
    manager: {
      name: 'manager',
      displayName: 'Manager',
      permissions: ['view_dashboard', 'manage_employees', 'view_reports', 'analytics'],
    },
    employee: {
      name: 'employee',
      displayName: 'Employee',
      permissions: ['view_dashboard', 'view_own_profile', 'edit_own_profile'],
    },
    hr_manager: {
      name: 'hr_manager',
      displayName: 'HR Manager',
      permissions: ['home', 'calendar_view', 'slice_of_life', 'communication', 'user_profile', 'hr_view', 'it_requests', 'employees', 'attendance', 'hr_operations', 'payroll', 'epr', 'analytics', 'todo_list'],
    },
    cs_manager: {
      name: 'cs_manager',
      displayName: 'CS Manager',
      permissions: ['home', 'calendar_view', 'slice_of_life', 'communication', 'user_profile', 'hr_view', 'it_requests', 'customer_service', 'cspa', 'cs_tickets', 'analytics', 'todo_list'],
    },
    driver_management: {
      name: 'driver_management',
      displayName: 'Driver Management',
      permissions: ['home', 'calendar_view', 'slice_of_life', 'communication', 'user_profile', 'hr_view', 'it_requests', 'drivers', 'driver_records', 'driver_documents', 'fleet_management', 'analytics', 'todo_list'],
    },
    operation_management: {
      name: 'operation_management',
      displayName: 'Operation Management',
      permissions: ['home', 'calendar_view', 'slice_of_life', 'communication', 'user_profile', 'hr_view', 'it_requests', 'drivers', 'driver_records', 'driver_documents', 'fleet_management', 'analytics', 'todo_list'],
    },
    subscribe_now: {
      name: 'subscribe_now',
      displayName: 'Subscribe Now',
      permissions: [
        // Home Panel
        'home', 'calendar_view',
        // Slice of Life (All Sections)
        'slice_of_life', 'memories', 'events', 'collections',
        // Communication
        'team_chat', 'communication',
        // User Profile
        'user_profile',
        // HR Panel
        'employees', 'complaints', 'suggestions',
        // IT Services
        'it_requests',
        // Operation Panel
        'fleet_delivery_checklist', 'fleet_maintenance_record',
        // Todo List Panel (All Sections)
        'todo_list', 'task_management',
        // Subscribe Now Panel (All)
        'subscribe_now'
      ],
    },
    iot_management: {
      name: 'iot_management',
      displayName: 'IOT Management',
      permissions: [
        // Home Panel
        'home', 'calendar_view', 'organizational_hierarchy',
        // Slice of Life (All Sections)
        'slice_of_life', 'memories', 'events', 'collections',
        // User Profile
        'user_profile',
        // HR Panel
        'complaints', 'complaints_inbox', 'suggestions',
        // IT Services
        'it_requests',
        // Todo List Panel (All Sections)
        'todo_list', 'task_management', 'my_tasks',
        // IOT Panel (All)
        'iot_panel', 'iot_record'
      ],
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
  ];

  const missing = required.filter(key => {
    const value = key.split('.').reduce((obj, k) => obj?.[k], config);
    return !value;
  });

  if (missing.length > 0) {
    console.error('❌ Missing required configuration:', missing);
    throw new Error(`Missing required configuration: ${missing.join(', ')}`);
  }
};

// Run validation in development
if (config.isDevelopment) {
  validateConfig();
}

// Security: Don't log sensitive information in production
if (config.isDevelopment) {
  console.log('🔧 Config Debug (Development Mode):');
  console.log('App Name:', config.app.name);
  console.log('Admin Email:', config.app.adminEmail);
  console.log('Supabase URL:', config.supabase.url);
  console.log('API Key Length:', config.supabase.anonKey ? config.supabase.anonKey.length : 'Not set');
} else {
  console.log('🔧 Production Mode: Configuration loaded successfully');
}

export default config; 