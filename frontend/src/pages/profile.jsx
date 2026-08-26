import { DashboardHeader } from "../components/DashboardLayout";

const profileStats = [
  { label: "Career Goal", value: "Frontend Developer" },
  { label: "Current Level", value: "Intermediate" },
  { label: "Completed Tracks", value: "08" },
  { label: "Mentor Sessions", value: "06" },
];

const achievements = [
  "Completed React Fundamentals track",
  "Improved JavaScript accuracy by 18%",
  "Reached 82% skill readiness score",
  "Applied to 9 opportunities this month",
];

function Profile() {
  return (
    <div className="dashboard-page">
      <DashboardHeader />

      <main className="dashboard-main dashboard-inner">
        <section className="page-header">
          <div>
            <p className="eyebrow">PROFILE</p>
            <h1>Student Profile</h1>
          </div>
        </section>

        <section className="profile-layout">
          <div className="panel profile-summary">
            <div className="profile-avatar">AS</div>
            <h2>Alicia Stone</h2>
            <p>Frontend learner focusing on React and design systems.</p>

            <div className="profile-contact">
              <span>alicia.stone@email.com</span>
              <span>Based in London, UK</span>
            </div>
          </div>

          <div className="panel profile-stats-panel">
            <div className="panel-header">
              <h2>Profile Details</h2>
            </div>

            <div className="stat-grid">
              {profileStats.map((item) => (
                <div key={item.label} className="stat-item">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="panel panel-table">
          <div className="panel-header">
            <h2>Recent Achievements</h2>
          </div>

          <ul className="achievement-list">
            {achievements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}

export default Profile;