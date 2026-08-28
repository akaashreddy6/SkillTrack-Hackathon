import { supabase } from "../lib/supabaseClient";

function requireClient() {
  if (!supabase) {
    throw new Error("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to frontend/.env.local.");
  }
  return supabase;
}

export function calculateProfileCompletion(profile = {}) {
  const fields = ["full_name", "phone", "location", "education", "career_goal", "bio"];
  const completed = fields.filter((field) => String(profile[field] || "").trim()).length;
  return Math.round((completed / fields.length) * 100);
}

export async function getCurrentProfile(userId) {
  const client = requireClient();
  const { data: authData } = await client.auth.getUser();
  const id = userId || authData.user?.id;
  if (!id) return null;
  const { data, error } = await client.from("profiles").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Unable to load your profile: ${error.message}`);
  return data;
}

export async function updateProfile(userId, values) {
  const client = requireClient();
  if (!userId) throw new Error("Unable to update your profile: no authenticated user was found.");
  const profile = { ...values, profile_completion: calculateProfileCompletion(values), updated_at: new Date().toISOString() };
  const { data, error } = await client.from("profiles").update(profile).eq("id", userId).select().maybeSingle();
  if (error) throw new Error(`Unable to update your profile: ${error.message}`);
  if (!data) throw new Error("Unable to update your profile: no profile record exists for this account.");
  return data;
}
