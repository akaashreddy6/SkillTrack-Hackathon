import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardHeader } from "../components/DashboardLayout";
import SkillTrackAI from "../components/SkillTrackAI";
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
  const [data, setData] = useState({ profile: null, progress: [], attempts: [], applications: [], jobs: [], learning: [] });
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
  const overallScore = data.progress.length ? Math.round(data.progress.reduce((total, item) => total + Number(item.current_score || 0), 0) / data.progress.length) : 0;
  const readinessLevel = overallScore >= 80 ? "Career ready" : overallScore >= 65 ? "Strong momentum" : overallScore >= 45 ? "Building readiness" : "Early stage";
  const strengths = [...data.progress].sort((first, second) => Number(second.current_score || 0) - Number(first.current_score || 0)).slice(0, 3);
  const priorityGaps = [...data.progress].filter((item) => Number(item.gap_percentage || 0) > 0).sort((first, second) => Number(second.gap_percentage || 0) - Number(first.gap_percentage || 0)).slice(0, 3);
  const learningInProgress = (data.learning || []).filter((item) => item.status !== "Completed").slice(0, 3);
  const nextAction = priorityGaps[0]
    ? { label: "Improve skill", href: `/learning?skill=${priorityGaps[0].skill_id || ""}`, detail: `${priorityGaps[0].skills?.name || "Priority skill"} is your clearest improvement area.` }
    : (data.attempts.length ? { label: "Take an assessment", href: "/assessments", detail: "Refresh your skill signal and close the next gap." } : { label: "Complete profile", href: "/profile", detail: "Strengthen your profile so employers can match you more accurately." });
  const continueTarget = [...(data.learning || [])]
    .sort((first, second) => new Date(second.updated_at || 0) - new Date(first.updated_at || 0))
    .find((item) => item.status !== "Completed") || null;
  const continueLearningHref = continueTarget
    ? (() => {
        const skillId = continueTarget.learning_topics?.skill_id || continueTarget.skill_id || "";
        const topicId = continueTarget.learning_topic_id || continueTarget.learning_topics?.id || "";
        const params = new URLSearchParams();

        if (skillId) {
          params.set("skill", String(skillId));
        }

        if (topicId) {
          params.set("topic", String(topicId));
        }

        return params.toString() ? `/learning?${params.toString()}` : "/learning";
      })()
    : "/learning";

  return (
    <div className="dashboard-page">
      <DashboardHeader />

      <main className="dashboard-main">
        <section className="dashboard-hero panel">
          <div className="dashboard-hero-copy">
            <p className="eyebrow">STUDENT COMMAND CENTER</p>
            <h1>Good morning, {currentProfile?.full_name || "there"}</h1>
            <p className="dashboard-subtitle">Your next career move starts here.</p>
            <p className="welcome-copy">
              {currentProfile?.email || user.email} · {currentProfile?.role || "student"}
            </p>
            {!currentProfile && <p className="data-error">Your profile has not been created yet. Open Profile to complete it.</p>}
          </div>

          <div className="readiness-score-card">
            <div className="score-ring" aria-label={`${overallScore}% career readiness`}>
              <div>
                <strong>{overallScore}%</strong>
                <span>Ready</span>
              </div>
            </div>
            <div>
              <span className="readiness-label">Career readiness</span>
              <strong>{readinessLevel}</strong>
              <small>{data.progress.length ? "Based on your real SkillTrack data" : "Complete an assessment to unlock this signal"}</small>
            </div>
          </div>

          <Link to={continueLearningHref} className="primary-dashboard-button">
            {continueTarget ? `Continue: ${continueTarget.learning_topics?.topic || "Learning"}` : "Continue Learning"}
          </Link>
        </section>

        <section className="overview-grid">
          <OverviewCard label="Career Readiness" value={`${overallScore}%`} detail={readinessLevel} accent="blue" icon="★" />
          <OverviewCard label="Top Strength" value={strengths[0]?.skills?.name || "—"} detail={strengths[0] ? `${strengths[0].current_score}% current level` : "No skill data yet"} accent="green" icon="✓" />
          <OverviewCard label="Priority Gap" value={priorityGaps[0] ? priorityGaps[0].gap_percentage + "%" : "0%"} detail={priorityGaps[0]?.skills?.name || "No major gaps yet"} accent="orange" icon="!" />
          <OverviewCard label="Profile Completion" value={`${currentProfile?.profile_completion || 0}%`} detail="Keep your profile current" accent="purple" icon="↗" />
        </section>

        <section className="dashboard-grid">
          <div className="panel panel-wide">
            <div className="panel-header">
              <h2>Career Readiness</h2>
              <span>Real signal</span>
            </div>

            <div className="readiness-grid">
              <div className="readiness-card">
                <span>Technical skills</span>
                <strong>{Math.round(data.progress.reduce((total, item) => total + Number(item.current_score || 0), 0) / Math.max(data.progress.length, 1))}%</strong>
              </div>
              <div className="readiness-card">
                <span>Assessment performance</span>
                <strong>{data.attempts.length ? Math.round(data.attempts.reduce((total, item) => total + Number(item.percentage || 0), 0) / data.attempts.length) : 0}%</strong>
              </div>
              <div className="readiness-card">
                <span>Learning progress</span>
                <strong>{data.learning?.length ? Math.round(data.learning.reduce((total, item) => total + Number(item.progress || 0), 0) / data.learning.length) : 0}%</strong>
              </div>
            </div>

            <div className="readiness-detail">
              <div>
                <div className="detail-label-row"><span>Strengths</span><small>{strengths.length ? strengths[0].skills?.name : "No data"}</small></div>
                <div className="detail-bar"><span style={{ width: `${strengths[0]?.current_score || 0}%` }} /></div>
              </div>
              <div>
                <div className="detail-label-row"><span>Biggest gap</span><small>{priorityGaps[0]?.skills?.name || "No data"}</small></div>
                <div className="detail-bar orange"><span style={{ width: `${priorityGaps[0]?.gap_percentage || 0}%` }} /></div>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h2>Your Next Best Move</h2>
              <span>Data-driven</span>
            </div>

            <div className="next-move-card">
              <p className="next-move-tag">Priority action</p>
              <h3>{nextAction.label}</h3>
              <p>{nextAction.detail}</p>
              <Link to={nextAction.href} className="button button-primary">Take action</Link>
            </div>
          </div>
        </section>

        <section className="dashboard-grid">
          <div className="panel panel-wide">
            <div className="panel-header">
              <h2>Skill Intelligence</h2>
              <span>Actionable</span>
            </div>

            <div className="skill-intelligence-list">
              {state.loading && <div className="route-state">Loading your skill signal...</div>}
              {!state.loading && !data.progress.length && <div className="empty-state">No assessed skill data yet. Complete an assessment to unlock your skill intelligence.</div>}
              {data.progress.map((skill) => (
                <div key={skill.id} className="skill-intelligence-row">
                  <div className="skill-intel-main">
                    <div>
                      <strong>{skill.skills?.name}</strong>
                      <small>{skillLevel(skill.current_score)}</small>
                    </div>
                    <span>{skill.current_score}% current · {skill.target_score}% target · {skill.gap_percentage}% gap</span>
                  </div>
                  <div className="skill-intel-actions">
                    <div className="mini-progress"><span style={{ width: `${skill.current_score}%` }} /></div>
                    <Link to={`/learning?skill=${skill.skill_id}`} className="secondary-action">Open learning</Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h2>Recommended for You</h2>
              <span>Curated</span>
            </div>

            <div className="recommendations-list">
              {learningInProgress.length ? learningInProgress.map((item) => (
                <div key={item.id} className="recommendation-item">
                  <strong>{item.learning_topics?.topic || "Learning topic"}</strong>
                  <span>Continue because your recent progress indicates this topic is still the next best step.</span>
                  <Link to={`/learning?skill=${item.learning_topics?.skill_id || ""}&topic=${item.learning_topic_id || item.learning_topics?.id || ""}`} className="secondary-action">Open topic</Link>
                </div>
              )) : <div className="empty-state">No in-progress learning is available yet.</div>}
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>Jobs that fit your skills</h2>
            <span>{data.jobs.length} matches</span>
          </div>

          <div className="job-grid">
            {!data.jobs.length && !state.loading && <div className="empty-state">No suitable jobs are available yet. Complete more assessments to improve your match signal.</div>}
            {data.jobs.map((job) => (
              <article key={job.id} className="job-card">
                <div className="job-header-row">
                  <div>
                    <h3>{job.title}</h3>
                    <p>{job.company_name}</p>
                  </div>
                  <span className="match-pill">{job.match}% Match</span>
                </div>

                <div className="job-match-summary">
                  <span>Matched skills</span>
                  <span>{job.matchedSkills?.length || 0}</span>
                </div>

                <div className="job-skills">
                  {job.matchedSkills?.slice(0, 3).map((item) => (
                    <span key={item.skill_id}>✓ {item.skills?.name}</span>
                  ))}
                </div>

                {job.missingSkills?.length > 0 && (
                  <p className="job-missing">Improve: {job.missingSkills.slice(0, 2).map((item) => item.skills?.name).join(", ")}</p>
                )}

                <div className="job-card-actions">
                  <Link to={`/jobs/${job.id}`} className="secondary-action full-width">View Job</Link>
                  <Link to={`/jobs/${job.id}`} className="button button-primary full-width">Learn more</Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="panel panel-table">
          <div className="panel-header">
            <h2>Recent Assessments</h2>
            <span>Latest results</span>
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

        <SkillTrackAI
          role="student"
          profile={currentProfile}
          skillProgress={data.progress}
          attempts={data.attempts}
          learningProgress={data.learning || []}
        />
      </main>
    </div>
  );
}

export default Dashboard;