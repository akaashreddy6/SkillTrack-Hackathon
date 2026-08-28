import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAssessment, getLatestAttempt, submitAssessment } from "../services/skilltrackService";
import { PageHeader, PlatformLayout, ProgressBar } from "../components/Platform";

const optionKeys = ["A", "B", "C", "D"];
const performanceText = { Excellent: "Keep building on this strong foundation.", Good: "Review the missed topics and continue practicing.", "Needs Improvement": "Complete targeted practice before retaking this assessment.", "Critical Gap": "Start with the foundations module for this skill." };

function ResultView() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { if (!user?.id) return undefined; getLatestAttempt(user.id, id).then(setAttempt).catch((loadError) => setError(loadError.message || "Unable to load your result.")); return undefined; }, [user?.id, id]);
  if (error) return <PlatformLayout><div className="data-error">{error}</div></PlatformLayout>;
  if (!attempt) return <PlatformLayout><div className="route-state">Loading your result...</div></PlatformLayout>;
  const skill = attempt.assessments?.skills;
  const target = skill?.target_score || 80;
  const gap = Math.max(target - attempt.percentage, 0);
  return <PlatformLayout><PageHeader eyebrow="ASSESSMENT COMPLETE" title="Assessment results" description="Your result has been added to your skill profile." /><section className="result-hero"><div className="score-ring"><strong>{attempt.percentage}%</strong><span>Score</span></div><div><p className="eyebrow">PERFORMANCE</p><h2>{attempt.performance_level}</h2><p>{attempt.correct_answers} of {attempt.total_questions} answers correct.</p></div><div className="result-stats"><span>Skill assessed<strong>{skill?.name || "Skill"}</strong></span><span>Skill gap<strong>{gap}%</strong></span></div></section><div className="result-grid"><section className="panel"><div className="panel-header"><h2>Skill-gap analysis</h2><span>Target: {target}%</span></div><div className="gap-meter"><div><span>Current skill score</span><strong>{attempt.percentage}%</strong></div><ProgressBar value={attempt.percentage} /><div className="target-line" style={{ left: `${target}%` }} /></div><p>{performanceText[attempt.performance_level]}</p></section><section className="panel recommendation-panel"><p className="eyebrow">RECOMMENDATION</p><h2>{gap ? "Close your skill gap" : "Maintain your momentum"}</h2><p>{performanceText[attempt.performance_level]}</p><button className="button button-primary full-width" onClick={() => navigate("/assessments")}>Back to assessments</button><button className="button button-secondary full-width" onClick={() => navigate("/dashboard")}>Go to dashboard</button><button className="button button-secondary full-width" onClick={() => navigate(`/assessments/${id}`)}>Retake assessment</button></section></div></PlatformLayout>;
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

  useEffect(() => { if (isResult || !user?.id) return undefined; getAssessment(id).then((data) => { setAssessment(data.assessment); setQuestions(data.questions); }).catch((error) => setState({ loading: false, error: error.message || "Unable to load this assessment." })).finally(() => setState((previous) => ({ ...previous, loading: false }))); return undefined; }, [id, isResult, user?.id]);
  useEffect(() => { if (!startedAt || state.submitting) return undefined; const timer = window.setInterval(() => setSecondsLeft((remaining) => { if (remaining <= 1) { window.clearInterval(timer); return 0; } return remaining - 1; }), 1000); return () => window.clearInterval(timer); }, [startedAt, state.submitting]);
  useEffect(() => { if (startedAt && secondsLeft === 0 && !state.submitting) submit(true); }, [secondsLeft, startedAt, state.submitting]);

  if (isResult) return <ResultView />;
  if (!user) return <PlatformLayout><div className="data-error">Please sign in to take an assessment.</div></PlatformLayout>;
  if (state.loading) return <PlatformLayout><div className="route-state">Loading your assessment...</div></PlatformLayout>;
  if (state.error) return <PlatformLayout><div className="data-error">{state.error}</div></PlatformLayout>;
  if (!assessment || !questions.length) return <PlatformLayout><div className="empty-state">This assessment has no questions yet.</div></PlatformLayout>;
  const question = questions[current];
  const start = () => { const now = new Date(); setStartedAt(now.toISOString()); setSecondsLeft(Math.max(1, (assessment.duration_minutes || 1) * 60)); };
  const submit = async (expired = false) => { if (state.submitting) return; if (!expired && Object.keys(answers).length !== questions.length) { setState((previous) => ({ ...previous, error: "Answer every question before submitting." })); return; } if (!expired && !window.confirm("Submit your assessment now?")) return; setState((previous) => ({ ...previous, submitting: true, error: "" })); try { await submitAssessment({ assessmentId: assessment.id, answers: Object.fromEntries(Object.entries(answers).map(([key, value]) => [key, optionKeys[value]])), startedAt }); window.dispatchEvent(new Event("skilltrack:assessment-submitted")); navigate(`/assessments/${assessment.id}/results`); } catch (error) { setState((previous) => ({ ...previous, submitting: false, error: error.message || "Unable to submit assessment." })); } };
  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");
  return <PlatformLayout><PageHeader eyebrow="SKILL ASSESSMENT" title={startedAt ? assessment.title : `Assess your ${assessment.skills?.name || "skills"}`} description={assessment.description || "A diagnostic assessment for your current capability."} />{!startedAt ? <section className="assessment-intro panel"><div className="assessment-icon">{assessment.skills?.name?.slice(0, 2).toUpperCase()}</div><div><span className="level-badge">{questions.length} questions · {assessment.duration_minutes} minutes</span><h2>Measure what you know today</h2><p>{assessment.description}</p><button className="button button-primary" onClick={start}>Start assessment</button></div></section> : <section className="assessment-workspace"><div className="assessment-progress"><div><strong>Question {current + 1} of {questions.length}</strong><span>{minutes}:{seconds} remaining</span></div><ProgressBar value={((current + 1) / questions.length) * 100} /></div><div className="question-layout"><aside className="question-nav"><h3>Questions</h3><div>{questions.map((item, index) => <button key={item.id} className={`${index === current ? "current" : ""} ${answers[item.id] !== undefined ? "answered" : ""}`} onClick={() => setCurrent(index)}>{index + 1}</button>)}</div><p>{Object.keys(answers).length} answered</p></aside><div className="question-card panel"><span className="question-category">{question.topic}</span><h2>{question.question_text}</h2><div className="options">{[question.option_a, question.option_b, question.option_c, question.option_d].map((option, index) => <button key={option} className={answers[question.id] === index ? "selected" : ""} onClick={() => setAnswers((previous) => ({ ...previous, [question.id]: index }))}><span>{optionKeys[index]}</span>{option}</button>)}</div>{state.error && <div className="data-error">{state.error}</div>}<div className="question-actions"><button className="button button-secondary" disabled={current === 0} onClick={() => setCurrent((value) => value - 1)}>Previous</button>{current < questions.length - 1 ? <button className="button button-primary" disabled={answers[question.id] === undefined} onClick={() => setCurrent((value) => value + 1)}>Next</button> : <button className="button button-primary" disabled={state.submitting} onClick={() => submit(false)}>{state.submitting ? "Submitting..." : "Submit assessment"}</button>}</div></div></div></section>}</PlatformLayout>;
}