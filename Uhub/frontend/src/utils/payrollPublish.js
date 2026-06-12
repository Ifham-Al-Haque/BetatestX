import { supabase } from '../supabaseClient';

/** Match a batch row to a UDrive employee record (employees table). */
export function matchEmployee(batchRow, employees) {
  const code = String(batchRow.employee_id || '').trim().toLowerCase();
  const name = String(batchRow.full_name || '').trim().toLowerCase();

  if (code) {
    const byCode = employees.find(
      (e) => String(e.employee_id || '').trim().toLowerCase() === code
    );
    if (byCode) return byCode;

    const byUuid = employees.find((e) => String(e.id) === code);
    if (byUuid) return byUuid;
  }

  if (name) {
    const byName = employees.find(
      (e) => String(e.full_name || '').trim().toLowerCase() === name
    );
    if (byName) return byName;
  }

  return null;
}

/**
 * Publish payroll_batch_rows into payrolls (status: pending).
 * Skips rows that already have a payroll record for the same employee/month/year.
 */
export async function publishBatchToRecords(batch, batchRows, employees, createdBy, publisherName) {
  const month = batch.month;
  const year = Number(batch.year);

  const { data: existing, error: existingErr } = await supabase
    .from('payrolls')
    .select('employee_id, month, year')
    .eq('month', month)
    .eq('year', year);

  if (existingErr) throw existingErr;

  const existingKeys = new Set(
    (existing || []).map((p) => `${String(p.employee_id)}|${p.month}|${p.year}`)
  );

  const toInsert = [];
  let skipped = 0;
  let unmatched = 0;

  for (const row of batchRows) {
    const matched = matchEmployee(row, employees);
    const employeeId = matched ? String(matched.id) : String(row.employee_id || row.full_name || 'unknown');
    const key = `${employeeId}|${month}|${year}`;

    if (existingKeys.has(key)) {
      skipped += 1;
      continue;
    }

    if (!matched) unmatched += 1;
    existingKeys.add(key);

    toInsert.push({
      batch_id: batch.id,
      employee_id: employeeId,
      employee_name: row.full_name || matched?.full_name || 'Unknown',
      department: row.department || matched?.department || null,
      month,
      year,
      basic_salary: row.basic_salary ?? 0,
      allowances: row.allowances ?? 0,
      deductions: row.deductions ?? 0,
      overtime_hours: row.overtime_hours ?? 0,
      overtime_rate: row.overtime_rate ?? 0,
      bonus: row.bonus ?? 0,
      tax_rate: row.tax_rate ?? 0,
      tax_amount: row.tax_amount ?? 0,
      gross_salary: row.gross_salary ?? 0,
      net_salary: row.net_salary ?? 0,
      status: 'pending',
      notes: `Published from batch: ${batch.name}`,
      created_by: createdBy || null,
    });
  }

  if (toInsert.length === 0) {
    return { published: 0, skipped, unmatched };
  }

  const { error: insertErr } = await supabase.from('payrolls').insert(toInsert);
  if (insertErr) throw insertErr;

  const { error: batchErr } = await supabase
    .from('payroll_batches')
    .update({
      published_at: new Date().toISOString(),
      published_by: createdBy || null,
      published_by_name: publisherName || null,
    })
    .eq('id', batch.id);

  if (batchErr) throw batchErr;

  return { published: toInsert.length, skipped, unmatched };
}
