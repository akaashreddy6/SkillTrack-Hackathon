import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAdminData, getDashboardData, getEmployerData, getJobMatches } from "../services/skilltrackService";
import SkillTrackAI from "./SkillTrackAI";

const publicRoutes = new Set(["/", "/login", "/register", "/password-reset", "/reset-password"]);

function getPageContext(pathname, search, role) {
  const path = pathname.toLowerCase();
  const params = new URLSearchParams(search);

  if (path.startsWith("/admin")) {
    return "Workforce intelligence";
  }

  if (path.startsWith("/employer")) {
    if (path.includes("/candidates/")) return "Candidate review";
    if (path.includes("/jobs/")) return "Job management";
    return "Employer hiring";
  }

  if (path.startsWith("/learning")) {
    return `Learning${params.get("skill") ? ` • skill ${params.get("skill")}` : ""}${params.get("topic") ? ` • topic ${params.get("topic")}` : ""}`;
  }

  if (path.startsWith("/jobs")) {
    return params.get("id") ? "Opportunity detail" : "Job matching";
  }

  if (path.startsWith("/skills")) {
    return "Skills";
  }

  if (path.startsWith("/assessments")) {
    return "Assessments";
  }

  if (path.startsWith("/career")) {
    return "Career readiness";
  }

  if (path.startsWith("/applications")) {
    return "Applications";
  }

  if (path.startsWith("/profile")) {
    return "Profile";
  }

  if (path.startsWith("/portfolio")) {
    return "Portfolio";
  }

  if (path.startsWith("/certifications")) {
    return "Certifications";
  }

  if (path.startsWith("/dashboard")) {
    return "Dashboard";
  }

  return `${role === "admin" ? "Admin" : role === "employer" ? "Employer" : "Student"} workspace`;
}

export default function GlobalAICopilot() {
  const location = useLocation();
  const { user, profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [aiData, setAiData] = useState({
    skillProgress: [],
    attempts: [],
    learningProgress: [],
    jobs: [],
    applications: [],
  });

  const role = profile?.role || "student";
  const pageContext = useMemo(
    () => getPageContext(location.pathname, location.search, role),
    [location.pathname, location.search, role]
  );

  useEffect(() => {
    if (!user?.id || publicRoutes.has(location.pathname)) return undefined;

    let mounted = true;

    const loadContext = async () => {
      try {
        if (role === "student") {
          const [dashboard, matchingJobs] = await Promise.all([
            getDashboardData(user.id),
            getJobMatches(user.id),
          ]);

          if (!mounted) return;

          setAiData({
            skillProgress: dashboard.progress || [],
            attempts: dashboard.attempts || [],
            learningProgress: dashboard.learning || [],
            jobs: matchingJobs.slice(0, 6),
            applications: dashboard.applications || [],
          });
        }

        if (role === "employer") {
          const employerData = await getEmployerData(user.id);
          if (!mounted) return;

          setAiData({
            skillProgress: [],
            attempts: [],
            learningProgress: [],
            jobs: employerData.jobs || [],
            applications: employerData.applications || [],
          });
        }

        if (role === "admin") {
          const adminData = await getAdminData();
          if (!mounted) return;

          setAiData({
            skillProgress: adminData.progress || [],
            attempts: adminData.attempts || [],
            learningProgress: [],
            jobs: adminData.jobs || [],
            applications: adminData.applications || [],
          });
        }
      } catch (error) {
        if (!mounted) return;
        setAiData({ skillProgress: [], attempts: [], learningProgress: [], jobs: [], applications: [] });
      }
    };

    void loadContext();

    return () => {
      mounted = false;
    };
  }, [location.pathname, role, user?.id]);

  if (!user || publicRoutes.has(location.pathname)) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        className="ai-copilot-trigger"
        aria-label="Open SkillTrack AI Career Copilot"
        onClick={() => setIsOpen(true)}
      >
        <span className="ai-copilot-icon" aria-hidden="true">🤖</span>
        <span className="ai-copilot-label">SkillTrack AI</span>
      </button>

      {isOpen && (
        <div
          className="ai-copilot-overlay"
          onClick={() => setIsOpen(false)}
          role="presentation"
        >
          <aside
            className="ai-copilot-panel"
            role="dialog"
            aria-modal="true"
            aria-label="SkillTrack AI Career Copilot"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="ai-copilot-header">
              <div>
                <p className="eyebrow">SKILLTRACK AI</p>
                <h2>Your Career Copilot</h2>
              </div>

              <button
                type="button"
                className="ai-copilot-close"
                aria-label="Close SkillTrack AI"
                onClick={() => setIsOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="ai-copilot-meta" aria-live="polite">
              <span>{role === "admin" ? "Admin" : role === "employer" ? "Employer" : "Student"}</span>
              <span>{pageContext}</span>
            </div>

            <SkillTrackAI
              role={role}
              profile={profile}
              skillProgress={aiData.skillProgress}
              attempts={aiData.attempts}
              learningProgress={aiData.learningProgress}
              pageContext={pageContext}
              hideHeader
            />
          </aside>
        </div>
      )}
    </>
  );
}
