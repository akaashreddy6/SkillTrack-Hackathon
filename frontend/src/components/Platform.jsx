import { useState } from "react";
import { NavLink, useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// SVG Icon definitions for enterprise SaaS navigation
const Icons = {
  Dashboard: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  Skills: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  Learning: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  ),
  Assessments: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  Certifications: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  ),
  Career: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  ),
  Jobs: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  Applications: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  Portfolio: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  Profile: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Candidates: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Users: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Analytics: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  Settings: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  Search: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Logout: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  Menu: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  Close: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
};

const navigationGroups = {
  student: [
    {
      groupTitle: null,
      items: [
        { label: "Dashboard", to: "/dashboard", icon: Icons.Dashboard },
      ],
    },
    {
      groupTitle: "LEARN",
      items: [
        { label: "My Skills", to: "/skills", icon: Icons.Skills },
        { label: "Learning", to: "/learning", icon: Icons.Learning },
        { label: "Assessments", to: "/assessments", icon: Icons.Assessments },
        { label: "Certifications", to: "/certifications", icon: Icons.Certifications },
      ],
    },
    {
      groupTitle: "CAREER",
      items: [
        { label: "Career Readiness", to: "/career", icon: Icons.Career },
        { label: "Jobs", to: "/jobs", icon: Icons.Jobs },
        { label: "Applications", to: "/applications", icon: Icons.Applications },
        { label: "Portfolio", to: "/portfolio", icon: Icons.Portfolio },
      ],
    },
    {
      groupTitle: "ACCOUNT",
      items: [
        { label: "Profile", to: "/profile", icon: Icons.Profile },
      ],
    },
  ],
  employer: [
    {
      groupTitle: null,
      items: [
        { label: "Overview", to: "/employer", icon: Icons.Dashboard },
      ],
    },
    {
      groupTitle: "RECRUITMENT",
      items: [
        { label: "Jobs", to: "/employer/jobs", icon: Icons.Jobs },
        { label: "Candidates", to: "/employer/candidates", icon: Icons.Candidates },
        { label: "Applications", to: "/employer/applications", icon: Icons.Applications },
      ],
    },
    {
      groupTitle: "ACCOUNT",
      items: [
        { label: "Company Profile", to: "/employer/profile", icon: Icons.Profile },
      ],
    },
  ],
  admin: [
    {
      groupTitle: null,
      items: [
        { label: "Overview", to: "/admin", icon: Icons.Dashboard },
      ],
    },
    {
      groupTitle: "MANAGEMENT",
      items: [
        { label: "Users", to: "/admin/users", icon: Icons.Users },
        { label: "Skills", to: "/admin/skills", icon: Icons.Skills },
        { label: "Jobs", to: "/admin/jobs", icon: Icons.Jobs },
        { label: "Applications", to: "/admin/applications", icon: Icons.Applications },
      ],
    },
    {
      groupTitle: "INTELLIGENCE",
      items: [
        { label: "Workforce Analytics", to: "/admin/workforce", icon: Icons.Analytics },
        { label: "Settings", to: "/admin/settings", icon: Icons.Settings },
      ],
    },
  ],
};

export function StatusBadge({ children, tone }) {
  if (!children) return null;
  const text = String(children);
  const normalized = tone || text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    <span className={`status-badge badge-${normalized}`}>
      <span className="badge-dot" aria-hidden="true" />
      {text}
    </span>
  );
}

export function ProgressBar({ value = 0, tone = "blue", showLabel = false, height }) {
  const cleanValue = Math.min(100, Math.max(0, Number(value) || 0));
  return (
    <div className="progress-container">
      <div
        className="progress-track"
        style={height ? { height: `${height}px` } : undefined}
        aria-label={`${cleanValue}% complete`}
        role="progressbar"
        aria-valuenow={cleanValue}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className={`progress-fill ${tone}`} style={{ width: `${cleanValue}%` }} />
      </div>
      {showLabel && <span className="progress-value-label">{cleanValue}%</span>}
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, action }) {
  return (
    <header className="page-header">
      <div className="page-header-content">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {action && <div className="page-header-actions">{action}</div>}
    </header>
  );
}

export function StatCard({ label, value, detail, tone = "blue", icon }) {
  return (
    <article className={`stat-card stat-${tone}`}>
      <div className="stat-header">
        <span className="stat-label">{label}</span>
        <div className={`stat-icon-wrap stat-${tone}`}>
          {icon || <span className="stat-mark" />}
        </div>
      </div>
      <div className="stat-value">{value}</div>
      {detail && <div className="stat-detail">{detail}</div>}
    </article>
  );
}

export function AppTable({ headers, rows }) {
  return (
    <div className="table-wrap">
      <table className="app-table">
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    </div>
  );
}

export function PlatformLayout({ children, role = "student" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const groups = navigationGroups[role] || navigationGroups.student;
  const roleLabel =
    role === "student"
      ? "Learner Workspace"
      : role === "admin"
      ? "Admin Console"
      : "Employer Hub";

  const initials = (profile?.full_name || user?.email || "ST")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleOpenAi = () => {
    window.dispatchEvent(new CustomEvent("skilltrack:open-ai-copilot"));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const query = searchQuery.trim();
    if (role === "student") {
      navigate(`/jobs?q=${encodeURIComponent(query)}`);
    } else if (role === "employer") {
      navigate(`/employer/candidates?q=${encodeURIComponent(query)}`);
    } else {
      navigate(`/admin/skills?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="platform-shell">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* LEFT SIDEBAR */}
      <aside className={`platform-sidebar ${mobileOpen ? "sidebar-mobile-open" : ""}`}>
        <div className="sidebar-brand-area">
          <button
            type="button"
            className="brand-logo-button"
            onClick={() => {
              navigate(role === "student" ? "/dashboard" : `/${role}`);
              setMobileOpen(false);
            }}
          >
            <div className="brand-logo-text">
              Skill<span>Track</span>
            </div>
            <p className="brand-tagline">Learn. Build. Get Hired.</p>
          </button>
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
          >
            <Icons.Close />
          </button>
        </div>

        <div className="workspace-badge-pill">
          <span className="workspace-badge-dot" />
          <span>{roleLabel}</span>
        </div>

        <nav className="platform-nav-tree" aria-label="Main Navigation">
          {groups.map((group, gIdx) => (
            <div key={gIdx} className="nav-group-section">
              {group.groupTitle && (
                <div className="nav-group-heading">{group.groupTitle}</div>
              )}
              <div className="nav-group-list">
                {group.items.map((item) => {
                  const ItemIcon = item.icon;
                  const isActive =
                    location.pathname === item.to ||
                    (item.to !== "/dashboard" &&
                      item.to !== `/${role}` &&
                      location.pathname.startsWith(`${item.to}/`));

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive: navActive }) =>
                        `platform-nav-item ${navActive || isActive ? "active" : ""}`
                      }
                    >
                      <span className="nav-item-icon" aria-hidden="true">
                        <ItemIcon />
                      </span>
                      <span className="nav-item-label">{item.label}</span>
                      {isActive ? <span className="nav-item-active-glow" /> : null}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer-card">
          <Link
            to={role === "employer" ? "/employer/profile" : "/profile"}
            className="sidebar-user-anchor"
            onClick={() => setMobileOpen(false)}
            title="Manage profile"
          >
            <div className="avatar user-avatar-mini">{initials}</div>
            <div className="user-text-info">
              <strong className="user-name-title">
                {profile?.full_name || (role === "admin" ? "Admin" : "Student User")}
              </strong>
              <small className="user-role-label">
                {role === "student"
                  ? "Student Profile"
                  : role === "admin"
                  ? "Administrator"
                  : "Employer"}
              </small>
            </div>
          </Link>
          <button
            type="button"
            className="sidebar-logout-btn"
            title="Sign out of SkillTrack"
            onClick={async () => {
              await signOut();
              navigate("/login");
            }}
          >
            <Icons.Logout />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* TOP HEADER + MAIN CONTENT */}
      <div className="platform-viewport">
        <header className="platform-topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="mobile-hamburger-btn"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
            >
              <Icons.Menu />
            </button>

            <form className="topbar-search-form" onSubmit={handleSearchSubmit}>
              <span className="search-icon-wrap" aria-hidden="true">
                <Icons.Search />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search skills, jobs, learning topics..."
                aria-label="Search platform"
                className="topbar-search-input"
              />
              <span className="search-kbd-hint">⌘K</span>
            </form>
          </div>

          <div className="topbar-right">
            <button
              type="button"
              className="topbar-ai-btn"
              onClick={handleOpenAi}
              title="Open SkillTrack AI Career Copilot"
            >
              <span className="ai-btn-glow-dot" />
              <span className="ai-btn-icon">🤖</span>
              <span className="ai-btn-text">SkillTrack AI</span>
            </button>

            <div className="topbar-divider" />

            <Link
              to={role === "employer" ? "/employer/profile" : "/profile"}
              className="topbar-user-pill"
              title="View your profile"
            >
              <div className="avatar topbar-avatar">{initials}</div>
              <div className="topbar-user-meta">
                <span className="topbar-user-name">
                  {profile?.full_name || (role === "admin" ? "Admin" : "Student")}
                </span>
                <span className="topbar-user-badge">
                  {role === "student" ? "Learner" : role === "admin" ? "Admin" : "Employer"}
                </span>
              </div>
            </Link>

            <button
              type="button"
              className="topbar-logout-btn"
              onClick={async () => {
                await signOut();
                navigate("/login");
              }}
              title="Sign out"
            >
              <Icons.Logout />
              <span className="topbar-logout-text">Logout</span>
            </button>
          </div>
        </header>

        <main className="platform-content-area">
          <div className="platform-content-inner">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
