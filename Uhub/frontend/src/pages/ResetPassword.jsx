// src/pages/ResetPassword.jsx
import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  async function handleReset(e) {
    e.preventDefault();
    setMessage("");

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setMessage("Error: " + error.message);
    } else {
      setMessage("Password updated! Redirecting to login...");
      setTimeout(() => navigate("/"), 2000);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] px-4">
      <form
        onSubmit={handleReset}
        className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md text-center"
      >
        <img src="/Uhub.png" alt="Uhub Logo" className="mx-auto w-20 h-20 mb-4" />
        <h2 className="text-xl font-bold text-[#1E3A8A] mb-4">Set New Password</h2>

        {message && <p className="text-sm mb-4 text-center text-red-600">{message}</p>}

        <input
          type="password"
          placeholder="New Password"
          className="w-full p-3 rounded border bg-gray-100 mb-4"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          className="w-full py-3 rounded-lg font-semibold bg-gradient-to-r from-[#10B981] to-[#2563EB] text-white hover:opacity-90 transition"
        >
          Update Password
        </button>
      </form>
    </div>
  );
}
