import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "../supabaseClient";
import activityService from "../services/activityService";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

const roleFromProfile = (profile) => {
  if (!profile || profile.inactive || profile.status === "unprovisioned") return null;
  return profile.role || null;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const currentUserIdRef = useRef(null);
  const currentRoleRef = useRef(null);
  const [profileCache, setProfileCache] = useState(new Map());

  useEffect(() => {
    currentUserIdRef.current = user?.id || null;
    currentRoleRef.current = role;
  }, [user?.id, role]);

  const buildProfile = async (userId, authUser, userData) => {
    const status = userData?.status || "active";
    if (status && String(status).toLowerCase() !== "active") {
      return {
        id: userData.id,
        usersTableId: userData.id,
        employeeId: userData.employee_id ?? null,
        auth_user_id: userId,
        email: authUser.email,
        role: null,
        status,
        inactive: true,
        full_name: authUser.email.split("@")[0],
        department: "Unassigned",
        position: "Employee",
      };
    }

    let employeeData = null;
    if (userData.employee_id) {
      const { data } = await supabase
        .from("employees")
        .select("id, full_name, department, position, status")
        .eq("id", userData.employee_id)
        .maybeSingle();
      employeeData = data;
    }

    const profile = {
      id: employeeData?.id || userId,
      usersTableId: userData.id,
      employeeId: employeeData?.id ?? userData.employee_id ?? null,
      auth_user_id: userId,
      email: authUser.email,
      role: userData.role || null,
      status,
      full_name: employeeData?.full_name || authUser.email.split("@")[0],
      department: employeeData?.department || "Unassigned",
      position: employeeData?.position || "Employee",
    };
    setProfileCache((prev) => new Map(prev.set(userId, profile)));
    return profile;
  };

  const getUserProfile = async (userId) => {
    try {
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !authUser?.email) {
        console.error("Auth error or missing email:", authError);
        return null;
      }

      const cached = profileCache.get(userId);
      if (cached?.role) return cached;

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, role, status, employee_id, email, auth_user_id")
        .eq("auth_user_id", userId)
        .maybeSingle();

      if (userError) {
        console.error("Error fetching UHub user:", userError);
        return null;
      }

      if (userData?.role) {
        return buildProfile(userId, authUser, userData);
      }

      const { data: claimed, error: claimError } = await supabase.rpc("claim_uhub_account");
      if (claimError) {
        console.warn("claim_uhub_account failed:", claimError.message);
      } else if (claimed?.success && claimed.user?.role) {
        return buildProfile(userId, authUser, claimed.user);
      } else if (claimed && claimed.success === false) {
        console.warn("No provisioned UHub account:", claimed.error);
      }

      return {
        id: userId,
        auth_user_id: userId,
        email: authUser.email,
        role: null,
        status: "unprovisioned",
        full_name: authUser.email.split("@")[0],
        department: "Unassigned",
        position: "Employee",
      };
    } catch (error) {
      console.error("Error in getUserProfile:", error);
      return null;
    }
  };

  const signOut = useCallback(async () => {
    try {
      try {
        await activityService.logLogout();
      } catch (activityError) {
        console.warn("Failed to log logout activity:", activityError);
      }

      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out:", error);
        throw error;
      }
      setUser(null);
      setUserProfile(null);
      setRole(null);
      setProfileCache(new Map());
    } catch (error) {
      console.error("Error in signOut:", error);
      throw error;
    }
  }, []);

  const sendInvitation = useCallback(async (email, inviteRole = "employee") => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) throw new Error("Not authenticated");
    const { data, error } = await supabase.rpc("invite_user", {
      invite_email: email,
      invite_role: inviteRole,
    });
    if (error) throw error;
    if (data && data.success === false) throw new Error(data.error || "Failed to invite user");
    return data;
  }, []);

  useEffect(() => {
    let isMounted = true;
    let authCheckInProgress = false;

    const checkAuth = async () => {
      if (authCheckInProgress) return;
      authCheckInProgress = true;

      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (error) {
          console.error("Error getting session:", error);
          setLoading(false);
          setAuthChecked(true);
          return;
        }

        if (session?.user) {
          setUser(session.user);
          currentUserIdRef.current = session.user.id;
          setRole("loading");
          currentRoleRef.current = "loading";

          const profile = await getUserProfile(session.user.id);
          if (!isMounted) return;
          setUserProfile(profile);
          const detectedRole = roleFromProfile(profile);
          setRole(detectedRole);
          currentRoleRef.current = detectedRole;
        } else {
          currentUserIdRef.current = null;
          currentRoleRef.current = null;
        }
      } catch (error) {
        if (!isMounted) return;
        console.error("Error in checkAuth:", error);
      } finally {
        if (!isMounted) return;
        setLoading(false);
        setAuthChecked(true);
        authCheckInProgress = false;
      }
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === "SIGNED_IN" && session?.user) {
        const isSameResolvedUser =
          currentUserIdRef.current === session.user.id &&
          currentRoleRef.current &&
          currentRoleRef.current !== "loading";

        setUser(session.user);
        currentUserIdRef.current = session.user.id;

        if (!isSameResolvedUser) {
          setLoading(true);
          setRole("loading");
          currentRoleRef.current = "loading";
        }

        getUserProfile(session.user.id)
          .then((profile) => {
            if (!isMounted || currentUserIdRef.current !== session.user.id) return;
            setUserProfile(profile);
            const detectedRole = roleFromProfile(profile);
            setRole(detectedRole);
            currentRoleRef.current = detectedRole;
          })
          .catch((error) => {
            if (!isMounted) return;
            console.warn("Profile fetch failed:", error);
          })
          .finally(() => {
            if (isMounted && !isSameResolvedUser) {
              setLoading(false);
            }
          });
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setUserProfile(null);
        setRole(null);
        setLoading(false);
        currentUserIdRef.current = null;
        currentRoleRef.current = null;
        setProfileCache(new Map());
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    userProfile,
    role,
    loading,
    authChecked,
    signOut,
    sendInvitation,
    getUserProfile,
    refreshProfile: async () => {
      if (user?.id) {
        const profile = await getUserProfile(user.id);
        setUserProfile(profile);
        setRole(roleFromProfile(profile));
      }
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
