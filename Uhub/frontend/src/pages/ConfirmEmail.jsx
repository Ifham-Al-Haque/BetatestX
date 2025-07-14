// src/pages/ConfirmEmail.jsx
import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function ConfirmEmail() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleResend() {
    setMessage("");
    setError("");

    if (!email) {
      setError("Please enter your email to resend.");
      return;
    }

    const { error } = await supabase.auth.resend({ type: "signup", email });

    if (error) {
      setError(error.message);
    } else {
      setMessage("Confirmation email has been resent. Please check your inbox.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-4">Confirm Your Email</h2>
        <p className="mb-4 text-gray-600">
          We've sent a confirmation link to your email. Please check your inbox and confirm your email address before logging in.
        </p>

        <input
          type="email"
          placeholder="Enter email to resend"
          className="border p-2 w-full mb-4 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          onClick={handleResend}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
        >
          Resend Confirmation Email
        </button>

        {message && <p className="mt-3 text-green-600 text-sm">{message}</p>}
        {error && <p className="mt-3 text-red-600 text-sm">{error}</p>}
      </div>
    </div>
  );
}
