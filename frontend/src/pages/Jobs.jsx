import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PageHeader, PlatformLayout, StatusBadge } from "../components/Platform";
import { applyToJob, getApplications, getJobById, getJobMatches } from "../services/skilltrackService";
import { useAuth } from "../context/AuthContext";

function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [match, setMatch] = useState(null);
  const [applied, setApplied] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState("");
  const [state, setState] = useState({ loading: true, error: "", message: "" });
  useEffect(() => {
    let active = true;
    Promise.all([getJobById(id), getJobMatches(user.id), getApplications(user.id)]).then(([detail, allMatches, applications]) => {
      if (!active) return;
      setJob(detail);
      setMatch(allMatches.find((item) => item.id === detail.id) || null);
      const existingApplication = applications.find((application) => application.job_id === detail.id);
      setApplied(Boolean(existingApplication));
      setApplicationStatus(existingApplication?.status || "");
    }).catch((error) => { if (active) setState((previous) => ({ ...previous, error: error.message || "Unable to load this job." })); }).finally(() => { if (active) setState((previous) => ({ ...previous, loading: false })); });
    return () => { active = false; };
  }, [id, user.id]);
  const apply = async () => {
    if (applied || job.status !== "Active") return;
    try { await applyToJob(id, user.id); setApplied(true); setState((previous) => ({ ...previous, message: "Application submitted successfully." })); }
    catch (error) { setState((previous) => ({ ...previous, error: error.message || "Unable to submit application." })); }
  };
  if (state.loading) return <PlatformLayout><div className="route-state">Loading job details...</div></PlatformLayout>;
  if (state.error) return <PlatformLayout><div className="data-error">{state.error}</div></PlatformLayout>;
  const result = match || { match: 0, matchLabel: "Low Match", matchedSkills: [], missingSkills: [] };
  return <PlatformLayout>
    <PageHeader eyebrow="OPPORTUNITY DETAILS" title={job.title} description={`${job.company_name} · ${job.location}`} action={<StatusBadge>{result.matchLabel}</StatusBadge>} />
    <section className="job-detail-grid">
      <article className="panel job-detail-main">
        <div className="job-detail-meta"><span>{job.location}</span><span>{job.employment_type || "Employment type not listed"}</span><span>{job.salary_range || "Salary not listed"}</span></div>
        <h2>About this role</h2><p>{job.description || "No description has been provided for this role."}</p>
        <h2>Required skills</h2><div className="job-skills">{job.job_skills?.map((item) => <span key={item.skill_id}>{item.skills?.name} · {item.minimum_score}%</span>)}</div>
        <h2>Your match</h2><div className="job-match-large"><strong>{result.match}%</strong><div><StatusBadge>{result.matchLabel}</StatusBadge><p>Based on your current skill progress.</p></div></div>
        <div className="match-columns"><div><h3>Matched skills</h3>{result.matchedSkills.length ? result.matchedSkills.map((item) => <p key={item.skill_id}>✓ {item.skills?.name} · {item.current}%</p>) : <p>No required skills currently meet the threshold.</p>}</div><div><h3>Skills to improve</h3>{result.missingSkills.length ? result.missingSkills.map((item) => <p key={item.skill_id}>! {item.skills?.name} · {item.current === null ? "Not assessed" : `${item.current}%`}</p>) : <p>All required skills meet the threshold.</p>}</div></div>
      </article>
      <aside className="panel job-apply-panel"><span className="section-kicker">READY TO MOVE FORWARD?</span><h2>{result.match}% match</h2><p>Apply with your current profile and keep building your readiness through SkillTrack.</p><button className="button button-primary full-width" disabled={applied || job.status !== "Active"} onClick={apply}>{job.status !== "Active" ? "Applications Closed" : applicationStatus === "Rejected" ? "Application Rejected" : applied ? "Already Applied" : "Apply"}</button><button className="button button-secondary full-width" onClick={() => navigate(`/learning?skill=${result.missingSkills[0]?.skill_id || ""}`)}>Improve Skill</button>{state.message && <div className="auth-success data-feedback">{state.message}</div>}<Link className="back-link" to="/jobs">Back to jobs</Link></aside>
    </section>
  </PlatformLayout>;
}

function Jobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [state, setState] = useState({ loading: true, error: "" });
  const [filters, setFilters] = useState({ search: "", location: "All", employment: "All", minimumMatch: "0" });

  useEffect(() => {
    let active = true;
    Promise.all([getJobMatches(user.id), getApplications(user.id)]).then(([availableJobs, applications]) => {
      if (!active) return;
      setJobs(availableJobs);
      setAppliedIds(new Set(applications.map((application) => application.job_id)));
    }).catch((error) => {
      if (active) setState({ loading: false, error: error.message || "Unable to load jobs." });
    }).finally(() => {
      if (active) setState((previous) => ({ ...previous, loading: false }));
    });
    return () => { active = false; };
  }, [user.id]);

  const filteredJobs = useMemo(() => jobs.filter((job) => {
    const haystack = `${job.title} ${job.company_name} ${job.job_skills?.map((item) => item.skills?.name).join(" ")}`.toLowerCase();
    const matchesSearch = !filters.search || haystack.includes(filters.search.trim().toLowerCase());
    const matchesLocation = filters.location === "All" || job.location === filters.location;
    const matchesEmployment = filters.employment === "All" || job.employment_type === filters.employment;
    const matchesMinimum = Number(job.match || 0) >= Number(filters.minimumMatch || 0);
    return matchesSearch && matchesLocation && matchesEmployment && matchesMinimum;
  }), [jobs, filters]);

  const locations = [...new Set(jobs.map((job) => job.location).filter(Boolean))];
  const employmentTypes = [...new Set(jobs.map((job) => job.employment_type).filter(Boolean))];
  const hasActiveFilters = Boolean(filters.search || filters.location !== "All" || filters.employment !== "All" || Number(filters.minimumMatch) > 0);

  const clearFilters = () => setFilters({ search: "", location: "All", employment: "All", minimumMatch: "0" });

  return <PlatformLayout>
    <PageHeader eyebrow="JOB MATCHES" title="Recommended opportunities" description="Explore roles matched to your real skill progress and find your next step." />
    <section className="job-filters panel">
      <div className="filter-toolbar">
        <label className="search-field" aria-label="Search jobs">
          <span className="search-field-icon">⌕</span>
          <input
            type="search"
            placeholder="Search roles, companies, or skills"
            value={filters.search}
            onChange={(event) => setFilters({ ...filters, search: event.target.value })}
          />
        </label>
        <select aria-label="Filter by location" value={filters.location} onChange={(event) => setFilters({ ...filters, location: event.target.value })}>
          <option value="All">All locations</option>
          {locations.map((location) => <option key={location}>{location}</option>)}
        </select>
        <select aria-label="Filter by employment type" value={filters.employment} onChange={(event) => setFilters({ ...filters, employment: event.target.value })}>
          <option value="All">All types</option>
          {employmentTypes.map((type) => <option key={type}>{type}</option>)}
        </select>
        <select aria-label="Filter by minimum match" value={filters.minimumMatch} onChange={(event) => setFilters({ ...filters, minimumMatch: event.target.value })}>
          <option value="0">Any match</option>
          <option value="40">40%+ match</option>
          <option value="60">60%+ match</option>
          <option value="80">80%+ match</option>
        </select>
        {hasActiveFilters && <button type="button" className="button button-secondary" onClick={clearFilters}>Clear filters</button>}
      </div>
    </section>

    <section className="job-grid dashboard-jobs-grid">
      {state.loading && <div className="route-state loading-panel"><div className="skeleton-card" /><div className="skeleton-card" /><div className="skeleton-card" /></div>}
      {!state.loading && state.error && <div className="data-error">{state.error}</div>}
      {!state.loading && !state.error && !filteredJobs.length && (
        <div className="empty-state">
          <h3>No opportunities match these filters.</h3>
          <p>Try clearing the current filters or update your skill data to unlock more job matches.</p>
          <button type="button" className="button button-primary" onClick={clearFilters}>Clear filters</button>
        </div>
      )}
      {filteredJobs.map((job) => <article key={job.id} className="job-card"><div className="job-header-row"><div><h3>{job.title}</h3><p>{job.company_name}</p></div><div className="job-match-badge"><strong>{job.match}%</strong><small>{job.matchLabel}</small></div></div><div className="job-location">{job.location} · {job.employment_type || "Employment type not listed"} · {job.salary_range || "Salary not listed"}</div><p className="job-description">{job.description || "No description provided."}</p><div className="job-skills">{job.job_skills?.map((item) => <span key={item.skill_id}>{item.skills?.name}</span>)}</div><div className="job-match-summary"><span>Matched: {job.matchedSkills.length}</span><span>Needs improvement: {job.missingSkills.length}</span></div><div className="job-card-actions"><Link to={`/jobs/${job.id}`} className="button button-secondary">View details</Link><Link to={`/jobs/${job.id}`} className="button button-primary">{appliedIds.has(job.id) ? "Already Applied" : "Apply"}</Link></div></article>)}
    </section>
  </PlatformLayout>;
}

export default function JobsRoute() {
  const { id } = useParams();
  return id ? <JobDetails /> : <Jobs />;
}
