import {
  Headphones, Wrench, Key, Laptop, Settings, Code, Wifi, Mail,
  Shield, HelpCircle, Monitor, Download, Phone, Printer, HardDrive,
  AlertTriangle, Bug, Package
} from 'lucide-react';

/** Maps DB `icon` slug → Lucide component for category cards and badges */
export const CATEGORY_ICON_MAP = {
  headphones: Headphones,
  support: Headphones,
  wrench: Wrench,
  'technical-issue': Wrench,
  bug: Bug,
  key: Key,
  access: Key,
  laptop: Laptop,
  package: Package,
  asset: Laptop,
  settings: Settings,
  maintenance: Settings,
  code: Code,
  software: Code,
  download: Download,
  wifi: Wifi,
  network: Wifi,
  mail: Mail,
  email: Mail,
  shield: Shield,
  security: Shield,
  'help-circle': HelpCircle,
  other: HelpCircle,
  monitor: Monitor,
  hardware: Monitor,
  phone: Phone,
  printer: Printer,
  'hard-drive': HardDrive,
  backup: HardDrive,
};

export const getCategoryIcon = (category) => {
  const slug = category?.icon?.toLowerCase?.()?.replace(/\s+/g, '-');
  if (slug && CATEGORY_ICON_MAP[slug]) return CATEGORY_ICON_MAP[slug];
  const nameKey = category?.name?.toLowerCase?.()?.replace(/\s+/g, '-');
  if (nameKey && CATEGORY_ICON_MAP[nameKey]) return CATEGORY_ICON_MAP[nameKey];
  return HelpCircle;
};

/** Seed data — run update_it_request_categories.sql in Supabase for production */
export const IT_REQUEST_CATEGORY_SEED = [
  { name: 'Support', description: 'General help, questions, and how-to assistance', color: '#14b8a6', icon: 'headphones', sort_order: 1 },
  { name: 'Technical Issue', description: 'Errors, bugs, or systems not working correctly', color: '#EF4444', icon: 'wrench', sort_order: 2 },
  { name: 'Access Request', description: 'Accounts, permissions, VPN, or password resets', color: '#F59E0B', icon: 'key', sort_order: 3 },
  { name: 'Asset Request', description: 'Laptops, monitors, peripherals, or equipment', color: '#3B82F6', icon: 'laptop', sort_order: 4 },
  { name: 'Maintenance', description: 'Scheduled maintenance, upgrades, or repairs', color: '#8B5CF6', icon: 'settings', sort_order: 5 },
  { name: 'Software Request', description: 'Installation, updates, or software licensing', color: '#06B6D4', icon: 'code', sort_order: 6 },
  { name: 'Network Issue', description: 'WiFi, VPN, internet, or connectivity problems', color: '#10B981', icon: 'wifi', sort_order: 7 },
  { name: 'Email & Communication', description: 'Email, phone, Teams, or messaging tools', color: '#6366F1', icon: 'mail', sort_order: 8 },
  { name: 'Security', description: 'Security incidents, malware, or suspicious activity', color: '#DC2626', icon: 'shield', sort_order: 9 },
  { name: 'Other', description: 'Anything that does not fit the categories above', color: '#6B7280', icon: 'help-circle', sort_order: 10 },
];

export const CATEGORY_TITLE_HINTS = {
  Support: 'e.g. Need help with Microsoft Teams setup',
  'Technical Issue': 'e.g. Laptop will not connect to the network',
  'Access Request': 'e.g. Request access to shared drive for new hire',
  'Asset Request': 'e.g. Request a second monitor for my desk',
  Maintenance: 'e.g. Schedule laptop battery replacement',
  'Software Request': 'e.g. Install Adobe Acrobat on my laptop',
  'Network Issue': 'e.g. VPN disconnects every few minutes',
  'Email & Communication': 'e.g. Cannot send emails from Outlook',
  Security: 'e.g. Received a suspicious phishing email',
  Other: 'e.g. Brief summary of your request',
};

export const PRIORITY_VISUAL = {
  Critical: { color: '#DC2626', bg: '#FEE2E2', icon: AlertTriangle },
  High: { color: '#EA580C', bg: '#FFEDD5', icon: AlertTriangle },
  Medium: { color: '#D97706', bg: '#FEF3C7', icon: Wrench },
  Low: { color: '#65A30D', bg: '#DCFCE7', icon: HelpCircle },
  Planning: { color: '#6B7280', bg: '#F3F4F6', icon: Settings },
};

/** Optional sub-types shown after a category is selected */
export const CATEGORY_SUB_OPTIONS = {
  Support: ['How-to / Training', 'Account Help', 'General Question'],
  'Technical Issue': ['Application Error', 'Device Not Working', 'Performance Issue', 'System Crash'],
  'Access Request': ['New Account', 'Password Reset', 'Shared Drive / Folder', 'VPN Access', 'App Permission'],
  'Asset Request': ['Laptop', 'Desktop', 'Monitor', 'Phone / SIM', 'Keyboard / Mouse', 'Headset', 'Docking Station'],
  Maintenance: ['Hardware Repair', 'Battery Replacement', 'Device Upgrade', 'Preventive Maintenance'],
  'Software Request': ['New Installation', 'Update / Patch', 'License Request', 'Uninstall'],
  'Network Issue': ['WiFi', 'VPN', 'Internet / Speed', 'Network Printer'],
  'Email & Communication': ['Outlook / Email', 'Microsoft Teams', 'Phone Extension', 'Distribution List'],
  Security: ['Phishing Report', 'Malware / Virus', 'Lost / Stolen Device', 'Suspicious Activity'],
  Other: [],
};

export const formatDescriptionWithSubcategory = (subcategory, description) => {
  const body = (description || '').trim();
  if (!subcategory?.trim()) return body;
  return `[Sub-type: ${subcategory.trim()}]\n\n${body}`;
};

export const parseSubcategoryFromDescription = (description) => {
  if (!description) return { subcategory: '', body: '' };
  const match = description.match(/^\[Sub-type:\s*(.+?)\]\s*\n?\n?(.*)$/s);
  if (match) {
    return { subcategory: match[1].trim(), body: match[2].trim() };
  }
  return { subcategory: '', body: description.trim() };
};

export const stripSubcategoryPrefix = (description) =>
  parseSubcategoryFromDescription(description).body || description;
