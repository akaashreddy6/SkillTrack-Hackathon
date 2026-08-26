import { Link } from "react-router-dom";
import { DashboardHeader } from "../components/DashboardLayout";

const skillProgress = [
  { name: "HTML", value: 92 },
  { name: "CSS", value: 84 },
  { name: "JavaScript", value: 68 },
  { name: "React", value: 76 },
  { name: "Java", value: 52 },
];

const gaps = [
  { name: "JavaScript", current: "Intermediate", target: "Advanced", button: "Improve Skill" },
  { name: "React", current: "Intermediate", target: "Advanced", button: "Improve Skill" },
  { name: "Java", current: "Basic", target: "Intermediate", button: "Improve Skill" },
];

const assessments = [
  { name: "Frontend Fundamentals", skill: "HTML/CSS", score: "92%", date: "12 Aug 2026", status: "Passed" },
  { name: "JavaScript Logic Test", skill: "JavaScript", score: "68%", date: "08 Aug 2026", status: "In Review" },
  { name: "React Components Quiz", skill: "React", score: "78%", date: "03 Aug 2026", status: "Passed" },
  { name: "Java OOP Assessment", skill: "Java", score: "57%", date: "29 Jul 2026", status: "Needs Review" },
];

const jobs = [
  {
    title: "Frontend Developer",
    company: "Nova Labs",
    skills: ["React", "CSS", "JavaScript"],
    match: 92,
  },
  {
    title: "UI Engineer",
    company: "BrightPath",
    skills: ["HTML", "CSS", "Accessibility"],
    match: 88,
  },
  {
    title: "Full Stack Intern",
    company: "SkillNest",
    skills: ["JavaScript", "React", "Java"],
    match: 81,
  },
];

function OverviewCard({ label, value, detail, accent, icon }) {
  return (
    <div className="overview-card">
      <div className="card-header-row">
        <span className="overview-label">{label}</span>
        <span className={`overview-icon ${accent}`}>{icon}</span>
      </div>
      <div className="overview-value">{value}</div>
      <div className="overview-detail">{detail}</div>
    </div>
  );
}

function Dashboard() {
  return (
    <div className="dashboard-page">
      <DashboardHeader />

      <main className="dashboard-main">
        <section className="welcome-panel">
          <div>
            <p className="eyebrow">STUDENT DASHBOARD</p>
            <h1>Welcome back!</h1>
            <p className="welcome-copy">
              Continue building your skills, review recent assessments, and unlock
              new opportunities aligned with your career goals.
            </p>
          </div>

          <Link to="/learning" className="primary-dashboard-button">
            Continue Learning
          </Link>
        </section>

        <section className="overview-grid">
          <OverviewCard label="Overall Skill Score" value="82%" detail="+6% this month" accent="blue" icon="★" />
          <OverviewCard label="Skills Assessed" value="12" detail="4 new this month" accent="green" icon="✓" />
          <OverviewCard label="Skill Gaps" value="03" detail="2 high-priority" accent="orange" icon="!" />
          <OverviewCard label="Applications" value="09" detail="3 interviews this week" accent="purple" icon="↗" />
        </section>

        <section className="dashboard-grid">
          <div className="panel panel-wide">
            <div className="panel-header">
              <h2>Skill Progress</h2>
              <span>Updated today</span>
            </div>

            <div className="progress-list">
              {skillProgress.map((skill) => (
                <div key={skill.name} className="progress-item">
                  <div className="progress-label-row">
                    <span>{skill.name}</span>
                    <strong>{skill.value}%</strong>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${skill.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h2>Skill Gaps</h2>
              <span>Recommended</span>
            </div>

            <div className="gap-list">
              {gaps.map((gap) => (
                <div key={gap.name} className="gap-item">
                  <div className="gap-topline">
                    <strong>{gap.name}</strong>
                    <span>{gap.current}</span>
                  </div>
                  <p>Target: {gap.target}</p>
                    <Link to="/learning" className="secondary-action">
                    {gap.button}
                    </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="panel panel-table">
          <div className="panel-header">
            <h2>Recent Assessments</h2>
            <span>Last 30 days</span>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Assessment</th>
                  <th>Skill</th>
                  <th>Score</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {assessments.map((assessment) => (
                  <tr key={assessment.name}>
                    <td>{assessment.name}</td>
                    <td>{assessment.skill}</td>
                    <td>{assessment.score}</td>
                    <td>{assessment.date}</td>
                    <td>
                      <span className={`status-badge ${assessment.status.toLowerCase().replace(/\s+/g, "-")}`}>
                        {assessment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>Job Recommendations</h2>
            <span>Best matches</span>
          </div>

          <div className="job-grid">
            {jobs.map((job) => (
              <article key={job.title} className="job-card">
                <div className="job-header-row">
                  <div>
                    <h3>{job.title}</h3>
                    <p>{job.company}</p>
                  </div>
                  <span className="match-pill">{job.match}% Match</span>
                </div>

                <div className="job-skills">
                  {job.skills.map((skill) => (
                    <span key={skill}>{skill}</span>
                  ))}
                </div>

                <Link to="/jobs" className="secondary-action full-width">
                  View Job
                </Link>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
