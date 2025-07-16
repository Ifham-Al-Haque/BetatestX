// src/pages/EmployeeForm.jsx
import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import Sidebar from "../components/Sidebar";

export default function EmployeeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    name: "",
    employee_id: "",
    department: "",
    designation: "",
    photo_url: "",
    summary: "",
    key_roles: "",
    extra_responsibilities: "",
    access_list: "",
    assets: "",
    auth_user_id: null,
    reporting_manager_id: null,
  });

  const [loading, setLoading] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [managers, setManagers] = useState([]);

  // Fetch auth users (requires service role token setup)
  useEffect(() => {
    async function fetchUsers() {
      const { data, error } = await supabase.auth.admin.listUsers();
      if (error) console.error("Error fetching users:", error.message);
      else setAvailableUsers(data?.users || []);
    }
    fetchUsers();
  }, []);

  // Fetch managers
  useEffect(() => {
    async function fetchManagers() {
      const { data, error } = await supabase
        .from("employees")
        .select("id, name, employee_id")
        .neq("id", id);
      if (!error) setManagers(data);
    }
    fetchManagers();
  }, [id]);

  // Fetch employee for edit
  const fetchEmployee = useCallback(async () => {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("id", id)
      .single();

    if (!error && data) {
      setForm(data);
    }
  }, [id]);

  useEffect(() => {
    if (isEdit) fetchEmployee();
  }, [isEdit, fetchEmployee]);

  // Submit form
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEdit) {
        const { error } = await supabase
          .from("employees")
          .update(form)
          .eq("id", id);
        if (error) alert("Update failed: " + error.message);
        else navigate("/employees");
      } else {
        const { error } = await supabase.from("employees").insert([form]);
        if (error) alert("Creation failed: " + error.message);
        else navigate("/employees");
      }
    } catch (err) {
      console.error("Form error:", err.message);
      alert("An unexpected error occurred.");
    }

    setLoading(false);
  }

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <div className="ml-64 p-8 w-full max-w-3xl">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">
          {isEdit ? "Edit" : "Add"} Employee
        </h2>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-4 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md"
        >
          <input
            type="text"
            placeholder="Full Name"
            className="p-2 border rounded dark:bg-gray-700"
            value={form.name}
            required
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            type="text"
            placeholder="Employee ID"
            className="p-2 border rounded dark:bg-gray-700"
            value={form.employee_id}
            required
            onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
          />
          <input
            type="text"
            placeholder="Department"
            className="p-2 border rounded dark:bg-gray-700"
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
          />
          <input
            type="text"
            placeholder="Designation"
            className="p-2 border rounded dark:bg-gray-700"
            value={form.designation}
            onChange={(e) => setForm({ ...form, designation: e.target.value })}
          />
          <input
            type="url"
            placeholder="Photo URL"
            className="p-2 border rounded dark:bg-gray-700"
            value={form.photo_url}
            onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
          />

          <textarea
            placeholder="Summary / Bio"
            className="p-2 border rounded dark:bg-gray-700"
            rows={3}
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
          />

          <textarea
            placeholder="Key Roles (comma-separated)"
            className="p-2 border rounded dark:bg-gray-700"
            rows={2}
            value={form.key_roles}
            onChange={(e) =>
              setForm({ ...form, key_roles: e.target.value })
            }
          />

          <textarea
            placeholder="Extra Responsibilities (comma-separated)"
            className="p-2 border rounded dark:bg-gray-700"
            rows={2}
            value={form.extra_responsibilities}
            onChange={(e) =>
              setForm({ ...form, extra_responsibilities: e.target.value })
            }
          />

          <textarea
            placeholder="Access Provided (comma-separated)"
            className="p-2 border rounded dark:bg-gray-700"
            rows={2}
            value={form.access_list}
            onChange={(e) => setForm({ ...form, access_list: e.target.value })}
          />

          <textarea
            placeholder="Assets Assigned (comma-separated)"
            className="p-2 border rounded dark:bg-gray-700"
            rows={2}
            value={form.assets}
            onChange={(e) => setForm({ ...form, assets: e.target.value })}
          />

          {/* Reporting Manager Dropdown */}
          <select
            value={form.reporting_manager_id || ""}
            onChange={(e) =>
              setForm({
                ...form,
                reporting_manager_id:
                  e.target.value === "" ? null : e.target.value,
              })
            }
            className="p-2 border rounded dark:bg-gray-700"
          >
            <option value="">Select Reporting Manager (optional)</option>
            {managers.map((mgr) => (
              <option key={mgr.id} value={mgr.id}>
                {mgr.name} ({mgr.employee_id})
              </option>
            ))}
          </select>

          {/* Auth User Dropdown */}
          <select
            value={form.auth_user_id || ""}
            onChange={(e) =>
              setForm({
                ...form,
                auth_user_id:
                  e.target.value === "" ? null : e.target.value,
              })
            }
            className="p-2 border rounded dark:bg-gray-700"
          >
            <option value="">Select Auth User (optional)</option>
            {availableUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.email}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
          >
            {loading
              ? isEdit
                ? "Updating..."
                : "Creating..."
              : isEdit
              ? "Update"
              : "Create"}{" "}
            Employee
          </button>
        </form>
      </div>
    </div>
  );
}


