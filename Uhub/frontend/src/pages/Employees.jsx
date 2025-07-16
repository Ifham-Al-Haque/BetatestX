import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { ChevronRight, Trash2, Pencil } from "lucide-react";

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEmployees();
  }, []);

  async function fetchEmployees() {
    setLoading(true);
    const { data, error } = await supabase
      .from("employees")
      .select(`
        id,
        name,
        employee_id,
        department,
        designation,
        reporting_manager:reporting_manager_id (
          name,
          employee_id
        )
      `);
    if (error) {
      console.error("Error fetching employees:", error.message);
    } else {
      setEmployees(data);
    }
    setLoading(false);
  }

  async function handleDelete(id) {
    const confirm = window.confirm("Are you sure you want to delete this employee?");
    if (!confirm) return;

    const { error } = await supabase.from("employees").delete().eq("id", id);
    if (error) {
      alert("Failed to delete: " + error.message);
    } else {
      fetchEmployees();
    }
  }

  const filteredEmployees = employees
    .filter((emp) =>
      emp.name?.toLowerCase().includes(search.toLowerCase()) ||
      emp.department?.toLowerCase().includes(search.toLowerCase()) ||
      emp.designation?.toLowerCase().includes(search.toLowerCase()) ||
      emp.employee_id?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const valA = a[sortKey]?.toLowerCase?.() || "";
      const valB = b[sortKey]?.toLowerCase?.() || "";
      return sortOrder === "asc"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    });

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <div className="ml-64 p-6 w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            Employee Records
          </h2>
          <button
            onClick={() => navigate("/employees/new")}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
          >
            + Add Employee
          </button>
        </div>

        {/* Search + Sort UI */}
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <input
            type="text"
            placeholder="Search by name, department, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="p-2 border rounded w-full max-w-md"
          />
          <div className="flex gap-2">
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value)}
              className="p-2 border rounded"
            >
              <option value="name">Name</option>
              <option value="department">Department</option>
              <option value="designation">Designation</option>
              <option value="employee_id">Employee ID</option>
            </select>
            <button
              onClick={() =>
                setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
              }
              className="px-3 py-2 bg-blue-600 text-white rounded"
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-600 dark:text-gray-300">Loading employees...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg shadow">
              <thead className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-left">
                <tr>
                  <th className="p-3">Employee ID</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Designation</th>
                  <th className="p-3">Manager</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((emp) => (
                    <tr
                      key={emp.id}
                      className="border-t border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="p-3">{emp.employee_id}</td>
                      <td className="p-3">{emp.name}</td>
                      <td className="p-3">{emp.department}</td>
                      <td className="p-3">{emp.designation}</td>
                      <td className="p-3">
                        {emp.reporting_manager
                          ? `${emp.reporting_manager.name} (${emp.reporting_manager.employee_id})`
                          : "-"}
                      </td>
                      <td className="p-3 flex justify-center items-center space-x-2">
                        <button
                          onClick={() => navigate(`/employees/${emp.id}`)}
                          title="View"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <ChevronRight size={20} />
                        </button>
                        <button
                          onClick={() => navigate(`/employees/edit/${emp.id}`)}
                          title="Edit"
                          className="text-yellow-500 hover:text-yellow-600"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(emp.id)}
                          title="Delete"
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-4 text-center text-gray-600 dark:text-gray-300"
                    >
                      No employees found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
