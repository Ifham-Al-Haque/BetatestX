// src/components/EditResponsibilitiesAndDuties.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function EditResponsibilitiesAndDuties() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [keyRoles, setKeyRoles] = useState([{ title: "", description: "" }]);
  const [extraDuties, setExtraDuties] = useState([{ title: "", description: "" }]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("employees")
        .select("key_roles_detailed, extra_duties_detailed")
        .eq("id", id)
        .single();

      if (!error) {
        if (data.key_roles_detailed?.length) setKeyRoles(data.key_roles_detailed);
        if (data.extra_duties_detailed?.length) setExtraDuties(data.extra_duties_detailed);
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const handleChange = (type, index, field, value) => {
    const updater = type === "key" ? [...keyRoles] : [...extraDuties];
    updater[index][field] = value;
    type === "key" ? setKeyRoles(updater) : setExtraDuties(updater);
  };

  const addField = (type) => {
    const newField = { title: "", description: "" };
    type === "key"
      ? setKeyRoles([...keyRoles, newField])
      : setExtraDuties([...extraDuties, newField]);
  };

  const removeField = (type, index) => {
    const updater = type === "key" ? [...keyRoles] : [...extraDuties];
    updater.splice(index, 1);
    type === "key" ? setKeyRoles(updater) : setExtraDuties(updater);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from("employees")
      .update({
        key_roles_detailed: keyRoles,
        extra_duties_detailed: extraDuties,
      })
      .eq("id", id);

    setSaving(false);

    if (!error) {
      alert("Responsibilities and duties updated successfully.");
              navigate(`/employee/${id}`);
    } else {
      alert("Error updating.");
      console.error(error.message);
    }
  };

  const renderFields = (type, items) => (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={index} className="bg-gray-100 dark:bg-gray-800 p-4 rounded">
          <input
            type="text"
            value={item.title}
            onChange={(e) => handleChange(type, index, "title", e.target.value)}
            placeholder="Title"
            className="w-full mb-2 p-2 border rounded dark:bg-gray-900"
            required
          />
          <textarea
            value={item.description}
            onChange={(e) => handleChange(type, index, "description", e.target.value)}
            placeholder="Description"
            className="w-full p-2 border rounded dark:bg-gray-900"
            rows={3}
            required
          />
          {items.length > 1 && (
            <button
              type="button"
              onClick={() => removeField(type, index)}
              className="text-red-500 text-sm mt-1 hover:underline"
            >
              Remove
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => addField(type)}
        className="bg-gray-200 dark:bg-gray-700 text-sm px-3 py-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
      >
        + Add More
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8 text-gray-800 dark:text-gray-100">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-6">Edit Responsibilities & Extra Duties</h2>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold mb-2">Key Responsibilities</h3>
              {renderFields("key", keyRoles)}
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Extra Duties</h3>
              {renderFields("duty", extraDuties)}
            </div>

            <button
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
