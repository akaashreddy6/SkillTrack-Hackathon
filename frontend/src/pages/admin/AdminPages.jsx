import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminData } from "../../services/skilltrackService";
import { AppTable, PageHeader, PlatformLayout, ProgressBar, StatCard, StatusBadge } from "../../components/Platform";

function useAdminData() {
  const [state, setState] = useState({ data: null, loading: true, error: "" });
  useEffect(() => {
    getAdminData().then((data) => setState({ data, loading: false, error: "" })).catch((error) => setState({ data: null, loading: false, error: error.message || "Unable to load platform analytics." }));
  }, []);
  return state;
}

function AdminState({ children }) {
  const state = useAdminData();
  if (state.loading) return <PlatformLayout role="admin"><div className="route-state">Loading platform analytics...</div></PlatformLayout>;
  if (state.error) return <PlatformLayout role="admin"><div className="data-error">{state.error}</div></PlatformLayout>;
  const data = {
    ...state.data,
    profiles: state.data?.allProfiles || [],
  };
  return <PlatformLayout role="admin">{children(data)}</PlatformLayout>;
}

function StatusCounts({ data }) {
  const statuses = ["Applied", "Under Review", "Shortlisted", "Interview", "Selected", "Rejected"];
  return <section className="panel"><div className="panel-header"><div><p className="eyebrow">APPLICATION OUTCOMES</p><h2>Current pipeline</h2></div><Link className="table-action" to="/admin/applications">View applications</Link></div>{statuses.map((status) => <div className="analytics-row" key={status}><div><strong>{status}</strong><span>{data.applications.filter((item) => item.status === status).length}</span></div></div>)}</section>;
}

export function AdminDashboard() {
  return <AdminState>{(data) => { const students = data.profiles.filter((item) => item.role === "student"); const employers = data.profiles.filter((item) => item.role === "employer"); const average = data.progress.length ? Math.round(data.progress.reduce((total, item) => total + Number(item.current_score || 0), 0) / data.progress.length) : 0; const gaps = Object.entries(data.progress.reduce((result, item) => { const name = item.skills?.name || "Unknown"; result[name] = (result[name] || 0) + Number(item.gap_percentage || 0); return result; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5); return <div><PageHeader eyebrow="PLATFORM ADMINISTRATOR" title="Workforce intelligence overview" description="Monitor real platform activity across learners, employers, skills, and opportunities." /><section className="overview-grid admin-kpis"><StatCard label="Total students" value={students.length} detail="Student profiles" /><StatCard label="Total employers" value={employers.length} detail="Employer profiles" tone="green" /><StatCard label="Active jobs" value={data.jobs.filter((item) => item.status === "Active").length} detail="Published opportunities" tone="navy" /><StatCard label="Applications" value={data.applications.length} detail="Recorded applications" tone="orange" /><StatCard label="Average skill score" value={`${average}%`} detail="Across skill progress" /></section><div className="admin-grid"><section className="panel"><div className="panel-header"><div><p className="eyebrow">TOP SKILL GAPS</p><h2>Where support is needed</h2></div><Link className="table-action" to="/admin/skills">View skills</Link></div>{gaps.length ? gaps.map(([name, value]) => <div className="analytics-row" key={name}><div><strong>{name}</strong><span>{Math.round(value / Math.max(students.length, 1))}% average gap</span></div><ProgressBar value={Math.min(100, Math.round(value / Math.max(students.length, 1)))} tone="orange" /></div>) : <div className="empty-state">No skill-gap data is available yet.</div>}</section><StatusCounts data={data} /></div></div>; }}</AdminState>;
}

export function AdminUsers() { return <AdminState>{(data) => <div><PageHeader eyebrow="PLATFORM USERS" title="Users" description="Review account and profile information without exposing authentication secrets." /><section className="panel panel-table"><AppTable headers={["Name", "Email", "Role", "Profile completion", "Joined"]} rows={data.profiles.map((user) => <tr key={user.id}><td>{user.full_name || "Unnamed user"}</td><td>{user.email}</td><td><StatusBadge>{user.role}</StatusBadge></td><td>{user.profile_completion || 0}%</td><td>{new Date(user.created_at).toLocaleDateString()}</td></tr>)} /></section></div>}</AdminState>; }

export function AdminSkills() { return <AdminState>{(data) => { const groups = Object.values(data.progress.reduce((result, item) => { const key = item.skill_id; if (!result[key]) result[key] = { name: item.skills?.name || "Unknown", current: [], target: [], gap: [] }; result[key].current.push(Number(item.current_score || 0)); result[key].target.push(Number(item.target_score || 0)); result[key].gap.push(Number(item.gap_percentage || 0)); return result; }, {})); return <div><PageHeader eyebrow="SKILL ANALYTICS" title="Skill gaps and readiness" description="Compare actual student skill evidence with target scores." /><section className="panel panel-table"><AppTable headers={["Skill", "Average current", "Average target", "Average gap", "Students assessed"]} rows={groups.map((skill) => <tr key={skill.name}><td>{skill.name}</td><td>{Math.round(skill.current.reduce((a, b) => a + b, 0) / skill.current.length)}%</td><td>{Math.round(skill.target.reduce((a, b) => a + b, 0) / skill.target.length)}%</td><td>{Math.round(skill.gap.reduce((a, b) => a + b, 0) / skill.gap.length)}%</td><td>{skill.current.length}</td></tr>)} /></section></div>; }}</AdminState>; }

export function AdminJobs() { return <AdminState>{(data) => <div><PageHeader eyebrow="JOB MARKET ANALYTICS" title="Jobs" description="Review active opportunities and the skills employers request." /><section className="panel panel-table"><AppTable headers={["Title", "Company", "Location", "Type", "Skills", "Status"]} rows={data.jobs.map((job) => <tr key={job.id}><td>{job.title}</td><td>{job.company_name}</td><td>{job.location || "Not listed"}</td><td>{job.employment_type || "Not listed"}</td><td>{job.job_skills?.map((item) => item.skills?.name).join(", ") || "None"}</td><td><StatusBadge>{job.status}</StatusBadge></td></tr>)} /></section></div>}</AdminState>; }

export function AdminApplications() { return <AdminState>{(data) => <div><PageHeader eyebrow="APPLICATION ANALYTICS" title="Applications" description="Monitor real application outcomes across the platform." /><section className="panel panel-table"><AppTable headers={["Job", "Company", "Status", "Applied"]} rows={data.applications.map((item) => <tr key={item.id}><td>{item.jobs?.title}</td><td>{item.jobs?.company_name}</td><td><StatusBadge>{item.status}</StatusBadge></td><td>{new Date(item.applied_at).toLocaleDateString()}</td></tr>)} /></section></div>}</AdminState>; }

export function AdminWorkforce() { return <AdminState>{(data) => { const technical = data.progress.length ? Math.round(data.progress.reduce((total, item) => total + Number(item.current_score || 0), 0) / data.progress.length) : 0; const assessment = data.attempts.length ? Math.round(data.attempts.reduce((total, item) => total + Number(item.percentage || 0), 0) / data.attempts.length) : 0; return <div><PageHeader eyebrow="WORKFORCE READINESS" title="Platform readiness" description="Evidence-based estimates from current skill and assessment records." /><section className="overview-grid three"><StatCard label="Technical skills" value={`${technical}%`} detail="Average skill progress" /><StatCard label="Assessment performance" value={`${assessment}%`} detail="Completed assessments" tone="green" /><StatCard label="Skill records" value={data.progress.length} detail="Current records" tone="orange" /></section><section className="panel"><h2>Assessment performance levels</h2>{Object.entries(data.attempts.reduce((result, item) => { result[item.performance_level] = (result[item.performance_level] || 0) + 1; return result; }, {})).map(([level, count]) => <div className="analytics-row" key={level}><div><strong>{level}</strong><span>{count}</span></div><ProgressBar value={count / Math.max(data.attempts.length, 1) * 100} /></div>)}</section></div>; }}</AdminState>; }

export function AdminSettings() { return <PlatformLayout role="admin"><PageHeader eyebrow="PLATFORM SETTINGS" title="Settings" description="Platform configuration is managed outside the public dashboard." /><section className="panel"><div className="empty-state">No editable platform settings are stored in the current database schema.</div></section></PlatformLayout>; }
