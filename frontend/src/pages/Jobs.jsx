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
    if (!user?.id) return undefined;
    let active = true;
    Promise.all([getJobById(id), getJobMatches(user.id), getApplications(user.id)])
      .then(([detail, allMatches, applications]) => {
        if (!active) return;
        setJob(detail);
        setMatch(allMatches.find((item) => item.id === detail.id) || null);
        const existingApplication = applications.find((application) => application.job_id === detail.id);
        setApplied(Boolean(existingApplication));
        setApplicationStatus(existingApplication?.status || "");
      })
      .catch((error) => {
        if (active) setState((previous) => ({ ...previous, error: error.message || "Unable to load this job." }));
      })
      .finally(() => {
        if (active) setState((previous) => ({ ...previous, loading: false }));
      });
    return () => {
      active = false;
    };
  }, [id, user?.id]);

  const apply = async () => {
    if (applied || job.status !== "Active") return;
    try {
      await applyToJob(id, user.id);
      setApplied(true);
      setState((previous) => ({ ...previous, message: "Application submitted successfully." }));
    } catch (error) {
      setState((previous) => ({
        ...previous,
        error: error.message || "Unable to submit application.",
      }));
    }
  };

  if (state.loading) {
    return (
      <PlatformLayout>
        <div className="route-state">Loading job details...</div>
      </PlatformLayout>
    );
  }

  if (state.error) {
    return (
      <PlatformLayout>
        <div className="data-error">{state.error}</div>
      </PlatformLayout>
    );
  }

  const result = match || { match: 0, matchLabel: "Low Match", matchedSkills: [], missingSkills: [] };

  return (
    <PlatformLayout>
      <PageHeader
        eyebrow="OPPORTUNITY PROFILE"
        title={job.title}
        description={`${job.company_name} · ${job.location}`}
        action={<StatusBadge>{result.matchLabel}</StatusBadge>}
      />

      <section className="job-detail-grid">
        <article className="panel job-detail-main">
          <div className="job-detail-meta">
            <span>📍 {job.location}</span>
            <span>💼 {job.employment_type || "Full-time"}</span>
            <span>💰 {job.salary_range || "Competitive"}</span>
          </div>

          <h2 style={{ fontSize: "17px", marginTop: "20px", color: "var(--ink-900)" }}>About this role</h2>
          <p style={{ color: "var(--ink-700)", lineHeight: "1.65", fontSize: "14px" }}>
            {job.description || "No description has been provided for this role."}
          </p>

          <h2 style={{ fontSize: "17px", marginTop: "24px", color: "var(--ink-900)" }}>Required verified skills</h2>
          <div className="job-skills">
            {job.job_skills?.map((item) => (
              <span key={item.skill_id}>
                {item.skills?.name} · Min {item.minimum_score}%
              </span>
            ))}
          </div>

          <h2 style={{ fontSize: "17px", marginTop: "24px", color: "var(--ink-900)" }}>Your capability match</h2>
          <div className="job-match-large">
            <strong>{result.match}%</strong>
            <div>
              <StatusBadge>{result.matchLabel}</StatusBadge>
              <p style={{ margin: "4px 0 0", color: "var(--ink-500)", fontSize: "13px" }}>
                Computed from your current assessment and progress data.
              </p>
            </div>
          </div>

          <div className="match-columns">
            <div>
              <h3>Matched Skills ({result.matchedSkills.length})</h3>
              {result.matchedSkills.length ? (
                result.matchedSkills.map((item) => (
                  <p key={item.skill_id} style={{ color: "var(--green-700)" }}>
                    ✓ {item.skills?.name} · {item.current}% score
                  </p>
                ))
              ) : (
                <p style={{ color: "var(--ink-500)" }}>No required skills currently meet the minimum benchmark.</p>
              )}
            </div>
            <div>
              <h3>Skills to Improve ({result.missingSkills.length})</h3>
              {result.missingSkills.length ? (
                result.missingSkills.map((item) => (
                  <p key={item.skill_id} style={{ color: "var(--amber-700)" }}>
                    ! {item.skills?.name} · {item.current === null ? "Not assessed" : `${item.current}% score`}
                  </p>
                ))
              ) : (
                <p style={{ color: "var(--green-700)" }}>All required skills meet or exceed the benchmark.</p>
              )}
            </div>
          </div>
        </article>

        <aside className="panel job-apply-panel">
          <span className="section-kicker">APPLICATION SUMMARY</span>
          <h2>{result.match}% Match Quality</h2>
          <p style={{ color: "var(--ink-600)", fontSize: "13px", lineHeight: "1.55", margin: "8px 0 16px" }}>
            Submit your profile and verified skill credentials directly to {job.company_name}.
          </p>

          <div style={{ display: "grid", gap: "10px" }}>
            <button
              type="button"
              className="button button-primary full-width"
              disabled={applied || job.status !== "Active"}
              onClick={apply}
            >
              {job.status !== "Active"
                ? "Applications Closed"
                : applicationStatus === "Rejected"
                ? "Application Rejected"
                : applied
                ? "Already Applied ✓"
                : "Submit Application"}
            </button>

            {result.missingSkills.length > 0 && (
              <button
                type="button"
                className="button button-secondary full-width"
                onClick={() => navigate(`/learning?skill=${result.missingSkills[0]?.skill_id || ""}`)}
              >
                Improve Missing Skills →
              </button>
            )}
          </div>

          {state.message && (
            <div className="auth-success data-feedback" style={{ marginTop: "14px" }}>
              {state.message}
            </div>
          )}

          <Link className="back-link" to="/jobs" style={{ display: "inline-block", marginTop: "16px" }}>
            ← Back to All Opportunities
          </Link>
        </aside>
      </section>
    </PlatformLayout>
  );
}

function Jobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [state, setState] = useState({ loading: true, error: "" });
  const [filters, setFilters] = useState({
    search: "",
    location: "All",
    employment: "All",
    minimumMatch: "0",
  });

  useEffect(() => {
    if (!user?.id) return undefined;
    let active = true;
    Promise.all([getJobMatches(user.id), getApplications(user.id)])
      .then(([availableJobs, applications]) => {
        if (!active) return;
        setJobs(availableJobs);
        setAppliedIds(new Set(applications.map((application) => application.job_id)));
      })
      .catch((error) => {
        if (active) setState({ loading: false, error: error.message || "Unable to load jobs." });
      })
      .finally(() => {
        if (active) setState((previous) => ({ ...previous, loading: false }));
      });
    return () => {
      active = false;
    };
  }, [user?.id]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const haystack = `${job.title} ${job.company_name} ${job.job_skills
        ?.map((item) => item.skills?.name)
        .join(" ")}`.toLowerCase();
      const matchesSearch = !filters.search || haystack.includes(filters.search.trim().toLowerCase());
      const matchesLocation = filters.location === "All" || job.location === filters.location;
      const matchesEmployment = filters.employment === "All" || job.employment_type === filters.employment;
      const matchesMinimum = Number(job.match || 0) >= Number(filters.minimumMatch || 0);
      return matchesSearch && matchesLocation && matchesEmployment && matchesMinimum;
    });
  }, [jobs, filters]);

  const locations = [...new Set(jobs.map((job) => job.location).filter(Boolean))];
  const employmentTypes = [...new Set(jobs.map((job) => job.employment_type).filter(Boolean))];
  const hasActiveFilters = Boolean(
    filters.search ||
      filters.location !== "All" ||
      filters.employment !== "All" ||
      Number(filters.minimumMatch) > 0
  );

  const clearFilters = () =>
    setFilters({ search: "", location: "All", employment: "All", minimumMatch: "0" });

  return (
    <PlatformLayout>
      <PageHeader
        eyebrow="TALENT MATCH ENGINE"
        title="Recommended Opportunities"
        description="Explore roles dynamically matched to your verified skills, current assessment scores, and career targets."
      />

      <section className="job-filters panel">
        <div className="filter-toolbar">
          <label className="search-field" aria-label="Search jobs">
            <span className="search-field-icon">⌕</span>
            <input
              type="search"
              placeholder="Search roles, companies, or skills..."
              value={filters.search}
              onChange={(event) => setFilters({ ...filters, search: event.target.value })}
            />
          </label>

          <select
            aria-label="Filter by location"
            value={filters.location}
            onChange={(event) => setFilters({ ...filters, location: event.target.value })}
          >
            <option value="All">All Locations</option>
            {locations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by employment type"
            value={filters.employment}
            onChange={(event) => setFilters({ ...filters, employment: event.target.value })}
          >
            <option value="All">All Employment Types</option>
            {employmentTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by minimum match"
            value={filters.minimumMatch}
            onChange={(event) => setFilters({ ...filters, minimumMatch: event.target.value })}
          >
            <option value="0">Any Match %</option>
            <option value="40">40%+ Match</option>
            <option value="60">60%+ Match</option>
            <option value="80">80%+ Match</option>
          </select>

          {hasActiveFilters && (
            <button type="button" className="button button-secondary" onClick={clearFilters}>
              Clear Filters
            </button>
          )}
        </div>
      </section>

      <section className="job-grid dashboard-jobs-grid">
        {state.loading && (
          <div className="route-state loading-panel">
            <div className="skeleton-card" />
            <div className="skeleton-card" />
            <div className="skeleton-card" />
          </div>
        )}

        {!state.loading && state.error && <div className="data-error">{state.error}</div>}

        {!state.loading && !state.error && !filteredJobs.length && (
          <div className="empty-state">
            <h3>No opportunities match these filters.</h3>
            <p>Try clearing current filters or complete more assessments to boost your match quality.</p>
            <button type="button" className="button button-primary" onClick={clearFilters}>
              Reset Filters
            </button>
          </div>
        )}

        {filteredJobs.map((job) => (
          <article key={job.id} className="job-card">
            <div className="job-header-row">
              <div>
                <h3>{job.title}</h3>
                <p>{job.company_name}</p>
              </div>
              <div className="job-match-badge">
                <strong>{job.match}%</strong>
                <small>{job.matchLabel}</small>
              </div>
            </div>

            <div className="job-location">
              {job.location} · {job.employment_type || "Full-time"} · {job.salary_range || "Competitive"}
            </div>

            <p className="job-description">{job.description || "No description provided."}</p>

            <div className="job-skills">
              {job.job_skills?.map((item) => (
                <span key={item.skill_id}>{item.skills?.name}</span>
              ))}
            </div>

            <div className="job-match-summary">
              <span>Matched Skills: {job.matchedSkills.length}</span>
              <span>Gaps to Close: {job.missingSkills.length}</span>
            </div>

            <div className="job-card-actions">
              <Link to={`/jobs/${job.id}`} className="button button-secondary">
                View Details
              </Link>
              <Link to={`/jobs/${job.id}`} className="button button-primary">
                {appliedIds.has(job.id) ? "Applied ✓" : "Apply Now →"}
              </Link>
            </div>
          </article>
        ))}
      </section>
    </PlatformLayout>
  );
}

export default function JobsRoute() {
  const { id } = useParams();
  return id ? <JobDetails /> : <Jobs />;
}

