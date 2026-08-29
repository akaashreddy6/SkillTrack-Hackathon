import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  closeEmployerJob,
  createEmployerJob,
  getEmployerData,
  getSkills,
  updateApplicationStatus,
  updateEmployerJob,
  updateProfile,
} from "../../services/skilltrackService";
import {
  AppTable,
  PageHeader,
  PlatformLayout,
  ProgressBar,
  StatCard,
  StatusBadge,
} from "../../components/Platform";

const statuses = ["Applied", "Under Review", "Shortlisted", "Interview", "Selected", "Rejected"];
const emptyJob = {
  title: "",
  company_name: "",
  location: "Remote",
  employment_type: "Full-time",
  salary_range: "",
  description: "",
  responsibilities: "",
  status: "Draft",
};

const emptyEmployerData = {
  employer: null,
  jobs: [],
  applications: [],
  candidateProgress: {},
};

function normalizeEmployerData(data) {
  return {
    ...emptyEmployerData,
    ...(data || {}),
    jobs: Array.isArray(data?.jobs) ? data.jobs : [],
    applications: Array.isArray(data?.applications) ? data.applications : [],
    candidateProgress: data?.candidateProgress || {},
  };
}

function useEmployerData() {
  const { user } = useAuth();
  const [state, setState] = useState({ data: emptyEmployerData, loading: true, error: "" });
  const load = async () => {
    try {
      setState({ data: emptyEmployerData, loading: true, error: "" });
      setState({ data: normalizeEmployerData(await getEmployerData(user.id)), loading: false, error: "" });
    } catch (error) {
      setState({ data: emptyEmployerData, loading: false, error: error.message || "Unable to load employer data." });
    }
  };
  useEffect(() => { load(); }, [user.id]);
  return { ...state, reload: load };
}

function EmployerShell({ children }) {
  const location = useLocation();
  return <PlatformLayout role="employer">{location.state?.message && <div className="auth-success data-feedback">{location.state.message}</div>}{children}</PlatformLayout>;
}

function EmployerState({ loading, error, children }) {
  if (loading) return <EmployerShell><div className="route-state">Loading employer workspace...</div></EmployerShell>;
  if (error) return <EmployerShell><div className="data-error">{error}</div></EmployerShell>;
  return children;
}

function JobForm({ initialJob = emptyJob, initialSkills = [], onSave, saving }) {
  const [form, setForm] = useState(initialJob);
  const [selectedSkills, setSelectedSkills] = useState(initialSkills);
  const [skills, setSkills] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => { getSkills().then(setSkills).catch((loadError) => setError(loadError.message || "Unable to load skills.")); }, []);
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!form.title.trim() || !form.company_name.trim() || !form.location.trim() || !form.employment_type || !form.description.trim() || !selectedSkills.length) {
      setError("Complete the title, company, location, employment type, description, and at least one required skill.");
      return;
    }
    try { await onSave(form, selectedSkills); }
    catch (saveError) { setError(saveError.message || "Unable to save job."); }
  };
  return <form className="panel employer-job-form" onSubmit={submit}>
    <div className="panel-header"><div><p className="eyebrow">JOB POSTING</p><h2>{form.id ? "Edit job" : "Basic information"}</h2></div><span>Use the SkillTrack skills catalog</span></div>
    {error && <div className="data-error">{error}</div>}
    <div className="form-grid">
      <label>Job title<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
      <label>Company<input required value={form.company_name} onChange={(event) => setForm({ ...form, company_name: event.target.value })} /></label>
      <label>Location<input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} /></label>
      <label>Employment type<select value={form.employment_type} onChange={(event) => setForm({ ...form, employment_type: event.target.value })}><option>Full-time</option><option>Part-time</option><option>Contract</option><option>Internship</option></select></label>
      <label>Salary range<input value={form.salary_range} onChange={(event) => setForm({ ...form, salary_range: event.target.value })} /></label>
      <label>Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option>Draft</option><option>Active</option><option>Closed</option></select></label>
      <label className="form-wide">Description<textarea required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
      <label className="form-wide">Responsibilities / requirements<textarea value={form.responsibilities} onChange={(event) => setForm({ ...form, responsibilities: event.target.value })} /></label>
    </div>
    <fieldset><legend>Required skills and minimum scores</legend><div className="skill-checkboxes">{skills.map((skill) => {
      const requirement = selectedSkills.find((item) => String(item.id) === String(skill.id));
      return <label key={skill.id}><input type="checkbox" checked={Boolean(requirement)} onChange={() => setSelectedSkills((current) => requirement ? current.filter((item) => String(item.id) !== String(skill.id)) : [...current, { id: skill.id, minimum_score: 60 }])} />{skill.name}{requirement && <input aria-label={`${skill.name} minimum score`} type="number" min="0" max="100" value={requirement.minimum_score} onChange={(event) => setSelectedSkills((current) => current.map((item) => String(item.id) === String(skill.id) ? { ...item, minimum_score: Number(event.target.value) } : item))} />}</label>;
    })}</div></fieldset>
    <button className="button button-primary" disabled={saving}>{saving ? "Saving..." : form.id ? "Save changes" : "Publish Job"}</button>
  </form>;
}

export function EmployerDashboard() {
  const { profile } = useAuth();
  const { data, loading, error } = useEmployerData();
  return <EmployerState loading={loading} error={error}><EmployerShell><PageHeader eyebrow="EMPLOYER OVERVIEW" title={`Good morning, ${profile?.full_name || "Employer"}`} description="Here's what's happening with your hiring activity." action={<Link className="button button-primary" to="/employer/jobs/new">+ Create New Job</Link>} /><section className="overview-grid three"><StatCard label="Active jobs" value={data.jobs.filter((job) => job.status === "Active").length} detail="Published roles" /><StatCard label="Total applications" value={data.applications.length} detail="Across your jobs" tone="green" /><StatCard label="Candidates" value={new Set(data.applications.map((item) => item.user_id)).size} detail="Unique applicants" tone="orange" /><StatCard label="Shortlisted" value={data.applications.filter((item) => item.status === "Shortlisted").length} detail="Ready for next step" /></section><div className="admin-grid employer-overview-grid"><section className="panel"><div className="panel-header"><div><p className="eyebrow">HIRING ACTIVITY</p><h2>Recent applications</h2></div><Link className="table-action" to="/employer/applications">View all</Link></div>{data.applications.length ? <AppTable headers={["Candidate", "Job", "Match", "Status"]} rows={data.applications.slice(0, 5).map((item) => <tr key={item.id}><td><strong>{item.profiles?.full_name || "Candidate"}</strong><small>{item.profiles?.email || ""}</small></td><td>{item.jobs?.title}</td><td>{item.match?.match ?? 0}%</td><td><StatusBadge>{item.status}</StatusBadge></td></tr>)} /> : <div className="empty-state">No applications yet. Publish your first job to start receiving candidates.</div>}</section><section className="panel"><div className="panel-header"><div><p className="eyebrow">STATUS SUMMARY</p><h2>Application pipeline</h2></div></div>{statuses.map((status) => { const count = data.applications.filter((item) => item.status === status).length; return <div className="analytics-row" key={status}><div><strong>{status}</strong><span>{count}</span></div><ProgressBar value={data.applications.length ? count / data.applications.length * 100 : 0} /></div>; })}</section></div><section className="panel panel-table"><div className="panel-header"><div><p className="eyebrow">JOB PERFORMANCE</p><h2>Recent jobs</h2></div><Link className="table-action" to="/employer/jobs">Manage jobs</Link></div>{data.jobs.length ? <AppTable headers={["Job title", "Applications", "Match quality", "Status", "Actions"]} rows={data.jobs.slice(0, 5).map((job) => { const applications = data.applications.filter((item) => item.job_id === job.id); const match = applications.length ? Math.round(applications.reduce((total, item) => total + (item.match?.match || 0), 0) / applications.length) : 0; return <tr key={job.id}><td><strong>{job.title}</strong><small>{job.company_name}</small></td><td>{applications.length}</td><td>{applications.length ? `${match}%` : "No applicants"}</td><td><StatusBadge>{job.status}</StatusBadge></td><td><Link className="table-action" to={`/employer/jobs/${job.id}`}>View</Link></td></tr>; })} /> : <div className="empty-state">No jobs yet. Create your first job posting.</div>}</section></EmployerShell></EmployerState>;
}

export function EmployerJobs() {
  const navigate = useNavigate(); const { data, loading, error, reload } = useEmployerData(); const [filter, setFilter] = useState("All"); const [actionError, setActionError] = useState("");
  const close = async (jobId) => { if (!window.confirm("Close this job posting?")) return; try { await closeEmployerJob(jobId, data.employer.id); await reload(); } catch (closeError) { setActionError(closeError.message || "Unable to close job."); } };
  return <EmployerState loading={loading} error={error}><EmployerShell><PageHeader eyebrow="JOB MANAGEMENT" title="Jobs" description="Manage your job postings and track candidate interest." action={<Link className="button button-primary" to="/employer/jobs/new">+ Create Job</Link>} />{actionError && <div className="data-error">{actionError}</div>}<div className="job-filters panel"><button className={filter === "All" ? "button button-primary" : "button button-secondary"} onClick={() => setFilter("All")}>All</button><button className={filter === "Active" ? "button button-primary" : "button button-secondary"} onClick={() => setFilter("Active")}>Active</button><button className={filter === "Closed" ? "button button-primary" : "button button-secondary"} onClick={() => setFilter("Closed")}>Closed</button></div><section className="resource-grid employer-jobs">{data.jobs.filter((job) => filter === "All" || job.status === filter).length ? data.jobs.filter((job) => filter === "All" || job.status === filter).map((job) => { const count = data.applications.filter((item) => item.job_id === job.id).length; return <article className="job-card" key={job.id}><div className="job-header-row"><div><h3>{job.title}</h3><p>{job.company_name} · {job.location || "Location not listed"}</p></div><StatusBadge>{job.status}</StatusBadge></div><p className="muted">{job.employment_type || "Employment type not listed"} · Posted {new Date(job.created_at).toLocaleDateString()}</p><p className="muted">{count} applications</p><div className="job-card-actions"><button className="button button-secondary" onClick={() => navigate(`/employer/jobs/${job.id}`)}>View</button><button className="button button-secondary" onClick={() => navigate(`/employer/jobs/${job.id}/edit`)}>Edit</button>{job.status === "Active" && <button className="button button-secondary" onClick={() => close(job.id)}>Close Job</button>}</div></article>; }) : <div className="empty-state">No {filter.toLowerCase()} jobs yet. Create your first job posting.</div>}</section></EmployerShell></EmployerState>;
}

export function CreateJob() {
  const { user } = useAuth(); const navigate = useNavigate(); const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  const save = async (form, skillIds) => { setSaving(true); setError(""); try { await createEmployerJob({ employerId: user.id, job: form, skillIds }); navigate("/employer/jobs", { replace: true, state: { message: "Job published successfully." } }); } catch (saveError) { setError(saveError); } finally { setSaving(false); } };
  return <EmployerShell><PageHeader eyebrow="JOB MANAGEMENT" title="Create Job" description="Publish a role with requirements from the SkillTrack skills catalog." /><div className="employer-form-error">{error && <div className="data-error">{error.message || "Unable to publish job."}</div>}</div><JobForm onSave={save} saving={saving} /></EmployerShell>;
}

export function EmployerJobDetails({ edit = false }) {
  const { id } = useParams(); const navigate = useNavigate(); const { data, loading, error, reload } = useEmployerData(); const [actionError, setActionError] = useState(""); const [saving, setSaving] = useState(false);
  if (!loading && !error && !data.jobs.some((job) => job.id === id)) return <EmployerShell><div className="data-error">Job not found or you are not authorized to view it.</div></EmployerShell>;
  const job = data?.jobs.find((item) => item.id === id);
  const save = async (form, skillIds) => { setSaving(true); try { await updateEmployerJob({ employerId: data.employer.id, job: { ...form, id }, skillIds }); navigate(`/employer/jobs/${id}`); await reload(); } catch (saveError) { setActionError(saveError.message || "Unable to update job."); } finally { setSaving(false); } };
  const close = async () => { if (!window.confirm("Close this job posting?")) return; try { await closeEmployerJob(id, data.employer.id); await reload(); } catch (closeError) { setActionError(closeError.message || "Unable to close job."); } };
  return <EmployerState loading={loading} error={error}><EmployerShell>{edit ? <><PageHeader eyebrow="JOB MANAGEMENT" title="Edit job" description="Update your owned job posting." /><JobForm initialJob={{ ...job, responsibilities: "" }} initialSkills={job.job_skills?.map((item) => ({ id: item.skill_id, minimum_score: item.minimum_score })) || []} onSave={save} saving={saving} />{actionError && <div className="data-error">{actionError}</div>}</> : <><PageHeader eyebrow="JOB DETAILS" title={job.title} description={`${job.company_name} · ${job.location || "Location not listed"}`} action={<><button className="button button-secondary" onClick={() => navigate(`/employer/jobs/${id}/edit`)}>Edit</button>{job.status === "Active" && <button className="button button-primary" onClick={close}>Close Job</button>}</>} /><section className="job-detail-grid"><article className="panel job-detail-main"><div className="job-detail-meta"><span>{job.employment_type || "Employment type not listed"}</span><span>{job.salary_range || "Salary not listed"}</span><span>Posted {new Date(job.created_at).toLocaleDateString()}</span></div><h2>Description</h2><p>{job.description || "No description provided."}</p><h2>Required skills</h2><div className="job-skills">{job.job_skills?.map((item) => <span key={item.skill_id}>{item.skills?.name} · minimum {item.minimum_score}%</span>)}</div></article><aside className="panel job-apply-panel"><StatusBadge>{job.status}</StatusBadge><h2>{data.applications.filter((item) => item.job_id === job.id).length} applications</h2><Link className="button button-primary full-width" to="/employer/applications">View applications</Link></aside></section></>}</EmployerShell></EmployerState>;
}

export function EmployerCandidates() {
  const { data, loading, error } = useEmployerData();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [matchFilter, setMatchFilter] = useState("All");

  const filteredApplications = (data.applications || []).filter((item) => {
    const searchText = `${item.profiles?.full_name || ""} ${item.jobs?.title || ""} ${item.match?.matchedSkills?.map((skill) => skill.skills?.name).join(" ") || ""}`.toLowerCase();
    const matchesSearch = !search || searchText.includes(search.trim().toLowerCase());
    const matchesStatus = statusFilter === "All" || item.status === statusFilter;
    const matchesMatch = matchFilter === "All" || Number(item.match?.match || 0) >= Number(matchFilter);
    return matchesSearch && matchesStatus && matchesMatch;
  });

  const hasActiveFilters = Boolean(search || statusFilter !== "All" || matchFilter !== "All");
  const clearFilters = () => { setSearch(""); setStatusFilter("All"); setMatchFilter("All"); };

  return <EmployerState loading={loading} error={error}><EmployerShell><PageHeader eyebrow="TALENT PIPELINE" title="Candidates" description="Review candidates who applied to your employer-owned jobs." /><div className="filter-toolbar compact"><label className="search-field" aria-label="Search candidates"><span className="search-field-icon">⌕</span><input type="search" placeholder="Search candidate or role" value={search} onChange={(event) => setSearch(event.target.value)} /></label><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="All">All stages</option>{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select><select value={matchFilter} onChange={(event) => setMatchFilter(event.target.value)}><option value="All">All match scores</option><option value="60">60%+ match</option><option value="75">75%+ match</option><option value="85">85%+ match</option></select>{hasActiveFilters && <button type="button" className="button button-secondary" onClick={clearFilters}>Clear filters</button>}</div>{filteredApplications.length ? <section className="panel panel-table"><AppTable headers={["Candidate", "Applied job", "Match", "Matching skills", "Missing skills", "Status", "Applied", "Action"]} rows={filteredApplications.map((item) => <tr key={item.id}><td><strong>{item.profiles?.full_name || "Candidate"}</strong><small>{item.profiles?.email || ""}</small></td><td>{item.jobs?.title}</td><td>{item.match?.match ?? 0}%</td><td>{item.match?.matchedSkills?.map((skill) => skill.skills?.name).join(", ") || "None"}</td><td>{item.match?.missingSkills?.map((skill) => skill.skills?.name).join(", ") || "None"}</td><td><StatusBadge>{item.status}</StatusBadge></td><td>{new Date(item.applied_at).toLocaleDateString()}</td><td><Link className="table-action" to={`/employer/candidates/${item.user_id}`}>View Candidate</Link></td></tr>)} /></section> : <div className="empty-state"><h3>No candidates match these filters.</h3><p>Try clearing filters or publish more roles to attract qualified applicants.</p><button type="button" className="button button-primary" onClick={clearFilters}>Clear filters</button></div>}</EmployerShell></EmployerState>;
}

export function EmployerCandidateDetails() {
  const { id } = useParams(); const { data, loading, error, reload } = useEmployerData(); const [actionError, setActionError] = useState("");
  return <EmployerState loading={loading} error={error}><EmployerShell>{!data.applications.some((item) => item.user_id === id) ? <div className="data-error">Candidate not found or you are not authorized to view this candidate.</div> : (() => { const applications = data.applications.filter((item) => item.user_id === id); const candidate = applications[0].profiles; const progress = data.candidateProgress?.[id] || []; return <><PageHeader eyebrow="CANDIDATE PROFILE" title={candidate?.full_name || "Candidate"} description={candidate?.email || ""} /><section className="overview-grid three"><StatCard label="Applications" value={applications.length} detail="Your owned jobs" /><StatCard label="Best match" value={`${Math.max(...applications.map((item) => item.match?.match || 0))}%`} detail="Calculated from skills" tone="green" /><StatCard label="Skill records" value={progress.length} detail="Available skill progress" /></section><section className="panel panel-table"><div className="panel-header"><div><p className="eyebrow">SKILL EVIDENCE</p><h2>Current skill scores</h2></div></div>{progress.length ? <AppTable headers={["Skill", "Current score", "Target score", "Gap"]} rows={progress.map((item) => <tr key={item.skill_id}><td>{item.skills?.name}</td><td>{item.current_score}%</td><td>{item.target_score}%</td><td>{Math.max(Number(item.target_score) - Number(item.current_score), 0)}%</td></tr>)} /> : <div className="empty-state">No skill progress has been recorded for this candidate.</div>}</section><section className="panel panel-table"><div className="panel-header"><div><p className="eyebrow">APPLICATIONS</p><h2>Application history</h2></div></div><AppTable headers={["Job", "Match", "Matching skills", "Missing skills", "Status", "Applied"]} rows={applications.map((item) => <tr key={item.id}><td>{item.jobs?.title}</td><td>{item.match?.match ?? 0}%</td><td>{item.match?.matchedSkills?.map((skill) => skill.skills?.name).join(", ") || "None"}</td><td>{item.match?.missingSkills?.map((skill) => skill.skills?.name).join(", ") || "None"}</td><td><StatusBadge>{item.status}</StatusBadge></td><td>{new Date(item.applied_at).toLocaleDateString()}</td></tr>)} /></section><section className="panel"><h2>Application actions</h2>{actionError && <div className="data-error">{actionError}</div>}<ApplicationActions application={applications[0]} employerId={data.employer.id} onUpdated={reload} onError={setActionError} /></section></>; })()}</EmployerShell></EmployerState>;
}

export function EmployerApplications() {
  const { data, loading, error } = useEmployerData();
  const [filter, setFilter] = useState("All");
  const [jobFilter, setJobFilter] = useState("All");
  const applications = (data?.applications || []).filter((item) => {
    const matchesStatus = filter === "All" || item.status === filter;
    const matchesJob = jobFilter === "All" || item.job_id === jobFilter;
    return matchesStatus && matchesJob;
  });
  const jobOptions = [...new Set((data?.applications || []).map((application) => application.job_id).filter(Boolean))].map((jobId) => ({
    value: jobId,
    label: (data?.applications || []).find((application) => application.job_id === jobId)?.jobs?.title || "Role",
  }));

  return <EmployerState loading={loading} error={error}><EmployerShell><PageHeader eyebrow="APPLICATION MANAGEMENT" title="Applications" description="Review applications and move candidates through your hiring process." /><div className="job-filters panel"><div className="filter-toolbar compact">{["All", ...statuses].map((status) => <button key={status} className={filter === status ? "button button-primary" : "button button-secondary"} onClick={() => setFilter(status)}>{status}</button>)}<select value={jobFilter} onChange={(event) => setJobFilter(event.target.value)}><option value="All">All jobs</option>{jobOptions.map((job) => <option key={job.value} value={job.value}>{job.label}</option>)}</select>{(filter !== "All" || jobFilter !== "All") && <button type="button" className="button button-secondary" onClick={() => { setFilter("All"); setJobFilter("All"); }}>Clear filters</button>}</div></div>{applications.length ? <section className="panel panel-table"><AppTable headers={["Candidate", "Job", "Match", "Applied", "Status", "Action"]} rows={applications.map((item) => <tr key={item.id}><td><strong>{item.profiles?.full_name || "Candidate"}</strong><small>{item.profiles?.email || ""}</small></td><td>{item.jobs?.title}</td><td>{item.match?.match ?? 0}%</td><td>{new Date(item.applied_at).toLocaleDateString()}</td><td><StatusBadge>{item.status}</StatusBadge></td><td><Link className="table-action" to={`/employer/applications/${item.id}`}>Review application</Link></td></tr>)} /></section> : <div className="empty-state"><h3>No applications match these filters.</h3><p>Try clearing filters or publish a new job to create a fresh pipeline.</p><button type="button" className="button button-primary" onClick={() => { setFilter("All"); setJobFilter("All"); }}>Clear filters</button></div>}</EmployerShell></EmployerState>;
}

function ApplicationTimeline({ status }) {
  const rejected = status === "Rejected";
  const stages = rejected ? ["Applied", "Under Review", "Rejected"] : ["Applied", "Under Review", "Shortlisted", "Interview", "Selected"];
  const currentIndex = stages.indexOf(status);
  return <div className="application-timeline">{stages.map((stage, index) => <div className={`timeline-step ${index <= currentIndex ? "complete" : ""} ${stage === status ? "current" : ""}`} key={stage}><span>{stage === "Rejected" ? "!" : index <= currentIndex ? "✓" : "○"}</span><strong>{stage}</strong>{index < stages.length - 1 && <i />}</div>)}</div>;
}

function ApplicationActions({ application, employerId, onUpdated, onError }) {
  const [saving, setSaving] = useState(false); const [confirming, setConfirming] = useState(false);
  const nextStatus = { Applied: "Under Review", "Under Review": "Shortlisted", Shortlisted: "Interview", Interview: "Selected" }[application.status];
  const update = async (status) => { setSaving(true); try { await updateApplicationStatus(application.id, employerId, status); await onUpdated(); } catch (error) { onError(error.message || "Unable to update application status."); } finally { setSaving(false); } };
  return <><div className="job-card-actions"><button className="button button-primary" disabled={saving || !nextStatus} onClick={() => nextStatus && update(nextStatus)}>{saving ? "Updating..." : application.status === "Applied" ? "Review" : application.status === "Under Review" ? "Shortlist" : application.status === "Shortlisted" ? "Move to Interview" : application.status === "Interview" ? "Select Candidate" : application.status}</button>{!["Selected", "Rejected"].includes(application.status) && <button className="button button-secondary" disabled={saving} onClick={() => setConfirming(true)}>Reject Application</button>}</div>{confirming && <div className="confirmation-backdrop" role="presentation"><div className="confirmation-dialog" role="dialog" aria-modal="true" aria-labelledby="reject-title"><h2 id="reject-title">Reject application?</h2><p>Are you sure you want to reject this candidate for this position?</p><div className="job-card-actions"><button className="button button-secondary" disabled={saving} onClick={() => setConfirming(false)}>Cancel</button><button className="button button-primary" disabled={saving} onClick={() => { setConfirming(false); update("Rejected"); }}>{saving ? "Rejecting..." : "Reject Application"}</button></div></div></div>}</>;
}

export function EmployerApplicationDetails() {
  const { id } = useParams(); const { data, loading, error, reload } = useEmployerData(); const [actionError, setActionError] = useState("");
  return <EmployerState loading={loading} error={error}><EmployerShell>{(() => { const application = data.applications.find((item) => item.id === id); if (!application) return <div className="data-error">Application not found or you are not authorized to view it.</div>; return <><PageHeader eyebrow="APPLICATION DETAILS" title={application.profiles?.full_name || "Candidate"} description={application.profiles?.email || application.jobs?.title} action={<StatusBadge>{application.status}</StatusBadge>} /><section className="overview-grid three"><StatCard label="Applied for" value={application.jobs?.title || "Job"} detail={application.jobs?.company_name || ""} /><StatCard label="Match" value={`${application.match?.match ?? 0}%`} detail={application.match?.matchLabel || "Calculated match"} tone="green" /><StatCard label="Applied" value={new Date(application.applied_at).toLocaleDateString()} detail="Application date" /></section><section className="panel job-detail-main"><h2>Application status</h2><ApplicationTimeline status={application.status} /><h2>Skill match</h2><div className="match-columns"><div><h3>Matched skills</h3><p>{application.match?.matchedSkills?.map((skill) => `${skill.skills?.name} (${skill.current}%)`).join(", ") || "None"}</p></div><div><h3>Missing skills</h3><p>{application.match?.missingSkills?.map((skill) => `${skill.skills?.name} (${skill.current === null ? "Not assessed" : `${skill.current}%`})`).join(", ") || "None"}</p></div></div><h2>Candidate overview</h2><p>Profile information is limited to the candidate record and skill evidence relevant to this application.</p><div className="job-card-actions"><ApplicationActions application={application} employerId={data.employer.id} onUpdated={reload} onError={setActionError} /></div>{actionError && <div className="data-error">{actionError}</div>}</section></>; })()}</EmployerShell></EmployerState>;
}

export function EmployerProfile() {
  const { user, profile, refreshProfile } = useAuth(); const [form, setForm] = useState({ full_name: profile?.full_name || "", location: profile?.location || "", career_goal: profile?.career_goal || "", bio: profile?.bio || "" }); const [state, setState] = useState({ saving: false, message: "", error: "" });
  const save = async (event) => { event.preventDefault(); setState({ saving: true, message: "", error: "" }); try { await updateProfile(user.id, form); await refreshProfile(user); setState({ saving: false, message: "Company profile saved.", error: "" }); } catch (saveError) { setState({ saving: false, message: "", error: saveError.message || "Unable to save profile." }); } };
  return <EmployerShell><PageHeader eyebrow="COMPANY PROFILE" title="Employer profile" description="Manage the profile details supported by your existing SkillTrack account." />{state.message && <div className="auth-success data-feedback">{state.message}</div>}{state.error && <div className="data-error">{state.error}</div>}<form className="panel project-form" onSubmit={save}><div className="form-grid"><label>Employer name<input required value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} /></label><label>Email<input value={profile?.email || ""} readOnly /></label><label>Location<input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} /></label><label>Career goal / company focus<input value={form.career_goal} onChange={(event) => setForm({ ...form, career_goal: event.target.value })} /></label><label className="form-wide">About company<textarea value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} /></label></div><div className="muted">Profile completion: {profile?.profile_completion || 0}%</div><button className="button button-primary" disabled={state.saving}>{state.saving ? "Saving..." : "Save profile"}</button></form></EmployerShell>;
}
