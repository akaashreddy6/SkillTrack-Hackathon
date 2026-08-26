import { Link } from "react-router-dom";
import { applications } from "../data/mockData";
import { AppTable, PageHeader, PlatformLayout, StatCard, StatusBadge } from "../components/Platform";

export default function Applications() {
  return <PlatformLayout><PageHeader eyebrow="EMPLOYMENT TRACKING" title="Application tracker" description="Keep every opportunity, conversation, and next step in view." action={<Link className="button button-primary" to="/jobs">Find opportunities</Link>} /><section className="overview-grid three"><StatCard label="Active applications" value="09" detail="3 new this month" /><StatCard label="Interview pipeline" value="03" detail="Next: BrightPath" tone="green" /><StatCard label="Response rate" value="67%" detail="+12% from last month" tone="orange" /></section><section className="panel panel-table"><div className="panel-header"><div><p className="eyebrow">YOUR PIPELINE</p><h2>Applied jobs</h2></div><span className="muted">Updated today</span></div><AppTable headers={["Role", "Company", "Applied", "Status", "Next step"]} rows={applications.map((application) => <tr key={application.id}><td><strong>{application.title}</strong></td><td>{application.company}</td><td>{application.date}</td><td><StatusBadge>{application.status}</StatusBadge></td><td><button className="table-action">View details</button></td></tr>)} /></section></PlatformLayout>;
}
