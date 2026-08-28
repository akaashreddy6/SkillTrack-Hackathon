import { supabase } from "../lib/supabaseClient";

function requireClient() {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Add the required Vite environment variables."
    );
  }

  return supabase;
}

function jobDescription(job) {
  return [
    job.description?.trim(),
    job.responsibilities?.trim()
      ? `Responsibilities:\n${job.responsibilities.trim()}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

async function read(query) {
  const { data, error } = await query;

  if (error) throw error;

  return data || [];
}

export const getDashboardData = async (userId) => {
  const client = requireClient();

  const profileQuery = client
    .from("profiles")
    .select(
      "id, full_name, email, role, profile_completion"
    )
    .eq("id", userId)
    .maybeSingle();

  const [profileResult, progress, attempts, applications] =
    await Promise.all([
      profileQuery,

      read(
        client
          .from("skill_progress")
          .select(
            "id, user_id, skill_id, current_score, target_score, gap_percentage, last_assessed_at, updated_at, skills(id, name, category)"
          )
          .eq("user_id", userId)
          .order("last_assessed_at", {
            ascending: false,
            nullsFirst: false,
          })
      ),

      read(
        client
          .from("assessment_attempts")
          .select("*, assessments(title, skill_id, skills(name))")
          .eq("user_id", userId)
          .order("completed_at", { ascending: false })
          .limit(5)
      ),

      read(
        client
          .from("applications")
          .select("*, jobs(title, company_name)")
          .eq("user_id", userId)
          .order("updated_at", { ascending: false })
      ),
    ]);

  if (profileResult.error) throw profileResult.error;

  return {
    profile: profileResult.data || null,
    progress,
    attempts,
    applications,
  };
};

export const getJobs = async () =>
  read(
    requireClient()
      .from("jobs")
      .select(
        "*, job_skills(skill_id, minimum_score, skills(id, name))"
      )
      .eq("status", "Active")
      .order("created_at", { ascending: false })
  );

export const getJobById = async (jobId) => {
  const { data, error } = await requireClient()
    .from("jobs")
    .select(
      "*, job_skills(skill_id, minimum_score, skills(id, name))"
    )
    .eq("id", jobId)
    .maybeSingle();

  if (error) throw error;

  if (!data) throw new Error("Job not found.");

  return data;
};

export const getJobMatches = async (userId) => {
  const [jobs, progress] = await Promise.all([
    getJobs(),

    read(
      requireClient()
        .from("skill_progress")
        .select(
          "skill_id, current_score, target_score, skills(id, name)"
        )
        .eq("user_id", userId)
    ),
  ]);

  const scores = Object.fromEntries(
    progress.map((item) => [
      String(item.skill_id),
      Number(item.current_score) || 0,
    ])
  );

  return jobs
    .map((job) => calculateJobMatch(job, scores))
    .sort((first, second) => second.match - first.match);
};

export const getCareerReadiness = async (userId) => {
  const client = requireClient();

  const [dashboard, jobs, learning] = await Promise.all([
    getDashboardData(userId),
    getJobMatches(userId),

    read(
      client
        .from("learning_progress")
        .select("progress, status, learning_topics(skill_id)")
        .eq("user_id", userId)
    ),
  ]);

  const technicalSkills = dashboard.progress.length
    ? Math.round(
        dashboard.progress.reduce(
          (total, item) =>
            total + Number(item.current_score || 0),
          0
        ) / dashboard.progress.length
      )
    : 0;

  const assessmentPerformance = dashboard.attempts.length
    ? Math.round(
        dashboard.attempts.reduce(
          (total, item) =>
            total + Number(item.percentage || 0),
          0
        ) / dashboard.attempts.length
      )
    : 0;

  const learningProgress = learning.length
    ? Math.round(
        learning.reduce(
          (total, item) =>
            total + Number(item.progress || 0),
          0
        ) / learning.length
      )
    : 0;

  const jobReadiness = jobs.length
    ? Math.round(
        jobs
          .slice(0, 3)
          .reduce(
            (total, job) => total + job.match,
            0
          ) / Math.min(jobs.length, 3)
      )
    : 0;

  const profileScore = Number(
    dashboard.profile?.profile_completion || 0
  );

  const dimensions = [
    {
      key: "technical",
      label: "Technical skills",
      score: technicalSkills,
    },
    {
      key: "profile",
      label: "Profile",
      score: profileScore,
    },
    {
      key: "assessment",
      label: "Assessment performance",
      score: assessmentPerformance,
    },
    {
      key: "learning",
      label: "Learning progress",
      score: learningProgress,
    },
    {
      key: "jobs",
      label: "Job readiness",
      score: jobReadiness,
    },
  ];

  const overall = Math.round(
    dimensions.reduce(
      (total, item) => total + item.score,
      0
    ) / dimensions.length
  );

  const level =
    overall >= 80
      ? "Career Ready"
      : overall >= 60
      ? "Nearly Ready"
      : overall >= 40
      ? "Developing"
      : "Early Stage";

  const gaps = dashboard.progress
    .filter((item) => item.gap_percentage > 0)
    .sort(
      (first, second) =>
        second.gap_percentage - first.gap_percentage
    );

  const nextAction =
    profileScore < 100
      ? "Complete your profile"
      : !dashboard.attempts.length
      ? "Take your first assessment"
      : gaps[0]?.gap_percentage >= 20
      ? `Improve ${
          gaps[0].skills?.name || "your highest skill gap"
        }`
      : learningProgress < 100
      ? "Continue your learning plan"
      : "Explore matching jobs";

  return {
    ...dashboard,
    jobs,
    learning,
    dimensions,
    overall,
    level,
    gaps,
    nextAction,
  };
};

export const calculateJobMatch = (job, scores) => {
  const requirements = job.job_skills || [];

  const details = requirements.map((requirement) => {
    const current =
      scores[String(requirement.skill_id)] ?? null;

    const minimum =
      Number(requirement.minimum_score) || 0;

    const ratio =
      current === null
        ? 0
        : Math.min(
            current / Math.max(minimum, 1),
            1
          ) * 100;

    return {
      ...requirement,
      current,
      match: Math.round(ratio),
      matched:
        current !== null && current >= minimum,
    };
  });

  const match = details.length
    ? Math.round(
        details.reduce(
          (total, item) => total + item.match,
          0
        ) / details.length
      )
    : 0;

  return {
    ...job,
    match,
    matchLabel:
      match >= 80
        ? "Excellent Match"
        : match >= 60
        ? "Good Match"
        : match >= 40
        ? "Partial Match"
        : "Low Match",
    matchedSkills: details.filter(
      (item) => item.matched
    ),
    missingSkills: details.filter(
      (item) => !item.matched
    ),
  };
};

export const getLearningResources = async () =>
  read(
    requireClient()
      .from("learning_resources")
      .select("*, skills(name)")
      .order("created_at", { ascending: false })
  );

const levelForScore = (score) =>
  score < 40
    ? "Critical Gap"
    : score < 60
    ? "Needs Improvement"
    : score < 80
    ? "Good"
    : "Strong";

const phasesForScore = (score) =>
  score < 40
    ? ["Fundamentals"]
    : score < 60
    ? ["Fundamentals", "Core Skills"]
    : score < 80
    ? [
        "Core Skills",
        "Advanced Skills",
        "Practical Projects",
      ]
    : ["Advanced Skills", "Practical Projects"];

export const getLearningPlan = async (
  userId,
  selectedSkillId
) => {
  const client = requireClient();

  const [progress, attempts] = await Promise.all([
    read(
      client
        .from("skill_progress")
        .select(
          "id, skill_id, current_score, target_score, gap_percentage, last_assessed_at, skills(id, name, category)"
        )
        .eq("user_id", userId)
        .order("gap_percentage", { ascending: false })
    ),

    read(
      client
        .from("assessment_attempts")
        .select(
          "id, assessment_id, completed_at, assessments(skill_id)"
        )
        .eq("user_id", userId)
        .order("completed_at", { ascending: false })
    ),
  ]);

  const chosenSkillId =
    selectedSkillId ||
    progress[0]?.skill_id ||
    attempts[0]?.assessments?.skill_id;

  if (!chosenSkillId) {
    return {
      progress,
      skill: null,
      topics: [],
      learningProgress: [],
      attempts,
    };
  }

  const skillProgress =
    progress.find(
      (item) =>
        String(item.skill_id) ===
        String(chosenSkillId)
    ) || null;

  const [
    topics,
    learningProgress,
    selectedAttempts,
  ] = await Promise.all([
    read(
      client
        .from("learning_topics")
        .select(
          "id, skill_id, topic, difficulty, estimated_minutes, phase"
        )
        .eq("skill_id", chosenSkillId)
        .order("created_at")
    ),

    read(
      client
        .from("learning_progress")
        .select(
          "id, learning_topic_id, progress, status, completed_at, updated_at"
        )
        .eq("user_id", userId)
    ),

    attempts
      .filter(
        (attempt) =>
          String(
            attempt.assessments?.skill_id
          ) === String(chosenSkillId)
      )
      .map((attempt) => attempt.id),
  ]);

  const weakCounts = {};

  if (selectedAttempts.length) {
    const answers = await read(
      client
        .from("assessment_answers")
        .select(
          "attempt_id, is_correct, questions(topic)"
        )
        .in("attempt_id", selectedAttempts)
    );

    answers
      .filter((answer) => !answer.is_correct)
      .forEach((answer) => {
        const topic = answer.questions?.topic;

        if (topic) {
          weakCounts[topic] =
            (weakCounts[topic] || 0) + 1;
        }
      });
  }

  const score = Number(
    skillProgress?.current_score || 0
  );

  const allowedPhases = phasesForScore(score);

  const topicProgress = Object.fromEntries(
    learningProgress.map((item) => [
      item.learning_topic_id,
      item,
    ])
  );

  const rankedTopics = topics
    .filter((topic) =>
      allowedPhases.includes(topic.phase)
    )
    .sort(
      (first, second) =>
        (weakCounts[second.topic] || 0) -
          (weakCounts[first.topic] || 0) ||
        first.topic.localeCompare(second.topic)
    )
    .map((topic, index) => ({
      ...topic,
      priority: index + 1,
      weakCount:
        weakCounts[topic.topic] || 0,
      recommendationReason:
        weakCounts[topic.topic]
          ? `${
              weakCounts[topic.topic]
            } missed question${
              weakCounts[topic.topic] === 1
                ? ""
                : "s"
            } in this topic.`
          : `Recommended for your ${levelForScore(
              score
            ).toLowerCase()} skill level.`,
      learningProgress:
        topicProgress[topic.id] || {
          progress: 0,
          status: "Not started",
        },
    }));

  return {
    progress,
    skill: skillProgress
      ? {
          ...skillProgress,
          level: levelForScore(score),
          assessmentId: selectedAttempts[0]
            ? attempts.find(
                (attempt) =>
                  attempt.id === selectedAttempts[0]
              )?.assessment_id
            : null,
        }
      : null,
    topics: rankedTopics,
    learningProgress,
    attempts,
  };
};

export const updateLearningProgress = async ({
  userId,
  learningTopicId,
  progress,
  status,
}) => {
  const completed =
    status === "Completed" || progress >= 100;

  const values = {
    user_id: userId,
    learning_topic_id: learningTopicId,
    progress: completed
      ? 100
      : Math.max(
          0,
          Math.min(99, progress)
        ),
    status: completed
      ? "Completed"
      : status || "In progress",
    completed_at: completed
      ? new Date().toISOString()
      : null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await requireClient()
    .from("learning_progress")
    .upsert(values, {
      onConflict:
        "user_id,learning_topic_id",
    })
    .select()
    .single();

  if (error) throw error;

  return data;
};

export const getAssessments = async () =>
  read(
    requireClient()
      .from("assessments")
      .select("*, skills(name)")
      .order("created_at")
  );

export const getAssessmentAttempts = async (
  userId
) =>
  read(
    requireClient()
      .from("assessment_attempts")
      .select(
        "*, assessments(title, skills(name))"
      )
      .eq("user_id", userId)
      .order("completed_at", {
        ascending: false,
      })
  );

export const getCertifications = async (
  userId
) =>
  read(
    requireClient()
      .from("certifications")
      .select("*, skills(name)")
      .eq("user_id", userId)
      .order("issued_at", {
        ascending: false,
      })
  );

export const getApplications = async (
  userId
) =>
  read(
    requireClient()
      .from("applications")
      .select(
        "*, jobs(title, company_name, location, description, employment_type, salary_range, job_skills(skill_id, minimum_score, skills(id, name)))"
      )
      .eq("user_id", userId)
      .order("updated_at", {
        ascending: false,
      })
  );

export const updateProfile = async (
  userId,
  values
) => {
  const filled = [
    values.full_name,
    values.phone,
    values.location,
    values.education,
    values.career_goal,
    values.bio,
  ].filter((value) => value?.trim()).length;

  const { data, error } = await requireClient()
    .from("profiles")
    .update({
      ...values,
      profile_completion: Math.round(
        (filled / 6) * 100
      ),
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select()
    .single();

  if (error) throw error;

  return data;
};

export const applyToJob = async (
  jobId,
  userId
) => {
  const client = requireClient();

  const { data: existing } = await client
    .from("applications")
    .select("id")
    .eq("job_id", jobId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    throw new Error(
      "You have already applied to this job."
    );
  }

  const { data, error } = await client
    .from("applications")
    .insert({
      job_id: jobId,
      user_id: userId,
      status: "Applied",
    })
    .select()
    .single();

  if (error) throw error;

  return data;
};

export const getAssessment = async (
  assessmentId
) => {
  const client = requireClient();

  const {
    data: assessment,
    error,
  } = await client
    .from("assessments")
    .select(
      "*, skills(name, target_score)"
    )
    .eq("id", assessmentId)
    .maybeSingle();

  if (error) throw error;

  if (!assessment) {
    throw new Error("Assessment not found.");
  }

  const questions = await read(
    client
      .from("questions")
      .select(
        "id, question_text, option_a, option_b, option_c, option_d, topic, difficulty"
      )
      .eq("skill_id", assessment.skill_id)
      .order("id")
  );

  return {
    assessment,
    questions,
  };
};

export const getLatestAttempt = async (
  userId,
  assessmentId
) => {
  const { data, error } =
    await requireClient()
      .from("assessment_attempts")
      .select(
        "*, assessments(title, skills(name, target_score))"
      )
      .eq("user_id", userId)
      .eq("assessment_id", assessmentId)
      .order("completed_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

  if (error) throw error;

  return data;
};

export const getAdminData = async () => {
  const client = requireClient();

  const [
    profiles,
    attempts,
    progress,
    jobs,
    applications,
  ] = await Promise.all([
    read(
      client
        .from("profiles")
        .select("id, full_name, email, role, profile_completion, created_at")
    ),

    read(
      client
        .from("assessment_attempts")
        .select("id, percentage, performance_level, completed_at, assessments(title, skill_id, skills(name))")
    ),

    read(
      client
        .from("skill_progress")
        .select("user_id, current_score, target_score, gap_percentage, skills(id, name)")
    ),

    read(
      client
        .from("jobs")
        .select("id, title, company_name, location, employment_type, status, created_at, job_skills(skill_id, skills(name))")
    ),

    read(
      client
        .from("applications")
        .select("id, job_id, user_id, status, applied_at, jobs(title, company_name)")
    ),
  ]);

  return {
    profiles,
    attempts,
    progress,
    jobs,
    applications,
  };
};

/*
 * Employer dashboard data.
 *
 * IMPORTANT:
 * We intentionally DO NOT use:
 *
 * profiles(full_name, email)
 *
 * inside the applications query because the current
 * database does not expose an applications -> profiles
 * foreign-key relationship.
 *
 * Profiles are therefore loaded separately and joined
 * in JavaScript.
 */
export const getEmployerData = async (
  employerId
) => {
  const client = requireClient();

  const [employerResult, jobs, applications] =
    await Promise.all([
      client
        .from("profiles")
        .select("id, full_name, email, role, location, career_goal, bio")
        .eq("id", employerId)
        .maybeSingle(),

      read(
        client
          .from("jobs")
          .select(
            "*, job_skills(skill_id, minimum_score, skills(id, name))"
          )
          .eq("employer_id", employerId)
          .order("created_at", {
            ascending: false,
          })
      ),

      read(
        client
          .from("applications")
          .select(
            "*, jobs!inner(title, company_name, job_skills(skill_id, minimum_score, skills(id, name)))"
          )
          .eq("jobs.employer_id", employerId)
          .order("updated_at", {
            ascending: false,
          })
      ),
    ]);

  if (employerResult.error) throw employerResult.error;

  const candidateIds = [
    ...new Set(
      applications
        .map(
          (application) =>
            application.user_id
        )
        .filter(Boolean)
    ),
  ];

  const profiles = candidateIds.length
    ? await read(
        client
          .from("profiles")
          .select(
            "id, full_name, email"
          )
          .in("id", candidateIds)
      )
    : [];

  const profileByUser =
    Object.fromEntries(
      profiles.map((profile) => [
        profile.id,
        profile,
      ])
    );

  const progress = candidateIds.length
    ? await read(
        client
          .from("skill_progress")
          .select(
            "user_id, skill_id, current_score, skills(id, name)"
          )
          .in("user_id", candidateIds)
      )
    : [];

  const progressByUser =
    progress.reduce(
      (groups, item) => {
        if (!groups[item.user_id]) {
          groups[item.user_id] = [];
        }

        groups[item.user_id].push(item);

        return groups;
      },
      {}
    );

  const enrichedApplications =
    applications.map((application) => {
      const candidateProgress =
        progressByUser[
          application.user_id
        ] || [];

      const scores =
        Object.fromEntries(
          candidateProgress.map(
            (item) => [
              String(item.skill_id),
              Number(
                item.current_score
              ) || 0,
            ]
          )
        );

      return {
        ...application,
        profiles:
          profileByUser[
            application.user_id
          ] || null,
        match: calculateJobMatch(
          application.jobs,
          scores
        ),
      };
    });

  return {
    employer: employerResult.data || null,
    jobs,
    applications:
      enrichedApplications,
    candidateProgress: progressByUser,
  };
};

export const getSkills = async () =>
  read(
    requireClient()
      .from("skills")
      .select(
        "id, name, category"
      )
      .order("name")
  );

export const getProjects = async (
  userId
) =>
  read(
    requireClient()
      .from("projects")
      .select(
        "*, project_skills(skill_id, skills(id, name))"
      )
      .eq("user_id", userId)
      .order("featured", {
        ascending: false,
      })
      .order("created_at", {
        ascending: false,
      })
  );

export const saveProject = async ({
  userId,
  project,
  skillIds,
}) => {
  const client = requireClient();

  const values = {
    ...project,
    user_id: userId,
    updated_at:
      new Date().toISOString(),
  };

  const { data, error } =
    project.id
      ? await client
          .from("projects")
          .update(values)
          .eq("id", project.id)
          .eq("user_id", userId)
          .select()
          .single()
      : await client
          .from("projects")
          .insert(values)
          .select()
          .single();

  if (error) throw error;

  const {
    error: removeError,
  } = await client
    .from("project_skills")
    .delete()
    .eq("project_id", data.id);

  if (removeError) {
    throw removeError;
  }

  if (skillIds.length) {
    const {
      error: skillError,
    } = await client
      .from("project_skills")
      .insert(
        skillIds.map((skillId) => ({
          project_id: data.id,
          skill_id: skillId,
        }))
      );

    if (skillError) {
      throw skillError;
    }
  }

  return data;
};

export const deleteProject = async (
  projectId,
  userId
) => {
  const { error } =
    await requireClient()
      .from("projects")
      .delete()
      .eq("id", projectId)
      .eq("user_id", userId);

  if (error) throw error;
};

export const createEmployerJob = async ({
  employerId,
  job,
  skillIds,
}) => {
  const client = requireClient();
  const jobValues = {
    title: job.title,
    company_name: job.company_name,
    location: job.location,
    employment_type: job.employment_type,
    salary_range: job.salary_range,
    description: jobDescription(job),
    status: job.status,
    employer_id: employerId,
  };

  const { data, error } =
    await client
      .from("jobs")
      .insert(jobValues)
      .select()
      .single();

  if (error) throw error;

  if (skillIds.length) {
    const {
      error: skillError,
    } = await client
      .from("job_skills")
      .insert(
        skillIds.map((skill) => ({
          job_id: data.id,
          skill_id: skill.id,
          minimum_score:
            skill.minimum_score || 60,
        }))
      );

    if (skillError) {
      throw skillError;
    }
  }

  return data;
};

export const updateEmployerJob = async ({
  employerId,
  job,
  skillIds,
}) => {
  const client = requireClient();
  const jobValues = {
    title: job.title,
    company_name: job.company_name,
    location: job.location,
    employment_type: job.employment_type,
    salary_range: job.salary_range,
    description: jobDescription(job),
    status: job.status,
  };

  const { data, error } =
    await client
      .from("jobs")
      .update(jobValues)
      .eq("id", job.id)
      .eq("employer_id", employerId)
      .select()
      .single();

  if (error) throw error;

  const {
    error: deleteError,
  } = await client
    .from("job_skills")
    .delete()
    .eq("job_id", job.id);

  if (deleteError) {
    throw deleteError;
  }

  if (skillIds.length) {
    const {
      error: skillError,
    } = await client
      .from("job_skills")
      .insert(
        skillIds.map((skill) => ({
          job_id: data.id,
          skill_id: skill.id,
          minimum_score:
            skill.minimum_score || 60,
        }))
      );

    if (skillError) {
      throw skillError;
    }
  }

  return data;
};

export const closeEmployerJob = async (
  jobId,
  employerId
) => {
  const { error } =
    await requireClient()
      .from("jobs")
      .update({
        status: "Closed",
      })
      .eq("id", jobId)
      .eq("employer_id", employerId);

  if (error) throw error;
};

/*
 * Update application status only when the
 * application belongs to a job owned by this employer.
 */
export const updateApplicationStatus = async (
  applicationId,
  employerId,
  status
) => {
  const client = requireClient();

  const allowedStatuses = [
    "Applied",
    "Under Review",
    "Shortlisted",
    "Interview",
    "Selected",
    "Rejected",
  ];

  if (!allowedStatuses.includes(status)) {
    throw new Error(
      "Invalid application status."
    );
  }

  const { data: application, error: applicationError } =
    await client
      .from("applications")
      .select("id, status, jobs!inner(employer_id)")
      .eq("id", applicationId)
      .eq(
        "jobs.employer_id",
        employerId
      )
      .maybeSingle();

  if (applicationError) {
    throw applicationError;
  }

  if (!application) {
    throw new Error(
      "You are not authorized to update this application."
    );
  }

  const nextStatuses = {
    Applied: ["Under Review", "Rejected"],
    "Under Review": ["Shortlisted", "Rejected"],
    Shortlisted: ["Interview", "Rejected"],
    Interview: ["Selected", "Rejected"],
    Selected: [],
    Rejected: [],
  };

  if (application.status !== status && !nextStatuses[application.status]?.includes(status)) {
    throw new Error(`Cannot move an application from ${application.status} to ${status}.`);
  }

  const { data, error } =
    await client
      .from("applications")
      .update({
        status,
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", applicationId)
      .select()
      .single();

  if (error) throw error;

  return data;
};

export const submitAssessment = async ({
  assessmentId,
  answers,
  startedAt,
}) => {
  const { data, error } =
    await requireClient().rpc(
      "submit_assessment",
      {
        p_assessment_id:
          assessmentId,
        p_answers: answers,
        p_started_at: startedAt,
      }
    );

  if (error) throw error;

  return data;
};