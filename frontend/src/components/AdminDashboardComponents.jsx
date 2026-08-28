import { ProgressBar, StatCard } from "./Platform";

export function GovernmentOverview({
  totalStudents,
  totalEmployers,
  totalJobs,
  activeJobs,
  totalApplications,
  selectedCount,
}) {
  return (
    <section className="overview-grid admin-kpis">
      <StatCard
        label="Total students"
        value={totalStudents}
        detail="Registered learners"
      />
      <StatCard
        label="Total employers"
        value={totalEmployers}
        detail="Active hiring partners"
      />
      <StatCard
        label="Total jobs"
        value={totalJobs}
        detail="Posted opportunities"
        tone="green"
      />
      <StatCard
        label="Active jobs"
        value={activeJobs}
        detail="Open positions"
        tone="green"
      />
      <StatCard
        label="Total applications"
        value={totalApplications}
        detail="Candidate submissions"
        tone="orange"
      />
      <StatCard
        label="Selected candidates"
        value={selectedCount}
        detail="Employment offers"
        tone="green"
      />
    </section>
  );
}

export function EmploymentPipeline({
  totalApplications,
  statusCounts,
}) {
  const appPercentage = (count) =>
    totalApplications > 0
      ? Math.round((count / totalApplications) * 100)
      : 0;

  return (
    <section className="panel employment-pipeline">
      <div className="panel-header">
        <div>
          <p className="eyebrow">EMPLOYMENT PIPELINE</p>
          <h2>Application flow & outcomes</h2>
        </div>
        <span>{totalApplications} total</span>
      </div>
      {totalApplications > 0 ? (
        <div className="pipeline-visualization">
          {[
            ["Applied", statusCounts.applied, "blue"],
            [
              "Shortlisted",
              statusCounts.shortlisted,
              "navy",
            ],
            ["Interview", statusCounts.interview, "orange"],
            ["Selected", statusCounts.selected, "green"],
            ["Rejected", statusCounts.rejected, "red"],
          ].map(([status, count, tone]) => (
            <div
              key={status}
              className="pipeline-stage"
            >
              <div
                className={`stage-bar ${tone}`}
                style={{
                  height: `${Math.max(
                    (count / totalApplications) *
                      200,
                    20
                  )}px`,
                }}
              />
              <div className="stage-label">
                <strong>{status}</strong>
                <span>
                  {count} ({appPercentage(count)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          No applications recorded yet.
        </div>
      )}
    </section>
  );
}

export function SkillGapIntelligence({
  topSkillGaps,
}) {
  return (
    <section className="panel skill-gaps-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">SKILL GAP INTELLIGENCE</p>
          <h2>Priority areas for support</h2>
        </div>
        <span>
          {topSkillGaps.length} skills tracked
        </span>
      </div>
      {topSkillGaps.length > 0 ? (
        <div className="skill-gap-list">
          {topSkillGaps.map((skill) => (
            <div
              key={skill.name}
              className="skill-gap-item"
            >
              <div className="gap-summary">
                <strong>{skill.name}</strong>
                <span className="gap-value">
                  {skill.avgGap} point gap
                </span>
              </div>
              <div className="gap-metrics">
                <div className="metric">
                  <small>Avg current</small>
                  <span>{skill.avgCurrent}%</span>
                </div>
                <div className="metric">
                  <small>Target</small>
                  <span>{skill.avgTarget}%</span>
                </div>
                <div className="metric">
                  <small>Learners</small>
                  <span>{skill.count}</span>
                </div>
              </div>
              <ProgressBar
                value={Math.round(
                  (skill.avgCurrent /
                    skill.avgTarget) *
                    100
                )}
                tone={
                  skill.avgGap > 40
                    ? "orange"
                    : "blue"
                }
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          No skill progress data recorded yet.
        </div>
      )}
    </section>
  );
}

export function SkillDemandAnalysis({
  topSkillDemand,
}) {
  return (
    <section className="panel skill-demand-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">SKILL DEMAND ANALYSIS</p>
          <h2>Most required skills in jobs</h2>
        </div>
        <span>
          {topSkillDemand.length} skills in demand
        </span>
      </div>
      {topSkillDemand.length > 0 ? (
        <div className="skill-demand-list">
          {topSkillDemand.map((skill) => (
            <div
              key={skill.name}
              className="skill-demand-item"
            >
              <div className="demand-summary">
                <strong>{skill.name}</strong>
                <span className="demand-value">
                  {skill.jobCount} jobs require
                </span>
              </div>
              <div className="demand-metrics">
                <div className="metric">
                  <small>Min score avg</small>
                  <span>{skill.minScoreAvg}%</span>
                </div>
              </div>
              <ProgressBar
                value={Math.min(
                  skill.jobCount * 15,
                  100
                )}
                tone="green"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          No job skill data recorded yet.
        </div>
      )}
    </section>
  );
}

export function WorkforceReadiness({
  totalStudents,
  avgTechnicalScore,
  avgAssessmentScore,
  avgProfileCompletion,
  assessmentParticipation,
  skillProgressParticipation,
}) {
  return (
    <section className="panel readiness-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">WORKFORCE READINESS</p>
          <h2>Overall student capabilities</h2>
        </div>
        <span>{totalStudents} students assessed</span>
      </div>
      {totalStudents > 0 ? (
        <div className="readiness-metrics">
          <div className="readiness-item">
            <span className="readiness-label">
              Technical Skills Score
            </span>
            <strong>{avgTechnicalScore}%</strong>
            <ProgressBar
              value={avgTechnicalScore}
              tone={
                avgTechnicalScore >= 70
                  ? "green"
                  : avgTechnicalScore >= 50
                  ? "orange"
                  : "red"
              }
            />
          </div>
          <div className="readiness-item">
            <span className="readiness-label">
              Assessment Performance
            </span>
            <strong>{avgAssessmentScore}%</strong>
            <ProgressBar
              value={avgAssessmentScore}
              tone={
                avgAssessmentScore >= 70
                  ? "green"
                  : avgAssessmentScore >= 50
                  ? "orange"
                  : "red"
              }
            />
          </div>
          <div className="readiness-item">
            <span className="readiness-label">
              Profile Completion
            </span>
            <strong>{avgProfileCompletion}%</strong>
            <ProgressBar
              value={avgProfileCompletion}
              tone={
                avgProfileCompletion >= 70
                  ? "green"
                  : "orange"
              }
            />
          </div>
          <div className="readiness-item">
            <span className="readiness-label">
              Assessment Participation
            </span>
            <strong>{assessmentParticipation}%</strong>
            <ProgressBar
              value={assessmentParticipation}
              tone="blue"
            />
          </div>
          <div className="readiness-item">
            <span className="readiness-label">
              Skill Development Tracking
            </span>
            <strong>
              {skillProgressParticipation}%
            </strong>
            <ProgressBar
              value={skillProgressParticipation}
              tone="blue"
            />
          </div>
        </div>
      ) : (
        <div className="empty-state">
          No student data recorded yet.
        </div>
      )}
    </section>
  );
}

export function LearningImpact({
  totalStudents,
  assessmentCount,
  uniqueTestTakers,
  avgAssessmentScore,
  uniqueProgressTrackers,
}) {
  return (
    <section className="panel learning-impact">
      <div className="panel-header">
        <div>
          <p className="eyebrow">LEARNING IMPACT</p>
          <h2>Engagement & progress</h2>
        </div>
      </div>
      {assessmentCount > 0 ? (
        <div className="impact-metrics">
          <div className="impact-item">
            <span>Assessments completed</span>
            <strong>{assessmentCount}</strong>
            <small>
              {totalStudents > 0
                ? Math.round(
                    (assessmentCount / totalStudents) *
                      10
                  )
                : 0}{" "}
              per student avg
            </small>
          </div>
          <div className="impact-item">
            <span>Unique test takers</span>
            <strong>{uniqueTestTakers}</strong>
            <small>
              {totalStudents > 0
                ? Math.round(
                    (uniqueTestTakers / totalStudents) *
                      100
                  )
                : 0}
              % participation
            </small>
          </div>
          <div className="impact-item">
            <span>Avg assessment score</span>
            <strong>{avgAssessmentScore}%</strong>
            <small>
              Based on {assessmentCount} attempts
            </small>
          </div>
          <div className="impact-item">
            <span>Students tracking progress</span>
            <strong>{uniqueProgressTrackers}</strong>
            <small>
              {totalStudents > 0
                ? Math.round(
                    (uniqueProgressTrackers /
                      totalStudents) *
                      100
                  )
                : 0}
              % monitoring progress
            </small>
          </div>
        </div>
      ) : (
        <div className="empty-state">
          No assessment data recorded yet.
        </div>
      )}
    </section>
  );
}
