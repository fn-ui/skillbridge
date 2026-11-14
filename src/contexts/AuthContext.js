"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { supabase } from "@/lib/supabase/client";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState("");

  // Prevent older profile requests from overwriting newer authentication state.
  const requestVersion = useRef(0);

  async function syncUser(session) {
    const version = ++requestVersion.current;
    const currentUser = session?.user ?? null;

    setUser(currentUser);
    setProfile(null);
    setProfileError("");

    if (!currentUser) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const { data: userProfile, error } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, role, bio, location, profile_image")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      // Ignore a response if another login/logout event happened meanwhile.
      if (version !== requestVersion.current) return;

      if (error) {
        console.error("Error loading profile:", error.message);
        setProfileError("We couldn't load your profile. Please try again.");
        return;
      }

      if (!userProfile) {
        console.error("No profile record found for:", currentUser.id);
        setProfileError(
          "Your account exists, but your SkillBridge profile could not be found."
        );
        return;
      }

      setProfile(userProfile);
    } catch (error) {
      if (version !== requestVersion.current) return;

      console.error("Authentication loading error:", error);
      setProfileError("Something went wrong while loading your profile.");
    } finally {
      if (version === requestVersion.current) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Defer the profile query until the Supabase auth callback has returned.
      Promise.resolve().then(() => {
        if (mounted) {
          syncUser(session);
        }
      });
    });

    async function initializeAuth() {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error("Error restoring session:", error.message);
          setProfileError("We couldn't restore your session. Please log in again.");
          setLoading(false);
          return;
        }

        await syncUser(session);
      } catch (error) {
        if (!mounted) return;

        console.error("Session initialization error:", error);
        setProfileError("Something went wrong while restoring your session.");
        setLoading(false);
      }
    }

    initializeAuth();

    return () => {
      mounted = false;
      requestVersion.current += 1;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        profileError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}