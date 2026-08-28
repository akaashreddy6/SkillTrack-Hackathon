import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardHeader } from "../components/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { getDashboardData, getJobMatches } from "../services/skilltrackService";

function OverviewCard({ label, value, detail, accent, icon }) {
  return (
    <div className="overview-card">
      <div className="card-header-row">
        <span className="overview-label">{label}</span>
        <span className={`overview-icon ${accent}`}>{icon}</span>
      </div>
      <div className="overview-value">{value}</div>
      <div className="overview-detail">{detail}</div>
    </div>
  );
}

function skillLevel(score) {
  return score < 40 ? "Critical Gap" : score < 60 ? "Needs Improvement" : score < 80 ? "Good" : "Strong";
}

function Dashboard() {
  const { user, profile } = useAuth();
  const [data, setData] = useState({ profile: null, progress: [], attempts: [], applications: [], jobs: [] });
  const [state, setState] = useState({ loading: true, error: "" });
  useEffect(() => {
    if (!user?.id) {
      setState({ loading: false, error: "Please sign in to view your dashboard." });
      return undefined;
    }
    let active = true;
    const loadDashboard = () => {
      setState({ loading: true, error: "" });
      Promise.all([getDashboardData(user.id), getJobMatches(user.id)]).then(([dashboard, availableJobs]) => {
        if (!active) return;
        const assessedSkillIds = new Set(dashboard.attempts.map((attempt) => attempt.assessments?.skill_id).filter(Boolean));
        setData({ ...dashboard, assessedSkillCount: assessedSkillIds.size, jobs: availableJobs.slice(0, 3) });
      }).catch((error) => { if (active) setState({ loading: false, error: error.message || "Unable to load your dashboard." }); }).finally(() => { if (active) setState((prev) => ({ ...prev, loading: false })); });
    };
    loadDashboard();
    window.addEventListener("focus", loadDashboard);
    window.addEventListener("skilltrack:assessment-submitted", loadDashboard);
    return () => { active = false; window.removeEventListener("focus", loadDashboard); window.removeEventListener("skilltrack:assessment-submitted", loadDashboard); };
  }, [user?.id]);
  if (!user) return <div className="route-state">Please sign in to view your dashboard.</div>;
  const currentProfile = data.profile || profile;
  const overallScore = data.progress.length ? Math.round(data.progress.reduce((total, item) => total + item.current_score, 0) / data.progress.length) : 0;
  const gaps = data.progress.filter((item) => item.gap_percentage > 0);
  return (
    <div className="dashboard-page">
      <DashboardHeader />

      <main className="dashboard-main">
        <section className="welcome-panel">
          <div>
            <p className="eyebrow">STUDENT DASHBOARD</p>
            <h1>Good morning, {currentProfile?.full_name || "there"}</h1>
            <p className="dashboard-subtitle">Your career readiness overview</p>
            <p className="welcome-copy">
              {currentProfile?.email || user.email} · {currentProfile?.role || "student"}
            </p>
            {!currentProfile && <p className="data-error">Your profile has not been created yet. Open Profile to complete it.</p>}
          </div>

          <Link to="/learning" className="primary-dashboard-button">
            Continue Learning
          </Link>
        </section>

        <section className="overview-grid">
          <OverviewCard label="Overall Skill Score" value={`${overallScore}%`} detail="From your latest assessments" accent="blue" icon="★" />
          <OverviewCard label="Skills Assessed" value={data.assessedSkillCount ?? data.progress.length} detail="Completed assessments" accent="green" icon="✓" />
          <OverviewCard label="Skill Gaps" value={gaps.length} detail="Areas below target" accent="orange" icon="!" />
          <OverviewCard label="Profile Completion" value={`${currentProfile?.profile_completion || 0}%`} detail="Keep your profile current" accent="purple" icon="↗" />
        </section>

        <section className="dashboard-grid">
          <div className="panel panel-wide">
            <div className="panel-header">
              <h2>Skill Progress</h2>
              <span>Updated today</span>
            </div>

            <div className="progress-list">
              {state.loading && <div className="route-state">Loading your skill progress...</div>}
              {!state.loading && !data.progress.length && <div className="empty-state">No skill assessments completed yet.</div>}
              {data.progress.map((skill) => (
                <div key={skill.id} className="progress-item">
                  <div className="progress-label-row">
                    <span>{skill.skills?.name}</span>
                    <strong>{skill.current_score}%</strong>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${skill.current_score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h2>Skill Gaps</h2>
              <span>Recommended</span>
            </div>

            <div className="gap-list">
              {!state.loading && !state.error && !gaps.length && <div className="empty-state">No skills need improvement right now.</div>}
              {gaps.map((gap) => (
                <div key={gap.id} className="gap-item">
                  <div className="gap-topline">
                    <strong>{gap.skills?.name}</strong>
                    <span>{gap.current_score}%</span>
                  </div>
                  <p>Target: {gap.target_score}% · Gap: {gap.gap_percentage}% · {skillLevel(gap.current_score)}</p>
                  <p className="gap-recommendation">Top recommendation: {gap.current_score < 40 ? "Fundamentals" : gap.current_score < 60 ? "Core skills" : gap.current_score < 80 ? "Advanced skills" : "Practical projects"}</p>
                    <Link to={`/learning?skill=${gap.skill_id}`} className="secondary-action">
                    Improve Skill
                    </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="panel panel-table">
          <div className="panel-header">
            <h2>Recent Assessments</h2>
            <span>Last 30 days</span>
          </div>

          <div className="table-wrap">
            {state.error && <div className="data-error">{state.error}</div>}
            {!state.loading && !state.error && !data.attempts.length && <div className="empty-state">No assessments completed yet.</div>}
            <table>
              <thead>
                <tr>
                  <th>Assessment</th>
                  <th>Skill</th>
                  <th>Score</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.attempts.map((assessment) => (
                  <tr key={assessment.id}>
                    <td>{assessment.assessments?.title}</td>
                    <td>{assessment.assessments?.skills?.name}</td>
                    <td>{assessment.percentage}%</td>
                    <td>{new Date(assessment.completed_at).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-badge ${assessment.performance_level.toLowerCase().replace(/\s+/g, "-")}`}>
                        {assessment.performance_level}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>Job Recommendations</h2>
            <span>Best matches</span>
          </div>

          <div className="job-grid">
            {data.jobs.map((job) => (
              <article key={job.id} className="job-card">
                <div className="job-header-row">
                  <div>
                    <h3>{job.title}</h3>
                    <p>{job.company_name}</p>
                  </div>
                  <span className="match-pill">{job.match}% Match</span>
                </div>

                {job.missingSkills?.length > 0 && <p className="job-missing">Missing: {job.missingSkills.map((item) => item.skills?.name).join(", ")}</p>}

                <div className="job-skills">
                  {job.job_skills?.map((jobSkill) => (
                    <span key={jobSkill.skill_id}>{jobSkill.skills?.name}</span>
                  ))}
                </div>

                <Link to="/jobs" className="secondary-action full-width">
                  View Job
                </Link>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
