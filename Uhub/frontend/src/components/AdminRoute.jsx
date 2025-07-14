import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }) {
  const { role, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (role !== "Admin") {
    return <Navigate to="/dashboard" />;
  }

  return children;
}
