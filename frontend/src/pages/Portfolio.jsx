import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader, PlatformLayout } from "../components/Platform";
import { deleteProject, getProjects, getSkills, saveProject } from "../services/skilltrackService";
import { useAuth } from "../context/AuthContext";

const emptyProject = {
  title: "",
  description: "",
  technologies: "",
  github_url: "",
  live_demo_url: "",
  image_url: "",
  featured: false,
};

export default function Portfolio() {
  const { user, profile } = useAuth();
  const [projects, setProjects] = useState([]);
  const [skills, setSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [project, setProject] = useState(emptyProject);
  const [state, setState] = useState({
    loading: true,
    saving: false,
    error: "",
    message: "",
  });

  const load = async () => {
    if (!user?.id) return;
    try {
      const [items, catalog] = await Promise.all([getProjects(user.id), getSkills()]);
      setProjects(items);
      setSkills(catalog);
    } catch (error) {
      setState((previous) => ({
        ...previous,
        error: error.message || "Unable to load your portfolio.",
      }));
    } finally {
      setState((previous) => ({ ...previous, loading: false }));
    }
  };

  useEffect(() => {
    if (!user?.id) return undefined;
    load();
  }, [user?.id]);

  const submit = async (event) => {
    event.preventDefault();
    setState((previous) => ({ ...previous, saving: true, error: "", message: "" }));
    try {
      await saveProject({ userId: user.id, project, skillIds: selectedSkills });
      setProject(emptyProject);
      setSelectedSkills([]);
      setState((previous) => ({ ...previous, saving: false, message: "Project saved successfully." }));
      await load();
    } catch (error) {
      setState((previous) => ({
        ...previous,
        saving: false,
        error: error.message || "Unable to save project.",
      }));
    }
  };

  const edit = (item) => {
    setProject({
      id: item.id,
      title: item.title,
      description: item.description || "",
      technologies: item.technologies || "",
      github_url: item.github_url || "",
      live_demo_url: item.live_demo_url || "",
      image_url: item.image_url || "",
      featured: item.featured,
    });
    setSelectedSkills(item.project_skills?.map((skill) => skill.skill_id) || []);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (id) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    try {
      await deleteProject(id, user.id);
      setProjects((items) => items.filter((item) => item.id !== id));
    } catch (error) {
      setState((previous) => ({
        ...previous,
        error: error.message || "Unable to delete project.",
      }));
    }
  };

  return (
    <PlatformLayout>
      <PageHeader
        eyebrow="EVIDENCE OF CAPABILITY"
        title={`${profile?.full_name || "Your"} Developer Portfolio`}
        description="Showcase real-world projects, live applications, code repositories, and mapped skill tags to potential employers."
        action={
          <Link className="button button-secondary" to="/profile">
            Edit Profile
          </Link>
        }
      />

      {state.error && <div className="data-error">{state.error}</div>}
      {state.message && <div className="auth-success data-feedback">{state.message}</div>}

      <form className="panel project-form" onSubmit={submit}>
        <div className="panel-header">
          <div>
            <p className="eyebrow">PORTFOLIO PROJECT EDITOR</p>
            <h2>{project.id ? "Edit Project" : "Add a New Project"}</h2>
          </div>
          <span>Build your verified proof library</span>
        </div>

        <div className="form-grid">
          <label>
            Project Title
            <input
              required
              placeholder="e.g. Distributed Task Queue"
              value={project.title}
              onChange={(event) => setProject({ ...project, title: event.target.value })}
            />
          </label>

          <label>
            Tech Stack / Technologies
            <input
              placeholder="e.g. React, Node.js, PostgreSQL, Redis"
              value={project.technologies}
              onChange={(event) => setProject({ ...project, technologies: event.target.value })}
            />
          </label>

          <label className="form-wide">
            Detailed Project Description
            <textarea
              required
              rows={3}
              placeholder="Explain the problem you solved, architectural decisions, and key technical challenges..."
              value={project.description}
              onChange={(event) => setProject({ ...project, description: event.target.value })}
            />
          </label>

          <label>
            GitHub Repository URL
            <input
              type="url"
              placeholder="https://github.com/your-username/project"
              value={project.github_url}
              onChange={(event) => setProject({ ...project, github_url: event.target.value })}
            />
          </label>

          <label>
            Live Demo URL
            <input
              type="url"
              placeholder="https://my-app.vercel.app"
              value={project.live_demo_url}
              onChange={(event) => setProject({ ...project, live_demo_url: event.target.value })}
            />
          </label>

          <label>
            Screenshot Image URL
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={project.image_url}
              onChange={(event) => setProject({ ...project, image_url: event.target.value })}
            />
          </label>
        </div>

        <fieldset style={{ margin: "20px 0" }}>
          <legend style={{ fontSize: "13px", fontWeight: "700", color: "var(--ink-900)", marginBottom: "8px" }}>
            Demonstrated Skills Checklist
          </legend>
          <div className="skill-checkboxes">
            {skills.map((skill) => (
              <label key={skill.id}>
                <input
                  type="checkbox"
                  checked={selectedSkills.includes(skill.id)}
                  onChange={() =>
                    setSelectedSkills((current) =>
                      current.includes(skill.id)
                        ? current.filter((id) => id !== skill.id)
                        : [...current, skill.id]
                    )
                  }
                />
                {skill.name}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="checkbox-row" style={{ marginBottom: "20px" }}>
          <input
            type="checkbox"
            checked={project.featured}
            onChange={(event) => setProject({ ...project, featured: event.target.checked })}
          />
          Feature this project prominently on your candidate profile
        </label>

        <div style={{ display: "flex", gap: "10px" }}>
          <button className="button button-primary" disabled={state.saving}>
            {state.saving ? "Saving Project..." : project.id ? "Update Project" : "Save Project"}
          </button>
          {project.id && (
            <button
              type="button"
              className="button button-secondary"
              onClick={() => {
                setProject(emptyProject);
                setSelectedSkills([]);
              }}
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      <section className="portfolio-grid">
        {state.loading && <div className="route-state">Loading your portfolio projects...</div>}
        {!state.loading && !projects.length && (
          <div className="empty-state">No projects yet. Add your first project to strengthen your portfolio.</div>
        )}
        {projects.map((item) => (
          <article className="project-card panel" key={item.id}>
            {item.image_url && <img src={item.image_url} alt={item.title} />}
            {item.featured && <span className="level-badge">Featured Project</span>}
            <h2>{item.title}</h2>
            <p>{item.description}</p>
            {item.technologies && (
              <div className="job-skills">
                {item.technologies.split(",").map((technology) => (
                  <span key={technology}>{technology.trim()}</span>
                ))}
              </div>
            )}
            <div className="job-skills">
              {item.project_skills?.map((skill) => (
                <span key={skill.skill_id}>✓ {skill.skills?.name}</span>
              ))}
            </div>
            <div className="project-links">
              {item.github_url && (
                <a href={item.github_url} target="_blank" rel="noreferrer">
                  GitHub Repo ↗
                </a>
              )}
              {item.live_demo_url && (
                <a href={item.live_demo_url} target="_blank" rel="noreferrer">
                  Live Demo ↗
                </a>
              )}
            </div>
            <div className="project-actions">
              <button className="table-action" onClick={() => edit(item)}>
                Edit Project
              </button>
              <button className="table-action danger-action" onClick={() => remove(item.id)}>
                Delete
              </button>
            </div>
          </article>
        ))}
      </section>
    </PlatformLayout>
  );
}

