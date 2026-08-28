import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getLearningPlan, updateLearningProgress } from "../services/skilltrackService";
import { PageHeader, PlatformLayout, ProgressBar } from "../components/Platform";

const roadmapPhases = ["Fundamentals", "Core Skills", "Advanced Skills", "Practical Projects"];

function Learning() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSkillId = searchParams.get("skill") || "";
  const [plan, setPlan] = useState({ progress: [], skill: null, topics: [], loading: true, error: "" });
  const [savingId, setSavingId] = useState("");

  const loadPlan = async () => {
    if (!user?.id) return;
    setPlan((previous) => ({ ...previous, loading: true, error: "" }));
    try {
      const nextPlan = await getLearningPlan(user.id, selectedSkillId || undefined);
      setPlan({ ...nextPlan, loading: false, error: "" });
    } catch (error) {
      setPlan((previous) => ({ ...previous, loading: false, error: error.message || "Unable to load your learning plan." }));
    }
  };

  useEffect(() => { loadPlan(); }, [user?.id, selectedSkillId]);

  const phases = useMemo(() => {
    const score = Number(plan.skill?.current_score || 0);
    const allowed = score < 40 ? ["Fundamentals"] : score < 60 ? ["Fundamentals", "Core Skills"] : score < 80 ? ["Core Skills", "Advanced Skills", "Practical Projects"] : ["Advanced Skills", "Practical Projects"];
    return roadmapPhases.filter((phase) => allowed.includes(phase)).map((phase) => {
      const phaseTopics = plan.topics.filter((topic) => topic.phase === phase);
      const completed = phaseTopics.length > 0 && phaseTopics.every((topic) => topic.learningProgress.status === "Completed");
      const active = phaseTopics.some((topic) => topic.learningProgress.status === "In progress");
      return { phase, status: completed ? "Completed" : active ? "In progress" : "Not started" };
    });
  }, [plan.skill, plan.topics]);

  const saveProgress = async (topic, action) => {
    const current = Number(topic.learningProgress.progress || 0);
    const progress = action === "complete" ? 100 : current === 0 ? 10 : Math.min(current + 25, 99);
    setSavingId(topic.id);
    try {
      await updateLearningProgress({ userId: user.id, learningTopicId: topic.id, progress, status: action === "complete" ? "Completed" : "In progress" });
      await loadPlan();
    } catch (error) {
      setPlan((previous) => ({ ...previous, error: error.message || "Unable to save learning progress." }));
    } finally {
      setSavingId("");
    }
  };

  const selectSkill = (event) => setSearchParams(event.target.value ? { skill: event.target.value } : {});
  const skillLevel = plan.skill?.level || "Not assessed";

  return <PlatformLayout>
    <PageHeader eyebrow="PERSONALISED LEARNING" title="Your personalised learning plan" description="Turn your latest assessment into focused practice and measurable progress." action={<Link className="primary-dashboard-button" to={plan.skill?.assessmentId ? `/assessments/${plan.skill.assessmentId}` : "/assessments"}>{plan.skill?.assessmentId ? "Retake assessment" : "Take an assessment"}</Link>} />
    {plan.loading && <div className="route-state">Loading your personalised learning plan...</div>}
    {plan.error && <div className="data-error">{plan.error}</div>}
    {!plan.loading && !plan.error && !plan.skill && <section className="learning-empty panel"><span className="resource-icon">GO</span><div><p className="eyebrow">YOUR PLAN STARTS WITH DATA</p><h2>Complete an assessment to unlock personalised learning.</h2><p>We will use your real score and missed topics to recommend the next best learning steps.</p><Link className="button button-primary" to="/assessments">Take an assessment</Link></div></section>}
    {!plan.loading && !plan.error && plan.skill && <>
      <section className="learning-overview panel"><div className="learning-overview-top"><div><span className="section-kicker">YOUR PERSONALIZED LEARNING PLAN</span><h2>{plan.skill.skills?.name}</h2><p>{skillLevel} pathway based on your latest assessment.</p></div><label className="learning-skill-select">Skill<select value={selectedSkillId || plan.skill.skill_id} onChange={selectSkill}>{plan.progress.map((item) => <option key={item.skill_id} value={item.skill_id}>{item.skills?.name}</option>)}</select></label></div><div className="learning-metrics"><div><span>Current score</span><strong>{plan.skill.current_score}%</strong></div><div><span>Target</span><strong>{plan.skill.target_score}%</strong></div><div><span>Skill gap</span><strong>{plan.skill.gap_percentage}%</strong></div><div><span>Skill level</span><strong>{skillLevel}</strong></div></div><ProgressBar value={plan.skill.current_score} /><p className="learning-guidance">{plan.skill.gap_percentage ? "Your recommendations focus on the topics most likely to close this gap." : "Your skill is at target. Focus on advanced topics and practical work to keep growing."}</p></section>
      <section className="roadmap-section"><div className="section-title"><div><p className="eyebrow">LEARNING ROADMAP</p><h2>A practical route forward</h2></div><span className="muted">{phases.length} relevant phases</span></div><div className="roadmap-flow">{phases.map((item, index) => <article className={`roadmap-phase ${item.status.toLowerCase().replace(" ", "-")}`} key={item.phase}><span>0{index + 1}</span><div><h3>{item.phase}</h3><p>{item.status}</p></div></article>)}</div></section>
      <section className="learning-resources"><div className="section-title"><div><p className="eyebrow">RECOMMENDED FOR YOU</p><h2>Close the next gap</h2></div><span className="muted">{plan.topics.length} topic{plan.topics.length === 1 ? "" : "s"}</span></div>{!plan.topics.length && <div className="empty-state">No recommendations are available for this skill yet.</div>}<div className="resource-grid">{plan.topics.map((topic) => { const progress = topic.learningProgress.progress || 0; const completed = topic.learningProgress.status === "Completed"; return <article className="resource-card learning-card" key={topic.id}><div className="resource-top"><span className="resource-icon">{String(topic.priority).padStart(2, "0")}</span><span className="level-badge">{topic.difficulty}</span></div><div className="topic-priority">Priority {topic.priority}</div><h3>{topic.topic}</h3><p>{topic.recommendationReason}</p><div className="resource-meta"><span>{plan.skill.skills?.name}</span><span>{topic.estimated_minutes} minutes</span></div><ProgressBar value={progress} /><div className="resource-bottom"><strong>{completed ? "Completed" : progress ? `${progress}% in progress` : "Not started"}</strong>{completed ? <button className="button button-secondary" disabled>Completed</button> : <><button className="button button-secondary" disabled={savingId === topic.id} onClick={() => saveProgress(topic, "start")}>{savingId === topic.id ? "Saving..." : progress ? "Continue learning" : "Start learning"}</button><button className="table-action" disabled={savingId === topic.id} onClick={() => saveProgress(topic, "complete")}>Mark complete</button></>}</div></article>; })}</div></section>
    </>}
  </PlatformLayout>;
}

export default Learning;
