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
      
      // First, try to get user profile from the new users table
      const { data, error } = await supabase
        .rpc('get_user_profile', { user_uuid: userId });
      
      if (error) {
        console.error("Supabase error fetching user profile:", error);
        
        // If the function doesn't exist yet, try fallback method
        if (error.code === '42883') { // Function doesn't exist
          console.log("get_user_profile function not found, using fallback...");
          
          // Try to get basic user info from users table
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("*")
            .eq("auth_user_id", userId)
            .maybeSingle();
          
          if (userError) {
            console.error("Fallback user query failed:", userError);
            return null;
          }
          
          if (userData) {
            console.log("Fallback user data retrieved:", userData);
            setProfileCache(prev => new Map(prev.set(userId, userData)));
            return userData;
          }
        }
        
        throw error;
      }
      
      // The function returns a table, so we get the first row
      const profileData = data && data.length > 0 ? data[0] : null;
      
      if (profileData) {
        console.log("Profile data retrieved from get_user_profile:", profileData);
        setProfileCache(prev => new Map(prev.set(userId, profileData)));
        return profileData;
      }
      
      // If no profile found, try to link the auth user to an existing user account
      console.log("No profile found, attempting to link auth user...");
      
      // Get current user's email from Supabase Auth
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser && authUser.email) {
        console.log("Attempting to link auth user with email:", authUser.email);
        
        // Try to link the auth user to an existing user account
        const { data: linkResult, error: linkError } = await supabase
          .rpc('link_auth_user', { 
            user_email: authUser.email, 
            auth_uuid: userId 
          });
        
        if (linkError) {
          console.error("Error linking auth user:", linkError);
        } else if (linkResult && linkResult.success) {
          console.log("Successfully linked auth user:", linkResult);
          
          // Now try to get the profile again
          const { data: retryData, error: retryError } = await supabase
            .rpc('get_user_profile', { user_uuid: userId });
          
          if (!retryError && retryData && retryData.length > 0) {
            const linkedProfile = retryData[0];
            console.log("Profile retrieved after linking:", linkedProfile);
            setProfileCache(prev => new Map(prev.set(userId, linkedProfile)));
            return linkedProfile;
          }
        }
      }
      
      // Final fallback: try to get basic user info from users table
      try {
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("auth_user_id", userId)
          .maybeSingle();
        
        if (userError) {
          console.error("Final fallback user query failed:", userError);
          return null;
        }
        
        if (userData) {
          console.log("Final fallback user data retrieved:", userData);
          setProfileCache(prev => new Map(prev.set(userId, userData)));
          return userData;
        }
      } catch (fallbackError) {
        console.error("Final fallback method failed:", fallbackError);
      }
      
      return null;
    } catch (error) {
      console.error("Error fetching user profile:", error);
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
    refreshProfile: () => {
      if (user?.id) {
        getUserProfile(user.id).then(profile => {
          setUserProfile(profile);
          setRole(profile?.role || 'employee');
        });
      }
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
