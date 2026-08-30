import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AppTable, PageHeader, PlatformLayout, StatCard, StatusBadge } from "../components/Platform";
import { getApplications, getJobMatches } from "../services/skilltrackService";
import { useAuth } from "../context/AuthContext";

function StudentApplicationTimeline({ status }) {
  const stages =
    status === "Rejected"
      ? ["Applied", "Under Review", "Rejected"]
      : ["Applied", "Under Review", "Shortlisted", "Interview", "Selected"];
  const currentIndex = stages.indexOf(status);

  return (
    <div className="application-timeline">
      {stages.map((stage, index) => (
        <div
          className={`timeline-step ${index <= currentIndex ? "complete" : ""} ${
            stage === status ? "current" : ""
          }`}
          key={stage}
        >
          <span>{stage === "Rejected" ? "✕" : index <= currentIndex ? "✓" : "○"}</span>
          <strong>{stage}</strong>
          {index < stages.length - 1 && <i />}
        </div>
      ))}
    </div>
  );
}

export function StudentApplicationDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [state, setState] = useState({
    loading: true,
    error: "",
    application: null,
    match: null,
  });

  useEffect(() => {
    if (!user?.id) return undefined;
    Promise.all([getApplications(user.id), getJobMatches(user.id)])
      .then(([applications, matches]) => {
        const application = applications.find((item) => item.id === id);
        setState({
          loading: false,
          error: application ? "" : "Application not found.",
          application,
          match: matches.find((item) => item.id === application?.job_id) || null,
        });
      })
      .catch((error) =>
        setState({
          loading: false,
          error: error.message || "Unable to load application.",
          application: null,
          match: null,
        })
      );
  }, [id, user?.id]);

  if (state.loading) {
    return (
      <PlatformLayout>
        <div className="route-state">Loading application details...</div>
      </PlatformLayout>
    );
  }

  if (state.error || !state.application) {
    return (
      <PlatformLayout>
        <div className="data-error">{state.error || "Application not found."}</div>
      </PlatformLayout>
    );
  }

  const { application, match } = state;

  return (
    <PlatformLayout>
      <PageHeader
        eyebrow="CANDIDACY TRACKING"
        title={application.jobs?.title || "Application"}
        description={`${application.jobs?.company_name || ""} · ${application.jobs?.location || ""}`}
        action={<StatusBadge>{application.status}</StatusBadge>}
      />

      <section className="job-detail-grid">
        <article className="panel job-detail-main">
          <h2>Application Pipeline Status</h2>
          <StudentApplicationTimeline status={application.status} />

          <h2 style={{ marginTop: "24px" }}>Role Overview</h2>
          <p style={{ color: "var(--ink-700)", lineHeight: "1.65", fontSize: "14px" }}>
            {application.jobs?.description || "No description provided."}
          </p>

          <h2 style={{ marginTop: "24px" }}>Required Verified Skills</h2>
          <div className="job-skills">
            {application.jobs?.job_skills?.map((skill) => (
              <span key={skill.skill_id}>
                {skill.skills?.name} · Min {skill.minimum_score}%
              </span>
            ))}
          </div>

          <h2 style={{ marginTop: "24px" }}>Your Match Score</h2>
          <div className="job-match-large">
            <strong>{match?.match ?? 0}%</strong>
            <div>
              <StatusBadge>{match?.matchLabel || "Low Match"}</StatusBadge>
              <p style={{ margin: "4px 0 0", color: "var(--ink-500)", fontSize: "13px" }}>
                Calculated from your current verified skill credentials.
              </p>
            </div>
          </div>

          <div className="match-columns">
            <div>
              <h3>Matched Skills ({match?.matchedSkills?.length || 0})</h3>
              {match?.matchedSkills?.length ? (
                match.matchedSkills.map((skill) => (
                  <p key={skill.skill_id} style={{ color: "var(--green-700)" }}>
                    ✓ {skill.skills?.name} · {skill.current}% score
                  </p>
                ))
              ) : (
                <p style={{ color: "var(--ink-500)" }}>None currently meet the threshold</p>
              )}
            </div>
            <div>
              <h3>Gaps to Improve ({match?.missingSkills?.length || 0})</h3>
              {match?.missingSkills?.length ? (
                match.missingSkills.map((skill) => (
                  <p key={skill.skill_id} style={{ color: "var(--amber-700)" }}>
                    ! {skill.skills?.name} ·{" "}
                    {skill.current === null ? "Not assessed" : `${skill.current}% score`}
                  </p>
                ))
              ) : (
                <p style={{ color: "var(--green-700)" }}>All required skills meet requirements</p>
              )}
            </div>
          </div>
        </article>

        <aside className="panel job-apply-panel">
          <span className="section-kicker">APPLICATION SUMMARY</span>
          <h2>{application.status}</h2>
          <p style={{ color: "var(--ink-600)", fontSize: "13px", margin: "6px 0 16px" }}>
            Applied on {new Date(application.applied_at).toLocaleDateString()}
          </p>

          <Link
            className="button button-secondary full-width"
            to="/applications"
            style={{ textAlign: "center", display: "block" }}
          >
            ← Back to Applications
          </Link>
        </aside>
      </section>
    </PlatformLayout>
  );
}

export default function Applications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [matches, setMatches] = useState({});
  const [state, setState] = useState({ loading: true, error: "" });
  const [filters, setFilters] = useState({ search: "", status: "All", job: "All" });

  useEffect(() => {
    if (!user?.id) return undefined;
    Promise.all([getApplications(user.id), getJobMatches(user.id)])
      .then(([items, jobs]) => {
        setApplications(items);
        setMatches(Object.fromEntries(jobs.map((job) => [job.id, job])));
      })
      .catch((error) =>
        setState({ loading: false, error: error.message || "Unable to load applications." })
      )
      .finally(() => setState((prev) => ({ ...prev, loading: false })));
  }, [user?.id]);

  const filteredApplications = applications.filter((application) => {
    const searchTarget = `${application.jobs?.title || ""} ${application.jobs?.company_name || ""} ${
      application.status || ""
    }`.toLowerCase();
    const matchesSearch =
      !filters.search || searchTarget.includes(filters.search.trim().toLowerCase());
    const matchesStatus = filters.status === "All" || application.status === filters.status;
    const matchesJob = filters.job === "All" || application.job_id === filters.job;
    return matchesSearch && matchesStatus && matchesJob;
  });

  const jobOptions = [...new Set(applications.map((application) => application.job_id).filter(Boolean))].map(
    (jobId) => ({
      value: jobId,
      label: applications.find((application) => application.job_id === jobId)?.jobs?.title || "Role",
    })
  );

  const hasActiveFilters = Boolean(filters.search || filters.status !== "All" || filters.job !== "All");
  const clearFilters = () => setFilters({ search: "", status: "All", job: "All" });

  return (
    <PlatformLayout>
      <PageHeader
        eyebrow="APPLICATION TRACKING"
        title="Application Tracker"
        description="Monitor active applications, stage progression, recruiter feedback, and interviews in one place."
        action={
          <Link className="button button-primary" to="/jobs">
            Find Opportunities →
          </Link>
        }
      />

      <section className="overview-grid three">
        <StatCard
          label="Total Applications"
          value={applications.length}
          detail="Active submissions in pipeline"
          tone="blue"
        />
        <StatCard
          label="Interview Stage"
          value={applications.filter((item) => item.status === "Interview").length}
          detail="Under active review"
          tone="green"
        />
        <StatCard
          label="Selected Offers"
          value={applications.filter((item) => item.status === "Selected").length}
          detail="Successful placements"
          tone="orange"
        />
      </section>

      <section className="panel panel-table">
        <div className="panel-header">
          <div>
            <p className="eyebrow">ACTIVE PIPELINE</p>
            <h2>Submitted Applications</h2>
          </div>
          <span className="muted">{filteredApplications.length} records</span>
        </div>

        <div className="filter-toolbar compact">
          <label className="search-field" aria-label="Search applications">
            <span className="search-field-icon">⌕</span>
            <input
              type="search"
              placeholder="Search role or company..."
              value={filters.search}
              onChange={(event) => setFilters({ ...filters, search: event.target.value })}
            />
          </label>

          <select
            aria-label="Filter by application status"
            value={filters.status}
            onChange={(event) => setFilters({ ...filters, status: event.target.value })}
          >
            <option value="All">All Statuses</option>
            {["Applied", "Under Review", "Shortlisted", "Interview", "Selected", "Rejected"].map(
              (status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              )
            )}
          </select>

          <select
            aria-label="Filter by job"
            value={filters.job}
            onChange={(event) => setFilters({ ...filters, job: event.target.value })}
          >
            <option value="All">All Job Roles</option>
            {jobOptions.map((job) => (
              <option key={job.value} value={job.value}>
                {job.label}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button type="button" className="button button-secondary" onClick={clearFilters}>
              Clear Filters
            </button>
          )}
        </div>

        {state.loading && (
          <div className="route-state loading-panel">
            <div className="skeleton-card" />
            <div className="skeleton-card" />
          </div>
        )}

        {state.error && <div className="data-error">{state.error}</div>}

        {!state.loading && !state.error && !filteredApplications.length && (
          <div className="empty-state">
            <h3>No applications match your filter criteria.</h3>
            <p>Try resetting the filter search or explore new open opportunities.</p>
            <Link className="button button-primary" to="/jobs">
              Browse Open Jobs →
            </Link>
          </div>
        )}

        {!state.loading && !state.error && filteredApplications.length > 0 && (
          <AppTable
            headers={["Target Role", "Company", "Skill Match", "Applied Date", "Current Status", "Action"]}
            rows={filteredApplications.map((application) => (
              <tr key={application.id}>
                <td>
                  <strong>{application.jobs?.title}</strong>
                </td>
                <td>{application.jobs?.company_name}</td>
                <td>
                  <strong style={{ color: "var(--blue-600)" }}>
                    {matches[application.job_id] ? `${matches[application.job_id].match}%` : "—"}
                  </strong>
                </td>
                <td>{new Date(application.applied_at).toLocaleDateString()}</td>
                <td>
                  <StatusBadge>{application.status}</StatusBadge>
                </td>
                <td>
                  <Link className="table-action" to={`/applications/${application.id}`}>
                    View Details →
                  </Link>
                </td>
              </tr>
            ))}
          />
        )}
      </section>
    </PlatformLayout>
  );
}

