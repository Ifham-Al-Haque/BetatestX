// src/pages/ExpenseTracker.jsx
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../supabaseClient";


export default function ExpenseTracker() {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({
    service_name: "",
    amount_aed: "",
    currency: "AED",
    months: "",
    service_status: "Active",
    department: "",
    date_paid: "",
  });
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) setUser(data.user);
    };
    fetchUser();
  }, []);

  const fetchExpenses = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("user_id", user.id)
      .order("date_paid", { ascending: false });

    if (error) {
      alert("Error fetching expenses: " + error.message);
    } else {
      setExpenses(data);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) fetchExpenses();
  }, [user, fetchExpenses]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user) return alert("User not logged in");

    const newExpense = { ...form, user_id: user.id };
    setLoading(true);
    const { error } = await supabase.from("expenses").insert([newExpense]);

    if (!error) {
      setForm({
        service_name: "",
        amount_aed: "",
        currency: "AED",
        months: "",
        service_status: "Active",
        department: "",
        date_paid: "",
      });
      fetchExpenses();
    } else {
      alert("Insert failed: " + error.message);
    }
    setLoading(false);
  }

  function startEdit(expense) {
    setEditingId(expense.id);
    setEditForm({ ...expense });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({});
  }

  async function saveEdit() {
    if (!user) return alert("User not logged in");
    setLoading(true);
    const { error } = await supabase
      .from("expenses")
      .update({
        service_name: editForm.service_name,
        amount_aed: editForm.amount_aed,
        currency: editForm.currency,
        months: editForm.months,
        service_status: editForm.service_status,
        department: editForm.department,
        date_paid: editForm.date_paid,
      })
      .eq("id", editingId)
      .eq("user_id", user.id);

    if (error) {
      alert("Update failed: " + error.message);
    } else {
      cancelEdit();
      fetchExpenses();
    }
    setLoading(false);
  }

  async function deleteExpense(id) {
    if (!user) return alert("User not logged in");
    if (!window.confirm("Are you sure you want to delete this expense?")) return;
    setLoading(true);
    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      alert("Delete failed: " + error.message);
    } else {
      fetchExpenses();
    }
    setLoading(false);
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">IT Expense Tracker</h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <input type="text" placeholder="Service Name" required value={form.service_name} onChange={(e) => setForm({ ...form, service_name: e.target.value })} className="border p-2" disabled={loading} />
        <input type="number" placeholder="Amount in AED" required value={form.amount_aed} onChange={(e) => setForm({ ...form, amount_aed: e.target.value })} className="border p-2" disabled={loading} />
        <input type="text" placeholder="Currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="border p-2" disabled={loading} />
        <input type="text" placeholder="Months" value={form.months} onChange={(e) => setForm({ ...form, months: e.target.value })} className="border p-2" disabled={loading} />
        <input type="date" value={form.date_paid} onChange={(e) => setForm({ ...form, date_paid: e.target.value })} className="border p-2" disabled={loading} />
        <select value={form.service_status} onChange={(e) => setForm({ ...form, service_status: e.target.value })} className="border p-2" disabled={loading}>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Trial">Trial</option>
          <option value="Free">Free</option>
        </select>
        <input type="text" placeholder="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="border p-2" disabled={loading} />
        <button type="submit" className="bg-blue-600 text-white py-2 px-4 col-span-1 md:col-span-2" disabled={loading}>Add Expense</button>
      </form>

      {loading && <p className="mb-4 text-gray-600">Loading...</p>}

      <table className="w-full table-auto border">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Service Name</th>
            <th className="border p-2">Amount (AED)</th>
            <th className="border p-2">Currency</th>
            <th className="border p-2">Months</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Department</th>
            <th className="border p-2">Date Paid</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {expenses.length === 0 ? (
            <tr>
              <td colSpan={8} className="text-center py-4 text-gray-500">No expenses found.</td>
            </tr>
          ) : (
            expenses.map((exp) =>
              editingId === exp.id ? (
                <tr key={exp.id} className="bg-yellow-50">
                  <td className="border p-2"><input type="text" value={editForm.service_name} onChange={(e) => setEditForm({ ...editForm, service_name: e.target.value })} className="border p-1 w-full" /></td>
                  <td className="border p-2"><input type="number" value={editForm.amount_aed} onChange={(e) => setEditForm({ ...editForm, amount_aed: e.target.value })} className="border p-1 w-full" /></td>
                  <td className="border p-2"><input type="text" value={editForm.currency} onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })} className="border p-1 w-full" /></td>
                  <td className="border p-2"><input type="text" value={editForm.months} onChange={(e) => setEditForm({ ...editForm, months: e.target.value })} className="border p-1 w-full" /></td>
                  <td className="border p-2"><select value={editForm.service_status} onChange={(e) => setEditForm({ ...editForm, service_status: e.target.value })} className="border p-1 w-full">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Trial">Trial</option>
                    <option value="Free">Free</option>
                  </select></td>
                  <td className="border p-2"><input type="text" value={editForm.department} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })} className="border p-1 w-full" /></td>
                  <td className="border p-2"><input type="date" value={editForm.date_paid ? editForm.date_paid.slice(0, 10) : ""} onChange={(e) => setEditForm({ ...editForm, date_paid: e.target.value })} className="border p-1 w-full" /></td>
                  <td className="border p-2 flex gap-1">
                    <button onClick={saveEdit} className="bg-green-600 text-white px-3 py-1 rounded">Save</button>
                    <button onClick={cancelEdit} className="bg-gray-400 text-white px-3 py-1 rounded">Cancel</button>
                  </td>
                </tr>
              ) : (
                <tr key={exp.id}>
                  <td className="border p-2">{exp.service_name}</td>
                  <td className="border p-2">{exp.amount_aed}</td>
                  <td className="border p-2">{exp.currency}</td>
                  <td className="border p-2">{exp.months}</td>
                  <td className="border p-2">{exp.service_status}</td>
                  <td className="border p-2">{exp.department}</td>
                  <td className="border p-2">{exp.date_paid?.slice(0, 10)}</td>
                  <td className="border p-2 flex gap-1">
                    <button onClick={() => startEdit(exp)} className="bg-yellow-400 text-black px-3 py-1 rounded">Edit</button>
                    <button onClick={() => deleteExpense(exp.id)} className="bg-red-600 text-white px-3 py-1 rounded">Delete</button>
                  </td>
                </tr>
              )
            )
          )}
        </tbody>
      </table>
    </div>
  );
}


