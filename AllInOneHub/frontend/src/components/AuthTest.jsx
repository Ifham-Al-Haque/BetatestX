import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AuthTest = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  if (loading) {
    return (
      <div className="fixed top-4 right-4 bg-blue-100 border border-blue-300 rounded-lg p-4 z-50">
        <p className="text-blue-800">Loading auth...</p>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 bg-green-100 border border-green-300 rounded-lg p-4 z-50 max-w-xs">
      <h3 className="font-semibold text-green-800 mb-2">Auth Status</h3>
      {user ? (
        <div className="space-y-2">
          <p className="text-sm text-green-700">
            <strong>Logged in:</strong> {user.email}
          </p>
          <p className="text-sm text-green-700">
            <strong>User ID:</strong> {user.id}
          </p>
          <button
            onClick={handleSignOut}
            className="w-full bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-red-700">
            <strong>Not logged in</strong>
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
          >
            Go to Login
          </button>
        </div>
      )}
    </div>
  );
};

export default AuthTest; 