import { useEffect, useState } from "react";
import { DashboardHeader } from "../components/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { getCurrentProfile, updateProfile } from "../services/profileService";
import { Link } from "react-router-dom";

function Profile() {
  const { user, profile, refreshProfile } = useAuth();
  const [form, setForm] = useState({ full_name: "", phone: "", location: "", education: "", career_goal: "", bio: "" });
  const [state, setState] = useState({ loading: true, saving: false, message: "", error: "" });
  useEffect(() => { if (profile) setForm({ full_name: profile.full_name || "", phone: profile.phone || "", location: profile.location || "", education: profile.education || "", career_goal: profile.career_goal || "", bio: profile.bio || "" }); }, [profile]);
  useEffect(() => { if (!user) return; getCurrentProfile(user.id).then((currentProfile) => { if (currentProfile) setForm({ full_name: currentProfile.full_name || "", phone: currentProfile.phone || "", location: currentProfile.location || "", education: currentProfile.education || "", career_goal: currentProfile.career_goal || "", bio: currentProfile.bio || "" }); else setState((prev) => ({ ...prev, error: "No profile record exists for this account. Please contact an administrator." })); }).catch((error) => setState((prev) => ({ ...prev, error: error.message || "Unable to load your profile." }))).finally(() => setState((prev) => ({ ...prev, loading: false }))); }, [user]);
  const save = async (event) => { event.preventDefault(); setState({ saving: true, message: "", error: "" }); try { await updateProfile(user.id, form); await refreshProfile(); setState({ saving: false, message: "Profile updated successfully.", error: "" }); } catch (error) { setState({ saving: false, message: "", error: error.message || "Unable to update your profile." }); } };
  if (!user) return <div className="route-state">Please sign in to view your profile.</div>;
  if (state.loading) return <div className="route-state">Loading your profile...</div>;
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
            <div className="profile-avatar">{(profile?.full_name || "You").slice(0, 2).toUpperCase()}</div>
            <h2>{profile?.full_name || "Your profile"}</h2>
            <p>{profile?.bio || "Add a career objective to help employers understand your direction."}</p>

            <div className="profile-contact">
              <span>{profile?.email || user.email}</span>
              <span>{profile?.location || "Location not added"}</span>
            </div>
            <Link className="button button-secondary full-width" to="/portfolio">Open portfolio</Link>
          </div>

          <div className="panel profile-stats-panel">
            <div className="panel-header">
              <h2>Profile Details</h2>
            </div>

            <form className="profile-form" onSubmit={save}><label>Full name<input value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} /></label><label>Phone<input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label><label>Location<input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} /></label><label>Education<input value={form.education} onChange={(event) => setForm({ ...form, education: event.target.value })} /></label><label>Career goal<input value={form.career_goal} onChange={(event) => setForm({ ...form, career_goal: event.target.value })} /></label><label>Bio<textarea value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} /></label><button className="button button-primary" disabled={state.saving}>{state.saving ? "Saving..." : "Save profile"}</button>{state.message && <span className="auth-success">{state.message}</span>}{state.error && <span className="data-error">{state.error}</span>}</form>
          </div>
        </section>

        <section className="panel panel-table">
          <div className="panel-header"><h2>Profile completion</h2><strong>{profile?.profile_completion || 0}%</strong></div><div className="progress-track"><div className="progress-fill" style={{ width: `${profile?.profile_completion || 0}%` }} /></div><p className="profile-hint">Complete your contact, education, career goal, and bio fields to build a stronger candidate profile.</p>
        </section>
      </main>
    </div>
  );
}

export default Profile;