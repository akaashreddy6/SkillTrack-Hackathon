import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getLearningPlan, updateLearningProgress } from "../services/skilltrackService";
import { PageHeader, PlatformLayout, ProgressBar } from "../components/Platform";

const roadmapPhases = ["Fundamentals", "Core Skills", "Advanced Skills", "Practical Projects"];

const buildLearningRoute = (skillId, topicId) => {
  const cleanSkillId = skillId ? String(skillId) : "";
  const cleanTopicId = topicId ? String(topicId) : "";

  if (!cleanSkillId) {
    return "/learning";
  }

  const params = new URLSearchParams({ skill: cleanSkillId });

  if (cleanTopicId) {
    params.set("topic", cleanTopicId);
  }

  return `/learning?${params.toString()}`;
};

function Learning() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSkillId = searchParams.get("skill") || "";
  const selectedTopicId = searchParams.get("topic") || "";
  const [plan, setPlan] = useState({ progress: [], skill: null, topics: [], loading: true, error: "" });
  const [savingId, setSavingId] = useState("");

  const loadPlan = async () => {
    if (!user?.id) return;
    setPlan((previous) => ({ ...previous, loading: true, error: "" }));
    try {
      const nextPlan = await getLearningPlan(user.id, selectedSkillId || undefined);
      setPlan({ ...nextPlan, loading: false, error: "" });
    } catch (error) {
      setPlan((previous) => ({
        ...previous,
        loading: false,
        error: error.message || "Unable to load your learning plan.",
      }));
    }
  };

  useEffect(() => {
    loadPlan();
  }, [user?.id, selectedSkillId]);

  const phases = useMemo(() => {
    const score = Number(plan.skill?.current_score || 0);
    const allowed =
      score < 40
        ? ["Fundamentals"]
        : score < 60
        ? ["Fundamentals", "Core Skills"]
        : score < 80
        ? ["Core Skills", "Advanced Skills", "Practical Projects"]
        : ["Advanced Skills", "Practical Projects"];
    return roadmapPhases
      .filter((phase) => allowed.includes(phase))
      .map((phase) => {
        const phaseTopics = plan.topics.filter((topic) => topic.phase === phase);
        const completed =
          phaseTopics.length > 0 &&
          phaseTopics.every((topic) => topic.learningProgress.status === "Completed");
        const active = phaseTopics.some((topic) => topic.learningProgress.status === "In progress");
        return { phase, status: completed ? "Completed" : active ? "In progress" : "Not started" };
      });
  }, [plan.skill, plan.topics]);

  const saveProgress = async (topic, action) => {
    const current = Number(topic.learningProgress.progress || 0);
    const progress = action === "complete" ? 100 : current === 0 ? 10 : Math.min(current + 25, 99);
    setSavingId(topic.id);
    try {
      await updateLearningProgress({
        userId: user.id,
        learningTopicId: topic.id,
        progress,
        status: action === "complete" ? "Completed" : "In progress",
      });
      await loadPlan();
    } catch (error) {
      setPlan((previous) => ({
        ...previous,
        error: error.message || "Unable to save learning progress.",
      }));
    } finally {
      setSavingId("");
    }
  };

  const selectSkill = (event) => {
    const nextSkillId = event.target.value;
    const params = new URLSearchParams(searchParams);

    if (nextSkillId) {
      params.set("skill", nextSkillId);
      params.delete("topic");
    } else {
      params.delete("skill");
      params.delete("topic");
    }

    setSearchParams(params);
  };

  const activeTopic = selectedTopicId
    ? plan.topics.find((topic) => String(topic.id) === String(selectedTopicId)) || null
    : null;

  const showTopicFallback = Boolean(selectedTopicId) && !activeTopic;

  const openTopic = (topic) => {
    if (!topic) return;

    const nextSkillId = topic.skill_id || selectedSkillId || plan.skill?.skill_id || "";

    if (!nextSkillId || !topic.id) {
      setSearchParams(new URLSearchParams());
      return;
    }

    const nextRoute = buildLearningRoute(nextSkillId, topic.id);
    const params = new URLSearchParams(nextRoute.split("?")[1] || "");
    setSearchParams(params);
  };

  const skillLevel = plan.skill?.level || "Not assessed";

  return (
    <PlatformLayout>
      <PageHeader
        eyebrow="PERSONALISED LEARNING"
        title="Your Personalised Learning Plan"
        description="Turn your latest assessment into focused practice, targeted modules, and measurable skill growth."
        action={
          <Link
            className="primary-dashboard-button"
            to={
              plan.skill?.assessmentId
                ? `/assessments/${plan.skill.assessmentId}${
                    activeTopic ? `?topic=${encodeURIComponent(activeTopic.topic)}` : ""
                  }`
                : "/assessments"
            }
          >
            {plan.skill?.assessmentId
              ? activeTopic
                ? `Test ${activeTopic.topic} →`
                : "Retake Assessment"
              : "Take an Assessment"}
          </Link>
        }
      />

      {plan.loading && <div className="route-state">Loading your personalised learning plan...</div>}
      {plan.error && <div className="data-error">{plan.error}</div>}
      {showTopicFallback && (
        <div className="data-error">
          This topic is no longer available. Showing the current skill roadmap instead.
        </div>
      )}

      {!plan.loading && !plan.error && !plan.skill && (
        <section className="learning-empty panel">
          <span className="resource-icon">GO</span>
          <div>
            <p className="eyebrow">YOUR PLAN STARTS WITH EVIDENCE</p>
            <h2>Complete an assessment to unlock personalised learning.</h2>
            <p>
              We will use your real score and missed questions to recommend the next highest-impact learning steps.
            </p>
            <Link className="button button-primary" to="/assessments" style={{ marginTop: "14px" }}>
              Take an Assessment →
            </Link>
          </div>
        </section>
      )}

      {!plan.loading && !plan.error && plan.skill && (
        <>
          <section className="learning-overview panel">
            <div className="learning-overview-top">
              <div>
                <span className="section-kicker">CURATED PATHWAY</span>
                <h2>{plan.skill.skills?.name}</h2>
                <p>{skillLevel} pathway calibrated to your latest assessment performance.</p>
              </div>
              <label className="learning-skill-select">
                Select Assessed Skill
                <select value={selectedSkillId || plan.skill.skill_id} onChange={selectSkill}>
                  {plan.progress.map((item) => (
                    <option key={item.skill_id} value={item.skill_id}>
                      {item.skills?.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="learning-metrics">
              <div>
                <span>Current Score</span>
                <strong>{plan.skill.current_score}%</strong>
              </div>
              <div>
                <span>Target Score</span>
                <strong>{plan.skill.target_score}%</strong>
              </div>
              <div>
                <span>Skill Gap</span>
                <strong style={{ color: plan.skill.gap_percentage > 0 ? "var(--amber-600)" : "var(--green-600)" }}>
                  {plan.skill.gap_percentage}%
                </strong>
              </div>
              <div>
                <span>Skill Level</span>
                <strong>{skillLevel}</strong>
              </div>
            </div>

            <ProgressBar value={plan.skill.current_score} tone={plan.skill.current_score >= 80 ? "green" : "blue"} />
            <p className="learning-guidance">
              {plan.skill.gap_percentage
                ? "Your recommendations focus on the topics most likely to close this gap."
                : "Your skill is at target benchmark. Focus on advanced topics and practical work to keep growing."}
            </p>
          </section>

          {activeTopic && (
            <section className="learning-overview panel learning-detail-panel">
              <div className="learning-detail-header">
                <div>
                  <span className="section-kicker">ACTIVE TOPIC MODULE</span>
                  <h2>{activeTopic.topic}</h2>
                  <p>
                    {activeTopic.difficulty} · {activeTopic.estimated_minutes} minutes · {activeTopic.phase}
                  </p>
                </div>
                <div className="learning-detail-actions">
                  <button
                    className="button button-secondary"
                    type="button"
                    onClick={() => {
                      const params = new URLSearchParams(searchParams);
                      params.delete("topic");
                      setSearchParams(params);
                    }}
                  >
                    ← Back to Roadmap
                  </button>
                  <button
                    className="button button-primary"
                    type="button"
                    disabled={savingId === activeTopic.id}
                    onClick={() => saveProgress(activeTopic, "start")}
                  >
                    {savingId === activeTopic.id
                      ? "Saving..."
                      : activeTopic.learningProgress.status === "Completed"
                      ? "Review Topic"
                      : activeTopic.learningProgress.progress
                      ? "Continue Learning"
                      : "Start Topic"}
                  </button>
                </div>
              </div>

              <div className="learning-detail-grid">
                <article>
                  <h3>What you will learn</h3>
                  <p>
                    Build practical understanding of {activeTopic.topic.toLowerCase()} in{" "}
                    {plan.skill.skills?.name || "this skill area"}, focusing on the concepts needed to close your current skill gap.
                  </p>
                </article>
                <article>
                  <h3>Explanation</h3>
                  <p>
                    Review the working patterns, architectural choices, and core skill principles behind {activeTopic.topic} so your practice is targeted and measurable.
                  </p>
                </article>
                <article>
                  <h3>Practical Examples</h3>
                  <p>
                    Apply the topic to realistic scenarios in {plan.skill.skills?.name || "your chosen skill"}, using concrete code examples rather than pure theory.
                  </p>
                </article>
                <article>
                  <h3>Key Takeaways</h3>
                  <p>
                    Focus on the core fundamentals, common mistakes, and the exact conceptual questions tested in this domain.
                  </p>
                </article>
                <article>
                  <h3>Practice Steps</h3>
                  <p>
                    Complete a short set of guided exercises and revisit the weak points highlighted by your diagnostic assessment.
                  </p>
                </article>
                <article>
                  <h3>Quick Assessment</h3>
                  <p>
                    Confirm mastery by explaining the core concept in your own words and applying it to a simulated challenge.
                  </p>
                </article>
              </div>

              <div className="learning-detail-footer">
                <div>
                  <strong>{activeTopic.learningProgress.progress || 0}% complete</strong>
                  <p style={{ color: "var(--ink-500)", fontSize: "13px", marginTop: "2px" }}>
                    {activeTopic.learningProgress.status === "Completed"
                      ? "You have completed this topic."
                      : activeTopic.learningProgress.progress
                      ? "Continue from your last saved progress."
                      : "Start this topic to begin your guided practice."}
                  </p>
                </div>
                <div className="learning-detail-actions">
                  <button
                    className="button button-secondary"
                    type="button"
                    onClick={() => saveProgress(activeTopic, "complete")}
                  >
                    Mark Complete ✓
                  </button>
                  {plan.topics.findIndex((topic) => String(topic.id) === String(activeTopic.id)) <
                    plan.topics.length - 1 && (
                    <button
                      className="button button-primary"
                      type="button"
                      onClick={() =>
                        openTopic(
                          plan.topics[
                            plan.topics.findIndex((topic) => String(topic.id) === String(activeTopic.id)) + 1
                          ]
                        )
                      }
                    >
                      Next Topic →
                    </button>
                  )}
                </div>
              </div>
            </section>
          )}

          <section className="roadmap-section">
            <div className="section-title">
              <div>
                <p className="eyebrow">STRUCTURED ROADMAP</p>
                <h2>A Practical Pathway Forward</h2>
              </div>
              <span className="muted">{phases.length} relevant phases</span>
            </div>
            <div className="roadmap-flow">
              {phases.map((item, index) => (
                <article
                  className={`roadmap-phase ${item.status.toLowerCase().replace(/\s+/g, "-")}`}
                  key={item.phase}
                >
                  <span>0{index + 1}</span>
                  <div>
                    <h3>{item.phase}</h3>
                    <p>{item.status}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="learning-resources">
            <div className="section-title">
              <div>
                <p className="eyebrow">PRIORITY MODULES</p>
                <h2>Close the Next Skill Gap</h2>
              </div>
              <span className="muted">
                {plan.topics.length} topic{plan.topics.length === 1 ? "" : "s"}
              </span>
            </div>

            {!plan.topics.length && (
              <div className="empty-state">No recommendations are available for this skill yet.</div>
            )}

            <div className="resource-grid">
              {plan.topics.map((topic) => {
                const progress = topic.learningProgress.progress || 0;
                const completed = topic.learningProgress.status === "Completed";
                return (
                  <article className="resource-card learning-card" key={topic.id}>
                    <div className="resource-top">
                      <span className="resource-icon">{String(topic.priority).padStart(2, "0")}</span>
                      <span className="level-badge">{topic.difficulty}</span>
                    </div>

                    <div className="topic-priority">Priority {topic.priority}</div>
                    <h3>{topic.topic}</h3>
                    <p>{topic.recommendationReason}</p>

                    <div className="resource-meta">
                      <span>{plan.skill.skills?.name}</span>
                      <span>⏱ {topic.estimated_minutes} minutes</span>
                    </div>

                    <ProgressBar value={progress} tone={completed ? "green" : "blue"} />

                    <div className="resource-bottom">
                      <strong>{completed ? "Completed" : progress ? `${progress}% in progress` : "Not started"}</strong>
                      <div className="learning-resource-actions">
                        <button
                          className="button button-secondary"
                          type="button"
                          disabled={savingId === topic.id}
                          onClick={() => openTopic(topic)}
                        >
                          {selectedTopicId === topic.id
                            ? "Open Topic"
                            : progress
                            ? "Continue"
                            : "Start"}
                        </button>
                        <button
                          className="table-action"
                          type="button"
                          disabled={savingId === topic.id}
                          onClick={() => saveProgress(topic, "complete")}
                        >
                          Mark Complete
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </>
      )}
    </PlatformLayout>
  );
}

export default Learning;

