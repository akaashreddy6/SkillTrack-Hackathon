import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  closeEmployerJob,
  createEmployerJob,
  getAdminData,
  getEmployerData,
  getSkills,
  updateApplicationStatus,
  updateEmployerJob,
} from "../services/skilltrackService";
import {
  PageHeader,
  PlatformLayout,
  StatCard,
} from "../components/Platform";
import {
  GovernmentOverview,
  EmploymentPipeline,
  SkillGapIntelligence,
  SkillDemandAnalysis,
  WorkforceReadiness,
  LearningImpact,
} from "../components/AdminDashboardComponents";

export function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getAdminData()
      .then(setData)
      .catch((loadError) =>
        setError(
          loadError.message ||
            "Unable to load admin data."
        )
      );
  }, []);

  if (error)
    return (
      <PlatformLayout role="admin">
        <div className="data-error">{error}</div>
      </PlatformLayout>
    );

  if (!data)
    return (
      <PlatformLayout role="admin">
        <div className="route-state">
          Loading administration data...
        </div>
      </PlatformLayout>
    );

  // Calculate top-level metrics
  const totalStudents = data.studentProfiles.length;
  const totalEmployers = data.employerProfiles.length;
  const totalJobs = data.jobs.length;
  const activeJobs = data.jobs.filter(
    (j) => j.status === "Active"
  ).length;
  const totalApplications = data.applications.length;
  const selectedCount = data.applications.filter(
    (a) => a.status === "Selected"
  ).length;

  // Application status breakdown
  const statusCounts = {
    applied: data.applications.filter(
      (a) => a.status === "Applied"
    ).length,
    shortlisted: data.applications.filter(
      (a) => a.status === "Shortlisted"
    ).length,
    interview: data.applications.filter(
      (a) => a.status === "Interview"
    ).length,
    selected: selectedCount,
    rejected: data.applications.filter(
      (a) => a.status === "Rejected"
    ).length,
  };

  // Average assessment score
  const avgAssessmentScore = data.attempts.length
    ? Math.round(
        data.attempts.reduce(
          (total, item) =>
            total + Number(item.percentage || 0),
          0
        ) / data.attempts.length
      )
    : 0;

  // Skill gaps analysis
  const skillGapMap = {};
  data.progress.forEach((item) => {
    const name = item.skills?.name || "Unknown";
    const gap = Math.max(
      Number(item.target_score || 80) -
        Number(item.current_score || 0),
      0
    );
    if (!skillGapMap[name]) {
      skillGapMap[name] = {
        name,
        skillId: item.skill_id,
        category: item.skills?.category,
        totalGap: 0,
        count: 0,
        totalCurrent: 0,
        totalTarget: 0,
      };
    }
    skillGapMap[name].totalGap += gap;
    skillGapMap[name].count += 1;
    skillGapMap[name].totalCurrent +=
      Number(item.current_score || 0);
    skillGapMap[name].totalTarget +=
      Number(item.target_score || 80);
  });

  const topSkillGaps = Object.values(skillGapMap)
    .map((skill) => ({
      ...skill,
      avgGap: Math.round(
        skill.totalGap / skill.count
      ),
      avgCurrent: Math.round(
        skill.totalCurrent / skill.count
      ),
      avgTarget: Math.round(
        skill.totalTarget / skill.count
      ),
    }))
    .sort((a, b) => b.avgGap - a.avgGap)
    .slice(0, 8);

  // Most demanded skills
  const skillDemandMap = {};
  data.jobSkills.forEach((item) => {
    const name = item.skills?.name || "Unknown";
    if (!skillDemandMap[name]) {
      skillDemandMap[name] = {
        name,
        skillId: item.skill_id,
        jobCount: 0,
        minScoreSum: 0,
      };
    }
    skillDemandMap[name].jobCount += 1;
    skillDemandMap[name].minScoreSum +=
      Number(item.minimum_score || 60);
  });

  const topSkillDemand = Object.values(
    skillDemandMap
  )
    .map((skill) => ({
      ...skill,
      minScoreAvg: Math.round(
        skill.minScoreSum / skill.jobCount
      ),
    }))
    .sort((a, b) => b.jobCount - a.jobCount)
    .slice(0, 8);

  // Workforce readiness calculations
  const avgTechnicalScore =
    data.progress.length > 0
      ? Math.round(
          data.progress.reduce(
            (total, item) =>
              total +
              Number(item.current_score || 0),
            0
          ) / data.progress.length
        )
      : 0;

  const avgProfileCompletion =
    totalStudents > 0
      ? Math.round(
          data.studentProfiles.reduce(
            (total, s) =>
              total +
              Number(s.profile_completion || 0),
            0
          ) / totalStudents
        )
      : 0;

  const uniqueTestTakers = data.attempts
    .filter(
      (a, idx, arr) =>
        arr.findIndex((x) =>
          String(x.user_id) === String(a.user_id)
        ) === idx
    )
    .map((a) => a.user_id).length;

  const assessmentParticipation =
    totalStudents > 0
      ? Math.round(
          (uniqueTestTakers / totalStudents) * 100
        )
      : 0;

  const uniqueProgressTrackers = data.progress
    .filter(
      (p, idx, arr) =>
        arr.findIndex((x) =>
          String(x.user_id) === String(p.user_id)
        ) === idx
    )
    .map((p) => p.user_id).length;

  const skillProgressParticipation =
    totalStudents > 0
      ? Math.round(
          (uniqueProgressTrackers / totalStudents) *
            100
        )
      : 0;

  return (
    <PlatformLayout role="admin">
      <PageHeader
        eyebrow="GOVERNMENT & INSTITUTION MONITORING"
        title="Workforce Intelligence Dashboard"
        description="Real-time insights into student readiness, employment outcomes, and skill intelligence across your platform."
      />

      <GovernmentOverview
        totalStudents={totalStudents}
        totalEmployers={totalEmployers}
        totalJobs={totalJobs}
        activeJobs={activeJobs}
        totalApplications={totalApplications}
        selectedCount={selectedCount}
      />

      <EmploymentPipeline
        totalApplications={totalApplications}
        statusCounts={statusCounts}
      />

      <SkillGapIntelligence
        topSkillGaps={topSkillGaps}
      />

      <SkillDemandAnalysis
        topSkillDemand={topSkillDemand}
      />

      <WorkforceReadiness
        totalStudents={totalStudents}
        avgTechnicalScore={avgTechnicalScore}
        avgAssessmentScore={avgAssessmentScore}
        avgProfileCompletion={avgProfileCompletion}
        assessmentParticipation={
          assessmentParticipation
        }
        skillProgressParticipation={
          skillProgressParticipation
        }
      />

      <LearningImpact
        totalStudents={totalStudents}
        assessmentCount={data.attempts.length}
        uniqueTestTakers={uniqueTestTakers}
        avgAssessmentScore={avgAssessmentScore}
        uniqueProgressTrackers={
          uniqueProgressTrackers
        }
      />
    </PlatformLayout>
  );
}

export function EmployerDashboard() {
  const { user, profile } = useAuth();
  const [data, setData] = useState(null);
  const [skills, setSkills] = useState([]);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [form, setForm] = useState({
    title: "",
    company_name: profile?.company_name || "",
    location: "Remote",
    employment_type: "Full-time",
    salary_range: "",
    description: "",
    status: "Active",
  });
  const [selectedSkills, setSelectedSkills] = useState(
    []
  );

  const load = () =>
    Promise.all([
      getEmployerData(user.id),
      getSkills(),
    ])
      .then(([employerData, skillData]) => {
        setData(employerData);
        setSkills(skillData);
      })
      .catch((loadError) =>
        setError(
          loadError.message ||
            "Unable to load employer data."
        )
      );

  useEffect(() => {
    if (user?.id) load();
  }, [user?.id]);

  const createJob = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const skillIds = selectedSkills.map((id) => ({
        id,
        minimum_score: 60,
      }));
      if (editingJob)
        await updateEmployerJob({
          employerId: user.id,
          job: { ...form, id: editingJob.id },
          skillIds,
        });
      else
        await createEmployerJob({
          employerId: user.id,
          job: form,
          skillIds,
        });
      setShowForm(false);
      setEditingJob(null);
      setForm({
        ...form,
        title: "",
        description: "",
      });
      setSelectedSkills([]);
      await load();
    } catch (saveError) {
      setError(
        saveError.message ||
          "Unable to save job."
      );
    } finally {
      setSaving(false);
    }
  };

  const _changeStatus = async (
    applicationId,
    status
  ) => {
    try {
      await updateApplicationStatus(
        applicationId,
        status
      );
      await load();
    } catch (statusError) {
      setError(
        statusError.message ||
          "Unable to update application status."
      );
    }
  };

  const _closeJob = async (jobId) => {
    try {
      await closeEmployerJob(jobId, user.id);
      await load();
    } catch (closeError) {
      setError(
        closeError.message ||
          "Unable to close job."
      );
    }
  };

  const _editJob = (job) => {
    setEditingJob(job);
    setForm({
      title: job.title,
      company_name: job.company_name,
      location: job.location || "",
      employment_type:
        job.employment_type || "Full-time",
      salary_range: job.salary_range || "",
      description: job.description || "",
      status: job.status,
    });
    setSelectedSkills(
      job.job_skills?.map((item) => item.skill_id) ||
        []
    );
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (error && !data)
    return (
      <PlatformLayout role="employer">
        <div className="data-error">{error}</div>
      </PlatformLayout>
    );

  if (!data)
    return (
      <PlatformLayout role="employer">
        <div className="route-state">
          Loading employer data...
        </div>
      </PlatformLayout>
    );

  return (
    <PlatformLayout role="employer">
      <PageHeader
        eyebrow="EMPLOYER CONSOLE"
        title="Build your next team"
        description="Manage roles, review candidates, and move applications forward."
        action={
          <button
            className="button button-primary"
            onClick={() =>
              setShowForm((open) => !open)
            }
          >
            + Post a job
          </button>
        }
      />
      <section className="overview-grid three">
        <StatCard
          label="Jobs posted"
          value={data.jobs.length}
          detail="Your owned roles"
        />
        <StatCard
          label="Active jobs"
          value={data.jobs.filter(
            (job) => job.status === "Active"
          ).length}
          detail="Published roles"
          tone="green"
        />
        <StatCard
          label="Applications"
          value={data.applications.length}
          detail="Candidate pipeline"
          tone="orange"
        />
      </section>
      {showForm && (
        <form
          className="panel employer-job-form"
          onSubmit={createJob}
        >
          <div className="panel-header">
            <h2>Create a job</h2>
            <span>
              Required skills use your SkillTrack
              catalog
            </span>
          </div>
          <div className="form-grid">
            <label>
              Job title
              <input
                required
                value={form.title}
                onChange={(event) =>
                  setForm({
                    ...form,
                    title: event.target.value,
                  })
                }
              />
            </label>
            <label>
              Company
              <input
                required
                value={form.company_name}
                onChange={(event) =>
                  setForm({
                    ...form,
                    company_name:
                      event.target.value,
                  })
                }
              />
            </label>
            <label>
              Location
              <input
                value={form.location}
                onChange={(event) =>
                  setForm({
                    ...form,
                    location: event.target.value,
                  })
                }
              />
            </label>
            <label>
              Employment type
              <select
                value={form.employment_type}
                onChange={(event) =>
                  setForm({
                    ...form,
                    employment_type:
                      event.target.value,
                  })
                }
              >
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Contract</option>
              </select>
            </label>
            <label>
              Salary range
              <input
                value={form.salary_range}
                onChange={(event) =>
                  setForm({
                    ...form,
                    salary_range:
                      event.target.value,
                  })
                }
              />
            </label>
            <label>
              Status
              <select
                value={form.status}
                onChange={(event) =>
                  setForm({
                    ...form,
                    status: event.target.value,
                  })
                }
              >
                <option>Draft</option>
                <option>Active</option>
              </select>
            </label>
            <label className="form-wide">
              Description
              <textarea
                required
                value={form.description}
                onChange={(event) =>
                  setForm({
                    ...form,
                    description:
                      event.target.value,
                  })
                }
              />
            </label>
          </div>
          <div className="form-section">
            <label>Required skills</label>
            <div className="skill-checkbox-list">
              {skills.map((skill) => (
                <label key={skill.id}>
                  <input
                    type="checkbox"
                    checked={selectedSkills.includes(
                      skill.id
                    )}
                    onChange={(event) => {
                      if (
                        event.target.checked
                      )
                        setSelectedSkills([
                          ...selectedSkills,
                          skill.id,
                        ]);
                      else
                        setSelectedSkills(
                          selectedSkills.filter(
                            (id) =>
                              id !== skill.id
                          )
                        );
                    }}
                  />
                  <span>{skill.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="form-actions">
            <button
              type="submit"
              disabled={saving}
              className="button button-primary"
            >
              {saving
                ? "Saving..."
                : editingJob
                ? "Update job"
                : "Post job"}
            </button>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => {
                setShowForm(false);
                setEditingJob(null);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      {error && (
        <div className="data-error">{error}</div>
      )}
    </PlatformLayout>
  );
}
