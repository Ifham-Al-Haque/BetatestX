// src/pages/Assets.jsx
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import Sidebar from "../components/Sidebar";

export default function Assets() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssets();
  }, []);

  async function fetchAssets() {
    setLoading(true);
    const { data, error } = await supabase
      .from("assets")
      .select("id, name, type, status, assigned_to, created_at");

    if (error) {
      console.error("Error fetching assets:", error.message);
    } else {
      setAssets(data);
    }
    setLoading(false);
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="ml-64 p-6 w-full">
        <h2 className="text-2xl font-bold mb-4">IT Asset List</h2>

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
              </tr>
            </thead>
            <tbody>
  {assets.map((asset) => (
    <tr key={asset.id} className="border-t hover:bg-gray-50">
      <td className="p-3">{asset.id}</td>
      <td className="p-3">{asset.name}</td>
      <td className="p-3">{asset.type}</td>
      <td className="p-3">{asset.status}</td>
      <td className="p-3">
        {asset.employee_name ?? "Unassigned"} {/* We'll add this in next step */}
      </td>
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

async function handleDelete(id) {
  const confirm = window.confirm("Are you sure you want to delete this asset?");
  if (!confirm) return;

  const { error } = await supabase.from("assets").delete().eq("id", id);
  if (error) {
    alert("Delete failed: " + error.message);
  } else {
    fetchAssets(); // Refresh list
  }
}

const { data, error } = await supabase
  .from("assets")
  .select(`
    id, name, type, status, created_at,
    assigned_to,
    employees (name)
  `);

  const enriched = data.map((asset) => ({
  ...asset,
  employee_name: asset.employees?.name,
}));
setAssets(enriched)

function handleEdit(asset) {
  alert("Edit feature coming soon. (Asset: " + asset.name + ")");
}

          </table>
        )}
      </div>
    </div>
  );
}
