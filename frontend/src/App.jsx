import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Skills from "./pages/Skills";
import Assessments from "./pages/Assessments";
import Jobs from "./pages/Jobs";
import Profile from "./pages/profile";
import "./App.css";

function Home() {
  return (
    <>
      <nav className="navbar">
        <div className="logo">
          Skill<span>Track</span>
        </div>

        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>

          <Link to="/login" className="nav-button">
            Get Started
          </Link>
        </div>
      </nav>

      <main className="hero-section">
        <div className="hero-content">
          <span className="badge">
            SMART SKILL & CAREER PLATFORM
          </span>

          <h1>
            Turn Your Skills Into
            <span> Career Opportunities.</span>
          </h1>

          <p>
            Assess your real skills, discover gaps, access
            personalized learning resources, and track your
            journey from training to employment.
          </p>

          <div className="hero-buttons">
            <Link to="/register" className="primary-button">
              Start Your Journey →
            </Link>

            <a href="#features" className="secondary-button">
              Explore Platform
            </a>
          </div>
        </div>

        <div className="skill-card">
          <div className="card-header">
            <h2>Skill Progress</h2>
            <span>● Active</span>
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

          <div className="skill-gap">
            <h3>Skill Gap Detected</h3>
            <p>JavaScript needs improvement</p>
          </div>
        </div>
      </main>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/skills" element={<Skills />} />
        <Route path="/assessments" element={<Assessments />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;