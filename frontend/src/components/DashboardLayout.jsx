import { NavLink, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function DashboardHeader() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const navItems = [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Skills", to: "/skills" },
    { label: "Assessments", to: "/assessments" },
    { label: "Learning", to: "/learning" },
    { label: "Career", to: "/career" },
    { label: "Jobs", to: "/jobs" },
    { label: "Applications", to: "/applications" },
    { label: "Portfolio", to: "/portfolio" },
    { label: "Certifications", to: "/certifications" },
    { label: "Profile", to: "/profile" },
  ];

  const initials = (profile?.full_name || "ST")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="dashboard-header">
      <Link to="/dashboard" className="dashboard-logo">
        Skill<span>Track</span>
      </Link>

      <nav className="dashboard-nav" aria-label="Student navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <Link
          to="/profile"
          className="avatar"
          style={{ width: "34px", height: "34px", fontSize: "12px", textDecoration: "none" }}
          title={profile?.full_name || "User Profile"}
        >
          {initials}
        </Link>
        <button
          type="button"
          className="logout-button"
          onClick={async () => {
            await signOut();
            navigate("/login");
          }}
        >
          Logout
        </button>
      </div>
    </header>
  );
}
