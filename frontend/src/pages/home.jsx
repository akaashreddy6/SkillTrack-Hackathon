import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="home">
      <nav className="navbar">
        <div className="logo">Skill<span>Track</span></div>

        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>
          <Link to="/profile" className="nav-button">
            Get Started
          </Link>
        </div>
      </nav>

      <section className="hero-section">
        <div className="hero-content">
          <div className="badge">SMART SKILL & CAREER PLATFORM</div>

          <h1>
            Turn Your Skills Into
            <span> Career Opportunities.</span>
          </h1>

          <p>
            Assess your real skills, discover gaps, access personalized
            learning resources, and track your journey from training to
            employment.
          </p>

          <div className="hero-buttons">
            <Link to="/profile" className="primary-button">
              Start Your Journey →
            </Link>

            <a href="#how-it-works" className="secondary-button">
              Explore Platform
            </a>
          </div>
        </div>

        <div className="hero-card">
          <div className="card-header">
            <span>Skill Progress</span>
            <span className="status">● Active</span>
          </div>

          <div className="skill">
            <div>
              <span>HTML</span>
              <strong>92%</strong>
            </div>
            <div className="progress">
              <div style={{ width: "92%" }}></div>
            </div>
          </div>

          <div className="skill">
            <div>
              <span>CSS</span>
              <strong>84%</strong>
            </div>
            <div className="progress">
              <div style={{ width: "84%" }}></div>
            </div>
          </div>

          <div className="skill">
            <div>
              <span>JavaScript</span>
              <strong>42%</strong>
            </div>
            <div className="progress">
              <div style={{ width: "42%" }}></div>
            </div>
          </div>

          <div className="gap-alert">
            <strong>Skill Gap Detected</strong>
            <p>JavaScript needs improvement</p>
          </div>
        </div>
      </section>

      <section id="features" className="features-section">
        <div className="section-heading">
          <span>WHY SKILLTRACK</span>
          <h2>Everything You Need to Grow</h2>
          <p>
            From skill assessment to employment tracking, everything is
            connected in one platform.
          </p>
        </div>

        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">✓</div>
            <h3>Skill Assessment</h3>
            <p>
              Test your actual knowledge instead of simply claiming a skill.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">◈</div>
            <h3>Skill Gap Detection</h3>
            <p>
              Identify the skills you need to improve for your career goal.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">↗</div>
            <h3>Personalized Learning</h3>
            <p>
              Get learning resources based on your assessment results.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">▣</div>
            <h3>Employment Tracking</h3>
            <p>
              Track your journey from training to employment and beyond.
            </p>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="process-section">
        <div className="section-heading">
          <span>HOW IT WORKS</span>
          <h2>Your Journey With SkillTrack</h2>
        </div>

        <div className="process-grid">
          <div>
            <b>01</b>
            <h3>Create Profile</h3>
            <p>Tell us about your education, training and career goal.</p>
          </div>

          <div>
            <b>02</b>
            <h3>Assess Skills</h3>
            <p>Answer questions to measure your actual skill level.</p>
          </div>

          <div>
            <b>03</b>
            <h3>Improve Skills</h3>
            <p>Get resources for the skills you need to improve.</p>
          </div>

          <div>
            <b>04</b>
            <h3>Track Career</h3>
            <p>Track employment outcomes and career progress.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;