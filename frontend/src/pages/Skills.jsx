import { DashboardHeader } from "../components/DashboardLayout";

const skillCatalog = [
  { name: "HTML & Semantics", level: "Advanced", progress: 92, focus: "Accessibility + structure" },
  { name: "CSS Layout", level: "Advanced", progress: 88, focus: "Responsive design systems" },
  { name: "JavaScript", level: "Intermediate", progress: 68, focus: "DOM + async logic" },
  { name: "React", level: "Intermediate", progress: 76, focus: "Component architecture" },
  { name: "Java", level: "Foundational", progress: 54, focus: "OOP and classes" },
  { name: "Problem Solving", level: "Strong", progress: 80, focus: "Logical reasoning" },
];

function Skills() {
  return (
    <div className="dashboard-page">
      <DashboardHeader />

      <main className="dashboard-main dashboard-inner">
        <section className="page-header">
          <div>
            <p className="eyebrow">SKILLS TRACKER</p>
            <h1>Skill Overview</h1>
          </div>
        </section>

        <section className="skills-grid">
          {skillCatalog.map((skill) => (
            <article key={skill.name} className="info-card">
              <div className="info-card-top">
                <div>
                  <h3>{skill.name}</h3>
                  <p>{skill.level}</p>
                </div>
                <span className="skill-score">{skill.progress}%</span>
              </div>

              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${skill.progress}%` }} />
              </div>

              <div className="info-meta">
                <span>Focus area</span>
                <strong>{skill.focus}</strong>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}

export default Skills;
