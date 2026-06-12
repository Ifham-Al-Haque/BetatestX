import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useToast } from '../context/ToastContext';
import Logo from '../components/ui/logo';

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  useEffect(() => {
    let isMounted = true;

    const initRecovery = async () => {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;

      if (!data?.session) {
        setIsError(true);
        setMessage('This reset link is invalid or has expired. Request a new one from login.');
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
    setMessage('');
    setIsError(false);

    if (newPassword.length < 8) {
      setIsError(true);
      setMessage('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setIsError(true);
      setMessage('Passwords do not match.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setIsError(true);
      setMessage('Error: ' + error.message);
      showError('Password Update Failed', error.message);
    } else {
      setIsError(false);
      setMessage('Password updated! Redirecting to login...');
      success('Password Updated', 'You can now sign in with your new password.');
      setTimeout(() => navigate('/login', { replace: true }), 1500);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-uhub-canvas px-4">
      <form
        onSubmit={handleReset}
        className="uhub-card p-8 w-full max-w-md text-center shadow-uhub-lg"
      >
        <Logo size="xl" showText={true} centered={true} className="mx-auto mb-6" />
        <h2 className="text-xl font-bold text-content-primary mb-4">Set New Password</h2>

        {message && (
          <div
            className={`text-sm mb-4 p-3 rounded-lg border flex items-center gap-2 ${
              isError
                ? 'text-accent-danger bg-red-500/10 border-red-500/30'
                : 'text-accent-success bg-emerald-500/10 border-emerald-500/30'
            }`}
          >
            {isError ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            <span>{message}</span>
          </div>
        )}

        <input
          type="password"
          placeholder="New Password"
          className="uhub-input mb-4"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          disabled={!ready || loading}
          required
        />

        <input
          type="password"
          placeholder="Confirm New Password"
          className="uhub-input mb-4"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={!ready || loading}
          required
        />

        <button
          type="submit"
          disabled={!ready || loading}
          className="uhub-btn-primary w-full py-3"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />
              Updating...
            </span>
          ) : (
            'Update Password'
          )}
        </button>
      </form>
    </div>
  );
}
