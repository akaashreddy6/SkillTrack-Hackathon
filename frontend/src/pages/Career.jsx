import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader, PlatformLayout, ProgressBar, StatusBadge } from "../components/Platform";
import { getCareerReadiness } from "../services/skilltrackService";
import { useAuth } from "../context/AuthContext";

const roadmap = [
  ["Discover", "Profile created and core skills identified", (data) => Boolean(data.profile?.profile_completion || data.progress.length)],
  ["Assess", "Complete a diagnostic skills assessment", (data) => data.attempts.length > 0],
  ["Improve", "Complete targeted modules in your learning plan", (data) => data.learning.length > 0 && data.learning.some((item) => item.status === "Completed")],
  ["Build", "Add validated projects to your developer portfolio", () => false],
  ["Match", "Discover job opportunities aligned with your verified skills", (data) => data.jobs.length > 0],
  ["Apply", "Track active job applications through the pipeline", (data) => data.applications.length > 0],
  ["Grow", "Reassess regularly to measure upward skill trajectory", (data) => data.attempts.length > 1],
];

export default function Career() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.id) return undefined;
    let active = true;
    getCareerReadiness(user.id)
      .then((readiness) => {
        if (active) setData(readiness);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || "Unable to load career readiness.");
      });
    return () => {
      active = false;
    };
  }, [user?.id]);

  if (error) {
    return (
      <PlatformLayout>
        <div className="data-error">{error}</div>
      </PlatformLayout>
    );
  }

  if (!data) {
    return (
      <PlatformLayout>
        <div className="route-state">Loading your career readiness intelligence...</div>
      </PlatformLayout>
    );
  }

  const goal = data.profile?.career_goal;
  const topJob = data.jobs[0];
  const nextTargetHref = data.nextAction.includes("profile")
    ? "/profile"
    : data.nextAction.includes("assessment")
    ? "/assessments"
    : data.nextAction.includes("learning") || data.nextAction.includes("Improve")
    ? "/learning"
    : "/jobs";

  return (
    <PlatformLayout>
      <PageHeader
        eyebrow="CAREER INTELLIGENCE"
        title="Your Career Readiness"
        description="A unified, multi-dimensional view of the evidence behind your employability and next career leap."
        action={<StatusBadge>{data.level}</StatusBadge>}
      />

      <section className="readiness-hero panel">
        <div
          className="readiness-score"
          style={{
            background: `conic-gradient(#2563EB 0% ${data.overall}%, rgba(255, 255, 255, 0.08) ${data.overall}% 100%)`,
          }}
        >
          <strong>{data.overall}%</strong>
          <span>Overall Readiness</span>
        </div>

        <div>
          <p className="eyebrow">READINESS STATUS</p>
          <h2>{data.level}</h2>
          <p style={{ color: "var(--ink-600)", fontSize: "14px", margin: "6px 0 16px" }}>
            {data.nextAction}
          </p>
          <Link className="button button-primary" to={nextTargetHref}>
            {data.nextAction} →
          </Link>
        </div>
      </section>

      <section className="readiness-grid">
        {data.dimensions.map((dimension) => (
          <article className="readiness-card panel" key={dimension.key}>
            <div>
              <span>{dimension.label}</span>
              <strong>{dimension.score}%</strong>
            </div>
            <ProgressBar
              value={dimension.score}
              tone={dimension.score >= 80 ? "green" : dimension.score >= 60 ? "blue" : "orange"}
            />
            <small style={{ marginTop: "8px", display: "block", color: "var(--ink-400)" }}>
              {dimension.score >= 80
                ? "Strong Signal"
                : dimension.score >= 60
                ? "On Track"
                : dimension.score >= 40
                ? "Developing"
                : "Early Stage"}
            </small>
          </article>
        ))}
      </section>

      <section className="career-main-grid">
        <section className="panel career-roadmap">
          <div className="panel-header">
            <div>
              <p className="eyebrow">PROGRESS ROADMAP</p>
              <h2>From Evidence to Opportunity</h2>
            </div>
            <span style={{ fontWeight: "700", color: "var(--blue-600)" }}>
              {roadmap.filter((item) => item[2](data)).length} of {roadmap.length} Milestones Complete
            </span>
          </div>

          <div className="roadmap-list">
            {roadmap.map(([title, description, complete], index) => {
              const isDone = complete(data);
              return (
                <div className={isDone ? "roadmap-row complete" : "roadmap-row"} key={title}>
                  <span>0{index + 1}</span>
                  <div>
                    <strong>{title}</strong>
                    <p>{description}</p>
                  </div>
                  <b>{isDone ? "✓" : "→"}</b>
                </div>
              );
            })}
          </div>
        </section>

        <section className="panel career-goal">
          <p className="eyebrow">CAREER TARGET</p>
          {goal ? (
            <>
              <h2>{goal}</h2>
              <p style={{ color: "var(--ink-500)", fontSize: "13px", lineHeight: "1.5" }}>
                Your readiness score is continuously calibrated against live job requirements matching this ambition.
              </p>
              <div className="goal-list">
                <span>
                  Assessed Skills
                  <strong>{data.progress.length}</strong>
                </span>
                <span>
                  Priority Skill Gaps
                  <strong style={{ color: data.gaps.length ? "var(--amber-600)" : "var(--green-600)" }}>
                    {data.gaps.length}
                  </strong>
                </span>
                <span>
                  Matching Opportunities
                  <strong>{data.jobs.length}</strong>
                </span>
              </div>
              {topJob && (
                <Link className="button button-secondary full-width" to={`/jobs/${topJob.id}`}>
                  View Top Job Match →
                </Link>
              )}
            </>
          ) : (
            <>
              <h2>Set a Target for Your Next Move</h2>
              <p style={{ color: "var(--ink-500)", fontSize: "13px", lineHeight: "1.5" }}>
                Add your career aspiration to unlock precision skill recommendations and candidate matching.
              </p>
              <Link className="button button-primary full-width" to="/profile" style={{ marginTop: "16px" }}>
                Update Profile Target →
              </Link>
            </>
          )}
        </section>
      </section>
    </PlatformLayout>
  );
}