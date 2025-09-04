// src/components/EditExtraDutiesForm.jsx
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useParams, useNavigate } from "react-router-dom";

export default function EditExtraDutiesForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [duties, setDuties] = useState([{ title: "", description: "" }]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchDuties = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("employees")
        .select("extra_duties_detailed")
        .eq("id", id)
        .single();

      if (!error && data?.extra_duties_detailed) {
        setDuties(data.extra_duties_detailed);
      }
      setLoading(false);
    };

    fetchDuties();
  }, [id]);

  const handleChange = (index, field, value) => {
    const updated = [...duties];
    updated[index][field] = value;
    setDuties(updated);
  };

  const addDuty = () => setDuties([...duties, { title: "", description: "" }]);

  const removeDuty = (index) => {
    const updated = [...duties];
    updated.splice(index, 1);
    setDuties(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from("employees")
      .update({ extra_duties_detailed: duties })
      .eq("id", id);

    setSaving(false);

    if (!error) {
      alert("Extra duties updated successfully.");
              navigate(`/employee/${id}`);
    } else {
      alert("Error updating extra duties.");
      console.error(error.message);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-4">Edit Extra Duties</h2>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {duties.map((duty, index) => (
              <div
                key={index}
                className="border p-4 rounded bg-gray-50 dark:bg-gray-700"
              >
                <div className="mb-2">
                  <label className="block text-sm font-medium mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={duty.title}
                    onChange={(e) => handleChange(index, "title", e.target.value)}
                    className="w-full p-2 border rounded dark:bg-gray-900"
                    required
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-sm font-medium mb-1">
                    Description
                  </label>
                  <textarea
                    value={duty.description}
                    onChange={(e) =>
                      handleChange(index, "description", e.target.value)
                    }
                    className="w-full p-2 border rounded dark:bg-gray-900"
                    rows={3}
                    required
                  />
                </div>
                {duties.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDuty(index)}
                    className="text-red-500 text-sm hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}

            <div className="flex items-center gap-4 mt-4">
              <button
                type="button"
                onClick={addDuty}
                className="bg-gray-200 dark:bg-gray-700 text-sm px-3 py-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                + Add More
              </button>

              <button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

