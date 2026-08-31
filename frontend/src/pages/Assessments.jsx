import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppTable, PageHeader, PlatformLayout, StatusBadge } from "../components/Platform";
import { useAuth } from "../context/AuthContext";
import { getAssessmentAttempts, getAssessments, getSkillTopics } from "../services/skilltrackService";

function Assessments() {
  const { user } = useAuth();
  const [catalog, setCatalog] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [topicsBySkill, setTopicsBySkill] = useState({});
  const [selectedTopics, setSelectedTopics] = useState({});
  const [state, setState] = useState({ loading: true, error: "" });

  useEffect(() => {
    if (!user?.id) return undefined;
    Promise.all([getAssessments(), getAssessmentAttempts(user.id), getSkillTopics()])
      .then(([available, history, allTopics]) => {
        setCatalog(available);
        setAttempts(history);

        const grouped = {};
        for (const t of allTopics || []) {
          if (!grouped[t.skill_id]) grouped[t.skill_id] = [];
          if (!grouped[t.skill_id].includes(t.topic)) {
            grouped[t.skill_id].push(t.topic);
          }
        }
        setTopicsBySkill(grouped);
      })
      .catch((error) =>
        setState({ loading: false, error: error.message || "Unable to load assessments." })
      )
      .finally(() => setState((previous) => ({ ...previous, loading: false })));
    return undefined;
  }, [user?.id]);

  const handleTopicChange = (assessmentId, topic) => {
    setSelectedTopics((prev) => ({ ...prev, [assessmentId]: topic }));
  };

  return (
    <PlatformLayout role="student">
      <PageHeader
        eyebrow="DIAGNOSTIC TESTING"
        title="Skill Diagnostics & Assessments"
        description="Measure your actual skill level with focused diagnostic assessments, discover conceptual gaps, and unlock verified credentials."
      />

      {state.loading && <div className="route-state">Loading assessments...</div>}
      {state.error && <div className="data-error">{state.error}</div>}

      {!state.loading && !state.error && (
        <section className="diagnostic-section">
          <div className="section-header-row">
            <div>
              <span className="eyebrow">DIAGNOSTIC TESTS</span>
              <h2 style={{ fontSize: "18px" }}>Available Diagnostic Assessments</h2>
            </div>
            <span className="panel-status-tag">{catalog.length} Available</span>
          </div>

          {!catalog.length && (
            <div className="empty-state panel">No assessments are available yet.</div>
          )}

          <div className="assessment-cards-grid">
            {catalog.map((assessment) => {
              const skillTopics = topicsBySkill[assessment.skill_id] || [];
              const selectedTopic = selectedTopics[assessment.id] || "All";
              const targetUrl = `/assessments/${assessment.id}${
                selectedTopic && selectedTopic !== "All"
                  ? `?topic=${encodeURIComponent(selectedTopic)}`
                  : ""
              }`;

              return (
                <article key={assessment.id} className="assessment-card panel">
                  <div className="assessment-card-header">
                    <div>
                      <span className="assessment-domain-tag">
                        {assessment.skills?.name || "Skill Domain"}
                      </span>
                      <h3 className="assessment-title">{assessment.title}</h3>
                    </div>
                    <span className="assessment-mark-icon">📝</span>
                  </div>

                  <p className="assessment-description">
                    {assessment.description || "Comprehensive capability and diagnostic evaluation."}
                  </p>

                  <div className="assessment-meta-pills">
                    <span className="meta-pill">⏱ {assessment.duration_minutes} min</span>
                    <span className="meta-pill">
                      📋 {selectedTopic !== "All" ? "Topic Test" : `${assessment.question_count} questions`}
                    </span>
                  </div>

                  {skillTopics.length > 0 && (
                    <div className="assessment-topic-select-wrap">
                      <label htmlFor={`topic-select-${assessment.id}`}>Focus Topic</label>
                      <select
                        id={`topic-select-${assessment.id}`}
                        value={selectedTopic}
                        onChange={(e) => handleTopicChange(assessment.id, e.target.value)}
                        className="topic-dropdown"
                      >
                        <option value="All">All Topics (Comprehensive)</option>
                        {skillTopics.map((topicName) => (
                          <option key={topicName} value={topicName}>
                            {topicName}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="assessment-action-row">
                    <Link className="button button-primary full-width" to={targetUrl}>
                      Start Assessment {selectedTopic !== "All" ? `(${selectedTopic})` : ""} →
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section className="panel panel-table" style={{ marginTop: "32px" }}>
        <div className="panel-header">
          <div>
            <span className="eyebrow">HISTORICAL RECORD</span>
            <h2>Assessment History</h2>
          </div>
          <span className="panel-status-tag">{attempts.length} completed</span>
        </div>

        {!state.loading && !attempts.length && (
          <div className="empty-state">No assessments completed yet. Take your first assessment above.</div>
        )}

        {attempts.length > 0 && (
          <AppTable
            headers={["Assessment", "Score", "Percentage", "Date Completed", "Performance Level"]}
            rows={attempts.map((attempt) => (
              <tr key={attempt.id}>
                <td>
                  <strong>{attempt.assessments?.title || "Assessment"}</strong>
                </td>
                <td>
                  {attempt.correct_answers} / {attempt.total_questions}
                </td>
                <td>
                  <strong style={{ color: "var(--blue-400)" }}>{attempt.percentage}%</strong>
                </td>
                <td>
                  {attempt.completed_at
                    ? new Date(attempt.completed_at).toLocaleDateString()
                    : "-"}
                </td>
                <td>
                  <StatusBadge>{attempt.performance_level}</StatusBadge>
                </td>
              </tr>
            ))}
          />
        )}
      </section>
    </PlatformLayout>
  );
}

export default Assessments;