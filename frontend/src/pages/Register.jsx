import { useState } from "react";

import { Link, useNavigate } from "react-router-dom";

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

function PasswordField({
  label,
  name,
  value,
  placeholder,
  onChange,
  error,
  showPassword,
  setShowPassword,
}) {
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

function Register() {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
    termsAccepted: false,
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

    if (!formData.fullName.trim()) {
      nextErrors.fullName = "Full name is required.";
    } else if (formData.fullName.trim().length < 2) {
      nextErrors.fullName = "Full name must be at least 2 characters.";
    }

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

    if (!formData.confirmPassword) {
      nextErrors.confirmPassword = "Please confirm your password.";
    } else if (formData.confirmPassword !== formData.password) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    if (!formData.role) {
      nextErrors.role = "Please select an account type.";
    }

    if (!formData.termsAccepted) {
      nextErrors.termsAccepted = "You must accept the terms and conditions.";
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
      const signupRequest = signUp({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
      });

      const timeout = new Promise((_, reject) => {
        window.setTimeout(() => reject(new Error("Signup request timed out. Check your Supabase configuration and network connection.")), 15000);
      });

      const { session } = await Promise.race([signupRequest, timeout]);

      if (session) {
        if (formData.role === "employer") {
          navigate("/employer", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      } else {
        setSubmitMessage({
          text: "Account created. Check your email to confirm your address, then sign in.",
          type: "success",
        });
      }
    } catch (error) {
      const message = String(error.message || "");
      const normalizedMessage = message.toLowerCase();
      const type =
        normalizedMessage.includes("rate limit") || normalizedMessage.includes("too many")
          ? "rate-limit"
          : normalizedMessage.includes("already registered") || normalizedMessage.includes("already exists")
            ? "existing-email"
            : normalizedMessage.includes("database error") || normalizedMessage.includes("trigger")
              ? "database-error"
              : "error";

      const text =
        type === "rate-limit"
          ? "Too many signup attempts. Please wait before trying again."
          : type === "existing-email"
            ? "An account with this email already exists. Try signing in instead."
            : type === "database-error"
              ? "Your account could not be completed because the profile could not be created. Please try again later."
              : message || "Unable to create your account. Please try again.";

      setSubmitMessage({ text, type });
    } finally {
      setSubmitting(false);
    }
  };

  const passwordStrength = !formData.password
    ? { label: "", value: 0 }
    : formData.password.length < 8
      ? { label: "Weak", value: 1 }
      : !/[A-Z]/.test(formData.password) || !/[0-9]/.test(formData.password)
        ? { label: "Fair", value: 2 }
        : { label: "Strong", value: 3 };

  return (
    <div className="auth-page">
      <div className="auth-shell auth-shell-register">
        <aside className="auth-visual" aria-label="SkillTrack account setup overview">
          <div className="auth-brand">
            Skill<span>Track</span>
          </div>
          <p className="auth-kicker">BUILD YOUR SKILLS, MOVE CLOSER TO YOUR CAREER</p>
          <h1>Create your SkillTrack account</h1>
          <p className="auth-visual-copy">
            Build your skills and move closer to your career goals with AI-guided learning, clear skill insight, and job tracking.
          </p>
          <ul className="auth-feature-list">
            <li>Assess your current skills</li>
            <li>Track learning progress</li>
            <li>Discover role-fit opportunities</li>
            <li>Get AI-powered next steps</li>
          </ul>
        </aside>

        <section className="auth-card auth-card-panel">
          <div className="auth-logo">
            Skill<span>Track</span>
          </div>

          <h1>Create your account</h1>
          <p className="auth-subtitle">Build your skills and move closer to your career goals.</p>

          {submitMessage.text && (
            <div className={submitMessage.type === "success" ? "auth-success" : "auth-error"}>{submitMessage.text}</div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <FormField
              label="Full name"
              type="text"
              name="fullName"
              value={formData.fullName}
              placeholder="Enter your full name"
              onChange={handleChange}
              error={errors.fullName}
            />

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
              placeholder="Create a password"
              onChange={handleChange}
              error={errors.password}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
            />

            {formData.password && (
              <div className={`password-strength strength-${passwordStrength.value}`} aria-live="polite">
                <span>Password strength: {passwordStrength.label}</span>
                <span className="password-strength-track"><span /></span>
              </div>
            )}

            <PasswordField
              label="Confirm password"
              name="confirmPassword"
              value={formData.confirmPassword}
              placeholder="Confirm your password"
              onChange={handleChange}
              error={errors.confirmPassword}
              showPassword={showConfirmPassword}
              setShowPassword={setShowConfirmPassword}
            />

            <div className="form-group">
              <label>Account type</label>
              <div className="role-options">
                <label className={`role-option ${formData.role === "student" ? "selected" : ""}`}>
                  <input type="radio" name="role" value="student" checked={formData.role === "student"} onChange={handleChange} />
                  <span>
                    <strong>Student</strong>
                    <small>Learn skills, assess progress, discover jobs</small>
                  </span>
                </label>

                <label className={`role-option ${formData.role === "employer" ? "selected" : ""}`}>
                  <input type="radio" name="role" value="employer" checked={formData.role === "employer"} onChange={handleChange} />
                  <span>
                    <strong>Employer</strong>
                    <small>Post roles, discover candidates, match skills</small>
                  </span>
                </label>
              </div>
              {errors.role && <span className="field-error">{errors.role}</span>}
            </div>

            <label className="checkbox-row terms-row">
              <input type="checkbox" name="termsAccepted" checked={formData.termsAccepted} onChange={handleChange} />
              <span>
                I agree to the <a href="#terms">terms and conditions</a>
              </span>
            </label>

            {errors.termsAccepted && <span className="field-error terms-error">{errors.termsAccepted}</span>}

            <button type="submit" className="auth-button" disabled={submitting}>
              {submitting ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </section>
      </div>
    </div>
  );
}

export default Register;