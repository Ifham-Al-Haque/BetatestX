import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useToast } from '../context/ToastContext';
import Logo from '../components/ui/logo';

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  useEffect(() => {
    let isMounted = true;

    // Supabase sets/refreshes session from the recovery URL fragment.
    // We wait briefly and then verify that a recovery session exists.
    const initRecovery = async () => {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;

      if (!data?.session) {
        setIsError(true);
        setMessage("This reset link is invalid or has expired. Request a new one from login.");
      } else {
        setReady(true);
      }
    };

    initRecovery();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleReset(e) {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    if (newPassword.length < 8) {
      setIsError(true);
      setMessage("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setIsError(true);
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setIsError(true);
      setMessage("Error: " + error.message);
      showError("Password Update Failed", error.message);
    } else {
      setIsError(false);
      setMessage("Password updated! Redirecting to login...");
      success("Password Updated", "You can now sign in with your new password.");
      setTimeout(() => navigate("/login", { replace: true }), 1500);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] px-4">
      <form
        onSubmit={handleReset}
        className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md text-center"
      >
        <Logo size="xl" showText={true} centered={true} className="mx-auto mb-6" />
        <h2 className="text-xl font-bold text-[#1E3A8A] mb-4">Set New Password</h2>

        {message && (
          <div
            className={`text-sm mb-4 p-3 rounded-lg border flex items-center gap-2 ${
              isError
                ? "text-red-700 bg-red-50 border-red-200"
                : "text-green-700 bg-green-50 border-green-200"
            }`}
          >
            {isError ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            <span>{message}</span>
          </div>
        )}

        <input
          type="password"
          placeholder="New Password"
          className="w-full p-3 rounded border bg-gray-100 mb-4"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          disabled={!ready || loading}
          required
        />

        <input
          type="password"
          placeholder="Confirm New Password"
          className="w-full p-3 rounded border bg-gray-100 mb-4"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={!ready || loading}
          required
        />

        <button
          type="submit"
          disabled={!ready || loading}
          className="w-full py-3 rounded-lg font-semibold bg-gradient-to-r from-[#10B981] to-[#2563EB] text-white hover:opacity-90 transition"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Updating...
            </span>
          ) : (
            "Update Password"
          )}
        </button>
      </form>
    </div>
  );
}
