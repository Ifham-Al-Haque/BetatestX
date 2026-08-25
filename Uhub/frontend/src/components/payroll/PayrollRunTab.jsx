import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, Download, FileUp, Lock,
  PencilLine, Plus, Save, Search, Trash2, X
} from "lucide-react";
import * as XLSX from "xlsx";
import { useToast } from "../../context/ToastContext";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../context/AuthContext";
import {
  BASE_VARIABLES,
  DEFAULT_FORMULAS,
  FORMULA_FUNCTIONS,
  STAGE_VARIABLES,
  calcRowWithFormulas,
  validateFormulas,
} from "../../utils/payrollFormula";
import { formatPayrollCurrency } from "../../utils/payrollConstants";

const FIELD_DEFS = [
  { key: "employee_id", label: "Employee ID", type: "text" },
  { key: "full_name", label: "Full Name", type: "text" },
  { key: "department", label: "Department", type: "text" },
  { key: "month", label: "Month", type: "text" },
  { key: "year", label: "Year", type: "number" },
  { key: "basic_salary", label: "Basic Salary", type: "number" },
  { key: "allowances", label: "Allowances", type: "number" },
  { key: "deductions", label: "Deductions", type: "number" },
  { key: "overtime_hours", label: "OT Hours", type: "number" },
  { key: "overtime_rate", label: "OT Rate", type: "number" },
  { key: "bonus", label: "Bonus", type: "number" },
  { key: "tax_rate", label: "Tax %", type: "number" },
];

function normalizeHeader(h) {
  return String(h ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function guessFieldKey(header) {
  const h = normalizeHeader(header);
  const guesses = [
    ["employee_id", ["employee_id", "emp_id", "id", "staff_id"]],
    ["full_name", ["full_name", "employee_name", "name", "fullnames"]],
    ["department", ["department", "dept"]],
    ["month", ["month", "pay_month", "salary_month"]],
    ["year", ["year", "pay_year", "salary_year"]],
    ["basic_salary", ["basic_salary", "basic", "base_salary", "salary", "basic_pay"]],
    ["allowances", ["allowances", "allowance", "benefits"]],
    ["deductions", ["deductions", "deduction", "deduct", "penalties"]],
    ["overtime_hours", ["overtime_hours", "ot_hours", "overtimehrs", "hours_ot"]],
    ["overtime_rate", ["overtime_rate", "ot_rate", "rate_ot"]],
    ["bonus", ["bonus", "incentive"]],
    ["tax_rate", ["tax_rate", "tax", "tax_percent", "tax_percentage"]],
  ];
  for (const [field, candidates] of guesses) {
    if (candidates.includes(h)) return field;
  }
  return "";
}

function toNumber(value) {
  if (value === null || value === undefined) return 0;
  const n = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : 0;
}

// Sample values used to validate/preview formulas when the table is empty
const SAMPLE_ROW = {
  basic_salary: 5000,
  allowances: 500,
  deductions: 200,
  overtime_hours: 10,
  overtime_rate: 25,
  bonus: 300,
  tax_rate: 5,
};

const FORMULA_FIELDS = [
  { key: "gross_formula", label: "Gross Salary" },
  { key: "tax_formula", label: "Tax" },
  { key: "net_formula", label: "Net Salary" },
];

function makeEmptyRow() {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    employee_id: "",
    full_name: "",
    department: "",
    month: "",
    year: new Date().getFullYear(),
    basic_salary: "",
    allowances: "",
    deductions: "",
    overtime_hours: "",
    overtime_rate: "",
    bonus: "",
    tax_rate: "",
  };
}

export default function PayrollRunTab({ onBatchSaved }) {
  const { success, error: showError } = useToast();
  const { userProfile } = useAuth();
  const fileInputRef = useRef(null);

  const [rawHeaders, setRawHeaders] = useState([]);
  const [mapping, setMapping] = useState(() => Object.fromEntries(FIELD_DEFS.map((f) => [f.key, ""])));
  const [importPreviewRows, setImportPreviewRows] = useState([]);
  const [rows, setRows] = useState([]);
  const [showMapper, setShowMapper] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [rowSearch, setRowSearch] = useState("");

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [batchName, setBatchName] = useState("");
  const [batchMonth, setBatchMonth] = useState("");
  const [batchYear, setBatchYear] = useState(new Date().getFullYear());
  const [lockOnSave, setLockOnSave] = useState(true);
  const [saving, setSaving] = useState(false);

  // Formula state: activeFormulas drive all calculations; the draft is
  // only used while editing, until "Lock & Apply".
  const [activeFormulas, setActiveFormulas] = useState(DEFAULT_FORMULAS);
  const [formulaDraft, setFormulaDraft] = useState(DEFAULT_FORMULAS);
  const [formulaEditing, setFormulaEditing] = useState(false);
  const [formulaMeta, setFormulaMeta] = useState(null);
  const [formulaSaving, setFormulaSaving] = useState(false);

  const canEditFormula = ["admin", "hr_manager"].includes(userProfile?.role);

  useEffect(() => {
    const loadFormulas = async () => {
      const { data, error } = await supabase
        .from("payroll_formulas")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Table missing or empty: silently keep the built-in defaults
      if (!error && data) {
        setActiveFormulas({
          gross_formula: data.gross_formula,
          tax_formula: data.tax_formula,
          net_formula: data.net_formula,
        });
        setFormulaMeta({ locked_by_name: data.locked_by_name, locked_at: data.locked_at });
      }
    };
    loadFormulas();
  }, []);

  const calcRow = useCallback(
    (row) => calcRowWithFormulas(row, activeFormulas),
    [activeFormulas]
  );

  const sampleRow = rows[0] || SAMPLE_ROW;

  const formulaDraftErrors = useMemo(
    () => (formulaEditing ? validateFormulas(formulaDraft, sampleRow) : {}),
    [formulaEditing, formulaDraft, sampleRow]
  );

  const formulaDraftPreview = useMemo(
    () => calcRowWithFormulas(sampleRow, formulaDraft),
    [formulaDraft, sampleRow]
  );

  const startFormulaEdit = () => {
    setFormulaDraft(activeFormulas);
    setFormulaEditing(true);
  };

  const cancelFormulaEdit = () => {
    setFormulaDraft(activeFormulas);
    setFormulaEditing(false);
  };

  const lockAndApplyFormulas = async () => {
    if (formulaSaving) return;

    const errors = validateFormulas(formulaDraft, sampleRow);
    if (Object.keys(errors).length > 0) {
      showError("Invalid formula", "Fix the highlighted formula errors before locking.");
      return;
    }

    setFormulaSaving(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const authUserId = authData?.user?.id || null;
      const lockedByName = userProfile?.full_name || userProfile?.email || null;
      const lockedAt = new Date().toISOString();

      const { error } = await supabase.from("payroll_formulas").insert({
        gross_formula: formulaDraft.gross_formula.trim(),
        tax_formula: formulaDraft.tax_formula.trim(),
        net_formula: formulaDraft.net_formula.trim(),
        is_locked: true,
        locked_at: lockedAt,
        locked_by: authUserId,
        locked_by_name: lockedByName,
      });

      if (error) {
        const msg = (error.message || "").toLowerCase();
        if (msg.includes("relation") || msg.includes("does not exist")) {
          showError(
            "Formula not persisted",
            "Run `create_payroll_formulas_schema.sql` in Supabase to save formulas permanently. The formula is applied for this session only."
          );
        } else {
          throw error;
        }
      } else {
        success("Formula locked", "Payroll is now calculated using the locked formula.");
      }

      setActiveFormulas({
        gross_formula: formulaDraft.gross_formula.trim(),
        tax_formula: formulaDraft.tax_formula.trim(),
        net_formula: formulaDraft.net_formula.trim(),
      });
      setFormulaMeta({ locked_by_name: lockedByName, locked_at: lockedAt });
      setFormulaEditing(false);
    } catch (err) {
      showError("Lock failed", err.message || "Failed to save the formula.");
    } finally {
      setFormulaSaving(false);
    }
  };

  const totals = useMemo(() => {
    const acc = { gross: 0, tax: 0, deductions: 0, net: 0 };
    for (const r of rows) {
      const { gross, tax, net } = calcRow(r);
      acc.gross += gross;
      acc.tax += tax;
      acc.deductions += toNumber(r.deductions);
      acc.net += net;
    }
    return acc;
  }, [rows, calcRow]);

  const displayedRows = useMemo(() => {
    const q = rowSearch.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.full_name, r.employee_id, r.department].some((v) =>
        String(v || "").toLowerCase().includes(q)
      )
    );
  }, [rows, rowSearch]);

  const handleManualAdd = () => {
    if (isLocked) return;
    setRows((prev) => [makeEmptyRow(), ...prev]);
  };

  const handleCellChange = (rowId, key, value) => {
    if (isLocked) return;
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, [key]: value } : r))
    );
  };

  const removeRow = (rowId) => {
    if (isLocked) return;
    setRows((prev) => prev.filter((r) => r.id !== rowId));
  };

  const parseFileToJson = async (file) => {
    const ext = (file.name.split(".").pop() || "").toLowerCase();

    if (ext === "csv") {
      const text = await file.text();
      const wb = XLSX.read(text, { type: "string" });
      const sheetName = wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      return XLSX.utils.sheet_to_json(ws, { defval: "" });
    }

    if (ext === "xlsx" || ext === "xls") {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheetName = wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      return XLSX.utils.sheet_to_json(ws, { defval: "" });
    }

    throw new Error("Unsupported file type. Please upload CSV, XLSX, or XLS.");
  };

  const handlePickFile = () => fileInputRef.current?.click();

  const [lastParsedJson, setLastParsedJson] = useState([]);

  const applyImportFromLast = () => {
    const json = lastParsedJson;
    if (!Array.isArray(json) || json.length === 0) {
      showError("Nothing to import", "Upload a file first.");
      return;
    }

    const required = ["employee_id", "full_name", "basic_salary"];
    const missing = required.filter((k) => !mapping[k]);
    if (missing.length) {
      showError(
        "Missing mapping",
        `Please map: ${missing
          .map((k) => FIELD_DEFS.find((f) => f.key === k)?.label || k)
          .join(", ")}`
      );
      return;
    }

    const mapped = json.map((src) => {
      const r = makeEmptyRow();
      for (const field of FIELD_DEFS) {
        const srcKey = mapping[field.key];
        if (!srcKey) continue;
        r[field.key] = src?.[srcKey] ?? "";
      }
      return r;
    });

    setRows(mapped);
    setShowMapper(false);
    success("Imported", `Loaded ${mapped.length} payroll rows.`);
  };

  // Ensure we keep full parsed json when loading
  const handleFileChangeWithCache = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const json = await parseFileToJson(file);
      if (!Array.isArray(json) || json.length === 0) {
        showError("Import failed", "No rows found in the file.");
        return;
      }
      setLastParsedJson(json);
      const headers = Object.keys(json[0] || {});
      setRawHeaders(headers);
      setImportPreviewRows(json.slice(0, 25));

      const nextMapping = Object.fromEntries(FIELD_DEFS.map((f) => [f.key, ""]));
      for (const field of FIELD_DEFS) {
        const guessed = headers.find((h) => guessFieldKey(h) === field.key);
        nextMapping[field.key] = guessed || "";
      }
      setMapping(nextMapping);
      setShowMapper(true);
      success("File loaded", "Map columns and import your payroll data.");
    } catch (err) {
      showError("Import failed", err.message || "Failed to read file.");
    } finally {
      e.target.value = "";
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        employee_id: "EMP-001",
        full_name: "John Doe",
        department: "HR",
        month: "January",
        year: new Date().getFullYear(),
        basic_salary: 5000,
        allowances: 500,
        deductions: 200,
        overtime_hours: 10,
        overtime_rate: 25,
        bonus: 300,
        tax_rate: 5,
      },
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "payroll-template.xlsx");
  };

  const computedExportRows = useMemo(() => {
    return rows.map((r) => {
      const { ot, gross, tax, net } = calcRow(r);
      return {
        employee_id: r.employee_id || "",
        full_name: r.full_name || "",
        department: r.department || "",
        month: r.month || "",
        year: r.year || "",
        basic_salary: toNumber(r.basic_salary),
        allowances: toNumber(r.allowances),
        bonus: toNumber(r.bonus),
        overtime_hours: toNumber(r.overtime_hours),
        overtime_rate: toNumber(r.overtime_rate),
        overtime_amount: ot,
        deductions: toNumber(r.deductions),
        tax_rate: toNumber(r.tax_rate),
        tax_amount: tax,
        gross_salary: gross,
        net_salary: net,
      };
    });
  }, [rows, calcRow]);

  const exportXlsx = () => {
    if (rows.length === 0) {
      showError("Nothing to export", "Add or import rows first.");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(computedExportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payroll");
    XLSX.writeFile(wb, `payroll-calculator-${Date.now()}.xlsx`);
    success("Exported", "Downloaded XLSX with calculated fields.");
  };

  const exportCsv = () => {
    if (rows.length === 0) {
      showError("Nothing to export", "Add or import rows first.");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(computedExportRows);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payroll-calculator-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    success("Exported", "Downloaded CSV with calculated fields.");
  };

  const openSave = () => {
    if (formulaEditing) {
      showError("Formula unlocked", "Lock the calculation formula before saving a batch.");
      return;
    }
    if (rows.length === 0) {
      showError("Nothing to save", "Add or import rows first.");
      return;
    }
    const inferredMonth = rows.find((r) => String(r.month || "").trim())?.month || "";
    const inferredYear = rows.find((r) => String(r.year || "").trim())?.year || new Date().getFullYear();
    setBatchMonth(String(inferredMonth || "").trim());
    setBatchYear(Number(inferredYear) || new Date().getFullYear());
    setBatchName(batchName || `${inferredMonth || "Payroll"} ${Number(inferredYear) || new Date().getFullYear()}`.trim());
    setShowSaveModal(true);
  };

  const saveBatchToSupabase = async () => {
    if (saving) return;
    if (!batchMonth || !batchYear) {
      showError("Missing info", "Please provide month and year.");
      return;
    }
    if (rows.length === 0) {
      showError("Nothing to save", "Add or import rows first.");
      return;
    }

    setSaving(true);
    try {
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw authErr;
      const authUserId = authData?.user?.id;
      if (!authUserId) throw new Error("Not authenticated.");

      const batchInsert = {
        name: batchName || `Payroll ${batchMonth} ${batchYear}`,
        month: batchMonth,
        year: Number(batchYear),
        created_by: authUserId,
        created_by_name: userProfile?.full_name || userProfile?.email || null,
        row_count: rows.length,
        totals: {
          gross: totals.gross,
          tax: totals.tax,
          deductions: totals.deductions,
          net: totals.net,
          // Snapshot of the formulas this batch was calculated with,
          // so historical batches stay auditable if formulas change later.
          formulas: { ...activeFormulas },
        },
        is_locked: false,
      };

      const { data: batch, error: batchErr } = await supabase
        .from("payroll_batches")
        .insert(batchInsert)
        .select("*")
        .single();

      if (batchErr) throw batchErr;

      const rowInserts = rows.map((r) => {
        const { ot, gross, tax, net } = calcRow(r);
        return {
          batch_id: batch.id,
          employee_id: String(r.employee_id || ""),
          full_name: String(r.full_name || ""),
          department: String(r.department || ""),
          month: String(r.month || batchMonth || ""),
          year: Number(r.year || batchYear || new Date().getFullYear()),
          basic_salary: toNumber(r.basic_salary),
          allowances: toNumber(r.allowances),
          deductions: toNumber(r.deductions),
          overtime_hours: toNumber(r.overtime_hours),
          overtime_rate: toNumber(r.overtime_rate),
          overtime_amount: ot,
          bonus: toNumber(r.bonus),
          tax_rate: toNumber(r.tax_rate),
          tax_amount: tax,
          gross_salary: gross,
          net_salary: net,
          raw: r,
        };
      });

      const { error: rowsErr } = await supabase.from("payroll_batch_rows").insert(rowInserts);
      if (rowsErr) throw rowsErr;

      if (lockOnSave) {
        const { error: lockErr } = await supabase
          .from("payroll_batches")
          .update({
            is_locked: true,
            locked_at: new Date().toISOString(),
            locked_by: authUserId,
            locked_by_name: userProfile?.full_name || userProfile?.email || null,
          })
          .eq("id", batch.id);
        if (lockErr) throw lockErr;
        setIsLocked(true);
      }

      setShowSaveModal(false);
      success("Saved", lockOnSave ? "Batch saved and locked." : "Batch saved.");
      onBatchSaved?.(batch);
    } catch (err) {
      const msg = err?.message || "Failed to save payroll batch.";
      const lower = msg.toLowerCase();
      if (lower.includes("duplicate key") || lower.includes("unique") || err?.code === "23505") {
        showError("Save failed", "A batch for this month/year already exists (month/year is locked to one batch). Choose a different month/year or delete the existing batch in Supabase.");
      } else if (lower.includes("relation") || lower.includes("does not exist")) {
        showError("Save failed", "Tables not found. Run `create_payroll_calculator_schema.sql` in Supabase, then try again.");
      } else {
        showError("Save failed", msg);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {isLocked && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/70 dark:border-emerald-800 text-sm text-emerald-800 dark:text-emerald-300">
          <Lock className="w-4 h-4 shrink-0" />
          This run is locked after saving. Import and row edits are disabled — start a new import to run another month.
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-6">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Import a spreadsheet or add rows, then save a batch. Formulas below drive Gross, Tax, and Net.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={downloadTemplate}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200/70 dark:border-gray-700/60 bg-white/80 dark:bg-gray-900/60 text-slate-700 dark:text-slate-200 text-sm hover:shadow-sm"
          >
            <Download className="w-4 h-4" />
            Template
          </button>
          <button
            type="button"
            onClick={handlePickFile}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-60"
            disabled={isLocked}
          >
            <FileUp className="w-4 h-4" />
            Import
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={handleFileChangeWithCache}
          />
          <button
            type="button"
            onClick={handleManualAdd}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200/70 dark:border-gray-700/60 bg-white/80 dark:bg-gray-900/60 text-slate-700 dark:text-slate-200 text-sm disabled:opacity-60"
            disabled={isLocked}
          >
            <Plus className="w-4 h-4" />
            Add row
          </button>
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200/70 dark:border-gray-700/60 bg-white/80 dark:bg-gray-900/60 text-slate-700 dark:text-slate-200 text-sm"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
          <button
            type="button"
            onClick={exportXlsx}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200/70 dark:border-gray-700/60 bg-white/80 dark:bg-gray-900/60 text-slate-700 dark:text-slate-200 text-sm"
          >
            <Download className="w-4 h-4" />
            XLSX
          </button>
          <button
            type="button"
            onClick={openSave}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm disabled:opacity-60"
            disabled={rows.length === 0 || saving || formulaEditing}
            title={formulaEditing ? "Lock the formula before saving a batch" : undefined}
          >
            <Save className="w-4 h-4" />
            Save batch
          </button>
        </div>
      </div>

      {/* Calculation formulas (lockable) */}
      <div
        className={`mb-6 rounded-3xl border shadow-xl overflow-hidden backdrop-blur-md ${
          formulaEditing
            ? "border-amber-300/80 dark:border-amber-600/50 bg-amber-50/60 dark:bg-amber-900/10"
            : "border-slate-200/70 dark:border-gray-700/60 bg-white/80 dark:bg-gray-900/60"
        }`}
      >
        <div className="px-6 py-4 border-b border-slate-200/70 dark:border-gray-700/60 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${formulaEditing ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
              {formulaEditing ? <PencilLine className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Calculation Formulas</h2>
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    formulaEditing
                      ? "bg-amber-100 text-amber-800"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {formulaEditing ? "EDITING — NOT LOCKED" : "LOCKED"}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {formulaEditing
                  ? "Batches cannot be saved until the formula is locked again."
                  : formulaMeta?.locked_by_name
                    ? `Locked by ${formulaMeta.locked_by_name}${formulaMeta.locked_at ? ` on ${new Date(formulaMeta.locked_at).toLocaleString()}` : ""}`
                    : "All payroll rows are calculated with these formulas."}
              </p>
            </div>
          </div>

          {!formulaEditing && canEditFormula && (
            <button
              type="button"
              onClick={startFormulaEdit}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200/70 dark:border-gray-700/60 bg-white/80 dark:bg-gray-900/60 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-gray-800/60 transition text-sm"
            >
              <PencilLine className="w-4 h-4" />
              Edit formulas
            </button>
          )}
        </div>

        {!formulaEditing ? (
          <div className="px-6 py-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
            {FORMULA_FIELDS.map((f) => (
              <div key={f.key}>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{f.label}</div>
                <code className="block px-3 py-2 rounded-xl bg-slate-100/80 dark:bg-gray-800/60 text-sm text-slate-800 dark:text-slate-200 font-mono break-words">
                  {activeFormulas[f.key]}
                </code>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-5 space-y-4">
            {FORMULA_FIELDS.map((f) => (
              <div key={f.key}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">{f.label}</label>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Variables: {[...BASE_VARIABLES, ...STAGE_VARIABLES[f.key]].join(", ")}
                  </span>
                </div>
                <input
                  value={formulaDraft[f.key]}
                  onChange={(e) => setFormulaDraft((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  spellCheck={false}
                  className={`w-full px-3 py-2 rounded-xl border bg-white dark:bg-gray-950 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 ${
                    formulaDraftErrors[f.key]
                      ? "border-red-400 focus:ring-red-500"
                      : "border-slate-200 dark:border-gray-700 focus:ring-emerald-500"
                  }`}
                />
                {formulaDraftErrors[f.key] && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {formulaDraftErrors[f.key]}
                  </p>
                )}
              </div>
            ))}

            <div className="text-xs text-slate-500 dark:text-slate-400">
              Functions: {FORMULA_FUNCTIONS.join(", ")} · Operators: + − × ÷ % ^ ( ) ·{" "}
              <code className="font-mono">overtime</code> = overtime_hours × overtime_rate
            </div>

            <div className="rounded-2xl border border-slate-200/70 dark:border-gray-700/60 bg-white/70 dark:bg-gray-900/40 px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-200">
                Preview ({rows.length > 0 ? "first row" : "sample data"}):
              </span>
              {formulaDraftPreview.error ? (
                <span className="text-red-600 dark:text-red-400">{formulaDraftPreview.error}</span>
              ) : (
                <>
                  <span className="text-slate-600 dark:text-slate-400">
                    Gross: <span className="font-semibold text-slate-900 dark:text-white">{formulaDraftPreview.gross.toFixed(2)}</span>
                  </span>
                  <span className="text-slate-600 dark:text-slate-400">
                    Tax: <span className="font-semibold text-slate-900 dark:text-white">{formulaDraftPreview.tax.toFixed(2)}</span>
                  </span>
                  <span className="text-slate-600 dark:text-slate-400">
                    Net: <span className="font-semibold text-slate-900 dark:text-white">{formulaDraftPreview.net.toFixed(2)}</span>
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={cancelFormulaEdit}
                disabled={formulaSaving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200/70 dark:border-gray-700/60 bg-white dark:bg-gray-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-gray-800/60 transition text-sm"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                type="button"
                onClick={lockAndApplyFormulas}
                disabled={formulaSaving || Object.keys(formulaDraftErrors).length > 0}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition disabled:opacity-60 text-sm"
              >
                <Lock className="w-4 h-4" />
                {formulaSaving ? "Locking…" : "Lock & Apply"}
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showSaveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-xl rounded-3xl border border-slate-200/70 dark:border-gray-700/60 bg-white dark:bg-gray-900 shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-slate-200/70 dark:border-gray-700/60">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Save payroll batch</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Saves the current table to Supabase with audit fields. Locking prevents edits for this batch.
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Month</label>
                    <input
                      value={batchMonth}
                      onChange={(e) => setBatchMonth(e.target.value)}
                      placeholder="e.g. January"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Year</label>
                    <input
                      type="number"
                      value={batchYear}
                      onChange={(e) => setBatchYear(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Batch name</label>
                  <input
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                    placeholder="e.g. Payroll January 2026"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <label className="flex items-center gap-3 select-none">
                  <input
                    type="checkbox"
                    checked={lockOnSave}
                    onChange={(e) => setLockOnSave(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-200">
                    Lock batch after saving (recommended)
                  </span>
                </label>
              </div>

              <div className="px-6 py-5 border-t border-slate-200/70 dark:border-gray-700/60 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200/70 dark:border-gray-700/60 bg-white dark:bg-gray-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-gray-800/60 transition"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveBatchToSupabase}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition disabled:opacity-60"
                  disabled={saving}
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMapper && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.25 }}
            className="mb-6 rounded-3xl border border-slate-200/70 dark:border-gray-700/60 bg-white/80 dark:bg-gray-900/60 backdrop-blur-md shadow-xl overflow-hidden"
          >
            <div className="px-6 py-5 border-b border-slate-200/70 dark:border-gray-700/60">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Map columns</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Match your file headers to payroll fields. Required: Employee ID, Full Name, Basic Salary.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMapper(false)}
                  className="px-3 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-gray-800/60 transition"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                {FIELD_DEFS.map((f) => (
                  <div key={f.key} className="flex items-center gap-3">
                    <div className="w-40 text-sm font-medium text-slate-700 dark:text-slate-200">
                      {f.label}
                      {["employee_id", "full_name", "basic_salary"].includes(f.key) && (
                        <span className="text-red-500"> *</span>
                      )}
                    </div>
                    <select
                      value={mapping[f.key] || ""}
                      onChange={(e) => setMapping((prev) => ({ ...prev, [f.key]: e.target.value }))}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">— Not mapped —</option>
                      {rawHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={applyImportFromLast}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition"
                  >
                    Import
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMapping(Object.fromEntries(FIELD_DEFS.map((f) => [f.key, ""])));
                    }}
                    className="px-4 py-2.5 rounded-xl border border-slate-200/70 dark:border-gray-700/60 bg-white/80 dark:bg-gray-900/60 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-gray-800/60 transition"
                  >
                    Reset mapping
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/70 dark:border-gray-700/60 bg-white/60 dark:bg-gray-900/40 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200/70 dark:border-gray-700/60 text-sm font-medium text-slate-800 dark:text-slate-200">
                  Preview (first {Math.min(importPreviewRows.length, 25)} rows)
                </div>
                <div className="overflow-auto max-h-[360px]">
                  <table className="min-w-full text-sm">
                    <thead className="sticky top-0 bg-slate-50/90 dark:bg-gray-900/90 backdrop-blur border-b border-slate-200/70 dark:border-gray-700/60">
                      <tr>
                        {rawHeaders.slice(0, 6).map((h) => (
                          <th key={h} className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {importPreviewRows.map((r, idx) => (
                        <tr key={idx} className="border-b border-slate-200/60 dark:border-gray-800/60">
                          {rawHeaders.slice(0, 6).map((h) => (
                            <td key={h} className="px-3 py-2 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                              {String(r?.[h] ?? "")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="rounded-3xl border border-slate-200/70 dark:border-gray-700/60 bg-white/80 dark:bg-gray-900/60 backdrop-blur-md shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/70 dark:border-gray-700/60 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={rowSearch}
              onChange={(e) => setRowSearch(e.target.value)}
              placeholder="Filter rows by name, ID, or department…"
              className="pl-9 pr-3 py-2 w-72 max-w-full rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm"
            />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="text-slate-500">
              {displayedRows.length}/{rows.length} rows
            </span>
            <span className="text-slate-600 dark:text-slate-400">
              Gross: <span className="font-semibold text-slate-900 dark:text-white">{formatPayrollCurrency(totals.gross)}</span>
            </span>
            <span className="text-slate-600 dark:text-slate-400">
              Tax: <span className="font-semibold text-slate-900 dark:text-white">{formatPayrollCurrency(totals.tax)}</span>
            </span>
            <span className="text-slate-600 dark:text-slate-400">
              Net: <span className="font-semibold text-blue-600">{formatPayrollCurrency(totals.net)}</span>
            </span>
          </div>
        </div>

        <div className="overflow-auto">
          <table className="min-w-[1100px] w-full text-sm">
            <thead className="bg-slate-50/90 dark:bg-gray-900/90 border-b border-slate-200/70 dark:border-gray-700/60">
              <tr>
                {FIELD_DEFS.map((f) => (
                  <th key={f.key} className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {f.label}
                  </th>
                ))}
                <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  Gross
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  Tax
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  Net
                </th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={FIELD_DEFS.length + 4} className="px-6 py-14 text-center text-slate-600 dark:text-slate-400">
                    Import a CSV/Excel file or add a row to start calculating payroll.
                  </td>
                </tr>
              ) : displayedRows.length === 0 ? (
                <tr>
                  <td colSpan={FIELD_DEFS.length + 4} className="px-6 py-10 text-center text-slate-500">
                    No rows match “{rowSearch}”.
                  </td>
                </tr>
              ) : (
                displayedRows.map((r) => {
                  const { gross, tax, net } = calcRow(r);
                  return (
                    <tr key={r.id} className="border-b border-slate-200/60 dark:border-gray-800/60">
                      {FIELD_DEFS.map((f) => (
                        <td key={f.key} className="px-4 py-2.5">
                          <input
                            type={f.type}
                            value={r[f.key] ?? ""}
                            onChange={(e) => handleCellChange(r.id, f.key, e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isLocked}
                          />
                        </td>
                      ))}
                      <td className="px-4 py-2.5 font-semibold text-emerald-600 whitespace-nowrap">
                        {formatPayrollCurrency(gross)}
                      </td>
                      <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {formatPayrollCurrency(tax)}
                      </td>
                      <td className="px-4 py-2.5 font-semibold text-blue-600 whitespace-nowrap">
                        {formatPayrollCurrency(net)}
                      </td>
                      <td className="px-4 py-2.5">
                        <button
                          type="button"
                          onClick={() => removeRow(r.id)}
                          className="p-2 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                          title="Remove row"
                          disabled={isLocked}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

