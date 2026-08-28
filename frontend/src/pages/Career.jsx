import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader, PlatformLayout, ProgressBar, StatusBadge } from "../components/Platform";
import { getCareerReadiness } from "../services/skilltrackService";
import { useAuth } from "../context/AuthContext";

const roadmap = [
  ["Discover", "Profile and skills identified", (data) => Boolean(data.profile?.profile_completion || data.progress.length)],
  ["Assess", "Complete a skills assessment", (data) => data.attempts.length > 0],
  ["Improve", "Complete your highest-priority learning plan", (data) => data.learning.length > 0 && data.learning.some((item) => item.status === "Completed")],
  ["Build", "Add projects to your portfolio", () => false],
  ["Match", "Find opportunities aligned to your skills", (data) => data.jobs.length > 0],
  ["Apply", "Track applications through the pipeline", (data) => data.applications.length > 0],
  ["Grow", "Reassess and track your progress", (data) => data.attempts.length > 1],
];

export default function Career() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { let active = true; getCareerReadiness(user.id).then((readiness) => { if (active) setData(readiness); }).catch((loadError) => { if (active) setError(loadError.message || "Unable to load career readiness."); }); return () => { active = false; }; }, [user.id]);
  if (error) return <PlatformLayout><div className="data-error">{error}</div></PlatformLayout>;
  if (!data) return <PlatformLayout><div className="route-state">Loading your career readiness...</div></PlatformLayout>;
  const goal = data.profile?.career_goal;
  const topJob = data.jobs[0];
  return <PlatformLayout><PageHeader eyebrow="CAREER READINESS" title="Your career readiness" description="One view of the evidence behind your next career step." action={<StatusBadge>{data.level}</StatusBadge>} /><section className="readiness-hero panel"><div className="readiness-score"><strong>{data.overall}%</strong><span>Overall readiness</span></div><div><p className="eyebrow">CURRENT STATE</p><h2>{data.level}</h2><p>{data.nextAction}</p><Link className="button button-primary" to={data.nextAction.includes("profile") ? "/profile" : data.nextAction.includes("assessment") ? "/assessments" : data.nextAction.includes("learning") || data.nextAction.includes("Improve") ? "/learning" : "/jobs"}>{data.nextAction}</Link></div></section><section className="readiness-grid">{data.dimensions.map((dimension) => <article className="readiness-card panel" key={dimension.key}><div><span>{dimension.label}</span><strong>{dimension.score}%</strong></div><ProgressBar value={dimension.score} /><small>{dimension.score >= 80 ? "Strong" : dimension.score >= 60 ? "On track" : dimension.score >= 40 ? "Developing" : "Early stage"}</small></article>)}</section><section className="career-main-grid"><section className="panel career-roadmap"><div className="panel-header"><div><p className="eyebrow">YOUR CAREER ROADMAP</p><h2>From evidence to opportunity</h2></div><span>{roadmap.filter((item) => item[2](data)).length} of {roadmap.length} complete</span></div><div className="roadmap-list">{roadmap.map(([title, description, complete], index) => <div className={complete(data) ? "roadmap-row complete" : "roadmap-row"} key={title}><span>0{index + 1}</span><div><strong>{title}</strong><p>{description}</p></div><b>{complete(data) ? "✓" : "→"}</b></div>)}</div></section><section className="panel career-goal"><p className="eyebrow">CAREER GOAL</p>{goal ? <><h2>{goal}</h2><p>Your readiness is measured against your current evidence and matching opportunities.</p><div className="goal-list"><span>Current skills<strong>{data.progress.length}</strong></span><span>Skill gaps<strong>{data.gaps.length}</strong></span><span>Matching jobs<strong>{data.jobs.length}</strong></span></div>{topJob && <Link className="button button-secondary full-width" to={`/jobs/${topJob.id}`}>View top match</Link>}</> : <><h2>Set a direction for your next move.</h2><p>Add a career goal to make your profile more useful to matching and readiness recommendations.</p><Link className="button button-primary" to="/profile">Complete profile</Link></>}</section></section></PlatformLayout>;
}