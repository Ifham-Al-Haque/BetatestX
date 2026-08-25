/** Tailwind gradient classes for org chart department accents (matches UDrive dept names). */
const GRADIENT_MAP = {
  IT: 'from-blue-500 to-blue-600',
  HR: 'from-purple-500 to-purple-600',
  FINANCE: 'from-green-500 to-green-600',
  Finance: 'from-green-500 to-green-600',
  MARKETING: 'from-pink-500 to-pink-600',
  Marketing: 'from-pink-500 to-pink-600',
  SALES: 'from-orange-500 to-orange-600',
  Sales: 'from-orange-500 to-orange-600',
  OPERATIONS: 'from-indigo-500 to-indigo-600',
  Operations: 'from-indigo-500 to-orange-600',
  TECHNOLOGY: 'from-cyan-500 to-blue-600',
  IOT: 'from-emerald-500 to-teal-600',
  COLLECTION: 'from-yellow-500 to-amber-600',
  'Customer Service': 'from-sky-500 to-cyan-600',
  'Driver Management': 'from-slate-500 to-gray-600',
  'SUBSCRIBE NOW SALES': 'from-violet-500 to-purple-600',
  Management: 'from-red-500 to-rose-600',
  MANAGEMENT: 'from-red-500 to-rose-600',
  Unassigned: 'from-gray-400 to-gray-500',
};

const FALLBACK_GRADIENTS = [
  'from-blue-500 to-indigo-600',
  'from-violet-500 to-purple-600',
  'from-teal-500 to-cyan-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
];

const hash = (str) => {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) h = (h << 5) - h + str.charCodeAt(i);
  return Math.abs(h);
};

export const getDepartmentGradient = (department) => {
  if (!department) return GRADIENT_MAP.Unassigned;
  if (GRADIENT_MAP[department]) return GRADIENT_MAP[department];
  const upper = department.toUpperCase();
  const match = Object.entries(GRADIENT_MAP).find(([k]) => k.toUpperCase() === upper);
  if (match) return match[1];
  return FALLBACK_GRADIENTS[hash(department) % FALLBACK_GRADIENTS.length];
};
