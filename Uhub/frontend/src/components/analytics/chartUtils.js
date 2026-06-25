export const normalizeServiceLabel = (name) => {
  if (!name) return "Unknown Service";
  return String(name)
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
};

export const parseAmountValue = (value) => {
  if (value == null || value === "") return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const cleaned = String(value).replace(/,/g, "").trim();
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const canonicalServiceName = (raw) => {
  let service = normalizeServiceLabel(raw);

  if (service.includes("ATLASSIAN") && service.includes("JIRA")) {
    service = "ATLASSIAN [JIRA & CONFLUENCE]";
  } else if (service.includes("AUTOMATION")) {
    service = "AUTOMATION";
  } else if (service.includes("AWS") && service.includes("BESPIN")) {
    service = "AWS[BESPIN]";
  } else if (service.includes("ELEVEN") && service.includes("LABS")) {
    service = "ELEVEN LABS";
  } else if (service.includes("ZAPIER") || service.includes("ZAIPER")) {
    service = "ZAPIER";
  } else if (service.includes("IDWISE") || service.includes("ID WISE")) {
    service = "IDWISE";
  } else if (service.includes("MO ENGAGE")) {
    service = "MO ENGAGE";
  }

  return service;
};

const DEPARTMENT_ALIASES = {
  TECNOLOGY: "TECHNOLOGY",
  TECH: "TECHNOLOGY",
  IT: "TECHNOLOGY",
  OPERATION: "OPERATIONS",
  OPS: "OPERATIONS",
  "SUBSCRIBE NOW": "SUBSCRIBE_NOW_SALES",
  SUBSCRIBE_NOW: "SUBSCRIBE_NOW_SALES",
  "SUBSCRIBE NOW SALES": "SUBSCRIBE_NOW_SALES",
  SUBSCRIBENOW: "SUBSCRIBE_NOW_SALES",
  "CUSTOMER SERVICE": "CUSTOMER_SERVICE",
  CUSTOMER_SERVICE: "CUSTOMER_SERVICE",
  CS: "CUSTOMER_SERVICE",
  HR: "HR",
  FINANCE: "FINANCE",
  MARKETING: "MARKETING",
  MANAGEMENT: "MANAGEMENT",
  IOT: "IOT",
  COLLECTION: "COLLECTION",
  OTHERS: "OTHERS",
  OTHER: "OTHERS",
  UDRIVE: "OTHERS",
};

/** Normalize raw department strings to canonical DEPARTMENTS values. */
export const canonicalDepartmentName = (raw) => {
  if (!raw) return "OTHERS";

  const cleaned = String(raw).trim().toUpperCase().replace(/\s+/g, " ");
  const underscored = cleaned.replace(/\s+/g, "_");

  if (DEPARTMENT_ALIASES[cleaned]) return DEPARTMENT_ALIASES[cleaned];
  if (DEPARTMENT_ALIASES[underscored]) return DEPARTMENT_ALIASES[underscored];

  if (cleaned.includes("TECH") || cleaned.includes("TECNO")) return "TECHNOLOGY";
  if (cleaned.includes("OPERATION")) return "OPERATIONS";
  if (cleaned.includes("SUBSCRIBE")) return "SUBSCRIBE_NOW_SALES";
  if (cleaned.includes("CUSTOMER")) return "CUSTOMER_SERVICE";

  const known = [
    "TECHNOLOGY",
    "HR",
    "CUSTOMER_SERVICE",
    "MARKETING",
    "FINANCE",
    "MANAGEMENT",
    "OPERATIONS",
    "SUBSCRIBE_NOW_SALES",
    "IOT",
    "COLLECTION",
    "OTHERS",
  ];
  if (known.includes(underscored)) return underscored;

  return "OTHERS";
};

export const DEPARTMENT_CHART_COLORS = {
  TECHNOLOGY: "#2563EB",
  HR: "#EC4899",
  CUSTOMER_SERVICE: "#06B6D4",
  MARKETING: "#8B5CF6",
  FINANCE: "#10B981",
  MANAGEMENT: "#6366F1",
  OPERATIONS: "#F97316",
  SUBSCRIBE_NOW_SALES: "#7C3AED",
  IOT: "#14B8A6",
  COLLECTION: "#F59E0B",
  OTHERS: "#94A3B8",
};
