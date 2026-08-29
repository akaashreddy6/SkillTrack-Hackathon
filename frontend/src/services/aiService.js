const AI_CONFIG_KEY = "__SKILLTRACK_AI_CONFIG__";

const normalizeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const summarizeSkillProgress = (skillProgress = []) => {
  if (!skillProgress.length) return "No skill assessment data is available yet.";

  const sorted = [...skillProgress].sort(
    (first, second) => Number(second.current_score || 0) - Number(first.current_score || 0)
  );
  const strongest = sorted[0];
  const weakest = [...skillProgress].sort(
    (first, second) => Number(first.current_score || 0) - Number(second.current_score || 0)
  )[0];

  return `${strongest?.skills?.name || "Your strongest area"} is your leading skill at ${strongest?.current_score ?? 0}%, while ${weakest?.skills?.name || "your weakest area"} is currently ${weakest?.current_score ?? 0}% and needs the next learning push.`;
};

const summarizeAttempts = (attempts = []) => {
  if (!attempts.length) return "No assessment attempts have been recorded yet.";

  const average = Math.round(
    attempts.reduce((total, item) => total + normalizeNumber(item.percentage, 0), 0) / attempts.length
  );

  const newest = attempts[0];

  return `Your latest assessment performance is ${newest?.percentage ?? 0}% and the average across recent attempts is ${average}%.`;
};

const summarizeLearning = (learningProgress = []) => {
  if (!learningProgress.length) return "There is no saved learning progress yet.";

  const inProgress = learningProgress.filter((item) => item.status === "In progress").length;
  const completed = learningProgress.filter((item) => item.status === "Completed").length;

  return `${completed} topics completed and ${inProgress} topics still active, which gives you a clear momentum signal.`;
};

const detectWeakSkill = (skillProgress = []) => {
  const weak = [...skillProgress].sort(
    (first, second) => Number(first.current_score || 0) - Number(second.current_score || 0)
  )[0];
  return weak ? weak.skills?.name || "your weakest skill" : "your next priority skill";
};

const getRoleContext = (role, pageContext) => {
  if (role === "employer") {
    return pageContext || "employer hiring pipeline";
  }

  if (role === "admin") {
    return pageContext || "workforce analytics overview";
  }

  return pageContext || "student learning and career dashboard";
};

const sanitizeProfile = (profile) => {
  if (!profile) return null;
  return {
    id: profile.id,
    full_name: profile.full_name || null,
    email: profile.email || null,
    role: profile.role || null,
    profile_completion: profile.profile_completion ?? null,
    career_goal: profile.career_goal || null,
    location: profile.location || null,
  };
};

const sanitizeSkillProgress = (skillProgress = []) =>
  skillProgress.slice(0, 12).map((item) => ({
    skill_id: item.skill_id || item.skills?.id || null,
    skill_name: item.skills?.name || null,
    current_score: Number(item.current_score ?? 0),
    target_score: Number(item.target_score ?? 0),
    gap_percentage: Number(item.gap_percentage ?? 0),
    last_assessed_at: item.last_assessed_at || null,
  }));

const sanitizeAttempts = (attempts = []) =>
  attempts.slice(0, 10).map((item) => ({
    attempt_id: item.id,
    assessment_title: item.assessments?.title || null,
    skill_name: item.assessments?.skills?.name || null,
    percentage: Number(item.percentage ?? 0),
    performance_level: item.performance_level || null,
    completed_at: item.completed_at || null,
  }));

const sanitizeLearning = (learningProgress = []) =>
  learningProgress.slice(0, 12).map((item) => ({
    learning_topic_id: item.learning_topic_id || item.learning_topics?.id || null,
    topic: item.learning_topics?.topic || item.topic || null,
    skill_id: item.learning_topics?.skill_id || null,
    progress: Number(item.progress ?? 0),
    status: item.status || "Not started",
    updated_at: item.updated_at || null,
  }));

export const setAiConfig = (config) => {
  if (typeof window !== "undefined") {
    window[AI_CONFIG_KEY] = config;
  }

  return config;
};

export const getAiStatus = async () => {
  try {
    const response = await fetch("/api/ai/config", { headers: { Accept: "application/json" } });
    if (!response.ok) {
      const fallback = { configured: false, provider: "guided", mode: "guided" };
      setAiConfig(fallback);
      return fallback;
    }

    const payload = await response.json();
    const finalConfig = {
      configured: Boolean(payload?.configured),
      provider: payload?.provider || "guided",
      mode: payload?.mode || (payload?.configured ? "live" : "guided"),
      model: payload?.model || null,
    };

    setAiConfig(finalConfig);
    return finalConfig;
  } catch (error) {
    const fallback = { configured: false, provider: "guided", mode: "guided" };
    setAiConfig(fallback);
    return fallback;
  }
};

export const isAiConfigured = () => {
  if (typeof window === "undefined") return false;
  return Boolean(window[AI_CONFIG_KEY]?.configured);
};

export async function generateSkilltrackInsight({
  role = "student",
  profile,
  prompt,
  skillProgress = [],
  attempts = [],
  learningProgress = [],
  pageContext = "",
}) {
  const normalizedPrompt = String(prompt || "").trim();
  const roleContext = getRoleContext(role, pageContext);
  const status = isAiConfigured() ? { configured: true } : await getAiStatus();

  if (!status.configured) {
    const normalizedLower = normalizedPrompt.toLowerCase();
    const userName = profile?.full_name || "there";
    const skillSummary = summarizeSkillProgress(skillProgress);
    const assessmentSummary = summarizeAttempts(attempts);
    const learningSummary = summarizeLearning(learningProgress);
    const weakestSkill = detectWeakSkill(skillProgress);

    if (!normalizedLower) {
      return {
        answer: `Hi ${userName}. I can help you plan your next move in ${roleContext}, explain your current skill gaps, and suggest a role-aware next step using your live SkillTrack data. Guided Insight Mode is active, which means this recommendation is data-driven and not generated by a real AI model.`,
        suggestions: [
          "What should I learn next?",
          "Analyze my skill gaps",
          "Which jobs match my skills?",
        ],
        status: "ready",
        provider: "guided",
      };
    }

    if (
      normalizedLower.includes("learn next") ||
      normalizedLower.includes("learning plan") ||
      normalizedLower.includes("plan") ||
      normalizedLower.includes("practice")
    ) {
      return {
        answer: `${userName}, the clearest next move in ${roleContext} is to focus on ${weakestSkill}. ${skillSummary} ${assessmentSummary} ${learningSummary} Prioritize a short, measurable practice cycle on that gap, then reassess before moving on to the next topic. This is Guided Insight Mode based on your live SkillTrack data, not a real AI-generated answer.`,
        suggestions: [
          "Explain my weakest skill",
          "Create a learning plan",
          "Which jobs match my skills?",
        ],
        status: "ready",
        provider: "guided",
      };
    }

    if (
      normalizedLower.includes("gap") ||
      normalizedLower.includes("weak") ||
      normalizedLower.includes("explain") ||
      normalizedLower.includes("resume") ||
      normalizedLower.includes("interview")
    ) {
      return {
        answer: `The clearest skill gap is ${weakestSkill}. ${skillSummary} ${assessmentSummary} This usually indicates the topic is still important for role readiness, but your current score is below the target threshold. Keep the learning cycle tight: review the concept, complete a focused practice set, rehearse the explanation, and retest before moving on. This is Guided Insight Mode based on your live SkillTrack data, not a real AI-generated answer.`,
        suggestions: [
          "What should I learn next?",
          "Build me a learning plan",
          "How should I improve my resume?",
        ],
        status: "ready",
        provider: "guided",
      };
    }

    if (
      normalizedLower.includes("job") ||
      normalizedLower.includes("career") ||
      normalizedLower.includes("ready") ||
      normalizedLower.includes("match")
    ) {
      return {
        answer: `Based on your current evidence, the best next move is to align your strongest skills with the roles closest to your current capability. ${skillSummary} ${assessmentSummary} Focus on the skills nearest the target threshold, then match those strengths to roles that value them most. This is Guided Insight Mode based on your live SkillTrack data, not a real AI-generated answer.`,
        suggestions: [
          "Which jobs match my skills?",
          "Am I improving?",
          "What should I learn next?",
        ],
        status: "ready",
        provider: "guided",
      };
    }

    if (role === "employer") {
      return {
        answer: `For your hiring workflow, the highest-value move is to compare candidate evidence against the job requirement thresholds and shortlist the strongest alignment first. Review the shared patterns, filter for evidence beyond the minimums, and then evaluate the remaining gaps. This is Guided Insight Mode based on your live SkillTrack data, not a real AI-generated answer.`,
        suggestions: [
          "Find the strongest candidates for this role",
          "Compare applicants for this job",
          "What skills are missing?",
        ],
        status: "ready",
        provider: "guided",
      };
    }

    if (role === "admin") {
      return {
        answer: `From a workforce perspective, the right next move is to prioritize skills showing the widest gap between current readiness and target demand. ${skillSummary} ${assessmentSummary} ${learningSummary} Use the same evidence to identify which programmes or job categories need the most support and where readiness is improving fastest. This is Guided Insight Mode based on your live SkillTrack data, not a real AI-generated answer.`,
        suggestions: [
          "Where are the biggest workforce gaps?",
          "Which skills are in demand?",
          "How ready is the workforce?",
        ],
        status: "ready",
        provider: "guided",
      };
    }

    return {
      answer: `Here is the recommended next step in ${roleContext}: focus on ${weakestSkill} and keep the learning loop short and measurable. ${skillSummary} ${assessmentSummary} ${learningSummary} Use this insight to choose the next topic, complete targeted practice, and confirm the improvement before moving on. This is Guided Insight Mode based on your live SkillTrack data, not a real AI-generated answer.`,
      suggestions: [
        "What should I learn next?",
        "Analyze my skill gaps",
        "Which jobs match my skills?",
      ],
      status: "ready",
      provider: "guided",
    };
  }

  const response = await fetch("/api/ai/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      role,
      profile: sanitizeProfile(profile),
      prompt: normalizedPrompt,
      skillProgress: sanitizeSkillProgress(skillProgress),
      attempts: sanitizeAttempts(attempts),
      learningProgress: sanitizeLearning(learningProgress),
      pageContext: pageContext || roleContext,
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.error || "SkillTrack AI is temporarily unavailable.");
  }

  const payload = await response.json();

  return {
    answer: payload.answer || "I couldn't generate a complete answer for that request.",
    suggestions: payload.suggestions || [],
    status: payload.status || "ready",
    provider: payload.provider || "live",
  };
}
