import { Link } from "react-router-dom";
import { DashboardHeader } from "../components/DashboardLayout";

const jobs = [
  {
    title: "Frontend Developer",
    company: "Nova Labs",
    location: "Remote",
    match: 92,
    skills: ["React", "CSS", "JavaScript"],
  },
  {
    title: "UI Engineer",
    company: "BrightPath",
    location: "Hybrid",
    match: 88,
    skills: ["HTML", "CSS", "Accessibility"],
  },
  {
    title: "Full Stack Intern",
    company: "SkillNest",
    location: "On-site",
    match: 81,
    skills: ["JavaScript", "React", "Java"],
  },
  {
    title: "Junior Product Engineer",
    company: "Synthex",
    location: "Remote",
    match: 79,
    skills: ["React", "Problem Solving", "API Design"],
  },
];

function Jobs() {
  return (
    <div className="dashboard-page">
      <DashboardHeader />

      <main className="dashboard-main dashboard-inner">
        <section className="page-header">
          <div>
            <p className="eyebrow">JOB MATCHES</p>
            <h1>Recommended Opportunities</h1>
          </div>
        </section>

        <section className="job-grid dashboard-jobs-grid">
          {jobs.map((job) => (
            <article key={job.title} className="job-card">
              <div className="job-header-row">
                <div>
                  <h3>{job.title}</h3>
                  <p>{job.company}</p>
                </div>
                <span className="match-pill">{job.match}% Match</span>
              </div>

              <div className="job-location">{job.location}</div>

              <div className="job-skills">
                {job.skills.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>

              <Link to="/applications" className="secondary-action full-width">
                View Job
              </Link>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}

export default Jobs;
