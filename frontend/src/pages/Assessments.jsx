import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardHeader } from "../components/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { getAssessmentAttempts, getAssessments } from "../services/skilltrackService";

function Assessments() {
  const { user } = useAuth();
  const [catalog, setCatalog] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [state, setState] = useState({ loading: true, error: "" });

  useEffect(() => {
    if (!user?.id) return undefined;
    Promise.all([getAssessments(), getAssessmentAttempts(user.id)])
      .then(([available, history]) => { setCatalog(available); setAttempts(history); })
      .catch((error) => setState({ loading: false, error: error.message || "Unable to load assessments." }))
      .finally(() => setState((previous) => ({ ...previous, loading: false })));
    return undefined;
  }, [user?.id]);

  return <div className="dashboard-page"><DashboardHeader /><main className="dashboard-main dashboard-inner">
    <section className="page-header"><div><p className="eyebrow">ASSESSMENTS</p><h1>Assessments</h1><p className="page-description">Measure your current skills and track improvement over time.</p></div></section>
    {state.loading && <div className="route-state">Loading assessments...</div>}
    {state.error && <div className="data-error">{state.error}</div>}
    {!state.loading && !state.error && <section className="assessment-catalog"><h2>Available assessments</h2>{!catalog.length && <div className="empty-state">No assessments are available yet.</div>}{catalog.map((assessment) => <article key={assessment.id}><div><strong>{assessment.title}</strong><span>{assessment.skills?.name || "Skill assessment"} · {assessment.description || "Diagnostic assessment"}</span><small>{assessment.question_count} questions · {assessment.duration_minutes} minutes</small></div><Link className="button button-primary" to={`/assessments/${assessment.id}`}>Start assessment</Link></article>)}</section>}
    <section className="panel panel-table"><div className="panel-header"><h2>Assessment history</h2><span>{attempts.length} attempts</span></div>{!state.loading && !attempts.length && <div className="empty-state">No assessments completed yet.</div>}{attempts.length > 0 && <div className="table-wrap"><table><thead><tr><th>Assessment</th><th>Score</th><th>Percentage</th><th>Date</th><th>Performance</th></tr></thead><tbody>{attempts.map((attempt) => <tr key={attempt.id}><td>{attempt.assessments?.title || "Assessment"}</td><td>{attempt.correct_answers} / {attempt.total_questions}</td><td>{attempt.percentage}%</td><td>{attempt.completed_at ? new Date(attempt.completed_at).toLocaleDateString() : "-"}</td><td><span className={`status-badge ${attempt.performance_level?.toLowerCase().replace(/\s+/g, "-")}`}>{attempt.performance_level}</span></td></tr>)}</tbody></table></div>}</section>
  </main></div>;
}

export default Assessments;