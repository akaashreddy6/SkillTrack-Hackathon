import { NavLink, useLocation, useNavigate } from "react-router-dom";

const studentItems = [
  ["Overview", "/dashboard", "01"], ["Skills", "/skills", "02"], ["Assessments", "/assessments", "03"],
  ["Learning", "/learning", "04"], ["Career readiness", "/career", "05"], ["Portfolio", "/portfolio", "06"], ["Jobs", "/jobs", "07"], ["Applications", "/applications", "08"],
  ["Certifications", "/certifications", "09"], ["Profile", "/profile", "10"],
];
const roleItems = { admin: [["Overview", "/admin"], ["Candidates", "/admin/candidates"], ["Assessments", "/admin/assessments"], ["Skills Analytics", "/admin/skills"], ["Jobs", "/admin/jobs"], ["Employment", "/admin/employment"], ["Reports", "/admin/reports"]], employer: [["Overview", "/employer"], ["Jobs", "/employer/jobs"], ["Candidates", "/employer/candidates"], ["Applications", "/employer/applications"], ["Profile", "/employer/profile"]] };

export function StatusBadge({ children }) {
  return <span className={`status-badge ${String(children).toLowerCase().replace(/\s+/g, "-")}`}>{children}</span>;
}

export function ProgressBar({ value, tone = "blue" }) {
  return <div className="progress-track" aria-label={`${value}% complete`}><div className={`progress-fill ${tone}`} style={{ width: `${value}%` }} /></div>;
}

export function PageHeader({ eyebrow, title, description, action }) {
  return <section className="page-header"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{description && <p className="page-description">{description}</p>}</div>{action}</section>;
}

export function StatCard({ label, value, detail, tone = "blue" }) {
  return <article className="stat-card"><div className={`stat-mark ${tone}`} /><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>;
}

export function PlatformLayout({ children, role = "student" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const items = role === "student" ? studentItems : roleItems[role];
  const roleLabel = role === "student" ? "Learner workspace" : `${role[0].toUpperCase()}${role.slice(1)} workspace`;
  return <div className="platform"><aside className="sidebar"><button className="brand" onClick={() => navigate(role === "student" ? "/dashboard" : `/${role}`)}>Skill<span>Track</span></button><div className="workspace-label">{roleLabel}</div><nav className="side-nav" aria-label={`${roleLabel} navigation`}>{items.map(([label, to, number]) => <NavLink key={to} to={to} className={({ isActive }) => isActive || (to !== "/dashboard" && location.pathname.startsWith(to)) ? "active" : ""}><span>{number}</span>{label}</NavLink>)}</nav><div className="sidebar-footer"><div className="user-mini"><div className="avatar">AS</div><div><strong>{role === "student" ? "Alicia Stone" : role === "admin" ? "Admin account" : "Nova Labs"}</strong><small>{role === "student" ? "Student profile" : "Workspace user"}</small></div></div><button className="logout-link" onClick={() => navigate("/login")}>Sign out</button></div></aside><main className="platform-content">{children}</main></div>;
}

export function AppTable({ headers, rows }) {
  return <div className="table-wrap"><table><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{rows}</tbody></table></div>;
}
