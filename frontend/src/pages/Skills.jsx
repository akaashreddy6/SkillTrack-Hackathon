import { useEffect, useState } from "react";
import { DashboardHeader } from "../components/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { getDashboardData } from "../services/skilltrackService";

function Skills() {
  const { user } = useAuth();
  const [state, setState] = useState({ loading: true, error: "", progress: [] });
  useEffect(() => {
    let active = true;
    getDashboardData(user.id)
      .then((data) => { if (active) setState({ loading: false, error: "", progress: data.progress || [] }); })
      .catch((error) => { if (active) setState({ loading: false, error: error.message || "Unable to load your skills.", progress: [] }); });
    return () => { active = false; };
  }, [user.id]);
  return (
    <div className="dashboard-page">
      <DashboardHeader />

      <main className="dashboard-main dashboard-inner">
        <section className="page-header">
          <div>
            <p className="eyebrow">SKILLS TRACKER</p>
            <h1>Skill Overview</h1>
          </div>
        </section>

        <section className="skills-grid">
          {state.loading && <div className="route-state">Loading your skill progress...</div>}
          {state.error && <div className="data-error">{state.error}</div>}
          {!state.loading && !state.error && !state.progress.length && <div className="empty-state">Complete an assessment to start tracking your skills.</div>}
          {state.progress.map((item) => {
            const score = Number(item.current_score) || 0;
            const level = score < 40 ? "Critical Gap" : score < 60 ? "Needs Improvement" : score < 80 ? "Good" : "Strong";
            return <article key={item.id} className="info-card">
              <div className="info-card-top">
                <div>
                  <h3>{item.skills?.name || "Skill"}</h3>
                  <p>{level}</p>
                </div>
                <span className="skill-score">{score}%</span>
              </div>

              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${score}%` }} />
              </div>

              <div className="info-meta">
                <span>Target score</span>
                <strong>{item.target_score}% · Gap {item.gap_percentage}%</strong>
              </div>
            </article>;
          })}
        </section>
      </main>
    </div>
  );
}

export default Skills;
