import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRoleAccess } from './RoleBasedRoute';

/** Allows access when the user has payroll OR payroll_calculator feature. */
export default function PayrollProtectedRoute({ children }) {
  const { loading, user } = useAuth();
  const { hasFeatureAccess } = useRoleAccess();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const allowed =
    hasFeatureAccess('payroll') || hasFeatureAccess('payroll_calculator');

  if (!allowed) return <Navigate to="/" replace />;

  return children;
}
