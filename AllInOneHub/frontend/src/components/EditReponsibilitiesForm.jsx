// src/components/EditResponsibilitiesForm.jsx
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useParams, useNavigate } from "react-router-dom";

export default function EditResponsibilitiesForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [roles, setRoles] = useState([{ title: "", description: "" }]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchRoles = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("employees")
        .select("key_roles_detailed")
        .eq("id", id)
        .single();

      if (!error && data?.key_roles_detailed) {
        setRoles(data.key_roles_detailed);
      }
      setLoading(false);
    };

    fetchRoles();
  }, [id]);

  const handleChange = (index, field, value) => {
    const updated = [...roles];
    updated[index][field] = value;
    setRoles(updated);
  };

  const addRole = () => setRoles([...roles, { title: "", description: "" }]);

  const removeRole = (index) => {
    const updated = [...roles];
    updated.splice(index, 1);
    setRoles(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from("employees")
      .update({ key_roles_detailed: roles })
      .eq("id", id);

    setSaving(false);

    if (!error) {
      alert("Responsibilities updated successfully.");
              navigate(`/employee/${id}`);
    } else {
      alert("Error updating responsibilities.");
      console.error(error.message);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-100 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">
          Edit Key Responsibilities
        </h2>

        {loading ? (
          <p className="text-gray-600">Loading...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {roles.map((role, index) => (
              <div key={index} className="border p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Title
                </label>
                <input
                  type="text"
                  value={role.title}
                  onChange={(e) => handleChange(index, "title", e.target.value)}
                  className="w-full p-2 mt-1 mb-3 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  required
                />

                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Description
                </label>
                <textarea
                  value={role.description}
                  onChange={(e) => handleChange(index, "description", e.target.value)}
                  className="w-full p-2 mt-1 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  rows={3}
                  required
                ></textarea>

                <div className="text-right mt-2">
                  {roles.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRole(index)}
                      className="text-sm text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}

            <div className="flex justify-between items-center mt-6">
              <button
                type="button"
                onClick={addRole}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                + Add More
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
