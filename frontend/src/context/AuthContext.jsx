import { createContext, useContext, useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async (currentUser = user) => {
    if (!supabase || !currentUser) return null;
    const { data, error } = await supabase.from("profiles").select("*").eq("id", currentUser.id).single();
    if (error && error.code !== "PGRST116") throw error;
    setProfile(data || null);
    return data || null;
  };

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return undefined;
    }
    let mounted = true;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      setUser(session?.user || null);
      if (session?.user) await refreshProfile(session.user).catch(() => undefined);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user || null);
      if (session?.user) await refreshProfile(session.user).catch(() => undefined);
      else setProfile(null);
      setLoading(false);
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  const signIn = async (email, password) => {
    if (!isSupabaseConfigured) throw new Error("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to frontend/.env.local.");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signUp = async ({ fullName, email, password }) => {
    if (!isSupabaseConfigured) throw new Error("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to frontend/.env.local.");
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
    if (error) throw error;
    if (data.user && data.session) await refreshProfile(data.user);
    return data;
  };

  const signOut = () => (supabase ? supabase.auth.signOut() : Promise.resolve());
  return <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, refreshProfile, isConfigured: isSupabaseConfigured }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
