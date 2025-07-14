// src/pages/Assets.jsx
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import Sidebar from "../components/Sidebar";

export default function Assets() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null); // ✅ Fixed missing state
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    status: "In Stock",
    assigned_to: "",
  });

  useEffect(() => {
    fetchAssets();
  }, []);

  async function fetchAssets() {
    setLoading(true);
    const { data, error } = await supabase
      .from("assets")
      .select(`
        id, name, type, status, created_at,
        assigned_to,
        employees (name)
      `);

    if (error) {
      console.error("Error fetching assets:", error.message);
    } else {
      const enriched = data.map((asset) => ({
        ...asset,
        employee_name: asset.employees?.name,
      }));
      setAssets(enriched);
    }
    setLoading(false);
  }

  async function handleDelete(id) {
    const confirmDelete = window.confirm("Are you sure you want to delete this asset?");
    if (!confirmDelete) return;

    const { error } = await supabase.from("assets").delete().eq("id", id);
    if (error) {
      alert("Delete failed: " + error.message);
    } else {
      fetchAssets();
    }
  }

  function handleEdit(asset) {
    setEditingAsset(asset);
    setFormData({
      name: asset.name,
      type: asset.type,
      status: asset.status,
      assigned_to: asset.assigned_to || "",
    });
    setShowForm(true);
  }

  function handleAddNew() {
    setEditingAsset(null);
    setFormData({
      name: "",
      type: "",
      status: "In Stock",
      assigned_to: "",
    });
    setShowForm(true);
  }

  async function handleFormSubmit(e) {
    e.preventDefault();

    const payload = {
      name: formData.name,
      type: formData.type,
      status: formData.status,
      assigned_to: formData.assigned_to || null,
    };

    if (editingAsset) {
      const { error } = await supabase
        .from("assets")
        .update(payload)
        .eq("id", editingAsset.id);

      if (error) {
        alert("Update failed: " + error.message);
      }
    } else {
      const { error } = await supabase.from("assets").insert(payload);
      if (error) {
        alert("Add failed: " + error.message);
      }
    }

    setShowForm(false);
    fetchAssets();
  }

  const filteredAssets = assets.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(search) ||
      a.type.toLowerCase().includes(search);
    const matchesStatus = statusFilter ? a.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex">
      <Sidebar />
      <div className="ml-64 p-6 w-full">
        <h2 className="text-2xl font-bold mb-4">IT Asset List</h2>

        <div className="flex items-center justify-between mb-4">
          <input
            type="text"
            placeholder="Search by name or type"
            className="border p-2 rounded w-64"
            onChange={(e) => setSearch(e.target.value.toLowerCase())}
          />
          <select
            className="border p-2 rounded"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="In Stock">In Stock</option>
            <option value="Assigned">Assigned</option>
            <option value="Retired">Retired</option>
          </select>
        </div>

        <button
          onClick={handleAddNew}
          className="mb-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          ➕ Add New Asset
        </button>

        {showForm && (
          <form
            onSubmit={handleFormSubmit}
            className="bg-gray-100 p-4 mb-4 rounded shadow"
          >
            <h3 className="text-lg font-semibold mb-2">
              {editingAsset ? "Edit Asset" : "Add New Asset"}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Asset Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                className="p-2 border rounded"
              />
              <input
                type="text"
                placeholder="Type (e.g., Laptop)"
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                required
                className="p-2 border rounded"
              />
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="p-2 border rounded"
              >
                <option value="In Stock">In Stock</option>
                <option value="Assigned">Assigned</option>
                <option value="Retired">Retired</option>
              </select>
              <input
                type="text"
                placeholder="Assigned To (employee ID)"
                value={formData.assigned_to}
                onChange={(e) =>
                  setFormData({ ...formData, assigned_to: e.target.value })
                }
                className="p-2 border rounded"
              />
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                {editingAsset ? "Update" : "Add"}
              </button>
              <button
                type="button"
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <p>Loading assets...</p>
        ) : (
          <table className="min-w-full bg-white border border-gray-200 shadow rounded">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-3 border-b">ID</th>
                <th className="p-3 border-b">Name</th>
                <th className="p-3 border-b">Type</th>
                <th className="p-3 border-b">Status</th>
                <th className="p-3 border-b">Assigned To</th>
                <th className="p-3 border-b">Created</th>
                <th className="p-3 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset) => (
                <tr key={asset.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{asset.id}</td>
                  <td className="p-3">{asset.name}</td>
                  <td className="p-3">{asset.type}</td>
                  <td className="p-3">{asset.status}</td>
                  <td className="p-3">{asset.employee_name ?? "Unassigned"}</td>
                  <td className="p-3">
                    {new Date(asset.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-3 space-x-2">
                    <button
                      className="text-blue-600 hover:underline"
                      onClick={() => handleEdit(asset)}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-600 hover:underline"
                      onClick={() => handleDelete(asset.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
