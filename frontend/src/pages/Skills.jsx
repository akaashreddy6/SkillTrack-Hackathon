import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader, PlatformLayout, ProgressBar, StatusBadge } from "../components/Platform";
import { useAuth } from "../context/AuthContext";
import { getDashboardData } from "../services/skilltrackService";

function Skills() {
  const { user } = useAuth();
  const [state, setState] = useState({ loading: true, error: "", progress: [] });

  useEffect(() => {
    if (!user?.id) return undefined;
    let active = true;
    getDashboardData(user.id)
      .then((data) => {
        if (active) setState({ loading: false, error: "", progress: data.progress || [] });
      })
      .catch((error) => {
        if (active) setState({ loading: false, error: error.message || "Unable to load your skills.", progress: [] });
      });
    return () => {
      active = false;
    };
  }, [user?.id]);

  const avgScore = state.progress.length
    ? Math.round(
        state.progress.reduce((acc, item) => acc + Number(item.current_score || 0), 0) / state.progress.length
      )
    : 0;
  const criticalGapsCount = state.progress.filter((item) => Number(item.current_score || 0) < 40).length;

  return (
    <PlatformLayout role="student">
      <PageHeader
        eyebrow="SKILLS TRACKER"
        title="Skill Overview & Intelligence"
        description="Understand your verified competencies, identify benchmark gaps, and direct your learning with precision."
        action={
          <Link to="/assessments" className="button button-primary">
            Take Assessment →
          </Link>
        }
      />

      {state.progress.length > 0 && (
        <section className="overview-grid" style={{ marginBottom: "24px" }}>
          <div className="stat-card stat-blue">
            <span className="stat-label">Assessed Skills</span>
            <div className="stat-value">{state.progress.length}</div>
            <span className="stat-detail">Active competencies</span>
          </div>
          <div className="stat-card stat-green">
            <span className="stat-label">Average Proficiency</span>
            <div className="stat-value">{avgScore}%</div>
            <span className="stat-detail">Across all domains</span>
          </div>
          <div className="stat-card stat-orange">
            <span className="stat-label">Critical Gaps</span>
            <div className="stat-value">{criticalGapsCount}</div>
            <span className="stat-detail">Requires immediate focus</span>
          </div>
        </section>
      )}

      <section className="skills-grid">
        {state.loading && <div className="route-state">Loading your skill progress...</div>}
        {state.error && <div className="data-error">{state.error}</div>}
        {!state.loading && !state.error && !state.progress.length && (
          <div className="empty-state panel">
            <h3>No skills tracked yet</h3>
            <p style={{ marginTop: "6px", color: "var(--text-muted)" }}>
              Complete your first diagnostic assessment to start tracking your competencies and closing gaps.
            </p>
            <Link to="/assessments" className="button button-primary" style={{ marginTop: "16px" }}>
              Start Assessment →
            </Link>
          </div>
        )}
        {state.progress.map((item) => {
          const score = Number(item.current_score) || 0;
          const target = Number(item.target_score) || 80;
          const gap = Number(item.gap_percentage) || Math.max(0, target - score);
          const level = score < 40 ? "Critical Gap" : score < 60 ? "Needs Improvement" : score < 80 ? "Good" : "Strong";
          const tone = score < 40 ? "red" : score < 60 ? "orange" : score < 80 ? "blue" : "green";

          return (
            <article key={item.id} className="info-card panel">
              <div className="info-card-top">
                <div>
                  <h3 className="skill-card-title">{item.skills?.name || "Skill"}</h3>
                  <StatusBadge>{level}</StatusBadge>
                </div>
                <span className="skill-score-badge">{score}%</span>
              </div>

              <div style={{ margin: "18px 0 12px" }}>
                <ProgressBar value={score} tone={tone} />
              </div>

              <div className="skill-metrics-row">
                <span className="skill-metric-item">
                  Target: <strong>{target}%</strong>
                </span>
                <span className="skill-metric-item">
                  Gap:{" "}
                  <strong style={{ color: gap > 0 ? "var(--amber-400)" : "var(--green-400)" }}>
                    {gap}%
                  </strong>
                </span>
              </div>

              <div className="skill-card-footer">
                <Link
                  to={`/learning?skill=${item.skill_id}`}
                  className="button button-secondary full-width"
                >
                  Learn & Improve →
                </Link>
              </div>
            </article>
          );
        })}
      </section>
    </PlatformLayout>
  );
}

export default Skills;
