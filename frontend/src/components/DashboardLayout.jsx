import { NavLink, useNavigate } from "react-router-dom";

export function DashboardHeader() {
  const navigate = useNavigate();

  const navItems = [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Skills", to: "/skills" },
    { label: "Assessments", to: "/assessments" },
    { label: "Jobs", to: "/jobs" },
    { label: "Profile", to: "/profile" },
  ];

  return (
    <header className="dashboard-header">
      <div className="dashboard-logo">
        Skill<span>Track</span>
      </div>

      <nav className="dashboard-nav" aria-label="Main navigation">
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

      <button
        type="button"
        className="logout-button"
        onClick={() => navigate("/login")}
      >
        Logout
      </button>
    </header>
  );
}
