/**
 * UDrive department hierarchy — parent departments and sub-branches (teams).
 * employees.department is a single field; resolveEmployeePlacement maps each
 * employee to { parentKey, branchKey, parentLabel, branchLabel }.
 */

const norm = (value) =>
  String(value || '')
    .trim()
    .toUpperCase()
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ');

/** Parent departments with sub-branch definitions */
export const DEPARTMENT_HIERARCHY = [
  {
    key: 'TECHNOLOGY',
    label: 'Technology',
    description: 'Product, engineering, IoT, and data teams',
    gradient: 'from-blue-600 via-indigo-600 to-violet-700',
    accent: 'blue',
    branches: [
      {
        key: 'PRODUCT',
        label: 'Product',
        aliases: ['PRODUCT', 'PRODUCT MANAGEMENT', 'PM'],
        keywords: ['product manager', 'product owner', 'product'],
      },
      {
        key: 'IT',
        label: 'IT',
        aliases: ['IT', 'TECHNOLOGY', 'TECH', 'INFORMATION TECHNOLOGY'],
        keywords: ['developer', 'engineer', 'software', 'it support', 'system admin', 'devops'],
      },
      {
        key: 'IOT',
        label: 'IoT',
        aliases: ['IOT', 'IOT MANAGEMENT', 'INTERNET OF THINGS'],
        keywords: ['iot', 'telematics', 'device', 'hardware'],
      },
      {
        key: 'DATA_BI',
        label: 'Data Analytics & Business Intelligence',
        aliases: [
          'DATA ANALYTIC',
          'DATA ANALYTICS',
          'DATA ANALYTIC & BUSINESS INTELLIGENCE',
          'DATA ANALYTICS & BUSINESS INTELLIGENCE',
          'BUSINESS INTELLIGENCE',
          'BI',
          'DATA SCIENCE',
          'ANALYTICS',
        ],
        keywords: ['data analyst', 'business intelligence', 'analytics', 'bi ', ' data '],
      },
    ],
  },
  {
    key: 'OPERATIONS',
    label: 'Operations',
    description: 'Fleet, drivers, and day-to-day operations',
    gradient: 'from-orange-500 via-amber-500 to-orange-600',
    accent: 'orange',
    branches: [
      { key: 'FLEET', label: 'Fleet', aliases: ['FLEET', 'FLEET MANAGEMENT'], keywords: ['fleet', 'vehicle'] },
      { key: 'DRIVER', label: 'Driver Management', aliases: ['DRIVER MANAGEMENT', 'DRIVERS'], keywords: ['driver'] },
      { key: 'OPS_GENERAL', label: 'Operations', aliases: ['OPERATIONS', 'OPS'], keywords: ['operations'] },
    ],
  },
  {
    key: 'FINANCE',
    label: 'Finance',
    description: 'Finance, accounting, and payroll',
    gradient: 'from-emerald-600 via-green-600 to-teal-700',
    accent: 'emerald',
    branches: [
      { key: 'FINANCE', label: 'Finance', aliases: ['FINANCE', 'ACCOUNTING', 'ACCOUNTS'], keywords: ['finance', 'accountant', 'payroll'] },
    ],
  },
  {
    key: 'HR',
    label: 'Human Resources',
    description: 'People, culture, and talent',
    gradient: 'from-pink-500 via-rose-500 to-pink-600',
    accent: 'pink',
    branches: [
      { key: 'HR', label: 'HR', aliases: ['HR', 'HUMAN RESOURCES'], keywords: ['human resource', 'hr ', 'recruit'] },
    ],
  },
  {
    key: 'MARKETING',
    label: 'Marketing',
    description: 'Brand, growth, and communications',
    gradient: 'from-purple-600 via-violet-600 to-purple-700',
    accent: 'purple',
    branches: [
      { key: 'MARKETING', label: 'Marketing', aliases: ['MARKETING'], keywords: ['marketing', 'brand', 'content'] },
    ],
  },
  {
    key: 'SALES',
    label: 'Sales',
    description: 'Revenue and customer acquisition',
    gradient: 'from-rose-500 via-red-500 to-rose-600',
    accent: 'rose',
    branches: [
      {
        key: 'SUBSCRIBE_NOW',
        label: 'Subscribe Now Sales',
        aliases: ['SUBSCRIBE NOW SALES', 'SUBSCRIBE NOW', 'SUBSCRIBE_NOW_SALES'],
        keywords: ['subscribe now', 'subscription sales'],
      },
      { key: 'SALES', label: 'Sales', aliases: ['SALES'], keywords: ['sales', 'account executive'] },
    ],
  },
  {
    key: 'CUSTOMER_SERVICE',
    label: 'Customer Service',
    description: 'Support and customer success',
    gradient: 'from-cyan-500 via-sky-500 to-cyan-600',
    accent: 'cyan',
    branches: [
      { key: 'CS', label: 'Customer Service', aliases: ['CUSTOMER SERVICE', 'CUSTOMER_SERVICE', 'SUPPORT'], keywords: ['customer service', 'support agent'] },
    ],
  },
  {
    key: 'COLLECTION',
    label: 'Collection',
    description: 'Collections and recovery',
    gradient: 'from-amber-500 via-yellow-500 to-amber-600',
    accent: 'amber',
    branches: [
      { key: 'COLLECTION', label: 'Collection', aliases: ['COLLECTION', 'COLLECTIONS'], keywords: ['collection'] },
    ],
  },
  {
    key: 'MANAGEMENT',
    label: 'Management',
    description: 'Executive and leadership',
    gradient: 'from-slate-700 via-gray-800 to-slate-900',
    accent: 'slate',
    branches: [
      { key: 'EXEC', label: 'Executive', aliases: ['MANAGEMENT', 'EXECUTIVE'], keywords: ['ceo', 'chief', 'director', 'head of', 'manager'] },
    ],
  },
];

/** Raw department values that belong under a parent (even if stored as top-level dept) */
export const DEPARTMENT_PARENT_MAP = {
  IOT: 'TECHNOLOGY',
  IT: 'TECHNOLOGY',
  TECHNOLOGY: 'TECHNOLOGY',
  TECH: 'TECHNOLOGY',
  PRODUCT: 'TECHNOLOGY',
  'DATA ANALYTIC': 'TECHNOLOGY',
  'DATA ANALYTICS': 'TECHNOLOGY',
  'DATA ANALYTIC & BUSINESS INTELLIGENCE': 'TECHNOLOGY',
  'DATA ANALYTICS & BUSINESS INTELLIGENCE': 'TECHNOLOGY',
  BI: 'TECHNOLOGY',
  'DRIVER MANAGEMENT': 'OPERATIONS',
  OPERATIONS: 'OPERATIONS',
  FINANCE: 'FINANCE',
  HR: 'HR',
  MARKETING: 'MARKETING',
  SALES: 'SALES',
  'SUBSCRIBE NOW SALES': 'SALES',
  'CUSTOMER SERVICE': 'CUSTOMER_SERVICE',
  COLLECTION: 'COLLECTION',
  MANAGEMENT: 'MANAGEMENT',
};

const findParent = (deptNorm) => {
  if (DEPARTMENT_PARENT_MAP[deptNorm]) {
    return DEPARTMENT_HIERARCHY.find((p) => p.key === DEPARTMENT_PARENT_MAP[deptNorm]);
  }
  return DEPARTMENT_HIERARCHY.find(
    (p) => p.key === deptNorm || p.branches.some((b) => b.aliases.map(norm).includes(deptNorm))
  );
};

/** All branch options for employee form dropdowns */
export const getAllBranchOptions = () => {
  const options = [];
  DEPARTMENT_HIERARCHY.forEach((parent) => {
    parent.branches.forEach((branch) => {
      options.push({
        value: branch.key,
        label: `${parent.label} → ${branch.label}`,
        parentKey: parent.key,
      });
    });
  });
  return options;
};

const findBranchByKey = (branchKey) => {
  if (!branchKey) return null;
  const keyNorm = norm(branchKey).replace(/\s+/g, '_');
  for (const parent of DEPARTMENT_HIERARCHY) {
    const branch = parent.branches.find(
      (b) => b.key === branchKey || b.key === keyNorm || norm(b.label) === norm(branchKey)
    );
    if (branch) return { parent, branch };
  }
  return null;
};

const matchBranch = (parent, deptNorm, roleText) => {
  if (!parent) return null;

  for (const branch of parent.branches) {
    if (branch.aliases.map(norm).includes(deptNorm)) return branch;
  }

  if (roleText) {
    for (const branch of parent.branches) {
      if (branch.keywords?.some((kw) => roleText.includes(kw))) return branch;
    }
  }

  if (parent.branches.length === 1) return parent.branches[0];
  return parent.branches.find((b) => b.key === 'IT') || parent.branches[0];
};

/** Map one employee record to parent department + sub-branch */
export const resolveEmployeePlacement = (employee) => {
  if (employee?.sub_department) {
    const byKey = findBranchByKey(employee.sub_department);
    if (byKey) {
      const { parent, branch } = byKey;
      return {
        parentKey: parent.key,
        branchKey: branch.key,
        parentLabel: parent.label,
        branchLabel: branch.label,
        parent,
        branch,
      };
    }
  }

  const deptNorm = norm(employee?.department);
  const roleText = norm(`${employee?.position || ''} ${employee?.designation || ''}`).toLowerCase();

  let parent = findParent(deptNorm);

  if (!parent && deptNorm) {
    parent = {
      key: deptNorm.replace(/\s+/g, '_'),
      label: employee.department,
      description: '',
      gradient: 'from-gray-500 to-gray-600',
      accent: 'gray',
      branches: [{ key: 'GENERAL', label: 'General', aliases: [deptNorm], keywords: [] }],
    };
  }

  if (!parent) {
    parent = {
      key: 'UNASSIGNED',
      label: 'Unassigned',
      description: 'Employees without a department',
      gradient: 'from-gray-400 to-gray-500',
      accent: 'gray',
      branches: [{ key: 'GENERAL', label: 'General', aliases: [], keywords: [] }],
    };
  }

  const branch = matchBranch(parent, deptNorm, roleText) || parent.branches[0];

  return {
    parentKey: parent.key,
    branchKey: branch.key,
    parentLabel: parent.label,
    branchLabel: branch.label,
    parent,
    branch,
  };
};

export const getHierarchyParent = (key) => DEPARTMENT_HIERARCHY.find((p) => p.key === key);
