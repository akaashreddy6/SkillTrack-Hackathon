import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader, PlatformLayout, ProgressBar } from "../components/Platform";
import { useAuth } from "../context/AuthContext";
import { getCurrentProfile, updateProfile } from "../services/profileService";

function Profile() {
  const { user, profile, refreshProfile } = useAuth();
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    location: "",
    education: "",
    career_goal: "",
    bio: "",
  });
  const [state, setState] = useState({
    loading: true,
    saving: false,
    message: "",
    error: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        location: profile.location || "",
        education: profile.education || "",
        career_goal: profile.career_goal || "",
        bio: profile.bio || "",
      });
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    getCurrentProfile(user.id)
      .then((currentProfile) => {
        if (currentProfile) {
          setForm({
            full_name: currentProfile.full_name || "",
            phone: currentProfile.phone || "",
            location: currentProfile.location || "",
            education: currentProfile.education || "",
            career_goal: currentProfile.career_goal || "",
            bio: currentProfile.bio || "",
          });
        } else {
          setState((prev) => ({
            ...prev,
            error: "No profile record exists for this account. Please contact an administrator.",
          }));
        }
      })
      .catch((error) =>
        setState((prev) => ({ ...prev, error: error.message || "Unable to load your profile." }))
      )
      .finally(() => setState((prev) => ({ ...prev, loading: false })));
  }, [user]);

  const save = async (event) => {
    event.preventDefault();
    setState({ saving: true, message: "", error: "" });
    try {
      await updateProfile(user.id, form);
      await refreshProfile();
      setState({ saving: false, message: "Profile updated successfully.", error: "" });
    } catch (error) {
      setState({
        saving: false,
        message: "",
        error: error.message || "Unable to update your profile.",
      });
    }
  };

  if (!user) {
    return (
      <PlatformLayout role="student">
        <div className="route-state">Please sign in to view your profile.</div>
      </PlatformLayout>
    );
  }

  if (state.loading) {
    return (
      <PlatformLayout role="student">
        <div className="route-state">Loading your profile...</div>
      </PlatformLayout>
    );
  }

  const initials = (profile?.full_name || form.full_name || "ST")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const completion = profile?.profile_completion || 0;

  return (
    <PlatformLayout role="student">
      <PageHeader
        eyebrow="ACCOUNT & IDENTITY"
        title="Student Career Profile"
        description="Manage your professional credentials, career objectives, educational background, and portfolio links."
      />

      <div className="profile-page-grid">
        {/* LEFT COLUMN: PROFILE SUMMARY & READINESS */}
        <aside className="profile-sidebar-col">
          <div className="panel profile-card-hero">
            <div className="avatar profile-avatar-lg">{initials}</div>
            <h2 className="profile-hero-name">{profile?.full_name || form.full_name || "Your Profile"}</h2>
            <p className="profile-hero-role">{form.career_goal || "Aspiring Technologist"}</p>
            <p className="profile-hero-bio">
              {profile?.bio || form.bio || "Add a professional summary to help hiring teams and employers understand your focus."}
            </p>

            <div className="profile-contact-meta">
              <div className="profile-meta-row">
                <span className="profile-meta-icon">📧</span>
                <span className="profile-meta-text">{profile?.email || user.email}</span>
              </div>
              <div className="profile-meta-row">
                <span className="profile-meta-icon">📍</span>
                <span className="profile-meta-text">{profile?.location || form.location || "Location not added"}</span>
              </div>
              {profile?.phone && (
                <div className="profile-meta-row">
                  <span className="profile-meta-icon">📞</span>
                  <span className="profile-meta-text">{profile.phone}</span>
                </div>
              )}
            </div>

            <Link className="button button-secondary full-width" to="/portfolio" style={{ marginTop: "20px" }}>
              Open Developer Portfolio →
            </Link>
          </div>

          <div className="panel profile-score-panel" style={{ marginTop: "20px" }}>
            <div className="panel-header">
              <div>
                <span className="eyebrow">READINESS FACTOR</span>
                <h3 style={{ fontSize: "15px" }}>Profile Completeness</h3>
              </div>
              <strong style={{ fontSize: "16px", color: "var(--blue-400)" }}>{completion}%</strong>
            </div>
            <ProgressBar
              value={completion}
              tone={completion >= 80 ? "green" : completion >= 50 ? "blue" : "orange"}
            />
            <p className="profile-hint" style={{ marginTop: "12px", color: "var(--text-muted)", fontSize: "12px" }}>
              Complete your contact details, education, target role, and bio to maximize your visibility to recruiters.
            </p>
          </div>
        </aside>

        {/* RIGHT COLUMN: STRUCTURED EDIT FORM */}
        <section className="profile-form-col">
          <div className="panel profile-form-panel">
            <div className="panel-header">
              <div>
                <span className="eyebrow">EDITABLE CREDENTIALS</span>
                <h2>Professional Information</h2>
              </div>
              <span className="panel-status-tag">Live Sync</span>
            </div>

            <form className="profile-form-structured" onSubmit={save}>
              {/* SECTION 1: PERSONAL INFORMATION */}
              <div className="form-section-block">
                <h3 className="form-section-title">1. Personal Information</h3>
                <div className="form-grid-2col">
                  <div className="form-group">
                    <label htmlFor="full_name">Full Name *</label>
                    <input
                      id="full_name"
                      required
                      placeholder="e.g. Alex Johnson"
                      value={form.full_name}
                      onChange={(event) => setForm({ ...form, full_name: event.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input
                      id="phone"
                      placeholder="+1 (555) 000-0000"
                      value={form.phone}
                      onChange={(event) => setForm({ ...form, phone: event.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: "14px" }}>
                  <label htmlFor="location">Location / City</label>
                  <input
                    id="location"
                    placeholder="e.g. San Francisco, CA or Remote"
                    value={form.location}
                    onChange={(event) => setForm({ ...form, location: event.target.value })}
                  />
                </div>
              </div>

              {/* SECTION 2: EDUCATION & CAREER TARGET */}
              <div className="form-section-block">
                <h3 className="form-section-title">2. Education & Career Objective</h3>
                <div className="form-grid-2col">
                  <div className="form-group">
                    <label htmlFor="education">Highest Education / Degree</label>
                    <input
                      id="education"
                      placeholder="e.g. B.S. Computer Science"
                      value={form.education}
                      onChange={(event) => setForm({ ...form, education: event.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="career_goal">Target Career Role / Goal</label>
                    <input
                      id="career_goal"
                      placeholder="e.g. Full-Stack Software Engineer"
                      value={form.career_goal}
                      onChange={(event) => setForm({ ...form, career_goal: event.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: BIO / SUMMARY */}
              <div className="form-section-block">
                <h3 className="form-section-title">3. Professional Summary & Bio</h3>
                <div className="form-group">
                  <label htmlFor="bio">Summary Bio</label>
                  <textarea
                    id="bio"
                    rows={4}
                    placeholder="Passionate engineer building accessible, high-performance web applications and mastering distributed systems..."
                    value={form.bio}
                    onChange={(event) => setForm({ ...form, bio: event.target.value })}
                  />
                </div>
              </div>

              {/* SUBMIT & FEEDBACK */}
              <div className="profile-submit-row">
                <button type="submit" className="button button-primary" disabled={state.saving}>
                  {state.saving ? "Saving Changes..." : "Save Profile Changes"}
                </button>
                {state.message && <span className="auth-success-badge">✓ {state.message}</span>}
                {state.error && <span className="data-error-badge">⚠ {state.error}</span>}
              </div>
            </form>
          </div>
        </section>
      </div>
    </PlatformLayout>
  );
}

export default Profile;