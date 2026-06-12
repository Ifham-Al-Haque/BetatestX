/**
 * Build an org tree from UDrive employee records (employees.reporting_manager_id).
 * Returns roots, a lookup map, reporting stats, and employees with broken manager links.
 */
export const buildOrgTree = (employees = []) => {
  if (!employees?.length) {
    return {
      map: new Map(),
      roots: [],
      managerIds: [],
      stats: { total: 0, topLevel: 0, maxDepth: 0, managers: 0 },
      brokenLinks: [],
      flatByLevel: [],
    };
  }

  const map = new Map();
  employees.forEach((emp) => {
    const managerName =
      emp.reporting_manager?.full_name ||
      (emp.reporting_manager_id ? null : null);

    map.set(String(emp.id), {
      ...emp,
      directReports: [],
      level: 0,
      managerName: managerName || null,
      reportingChain: [],
      reportingChainNames: [],
      totalReports: 0,
      brokenManager: false,
    });
  });

  const brokenLinks = [];
  const roots = [];

  employees.forEach((emp) => {
    const id = String(emp.id);
    const node = map.get(id);
    const managerKey = emp.reporting_manager_id ? String(emp.reporting_manager_id) : null;

    if (managerKey && managerKey !== id) {
      const manager = map.get(managerKey);
      if (manager) {
        manager.directReports.push(node);
        node.managerName = manager.full_name;
      } else {
        node.brokenManager = true;
        node.managerName = emp.reporting_manager?.full_name || 'Unknown manager';
        brokenLinks.push(node);
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  const sortNodes = (nodes) => {
    nodes.sort(
      (a, b) =>
        (b.directReports.length - a.directReports.length) ||
        (a.full_name || '').localeCompare(b.full_name || '')
    );
    nodes.forEach((n) => sortNodes(n.directReports));
  };
  sortNodes(roots);

  let maxDepth = 0;
  const flatByLevel = [];

  const walk = (node, level = 0, chain = [], chainNames = []) => {
    node.level = level;
    node.reportingChain = chain;
    node.reportingChainNames = chainNames;
    maxDepth = Math.max(maxDepth, level);

    flatByLevel.push(node);

    const countReports = (n) => {
      let total = n.directReports.length;
      n.directReports.forEach((c) => { total += countReports(c); });
      n.totalReports = total;
      return total;
    };
    countReports(node);

    node.directReports.forEach((child) => {
      walk(child, level + 1, [...chain, node.id], [...chainNames, node.full_name]);
    });
  };

  roots.forEach((root) => walk(root, 0, [], []));

  flatByLevel.sort((a, b) => a.level - b.level || (a.full_name || '').localeCompare(b.full_name || ''));

  const managerIds = [];
  map.forEach((n, id) => {
    if (n.directReports.length) managerIds.push(id);
  });

  return {
    map,
    roots,
    managerIds,
    brokenLinks,
    flatByLevel,
    stats: {
      total: employees.length,
      topLevel: roots.length,
      maxDepth: maxDepth + 1,
      managers: managerIds.length,
      broken: brokenLinks.length,
    },
  };
};

/** Collect ancestor ids for a node so search can auto-expand the path. */
export const getAncestorIds = (node) => (node?.reportingChain || []).map(String);

export const nodeMatchesQuery = (node, query) => {
  if (!query) return false;
  const q = query.toLowerCase();
  return (
    node.full_name?.toLowerCase().includes(q) ||
    node.position?.toLowerCase().includes(q) ||
    node.designation?.toLowerCase?.().includes(q) ||
    node.department?.toLowerCase().includes(q) ||
    node.employee_id?.toLowerCase?.().includes(q) ||
    node.managerName?.toLowerCase().includes(q)
  );
};
