import { useEffect, useState } from "react";
import { PageHeader, PlatformLayout, StatusBadge } from "../components/Platform";
import { getCertifications } from "../services/skilltrackService";
import { useAuth } from "../context/AuthContext";

export default function Certifications() {
  const { user } = useAuth();
  const [certifications, setCertifications] = useState([]);
  const [state, setState] = useState({ loading: true, error: "" });
  useEffect(() => { getCertifications(user.id).then(setCertifications).catch((error) => setState({ loading: false, error: error.message || "Unable to load certifications." })).finally(() => setState((prev) => ({ ...prev, loading: false }))); }, [user.id]);
  return <PlatformLayout><PageHeader eyebrow="VERIFIED ACHIEVEMENTS" title="Certifications" description="A portable record of your verified learning outcomes." action={<button className="button button-primary">Download record</button>} /><section className="certification-intro"><div className="certificate-seal">ST</div><div><p className="eyebrow">SKILLTRACK RECORD</p><h2>{certifications.length} certifications verified</h2><p>Share a trusted snapshot of your assessed capabilities with employers.</p></div></section>{state.loading && <div className="route-state">Loading your certifications...</div>}{state.error && <div className="data-error">{state.error}</div>}<section className="cert-grid">{!state.loading && !state.error && !certifications.length && <div className="empty-state">No certifications have been issued yet.</div>}{certifications.map((certificate) => <article className="certificate-card" key={certificate.id}><div className="certificate-top"><span className="certificate-mark">✓</span><StatusBadge>{certificate.status}</StatusBadge></div><h3>{certificate.name}</h3><div className="certificate-details"><span>Skill<strong>{certificate.skills?.name}</strong></span><span>Score<strong>{certificate.score}%</strong></span><span>Issued<strong>{new Date(certificate.issued_at).toLocaleDateString()}</strong></span></div><button className="table-action">View certificate</button></article>)}</section></PlatformLayout>;
}
