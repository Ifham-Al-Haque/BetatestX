import { DEPARTMENT_HIERARCHY, resolveEmployeePlacement } from '../config/departmentHierarchy';
import { buildOrgTree } from './buildOrgTree';

/**
 * Group employees by parent department → sub-branch, with optional reporting tree per branch.
 */
export const buildDepartmentHierarchy = (employees = [], hierarchy = DEPARTMENT_HIERARCHY) => {
  const parentMap = new Map();
  const tree = hierarchy?.length ? hierarchy : DEPARTMENT_HIERARCHY;

  const ensureParent = (placement) => {
    if (!parentMap.has(placement.parentKey)) {
      parentMap.set(placement.parentKey, {
        ...placement.parent,
        key: placement.parentKey,
        branches: new Map(),
        employeeCount: 0,
      });
    }
    return parentMap.get(placement.parentKey);
  };

  const ensureBranch = (parentNode, placement) => {
    if (!parentNode.branches.has(placement.branchKey)) {
      parentNode.branches.set(placement.branchKey, {
        ...placement.branch,
        key: placement.branchKey,
        employees: [],
      });
    }
    return parentNode.branches.get(placement.branchKey);
  };

  employees.forEach((emp) => {
    const placement = resolveEmployeePlacement(emp, tree);
    const parentNode = ensureParent(placement);
    const branchNode = ensureBranch(parentNode, placement);
    branchNode.employees.push({ ...emp, placement });
    parentNode.employeeCount += 1;
  });

  // Attach configured parents with zero employees (so HR sees full structure)
  tree.forEach((parent) => {
    if (!parentMap.has(parent.key)) {
      parentMap.set(parent.key, {
        ...parent,
        key: parent.key,
        branches: new Map(),
        employeeCount: 0,
      });
    }
    const parentNode = parentMap.get(parent.key);
    parent.branches.forEach((branch) => {
      if (!parentNode.branches.has(branch.key)) {
        parentNode.branches.set(branch.key, { ...branch, key: branch.key, employees: [] });
      }
    });
  });

  const parents = Array.from(parentMap.values())
    .map((parent) => {
      const branches = Array.from(parent.branches.values())
        .map((branch) => {
          const { roots } = buildOrgTree(branch.employees);
          return {
            ...branch,
            count: branch.employees.length,
            roots,
          };
        })
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

      return {
        ...parent,
        branches,
        branchCount: branches.filter((b) => b.count > 0).length,
      };
    })
    .sort((a, b) => b.employeeCount - a.employeeCount || a.label.localeCompare(b.label));

  const totalPlaced = employees.length;
  const techParent = parents.find((p) => p.key === 'TECHNOLOGY');

  return {
    parents,
    stats: {
      parentCount: parents.filter((p) => p.employeeCount > 0).length,
      branchCount: parents.reduce((n, p) => n + p.branches.filter((b) => b.count > 0).length, 0),
      totalEmployees: totalPlaced,
      technologyBranches: techParent?.branches?.length || 0,
    },
  };
};
