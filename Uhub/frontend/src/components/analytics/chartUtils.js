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
