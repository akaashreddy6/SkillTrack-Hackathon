import { Link } from "react-router-dom";
import { DashboardHeader } from "../components/DashboardLayout";

const assessments = [
  { name: "Frontend Fundamentals", skill: "HTML/CSS", score: 92, date: "12 Aug 2026", status: "Passed" },
  { name: "JavaScript Logic Test", skill: "JavaScript", score: 68, date: "08 Aug 2026", status: "In Review" },
  { name: "React Components Quiz", skill: "React", score: 78, date: "03 Aug 2026", status: "Passed" },
  { name: "Java OOP Assessment", skill: "Java", score: 57, date: "29 Jul 2026", status: "Needs Review" },
  { name: "UX Thinking Challenge", skill: "Design", score: 86, date: "22 Jul 2026", status: "Passed" },
];

function Assessments() {
  return (
    <div className="dashboard-page">
      <DashboardHeader />

      <main className="dashboard-main dashboard-inner">
        <section className="page-header">
          <div>
            <p className="eyebrow">ASSESSMENTS</p>
            <h1>Assessment History</h1>
          </div>
        </section>

        <section className="panel panel-table">
          <div className="assessment-launch">
            <div><span className="section-kicker">NEXT ASSESSMENT</span><h2>JavaScript Logic Test</h2><p>10 questions · 12 minutes · Skill-gap report included</p></div>
            <Link className="button button-primary" to="/assessments/javascript">Start assessment</Link>
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
                    <td>{assessment.score}%</td>
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
      </main>
    </div>
  );
}

export default Assessments;
