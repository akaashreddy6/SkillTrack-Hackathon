import { useEffect, useState } from "react";
import { PageHeader, PlatformLayout, StatusBadge } from "../components/Platform";
import { getCertifications } from "../services/skilltrackService";
import { useAuth } from "../context/AuthContext";

export default function Certifications() {
  const { user } = useAuth();
  const [certifications, setCertifications] = useState([]);
  const [state, setState] = useState({ loading: true, error: "" });

  useEffect(() => {
    if (!user?.id) return undefined;
    getCertifications(user.id)
      .then(setCertifications)
      .catch((error) =>
        setState({ loading: false, error: error.message || "Unable to load certifications." })
      )
      .finally(() => setState((prev) => ({ ...prev, loading: false })));
  }, [user?.id]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <PlatformLayout>
      <PageHeader
        eyebrow="VERIFIED ACHIEVEMENTS"
        title="Certifications & Badges"
        description="A tamper-evident, verifiable record of your assessment performance and validated competency outcomes."
        action={
          <button type="button" className="button button-primary" onClick={handlePrint}>
            Download / Print Record 🖨
          </button>
        }
      />

      <section className="certification-intro">
        <div className="certificate-seal">ST</div>
        <div>
          <p className="eyebrow">SKILLTRACK VERIFIED TRANSCRIPT</p>
          <h2>{certifications.length} Credentials Verified</h2>
          <p style={{ color: "var(--ink-600)", fontSize: "14px", marginTop: "4px" }}>
            Share a trusted, cryptographically validated snapshot of your assessed capabilities with employers and recruiters.
          </p>
        </div>
      </section>

      {state.loading && <div className="route-state">Loading your verified certificates...</div>}
      {state.error && <div className="data-error">{state.error}</div>}

      <section className="cert-grid">
        {!state.loading && !state.error && !certifications.length && (
          <div className="empty-state">
            <h3>No certifications have been issued yet.</h3>
            <p>Score 80% or higher on any skill assessment to earn your verified credential certificate.</p>
          </div>
        )}

        {certifications.map((certificate) => (
          <article className="certificate-card" key={certificate.id}>
            <div className="certificate-top">
              <span className="certificate-mark">✓</span>
              <StatusBadge>{certificate.status || "Verified"}</StatusBadge>
            </div>

            <h3>{certificate.name}</h3>

            <div className="certificate-details">
              <span>
                Skill
                <strong>{certificate.skills?.name || "Technical Domain"}</strong>
              </span>
              <span>
                Verified Score
                <strong style={{ color: "var(--blue-600)" }}>{certificate.score}%</strong>
              </span>
              <span>
                Issued Date
                <strong>{new Date(certificate.issued_at).toLocaleDateString()}</strong>
              </span>
            </div>

            <button
              type="button"
              className="table-action"
              style={{ marginTop: "12px" }}
              onClick={handlePrint}
            >
              View Certificate Document →
            </button>
          </article>
        ))}
      </section>
    </PlatformLayout>
  );
}

