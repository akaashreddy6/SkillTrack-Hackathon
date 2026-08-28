import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link, useNavigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Skills from "./pages/Skills";
import Assessments from "./pages/Assessments";
import Jobs from "./pages/Jobs";
import Profile from "./pages/profile";
import Learning from "./pages/Learning";
import Applications from "./pages/Applications";
import Certifications from "./pages/Certifications";
import AssessmentFlow from "./pages/AssessmentFlow";
import Career from "./pages/Career";
import Portfolio from "./pages/Portfolio";
import { AdminDashboard, EmployerDashboard } from "./pages/Workspaces";
import { useAuth } from "./context/AuthContext";
import { getDashboardData, getJobs } from "./services/skilltrackService";
import "./App.css";

function Home() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState({ progress: [], jobs: [], loading: false });
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!user?.id) return undefined;
    setSnapshot((previous) => ({ ...previous, loading: true }));
    Promise.all([getDashboardData(user.id), getJobs()]).then(([dashboard, jobs]) => setSnapshot({ progress: dashboard.progress, jobs: jobs.slice(0, 2), loading: false })).catch(() => setSnapshot({ progress: [], jobs: [], loading: false }));
    return undefined;
  }, [user?.id]);

  const leadSkill = snapshot.progress[0];
  const score = leadSkill?.current_score;
  const target = leadSkill?.target_score;
  const gap = leadSkill?.gap_percentage;
  const navItems = user ? [["Dashboard", "/dashboard"], ["Skills", "/skills"], ["Assessments", "/assessments"], ["Learning", "/learning"], ["Jobs", "/jobs"]] : [["Home", "#top"], ["How it works", "#how-it-works"], ["Platform", "#intelligence"]];
  return (
    <div className="home-page" id="top">
      <nav className="navbar home-nav"><Link className="logo" to="/">Skill<span>Track</span></Link><button className="home-menu-button" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}><span /><span /><span /></button><div className={`nav-links ${menuOpen ? "home-nav-open" : ""}`}>{navItems.map(([label, to]) => to.startsWith("/") ? <Link key={label} to={to} onClick={() => setMenuOpen(false)}>{label}</Link> : <a key={label} href={to} onClick={() => setMenuOpen(false)}>{label}</a>)}{user ? <><Link className="nav-button nav-outline" to="/profile" onClick={() => setMenuOpen(false)}>Profile</Link><button className="nav-button" onClick={async () => { await signOut(); navigate("/"); }}>Logout</button></> : <><Link to="/login" onClick={() => setMenuOpen(false)}>Login</Link><Link to="/register" className="nav-button" onClick={() => setMenuOpen(false)}>Get started</Link></>}</div></nav>
      <main className="home-main">
        <section className="hero-section home-hero"><div className="hero-content"><span className="badge">DIGITAL SKILLS &amp; CAREER INTELLIGENCE</span><h1>Discover Skills.<br /><span>Close Gaps.</span><br />Build Careers.</h1><p>SkillTrack helps learners understand their real skill level, identify critical gaps, build personalized learning plans, and discover opportunities that match their capabilities.</p><div className="hero-buttons"><Link to={user ? "/assessments" : "/register"} className="primary-button">Start Your Assessment <span aria-hidden="true">→</span></Link><Link to="/jobs" className="secondary-button">Explore Opportunities</Link></div><div className="hero-proof"><span><strong>01</strong> Measure capability</span><span><strong>02</strong> Build readiness</span><span><strong>03</strong> Find direction</span></div></div><div className="hero-visual" aria-label="Skill intelligence pathway"><div className="visual-grid" /><div className="visual-orbit orbit-one"><span className="orbit-node node-a">SKILLS</span><span className="orbit-node node-b">LEARN</span></div><div className="visual-orbit orbit-two"><span className="orbit-node node-c">MATCH</span></div><div className="visual-core"><span>SKILL</span><strong>{score !== undefined ? `${score}%` : "DATA"}</strong><small>{leadSkill?.skills?.name || "INTELLIGENCE"}</small></div><div className="visual-callout callout-top"><b>ASSESS</b><span>Evidence-led insight</span></div><div className="visual-callout callout-bottom"><b>{user && gap !== undefined ? `${gap}% gap` : "CAREER READY"}</b><span>{user ? "Next best action" : "From insight to opportunity"}</span></div></div></section>
        <section className="value-strip" id="features">{[["01", "Assess Skills", "Measure capability with focused diagnostics."], ["02", "Identify Gaps", "See the skills that need attention."], ["03", "Personalize Learning", "Turn insight into a practical plan."], ["04", "Match Opportunities", "Connect strengths to meaningful roles."]].map(([number, title, text]) => <article key={title}><span>{number}</span><div><h3>{title}</h3><p>{text}</p></div></article>)}</section>
        <section className="home-section process-section" id="how-it-works"><div className="section-heading"><span>HOW SKILLTRACK WORKS</span><h2>A clearer path from potential to progress.</h2><p>Every step is connected, so learners and institutions can act on the same evidence.</p></div><div className="process-flow">{[["01", "Assess", "Measure your actual skill level."], ["02", "Identify", "Understand exactly where you need improvement."], ["03", "Learn", "Follow a personalized learning plan."], ["04", "Match", "Discover opportunities that fit your skills."], ["05", "Grow", "Reassess and track your progress."]].map(([number, title, text]) => <article key={number}><span>{number}</span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div></section>
        <section className="home-section intelligence-section" id="intelligence"><div className="intelligence-copy"><span className="section-label">SKILL INTELLIGENCE</span><h2>Make the gap visible. Make the next step obvious.</h2><p>Personalized learning recommendations are generated from assessment performance, so every action is connected to a real capability signal.</p><Link to={user ? "/dashboard" : "/register"} className="text-link">{user ? "Open your dashboard" : "Create your skill profile"} <span>→</span></Link></div><div className="intelligence-card">{snapshot.loading ? <div className="route-state">Loading your latest skill signal...</div> : leadSkill ? <><div className="intelligence-card-head"><span>{leadSkill.skills?.name}</span><small>Latest assessment</small></div><div className="intelligence-metrics"><div><strong>{score}%</strong><span>Current skill</span></div><div><strong>{target}%</strong><span>Target</span></div><div><strong>{gap}%</strong><span>Skill gap</span></div></div><div className="intelligence-track"><span style={{ width: `${score}%` }} /></div><p>Focus your next learning session on the gap with the highest impact.</p></> : <div className="empty-state">Complete an assessment to see your skill intelligence here.</div>}</div></section>
        <section className="home-section learning-preview"><div className="section-heading left"><span>PERSONALIZED LEARNING</span><h2>Learning that responds to where you are now.</h2></div><div className="learning-preview-grid"><div className="learning-plan-card"><div className="plan-top"><span className="section-label">YOUR PERSONALIZED LEARNING PLAN</span><span className="plan-status">{user ? "Live plan" : "Ready when you are"}</span></div><h3>{leadSkill?.skills?.name || "Your next skill"}</h3><p>{leadSkill ? "Recommended topics are prioritized from your latest assessment." : "Take an assessment to generate a learning plan built around your goals."}</p><div className="plan-values"><span>Current <b>{score !== undefined ? `${score}%` : "—"}</b></span><span>Target <b>{target !== undefined ? `${target}%` : "—"}</b></span><span>Gap <b>{gap !== undefined ? `${gap}%` : "—"}</b></span></div><Link to={user ? "/learning" : "/register"} className="button button-primary">View learning plan</Link></div><div className="topic-list"><span className="section-label">RECOMMENDED TOPICS</span>{["Fundamentals", "Functions", "Arrays", "DOM", "Async JavaScript"].map((topic, index) => <div key={topic}><span>0{index + 1}</span><strong>{topic}</strong><small>{leadSkill ? "Recommended" : "Assessment-led"}</small></div>)}</div></div></section>
        <section className="home-section opportunities-section"><div className="section-heading left"><span>OPPORTUNITY MATCHING</span><h2>Find opportunities that match your skills.</h2><p>See what your evidence makes possible and where one more learning step can improve your fit.</p></div><div className="opportunity-preview">{snapshot.jobs.length ? snapshot.jobs.map((job) => <article className="opportunity-item" key={job.id}><div><span className="opportunity-mark">↗</span><div><h3>{job.title}</h3><p>{job.company_name} · {job.location}</p></div></div><span className="match-label">{user ? "Match in workspace" : "Explore role"}</span></article>) : <div className="empty-state">Explore live opportunities from the Jobs workspace.</div>}<Link to="/jobs" className="button button-secondary">Explore all opportunities</Link></div></section>
        <section className="institution-section"><div><span className="section-label">FOR INSTITUTIONS &amp; PROGRAMMES</span><h2>Turning skill data into workforce intelligence.</h2><p>SkillTrack gives programmes a shared view of readiness, training needs, and employment pathways without making claims on behalf of any government organization.</p></div><div className="institution-grid">{["Skill gap analytics", "Workforce readiness", "Training needs", "In-demand skills", "Employment outcomes"].map((item, index) => <div key={item}><span>0{index + 1}</span><strong>{item}</strong></div>)}</div></section>
        <section className="final-cta"><span className="section-label">YOUR NEXT STEP</span><h2>Ready to discover your next opportunity?</h2><Link to={user ? "/assessments" : "/register"} className="primary-button">Start Your Assessment <span>→</span></Link></section>
      </main><footer className="home-footer"><Link className="logo" to="/">Skill<span>Track</span></Link><span>Discover Skills. Close Gaps. Build Careers.</span><span>© 2026 SkillTrack</span></footer>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/skills" element={<Skills />} />
          <Route path="/assessments" element={<Assessments />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/:id" element={<Jobs />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/learning" element={<Learning />} />
          <Route path="/career" element={<Career />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/certifications" element={<Certifications />} />
          <Route path="/assessments/:id" element={<AssessmentFlow />} />
          <Route path="/assessments/:id/results" element={<AssessmentFlow />} />
        </Route>
        <Route element={<ProtectedRoute role="admin" />}>
          <Route path="/admin/*" element={<AdminDashboard />} />
        </Route>
        <Route element={<ProtectedRoute role="employer" />}>
          <Route path="/employer/*" element={<EmployerDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;