import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { URL } from 'node:url';

const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const separatorIndex = trimmed.indexOf('=');
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value.replace(/^['"]|['"]$/g, '');
    }
  }
}

const port = Number(process.env.PORT || 3001);

const provider = process.env.AI_PROVIDER || 'openai';
const apiKey = (process.env.AI_API_KEY || '').trim();
const aiBaseUrl = (process.env.AI_BASE_URL || '').trim();
const defaultModel = process.env.AI_MODEL || 'gpt-4o-mini';
const apiTimeoutMs = Number(process.env.AI_TIMEOUT_MS || 30000);

const safeJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
  });
  res.end(JSON.stringify(payload));
};

const buildProviderEndpoint = () => {
  if (!aiBaseUrl) {
    return 'https://api.openai.com/v1/chat/completions';
  }

  const normalized = aiBaseUrl.replace(/\/+$|\s+/g, '');
  if (normalized.endsWith('/chat/completions')) {
    return normalized;
  }

  return `${normalized}/chat/completions`;
};

const buildGuidedFallback = ({ prompt, role, pageContext, profile, skillProgress, attempts, learningProgress }) => {
  const name = profile?.full_name || 'there';
  const context = pageContext || `${role || 'student'} workspace`;
  const gapSkill = [...(skillProgress || [])].sort((a, b) => (Number(a.current_score || 0) - Number(b.current_score || 0)))[0];
  const focusSkill = gapSkill?.skill_name || 'your next highest-priority skill';

  return {
    answer: `Hi ${name}. Based on your SkillTrack data in ${context}, the strongest next move is to focus on ${focusSkill}. Review the areas with the lowest scores first, then continue with the learning topics connected to those skills before applying to roles. This is a data-derived recommendation from the platform and not a claim that a real model produced the answer.`,
    suggestions: [
      'What should I learn next?',
      'Analyze my skill gaps',
      'Which jobs match my skills?',
    ],
    status: 'ready',
    provider: 'guided',
    role,
  };
};

const callOpenAI = async ({ prompt, role, pageContext, profile, skillProgress, attempts, learningProgress }) => {
  const completionUrl = buildProviderEndpoint();

  const response = await fetch(completionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: defaultModel,
      temperature: 0.4,
      messages: [
        {
          role: 'system',
          content: `You are SkillTrack AI, a career and learning copilot for a skills platform. Use the user's data only. Never invent jobs, skills, assessment scores, or candidate details. If details are missing, say so. Clearly distinguish facts from recommendations. Keep answers practical and concise. Role: ${role || 'student'}. Context: ${pageContext || 'SkillTrack platform'}.`,
        },
        {
          role: 'user',
          content: JSON.stringify({
            profile: profile || null,
            prompt,
            skillProgress: skillProgress || [],
            attempts: attempts || [],
            learningProgress: learningProgress || [],
          }, null, 2),
        },
      ],
    }),
    signal: AbortSignal.timeout(apiTimeoutMs),
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(payload || 'The real AI provider could not answer the request.');
  }

  const payload = await response.json();
  const message = payload.choices?.[0]?.message?.content || 'I could not generate a complete answer.';

  return {
    answer: message,
    suggestions: [
      'What should I learn next?',
      'Analyze my skill gaps',
      'Build me a learning plan',
    ],
    status: 'ready',
    provider: 'openai',
  };
};

const resolveAiResponse = async (body) => {
  const { prompt, role, pageContext, profile, skillProgress, attempts, learningProgress } = body || {};

  if (!apiKey || !aiBaseUrl) {
    return buildGuidedFallback({ prompt, role, pageContext, profile, skillProgress, attempts, learningProgress });
  }

  if (provider === 'openai') {
    return callOpenAI({ prompt, role, pageContext, profile, skillProgress, attempts, learningProgress });
  }

  return buildGuidedFallback({ prompt, role, pageContext, profile, skillProgress, attempts, learningProgress });
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'OPTIONS') {
    safeJson(res, 204, {});
    return;
  }

  if (url.pathname === '/api/health') {
    safeJson(res, 200, { ok: true });
    return;
  }

  if (url.pathname === '/api/ai/config') {
    const configured = Boolean(apiKey && aiBaseUrl);
    safeJson(res, 200, {
      configured,
      provider: configured ? provider : 'guided',
      mode: configured ? 'live' : 'guided',
      model: defaultModel,
    });
    return;
  }

  if (url.pathname === '/api/ai/chat' && req.method === 'POST') {
    try {
      const body = await new Promise((resolve, reject) => {
        let text = '';

        req.on('data', (chunk) => {
          text += chunk;
          if (text.length > 1_000_000) {
            reject(new Error('Request body too large.'));
            req.destroy();
          }
        });

        req.on('end', () => {
          try {
            const parsed = text ? JSON.parse(text) : {};
            resolve(parsed);
          } catch (error) {
            reject(new Error('Invalid JSON request body.'));
          }
        });

        req.on('error', reject);
      });

      if (!body || typeof body !== 'object') {
        safeJson(res, 400, { error: 'Request body must be valid JSON.' });
        return;
      }

      const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
      if (!prompt) {
        safeJson(res, 400, { error: 'A prompt is required.' });
        return;
      }

      const answer = await resolveAiResponse(body);
      safeJson(res, 200, answer);
    } catch (error) {
      safeJson(res, 500, {
        error: error.message || "SkillTrack AI couldn't complete that request.",
      });
    }
    return;
  }

  safeJson(res, 404, { error: 'Not found.' });
});

server.listen(port, () => {
  console.log(`SkillTrack AI backend listening on http://localhost:${port}`);
});
