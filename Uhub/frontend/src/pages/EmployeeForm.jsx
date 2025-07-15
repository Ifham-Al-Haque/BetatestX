// src/pages/EmployeeForm.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import Sidebar from "../components/Sidebar";

export default function EmployeeForm() {
  const { id } = useParams(); // for edit mode
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
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      fetchEmployee();
    }
  }, [id]);

  async function fetchEmployee() {
    const { data, error } = await supabase.from("employees").select("*").eq("id", id).single();
    if (!error && data) {
      setForm(data);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    if (isEdit) {
      const { error } = await supabase.from("employees").update(form).eq("id", id);
      if (error) alert("Update failed: " + error.message);
      else navigate("/employees");
    } else {
      const { error } = await supabase.from("employees").insert([form]);
      if (error) alert("Creation failed: " + error.message);
      else navigate("/employees");
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

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
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
            onChange={(e) => setForm({ ...form, key_roles: e.target.value })}
          />

          <textarea
            placeholder="Extra Responsibilities (comma-separated)"
            className="p-2 border rounded dark:bg-gray-700"
            rows={2}
            value={form.extra_responsibilities}
            onChange={(e) => setForm({ ...form, extra_responsibilities: e.target.value })}
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

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
          >
            {isEdit ? "Update" : "Create"} Employee
          </button>
        </form>
      </div>
    </div>
  );
}
