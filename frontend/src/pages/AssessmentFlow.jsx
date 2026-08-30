import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAssessment, getLatestAttempt, submitAssessment } from "../services/skilltrackService";
import { PageHeader, PlatformLayout, ProgressBar } from "../components/Platform";

const optionKeys = ["A", "B", "C", "D"];
const performanceText = {
  Excellent: "Keep building on this strong foundation with advanced real-world projects.",
  Good: "Review the missed topics in your learning roadmap and continue targeted practice.",
  "Needs Improvement": "Complete the fundamentals and core skills modules before retaking this assessment.",
  "Critical Gap": "Start with the introductory foundations module to close key conceptual gaps.",
};

function ResultView() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.id) return undefined;
    getLatestAttempt(user.id, id)
      .then(setAttempt)
      .catch((loadError) => setError(loadError.message || "Unable to load your result."));
    return undefined;
  }, [user?.id, id]);

  if (error) {
    return (
      <PlatformLayout>
        <div className="data-error">{error}</div>
      </PlatformLayout>
    );
  }

  if (!attempt) {
    return (
      <PlatformLayout>
        <div className="route-state">Loading your assessment result...</div>
      </PlatformLayout>
    );
  }

  const skill = attempt.assessments?.skills;
  const target = skill?.target_score || 80;
  const gap = Math.max(target - attempt.percentage, 0);

  return (
    <PlatformLayout>
      <PageHeader
        eyebrow="ASSESSMENT COMPLETE"
        title="Assessment Results"
        description="Your diagnostic result has been recorded and your skill profile updated in real time."
      />

      <section className="result-hero">
        <div
          className="score-ring"
          style={{
            background: `conic-gradient(#2563EB 0% ${attempt.percentage}%, rgba(255, 255, 255, 0.08) ${attempt.percentage}% 100%)`,
          }}
        >
          <div>
            <strong>{attempt.percentage}%</strong>
            <span>Score</span>
          </div>
        </div>

        <div>
          <p className="eyebrow">PERFORMANCE EVALUATION</p>
          <h2>{attempt.performance_level}</h2>
          <p>
            {attempt.correct_answers} of {attempt.total_questions} questions answered correctly.
          </p>
        </div>

        <div className="result-stats">
          <span>
            Skill Assessed
            <strong>{skill?.name || "Skill"}</strong>
          </span>
          <span>
            Skill Gap
            <strong style={{ color: gap > 0 ? "var(--amber-600)" : "var(--green-600)" }}>
              {gap}%
            </strong>
          </span>
        </div>
      </section>

      <div className="result-grid">
        <section className="panel">
          <div className="panel-header">
            <h2>Skill-Gap Analysis</h2>
            <span>Target Benchmark: {target}%</span>
          </div>

          <div className="gap-meter">
            <div>
              <span>Current Score vs Benchmark</span>
              <strong>{attempt.percentage}%</strong>
            </div>
            <ProgressBar value={attempt.percentage} tone={attempt.percentage >= target ? "green" : "orange"} />
            <div className="target-line" style={{ left: `${target}%` }} title={`Target: ${target}%`} />
          </div>

          <p style={{ marginTop: "16px", color: "var(--ink-600)", fontSize: "14px", lineHeight: "1.6" }}>
            {performanceText[attempt.performance_level] || "Continue your personalized learning path to make steady progress."}
          </p>
        </section>

        <section className="panel recommendation-panel">
          <p className="eyebrow">NEXT BEST ACTION</p>
          <h2>{gap > 0 ? "Close Your Skill Gap" : "Maintain Your Momentum"}</h2>
          <p style={{ color: "var(--ink-500)", fontSize: "13px", lineHeight: "1.55" }}>
            {gap > 0
              ? "Follow your structured learning roadmap to focus on the topics where you missed questions."
              : "You have exceeded the standard benchmark for this skill. Explore job matches or complete advanced projects."}
          </p>
          <div style={{ display: "grid", gap: "10px", marginTop: "14px" }}>
            <button
              type="button"
              className="button button-primary full-width"
              onClick={() => navigate("/assessments")}
            >
              Back to Assessments
            </button>
            <button
              type="button"
              className="button button-secondary full-width"
              onClick={() => navigate("/dashboard")}
            >
              Go to Dashboard
            </button>
            <button
              type="button"
              className="button button-secondary full-width"
              onClick={() => navigate(`/assessments/${id}`)}
            >
              Retake Assessment
            </button>
          </div>
        </section>
      </div>
    </PlatformLayout>
  );
}

export default function AssessmentFlow() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [startedAt, setStartedAt] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [state, setState] = useState({ loading: true, error: "", submitting: false });
  const isResult = location.pathname.endsWith("/results");

  useEffect(() => {
    if (isResult || !user?.id) return undefined;
    getAssessment(id)
      .then((data) => {
        setAssessment(data.assessment);
        setQuestions(data.questions);
      })
      .catch((error) =>
        setState({ loading: false, error: error.message || "Unable to load this assessment." })
      )
      .finally(() => setState((previous) => ({ ...previous, loading: false })));
    return undefined;
  }, [id, isResult, user?.id]);

  useEffect(() => {
    if (!startedAt || state.submitting) return undefined;
    const timer = window.setInterval(() => {
      setSecondsLeft((remaining) => {
        if (remaining <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return remaining - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [startedAt, state.submitting]);

  useEffect(() => {
    if (startedAt && secondsLeft === 0 && !state.submitting) {
      submit(true);
    }
  }, [secondsLeft, startedAt, state.submitting]);

  if (isResult) return <ResultView />;
  if (!user) {
    return (
      <PlatformLayout>
        <div className="data-error">Please sign in to take an assessment.</div>
      </PlatformLayout>
    );
  }

  if (state.loading) {
    return (
      <PlatformLayout>
        <div className="route-state">Loading your assessment questions...</div>
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

  if (!assessment || !questions.length) {
    return (
      <PlatformLayout>
        <div className="empty-state">This assessment has no questions configured yet.</div>
      </PlatformLayout>
    );
  }

  const question = questions[current];
  const start = () => {
    const now = new Date();
    setStartedAt(now.toISOString());
    setSecondsLeft(Math.max(1, (assessment.duration_minutes || 1) * 60));
  };

  const submit = async (expired = false) => {
    if (state.submitting) return;
    if (!expired && Object.keys(answers).length !== questions.length) {
      setState((previous) => ({
        ...previous,
        error: "Please answer every question before submitting your test.",
      }));
      return;
    }
    if (!expired && !window.confirm("Are you sure you want to submit your assessment now?")) {
      return;
    }

    setState((previous) => ({ ...previous, submitting: true, error: "" }));
    try {
      await submitAssessment({
        assessmentId: assessment.id,
        answers: Object.fromEntries(
          Object.entries(answers).map(([key, value]) => [key, optionKeys[value]])
        ),
        startedAt,
      });
      window.dispatchEvent(new Event("skilltrack:assessment-submitted"));
      navigate(`/assessments/${assessment.id}/results`);
    } catch (error) {
      setState((previous) => ({
        ...previous,
        submitting: false,
        error: error.message || "Unable to submit assessment.",
      }));
    }
  };

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");

  return (
    <PlatformLayout>
      <PageHeader
        eyebrow="DIAGNOSTIC TEST"
        title={startedAt ? assessment.title : `Assess your ${assessment.skills?.name || "Skills"}`}
        description={assessment.description || "A timed diagnostic assessment to measure your capability."}
      />

      {!startedAt ? (
        <section className="assessment-intro panel">
          <div className="assessment-icon">
            {(assessment.skills?.name || "ST").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <span className="level-badge" style={{ marginBottom: "8px" }}>
              {questions.length} Questions · {assessment.duration_minutes} Minutes
            </span>
            <h2>Measure What You Know Today</h2>
            <p>{assessment.description}</p>
            <button type="button" className="button button-primary" onClick={start} style={{ marginTop: "16px" }}>
              Start Assessment →
            </button>
          </div>
        </section>
      ) : (
        <section className="assessment-workspace">
          <div className="assessment-progress">
            <div>
              <strong>
                Question {current + 1} of {questions.length}
              </strong>
              <span style={{ color: secondsLeft < 60 ? "var(--rose-600)" : "var(--blue-600)", fontWeight: "700" }}>
                ⏱ {minutes}:{seconds} remaining
              </span>
            </div>
            <ProgressBar value={((current + 1) / questions.length) * 100} />
          </div>

          <div className="question-layout">
            <aside className="question-nav">
              <h3>Question Matrix</h3>
              <div>
                {questions.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`${index === current ? "current" : ""} ${
                      answers[item.id] !== undefined ? "answered" : ""
                    }`}
                    onClick={() => setCurrent(index)}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              <p style={{ marginTop: "12px", fontSize: "12px", color: "var(--ink-500)" }}>
                {Object.keys(answers).length} of {questions.length} answered
              </p>
            </aside>

            <div className="question-card panel">
              <span className="question-category">{question.topic || "Core Topic"}</span>
              <h2>{question.question_text}</h2>

              <div className="options">
                {[question.option_a, question.option_b, question.option_c, question.option_d].map(
                  (option, index) => (
                    <button
                      key={option}
                      type="button"
                      className={answers[question.id] === index ? "selected" : ""}
                      onClick={() =>
                        setAnswers((previous) => ({ ...previous, [question.id]: index }))
                      }
                    >
                      <span>{optionKeys[index]}</span>
                      {option}
                    </button>
                  )
                )}
              </div>

              {state.error && <div className="data-error" style={{ marginTop: "16px" }}>{state.error}</div>}

              <div className="question-actions">
                <button
                  type="button"
                  className="button button-secondary"
                  disabled={current === 0}
                  onClick={() => setCurrent((value) => value - 1)}
                >
                  ← Previous
                </button>

                {current < questions.length - 1 ? (
                  <button
                    type="button"
                    className="button button-primary"
                    disabled={answers[question.id] === undefined}
                    onClick={() => setCurrent((value) => value + 1)}
                  >
                    Next Question →
                  </button>
                ) : (
                  <button
                    type="button"
                    className="button button-primary"
                    disabled={state.submitting}
                    onClick={() => submit(false)}
                  >
                    {state.submitting ? "Submitting Results..." : "Submit Assessment ✓"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </PlatformLayout>
  );
}