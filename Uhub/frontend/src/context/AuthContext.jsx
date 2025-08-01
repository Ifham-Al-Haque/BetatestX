import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "../supabaseClient";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  // Cache for user profiles to avoid repeated database calls
  const [profileCache, setProfileCache] = useState(new Map());

  const getUserProfile = useCallback(async (userId) => {
    try {
      // Check cache first
      if (profileCache.has(userId)) {
        console.log("Using cached profile for user ID:", userId);
        return profileCache.get(userId);
      }

      console.log("Fetching profile for user ID:", userId);
      
      // First, let's check if the user exists in the employees table
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("id", userId)
        .maybeSingle(); // Use maybeSingle instead of single to avoid errors if no record found

      if (error) {
        console.error("Supabase error fetching user profile:", error);
        throw error;
      }
      
      console.log("Profile data retrieved:", data);
      
      // Cache the result
      setProfileCache(prev => new Map(prev.set(userId, data)));
      
      return data;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      
      // If it's a 406 error, it might be a data type issue
      if (error.code === '406' || error.message?.includes('406')) {
        console.log("Attempting alternative query method...");
        try {
          // Try a different approach - get all employees and filter client-side
          const { data: allEmployees, error: altError } = await supabase
            .from("employees")
            .select("*");
          
          if (altError) {
            console.error("Alternative query also failed:", altError);
            return null;
          }
          
          const userProfile = allEmployees.find(emp => emp.id === userId);
          console.log("Found profile via alternative method:", userProfile);
          
          // Cache the result
          setProfileCache(prev => new Map(prev.set(userId, userProfile)));
          
          return userProfile;
        } catch (altError) {
          console.error("Alternative method failed:", altError);
          return null;
        }
      }
      
      return null;
    }
  }, [profileCache]);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out:", error);
        console.warn("Sign Out Error: Failed to sign out. Please try again.");
      } else {
        setUser(null);
        setUserProfile(null);
        setRole(null);
        // Clear cache on sign out
        setProfileCache(new Map());
        console.log("User signed out successfully");
      }
    } catch (error) {
      console.error("Unexpected error during sign out:", error);
      console.warn("Sign Out Error: An unexpected error occurred during sign out.");
    }
  }, []);

  const sendInvitation = useCallback(async (email, role = "employee") => {
    try {
      const { data, error } = await supabase
        .from("access_requests")
        .insert([
          {
            email,
            role,
            status: "pending",
          },
        ])
        .select();

      if (error) {
        console.error("Error sending invitation:", error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Error in sendInvitation:", error);
      throw error;
    }
  }, []);

  const acceptInvitation = useCallback(async (invitationId, userData) => {
    try {
      const { data, error } = await supabase
        .from("access_requests")
        .update({ status: "accepted" })
        .eq("id", invitationId)
        .select();

      if (error) {
        console.error("Error accepting invitation:", error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Error in acceptInvitation:", error);
      throw error;
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          setLoading(false);
          setAuthChecked(true);
          return;
        }

        if (session?.user) {
          setUser(session.user);
          
          // Fetch profile immediately but don't block auth
          try {
            const profile = await getUserProfile(session.user.id);
            setUserProfile(profile);
            setRole(profile?.role || 'employee');
          } catch (profileError) {
            console.warn("Profile fetch failed:", profileError);
            setRole('employee'); // Default role
          }
        } else {
          // No active session
        }
      } catch (error) {
        console.error("Error in checkAuth:", error);
      } finally {
        setLoading(false);
        setAuthChecked(true);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          
          // Fetch profile with timeout
          try {
            const profile = await getUserProfile(session.user.id);
            setUserProfile(profile);
            setRole(profile?.role || 'employee');
          } catch (error) {
            console.warn("Profile fetch failed:", error);
            setRole('employee'); // Default role
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setUserProfile(null);
          setRole(null);
          setProfileCache(new Map());
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [getUserProfile]);

  const value = {
    user,
    userProfile,
    role,
    loading,
    authChecked,
    signOut,
    sendInvitation,
    acceptInvitation,
    getUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
