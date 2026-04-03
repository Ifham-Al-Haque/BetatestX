/**
 * Helpers for employees.access_list (JSONB): mix of legacy string entries and
 * structured { name, scopes } objects for system access + sub-access / scope.
 */

export function normalizeAccessList(raw) {
  if (!raw) return [];
  let arr;
  if (Array.isArray(raw)) {
    arr = raw;
  } else if (typeof raw === 'string') {
    const t = raw.trim();
    if (t.startsWith('[')) {
      try {
        arr = JSON.parse(t);
      } catch {
        arr = raw.split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
      }
    } else {
      arr = raw.split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
    }
  } else {
    return [];
  }

  return arr
    .map((item, i) => {
      if (typeof item === 'string') {
        return { name: item.trim(), scopes: [] };
      }
      if (item && typeof item === 'object') {
        const name = (item.name || item.label || item.system || '').trim() || `Access ${i + 1}`;
        let scopes = [];
        if (Array.isArray(item.scopes)) {
          scopes = item.scopes.map(String).map((s) => s.trim()).filter(Boolean);
        } else if (Array.isArray(item.roles)) {
          scopes = item.roles.map(String).map((s) => s.trim()).filter(Boolean);
        }
        return { name, scopes };
      }
      return { name: String(item).trim(), scopes: [] };
    })
    .filter((e) => e.name);
}

export function toDbAccessList(entries) {
  return entries
    .map((e) => ({
      name: (e.name || '').trim(),
      scopes: (e.scopes || []).map((s) => String(s).trim()).filter(Boolean),
    }))
    .filter((e) => e.name);
}

/** For EmployeeForm textarea: show legacy lines or pretty JSON for structured rows */
export function accessListToFormString(field) {
  if (!field) return '';
  if (Array.isArray(field)) {
    if (field.length && typeof field[0] === 'object' && field[0] !== null) {
      return JSON.stringify(
        normalizeAccessList(field).map((e) => ({ name: e.name, scopes: e.scopes })),
        null,
        2
      );
    }
    return field.join('\n');
  }
  if (typeof field === 'string') return field;
  return '';
}

/** Parse form textarea back to DB shape (array of strings or array of { name, scopes }) */
export function accessListFromForm(formValue) {
  if (!formValue || (typeof formValue === 'string' && !formValue.trim())) return [];
  if (Array.isArray(formValue)) return normalizeAccessList(formValue);
  const t = String(formValue).trim();
  if (t.startsWith('[')) {
    try {
      const parsed = JSON.parse(t);
      if (Array.isArray(parsed)) return toDbAccessList(normalizeAccessList(parsed));
    } catch {
      /* fall through to line-based */
    }
  }
  return toDbAccessList(
    t.split('\n').map((line) => ({ name: line.trim(), scopes: [] })).filter((e) => e.name)
  );
}
