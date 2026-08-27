import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Building2,
  Check,
  GitBranch,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  Archive,
  X,
} from "lucide-react";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import {
  useDepartmentCatalog,
  useDepartmentCatalogMutations,
} from "../hooks/useDepartmentCatalog";

const MANAGE_ROLES = new Set(["admin", "hr_manager", "super_admin"]);

export default function DepartmentManagement() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { success, error: showError } = useToast();
  const canManage = MANAGE_ROLES.has(userProfile?.role);

  const { data: catalog, isLoading } = useDepartmentCatalog(true);
  const mutations = useDepartmentCatalogMutations();

  const [newDepartmentName, setNewDepartmentName] = useState("");
  const [newBranchName, setNewBranchName] = useState({});
  const [editingDepartmentId, setEditingDepartmentId] = useState("");
  const [editingBranchId, setEditingBranchId] = useState("");
  const [departmentDraft, setDepartmentDraft] = useState("");
  const [branchDraft, setBranchDraft] = useState("");

  const departments = catalog?.departments || [];
  const branches = catalog?.branches || [];
  const fromDatabase = Boolean(catalog?.fromDatabase);

  const branchesByDepartment = useMemo(() => {
    const grouped = new Map();
    branches.forEach((branch) => {
      const list = grouped.get(branch.department_id) || [];
      list.push(branch);
      grouped.set(branch.department_id, list);
    });
    return grouped;
  }, [branches]);

  const run = async (fn, okMessage) => {
    try {
      await fn();
      success("Saved", okMessage);
    } catch (err) {
      showError("Could not save", err.message || "Please try again.");
    }
  };

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    await run(
      () => mutations.createDepartment.mutateAsync({ name: newDepartmentName }),
      "Department added."
    );
    setNewDepartmentName("");
  };

  if (!canManage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-3xl mx-auto px-4 py-16">
          <div className="rounded-2xl border border-amber-200 bg-white p-8 dark:border-amber-900/40 dark:bg-gray-800">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Departments</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Only admin and HR manager can create or edit departments.
            </p>
            <button
              type="button"
              onClick={() => navigate("/employees")}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to employees
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 md:p-8 text-white shadow-xl mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <p className="text-blue-100 text-sm font-medium mb-1">HR Panel</p>
              <h1 className="text-3xl font-bold mb-2">Departments & Branches</h1>
              <p className="text-blue-100 max-w-2xl">
                Create and edit the lists used on the employee form. Existing employee records keep their current values until you rename a department or branch.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/employees")}
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 border border-white/20 hover:bg-white/25"
            >
              <ArrowLeft className="h-4 w-4" />
              Employees
            </button>
          </div>
        </motion.div>

        {!fromDatabase && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
            Showing the built-in list until you run <code className="font-mono">create_department_catalog.sql</code> in Supabase. After that, new departments you add here will appear on the employee form.
          </div>
        )}

        <form
          onSubmit={handleCreateDepartment}
          className="mb-6 rounded-2xl border border-gray-200/70 bg-white/90 p-4 dark:border-gray-700/60 dark:bg-gray-800/90"
        >
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Add department
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={newDepartmentName}
              onChange={(e) => setNewDepartmentName(e.target.value)}
              placeholder="e.g. Management"
              className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              disabled={!fromDatabase}
            />
            <button
              type="submit"
              disabled={!fromDatabase || !newDepartmentName.trim() || mutations.createDepartment.isPending}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 font-medium text-white disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Add department
            </button>
          </div>
        </form>

        {isLoading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-gray-500 dark:border-gray-700 dark:bg-gray-800">
            Loading departments…
          </div>
        ) : (
          <div className="space-y-4">
            {departments.map((department) => {
              const deptBranches = branchesByDepartment.get(department.id) || [];
              const inactive = department.is_active === false;
              return (
                <div
                  key={department.id}
                  className={`rounded-2xl border bg-white/90 p-5 dark:bg-gray-800/90 ${
                    inactive
                      ? "border-gray-200 opacity-70 dark:border-gray-700"
                      : "border-gray-200/70 dark:border-gray-700/60"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="rounded-xl bg-blue-100 p-2.5 dark:bg-blue-900/30">
                        <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      {editingDepartmentId === department.id ? (
                        <input
                          value={departmentDraft}
                          onChange={(e) => setDepartmentDraft(e.target.value)}
                          className="flex-1 rounded-lg border border-blue-300 px-3 py-2 dark:border-blue-700 dark:bg-gray-900 dark:text-white"
                        />
                      ) : (
                        <div className="min-w-0">
                          <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                            {department.name}
                          </h2>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {deptBranches.length} branch{deptBranches.length === 1 ? "" : "es"}
                            {inactive ? " · Archived" : ""}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {editingDepartmentId === department.id ? (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              run(async () => {
                                await mutations.updateDepartment.mutateAsync({
                                  department,
                                  name: departmentDraft,
                                });
                                setEditingDepartmentId("");
                              }, "Department renamed. Matching employee records were updated.")
                            }
                            className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                            title="Save"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingDepartmentId("")}
                            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            disabled={!fromDatabase}
                            onClick={() => {
                              setEditingDepartmentId(department.id);
                              setDepartmentDraft(department.name);
                            }}
                            className="rounded-lg p-2 text-indigo-600 hover:bg-indigo-50 disabled:opacity-40 dark:hover:bg-indigo-900/20"
                            title="Rename"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          {inactive ? (
                            <button
                              type="button"
                              disabled={!fromDatabase}
                              onClick={() =>
                                run(
                                  () => mutations.restoreDepartment.mutateAsync(department),
                                  "Department restored."
                                )
                              }
                              className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                              title="Restore"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={!fromDatabase}
                              onClick={() =>
                                run(
                                  () => mutations.archiveDepartment.mutateAsync(department),
                                  "Department archived. It will no longer appear on new employee forms."
                                )
                              }
                              className="rounded-lg p-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                              title="Archive"
                            >
                              <Archive className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={!fromDatabase}
                            onClick={() => {
                              if (!window.confirm(`Delete ${department.name}? This is only allowed if no employees use it.`)) return;
                              run(
                                () => mutations.deleteDepartment.mutateAsync(department),
                                "Department deleted."
                              );
                            }}
                            className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 pl-0 md:pl-14">
                    {deptBranches.map((branch) => (
                      <div
                        key={branch.id}
                        className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2 dark:border-gray-700 dark:bg-gray-900/40"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <GitBranch className="h-4 w-4 shrink-0 text-gray-400" />
                          {editingBranchId === branch.id ? (
                            <input
                              value={branchDraft}
                              onChange={(e) => setBranchDraft(e.target.value)}
                              className="flex-1 rounded-lg border border-blue-300 px-3 py-1.5 text-sm dark:border-blue-700 dark:bg-gray-800 dark:text-white"
                            />
                          ) : (
                            <span className="text-sm text-gray-800 dark:text-gray-200 truncate">
                              {branch.name}
                              {branch.is_active === false ? " (archived)" : ""}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {editingBranchId === branch.id ? (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  run(async () => {
                                    await mutations.updateBranch.mutateAsync({
                                      branch,
                                      name: branchDraft,
                                    });
                                    setEditingBranchId("");
                                  }, "Branch renamed. Matching employee records were updated.")
                                }
                                className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingBranchId("")}
                                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                disabled={!fromDatabase}
                                onClick={() => {
                                  setEditingBranchId(branch.id);
                                  setBranchDraft(branch.name);
                                }}
                                className="rounded-lg p-1.5 text-indigo-600 hover:bg-indigo-50 disabled:opacity-40"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              {branch.is_active === false ? (
                                <button
                                  type="button"
                                  disabled={!fromDatabase}
                                  onClick={() =>
                                    run(
                                      () => mutations.restoreBranch.mutateAsync(branch),
                                      "Branch restored."
                                    )
                                  }
                                  className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={!fromDatabase}
                                  onClick={() =>
                                    run(
                                      () => mutations.archiveBranch.mutateAsync(branch),
                                      "Branch archived."
                                    )
                                  }
                                  className="rounded-lg p-1.5 text-amber-600 hover:bg-amber-50"
                                >
                                  <Archive className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                type="button"
                                disabled={!fromDatabase}
                                onClick={() => {
                                  if (!window.confirm(`Delete branch ${branch.name}? This is only allowed if no employees use it.`)) return;
                                  run(
                                    () => mutations.deleteBranch.mutateAsync(branch),
                                    "Branch deleted."
                                  );
                                }}
                                className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        run(async () => {
                          await mutations.createBranch.mutateAsync({
                            department,
                            name: newBranchName[department.id] || "",
                          });
                          setNewBranchName((prev) => ({ ...prev, [department.id]: "" }));
                        }, "Branch added.");
                      }}
                      className="flex gap-2 pt-1"
                    >
                      <input
                        value={newBranchName[department.id] || ""}
                        onChange={(e) =>
                          setNewBranchName((prev) => ({ ...prev, [department.id]: e.target.value }))
                        }
                        placeholder={`Add branch under ${department.name}`}
                        disabled={!fromDatabase || inactive}
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      />
                      <button
                        type="submit"
                        disabled={!fromDatabase || inactive || !(newBranchName[department.id] || "").trim()}
                        className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white disabled:opacity-50"
                      >
                        <Plus className="h-4 w-4" />
                        Add
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
