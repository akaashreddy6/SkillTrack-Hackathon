import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ role }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="route-state">Loading your SkillTrack workspace...</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (role && profile?.role !== role) return <Navigate to={profile?.role === "admin" ? "/admin" : profile?.role === "employer" ? "/employer" : "/dashboard"} replace />;
  return <Outlet />;
}
