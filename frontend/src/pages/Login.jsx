import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function FormField({ label, type, name, value, placeholder, onChange, error }) {
  return (
    <div className="form-group">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        className={error ? "input-error" : ""}
        aria-invalid={Boolean(error)}
      />
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

function PasswordField({ label, name, value, placeholder, onChange, error, showPassword, setShowPassword }) {
  return (
    <div className="form-group">
      <label htmlFor={name}>{label}</label>
      <div className={`password-input ${error ? "input-error-wrap" : ""}`}>
        <input
          id={name}
          name={name}
          type={showPassword ? "text" : "password"}
          value={value}
          placeholder={placeholder}
          onChange={onChange}
          className={error ? "input-error" : ""}
          aria-invalid={Boolean(error)}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setShowPassword((prev) => !prev)}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? "Hide" : "Show"}
        </button>
      </div>
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, refreshProfile, isConfigured } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({ text: "", type: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    const fieldValue = type === "checkbox" ? checked : value;

    setFormData((prev) => ({ ...prev, [name]: fieldValue }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setSubmitMessage({ text: "", type: "" });
  };

  const validate = () => {
    const nextErrors = {};
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!emailPattern.test(formData.email)) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (!formData.password) {
      nextErrors.password = "Password is required.";
    } else if (formData.password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters.";
    }

    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setSubmitMessage({ text: "", type: "" });
      return;
    }

    setErrors({});
    setSubmitting(true);
    setSubmitMessage({ text: "", type: "" });

    try {
      const { user } = await signIn(formData.email.trim(), formData.password);

      if (user) {
        const userProfile = await refreshProfile(user);

        if (userProfile?.role === "employer") {
          navigate("/employer", { replace: true });
        } else if (userProfile?.role === "admin") {
          navigate("/admin", { replace: true });
        } else {
          navigate(location.state?.from || "/dashboard", { replace: true });
        }
      }
    } catch (error) {
      setSubmitMessage({
        text: error.message || "Unable to sign in. Please try again.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <aside className="auth-visual" aria-label="SkillTrack overview panel">
          <div className="auth-brand">
            Skill<span>Track</span>
          </div>
          <p className="auth-kicker">TURN YOUR SKILLS INTO YOUR CAREER</p>
          <h1>Learn smarter. Understand your skills. Become career-ready.</h1>
          <p className="auth-visual-copy">
            SkillTrack connects learning, skill intelligence, AI career guidance and real job opportunities in one clear platform.
          </p>
          <ul className="auth-feature-list">
            <li>AI Career Copilot</li>
            <li>Skill Intelligence</li>
            <li>Personalized Learning</li>
            <li>Smart Job Matching</li>
          </ul>
        </aside>

        <section className="auth-card auth-card-panel">
          <div className="auth-logo">
            Skill<span>Track</span>
          </div>

          <h1>Welcome back</h1>
          <p className="auth-subtitle">Sign in to continue your career journey.</p>

          {submitMessage.text && (
            <div className={submitMessage.type === "error" ? "auth-error" : "auth-success"}>{submitMessage.text}</div>
          )}

          {!isConfigured && (
            <div className="auth-warning">
              Supabase is not configured for this environment yet. Add your project settings to enable authentication.
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <FormField
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              placeholder="Enter your email"
              onChange={handleChange}
              error={errors.email}
            />

            <PasswordField
              label="Password"
              name="password"
              value={formData.password}
              placeholder="Enter your password"
              onChange={handleChange}
              error={errors.password}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
            />

            <div className="auth-meta">
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                />
                <span>Remember me</span>
              </label>

              <a href="#forgot-password" className="auth-link">
                Forgot password?
              </a>
            </div>

            <button type="submit" className="auth-button" disabled={submitting}>
              {submitting ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="auth-footer">
            Don&apos;t have an account? <Link to="/register">Create an account</Link>
          </p>
        </section>
      </div>
    </div>
  );
}

export default Login;