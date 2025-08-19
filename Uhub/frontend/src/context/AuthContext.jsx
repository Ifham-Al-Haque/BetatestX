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

  const getUserProfile = async (userId) => {
    try {
      console.log("Fetching profile for user ID:", userId);
      
      // Get current user's email from Supabase Auth
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser || !authUser.email) {
        console.error("No auth user or email found");
        return null;
      }
      
      console.log("Auth user email:", authUser.email);
      
      // Try to get user profile from the users table directly
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("email", authUser.email)
        .maybeSingle();
      
      if (userError) {
        console.error("Error fetching user from users table:", userError);
        return null;
      }
      
      if (userData) {
        console.log("User data retrieved from users table:", userData);
        setProfileCache(prev => new Map(prev.set(userId, userData)));
        return userData;
      }
      
      // If no user found in users table, try to create one
      console.log("No user found in users table, attempting to create...");
      
      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert({
          email: authUser.email,
          auth_user_id: userId,
          role: 'employee', // Default role
          status: 'active',
          full_name: authUser.email.split('@')[0],
          department: 'Unassigned',
          position: 'Employee'
        })
        .select()
        .single();
      
      if (createError) {
        console.error("Error creating user:", createError);
        return null;
      }
      
      if (newUser) {
        console.log("New user created:", newUser);
        setProfileCache(prev => new Map(prev.set(userId, newUser)));
        return newUser;
      }
      
      return null;
    } catch (error) {
      console.error("Error in getUserProfile:", error);
      return null;
    }
  };

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
      console.error("Error in signOut:", error);
    }
  }, []);

  const sendInvitation = useCallback(async (email, role = 'employee') => {
    try {
      const { data, error } = await supabase
        .from("access_requests")
        .insert({
          email,
          role,
          status: "pending",
          requested_at: new Date().toISOString()
        })
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

  const acceptInvitation = useCallback(async (invitationId) => {
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
    let isMounted = true;
    let authCheckInProgress = false;
    
    const checkAuth = async () => {
      // Prevent multiple simultaneous auth checks
      if (authCheckInProgress) {
        console.log("🔒 Auth check already in progress, skipping...");
        return;
      }
      
      authCheckInProgress = true;
      
      try {
        console.log("🔍 Checking authentication status...");
        
        // Get current session without timeout (Supabase handles this)
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (error) {
          console.error("Error getting session:", error);
          setLoading(false);
          setAuthChecked(true);
          return;
        }

        if (session?.user) {
          console.log("✅ User authenticated:", session.user.email);
          setUser(session.user);
          setRole('employee'); // Set default role immediately
          
          // Fetch profile in background (non-blocking)
          getUserProfile(session.user.id)
            .then(profile => {
              if (!isMounted) return;
              console.log("📋 Profile loaded:", profile);
              setUserProfile(profile);
              // Use the role from the user account, not from employee record
              setRole(profile?.role || 'employee');
            })
            .catch(error => {
              if (!isMounted) return;
              console.warn("⚠️ Profile fetch failed:", error);
              // Keep default role
            });
        } else {
          console.log("❌ No active session found");
        }
      } catch (error) {
        if (!isMounted) return;
        console.error("Error in checkAuth:", error);
      } finally {
        if (!isMounted) return;
        console.log("🏁 Auth check completed");
        setLoading(false);
        setAuthChecked(true);
        authCheckInProgress = false;
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        console.log("🔄 Auth state change:", event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          setRole('employee'); // Set default role immediately
          
          // Fetch profile in background
          getUserProfile(session.user.id)
            .then(profile => {
              if (!isMounted) return;
              setUserProfile(profile);
              // Use the role from the user account, not from employee record
              setRole(profile?.role || 'employee');
            })
            .catch(error => {
              if (!isMounted) return;
              console.warn("Profile fetch failed:", error);
            });
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setUserProfile(null);
          setRole(null);
          setProfileCache(new Map());
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []); // Remove getUserProfile dependency to prevent infinite loops

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
    // Add a function to force refresh the profile
    refreshProfile: async () => {
      if (user?.id) {
        const profile = await getUserProfile(user.id);
        if (profile) {
          setUserProfile(profile);
          setRole(profile.role || 'employee');
          console.log("Profile refreshed:", profile);
          console.log("Role set to:", profile.role);
        }
      }
    },
    // Add a function to manually set role (for debugging)
    setUserRole: (newRole) => {
      setRole(newRole);
      console.log("Role manually set to:", newRole);
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
