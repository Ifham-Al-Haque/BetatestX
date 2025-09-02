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
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error("Auth error:", authError);
        return null;
      }
      
      if (!authUser || !authUser.email) {
        console.error("No auth user or email found");
        return null;
      }
      
      console.log("Auth user email:", authUser.email);
      
      // Check if user exists in users table (primary role source)
      console.log("🔍 Checking users table for auth_user_id:", userId);
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role, status, employee_id, email, full_name, department, position")
        .eq("auth_user_id", userId)
        .maybeSingle();
      
      if (userError) {
        console.error("❌ Error fetching user data:", userError);
        return null;
      }
      
      console.log("📋 User data found:", userData);
      
      if (userData) {
        console.log("✅ User data found in database:", userData);
        
        // Since we now have all the data from users table, create profile directly
        if (userData.role) {
          console.log("🎯 Creating profile from users table data");
          const profile = {
            id: userId,
            auth_user_id: userId,
            email: authUser.email,
            role: userData.role,
            status: userData.status,
            full_name: userData.full_name || authUser.email.split('@')[0],
            department: userData.department || 'Unassigned',
            position: userData.position || 'Employee'
          };
          console.log("✅ Created profile from users table:", profile);
          setProfileCache(prev => new Map(prev.set(userId, profile)));
          return profile;
        }
        
        // If we reach here, user exists but employee_id is null or employee not found
        console.log("⚠️ User found but employee_id missing or invalid, will try to fix existing employee record");
        
        // Try to find existing employee record by email
        let existingEmployee = null;
        try {
          const { data: employeeData, error: findEmployeeError } = await supabase
            .from("employees")
            .select("id, full_name, department, position, status")
            .eq("email", authUser.email)
            .maybeSingle();
            
          if (findEmployeeError) {
            console.error("❌ Error finding existing employee:", findEmployeeError);
            console.log("🔄 Will create new employee record due to database error");
          } else if (employeeData) {
            existingEmployee = employeeData;
            console.log("✅ Found existing employee record:", existingEmployee);
            
            // Update the user record to link to the existing employee
            const { error: updateUserError } = await supabase
              .from("users")
              .update({ employee_id: existingEmployee.id })
              .eq("auth_user_id", userId);
              
            if (updateUserError) {
              console.error("❌ Error updating user record:", updateUserError);
            } else {
              console.log("✅ Updated user record to link to existing employee");
              
              // Create profile from existing employee data
              const profile = {
                id: existingEmployee.id,
                auth_user_id: userId,
                email: authUser.email,
                role: userData.role,
                status: userData.status,
                full_name: existingEmployee.full_name,
                department: existingEmployee.department,
                position: existingEmployee.position
              };
              console.log("🎯 Created profile from existing employee:", profile);
              setProfileCache(prev => new Map(prev.set(userId, profile)));
              return profile;
            }
          }
        } catch (employeeLookupError) {
          console.error("❌ Exception during employee lookup:", employeeLookupError);
          console.log("🔄 Will create new employee record due to exception");
        }
        
        console.log("🔄 Will create new profile since existing employee not found or lookup failed");
      } else {
        console.log("⚠️ No user data found, will create new profile");
      }
      

      
      // If no user record found, check if it's the admin user
      if (authUser.email === 'ifham@udrive.ae') {
        console.log("👑 Admin user detected, creating admin profile...");
        
        // First check if employee already exists
        console.log("🔍 Checking if employee already exists...");
        let existingEmployee = null;
        let employeeId;
        let newEmployee = null; // Declare newEmployee variable
        
        try {
          const { data: employeeData, error: findError } = await supabase
            .from("employees")
            .select("id, full_name, department, position, status")
            .eq("email", authUser.email)
            .maybeSingle();
            
          if (findError) {
            console.error("❌ Error checking existing employee:", findError);
            console.log("🔄 Will create new employee record due to database error");
          } else if (employeeData) {
            existingEmployee = employeeData;
            console.log("✅ Found existing employee record:", existingEmployee);
            employeeId = existingEmployee.id;
          }
        } catch (employeeLookupError) {
          console.error("❌ Exception during employee lookup:", employeeLookupError);
          console.log("🔄 Will create new employee record due to exception");
        }
        
        if (!employeeId) {
          // Create new employee record
          console.log("🔧 Creating new employee record...");
          try {
            const { data: createdEmployee, error: createEmployeeError } = await supabase
              .from("employees")
              .upsert({
                full_name: "Ifham",
                email: authUser.email,
                department: "IT",
                position: "System Administrator",
                employee_id: `EMP_${Date.now()}` // Generate unique employee ID
              })
              .select()
              .single();
            
            if (createEmployeeError) {
              console.error("❌ Error creating employee record:", createEmployeeError);
              return null;
            }
            
            if (createdEmployee) {
              console.log("✅ New employee record created:", createdEmployee);
              employeeId = createdEmployee.id;
              newEmployee = createdEmployee; // Assign to the declared variable
            } else {
              console.error("❌ Failed to create employee record");
              return null;
            }
          } catch (createEmployeeException) {
            console.error("❌ Exception creating employee record:", createEmployeeException);
            return null;
          }
        }
        
        // Now create or update user record linking to the employee
        console.log("🔧 Creating/updating user record...");
        const { data: newUser, error: createUserError } = await supabase
          .from("users")
          .upsert({
            auth_user_id: userId,
            employee_id: employeeId,
            email: authUser.email,
            role: "admin",
            status: "active"
          })
          .select()
          .single();
        
        if (createUserError) {
          console.error("❌ Error creating user record:", createUserError);
          return null;
        }
        
        if (newUser) {
          console.log("✅ Admin profile created:", newUser);
          
          // Get employee details for the profile
          const employeeDetails = existingEmployee || newEmployee;
          const profile = {
            id: employeeId,
            auth_user_id: userId,
            email: authUser.email,
            role: newUser.role,
            status: newUser.status,
            full_name: employeeDetails.full_name,
            department: employeeDetails.department,
            position: employeeDetails.position
          };
          console.log("🎯 Final admin profile:", profile);
          setProfileCache(prev => new Map(prev.set(userId, profile)));
          return profile;
        }
      } else {
        // Regular user, create basic profile
        console.log("👤 Creating basic employee profile for regular user...");
        
        // First check if employee already exists
        console.log("🔍 Checking if employee already exists...");
        const { data: existingEmployee, error: findError } = await supabase
          .from("employees")
          .select("id, full_name, department, position, status")
          .eq("email", authUser.email)
          .maybeSingle();
          
        if (findError) {
          console.error("❌ Error checking existing employee:", findError);
          console.error("❌ Error details:", {
            message: findError.message,
            details: findError.details,
            hint: findError.hint,
            code: findError.code
          });
          return null;
        }
        
        let employeeId;
        let newEmployee = null; // Declare newEmployee variable
        
        if (existingEmployee) {
          console.log("✅ Found existing employee record:", existingEmployee);
          employeeId = existingEmployee.id;
        } else {
          // Create new employee record
          console.log("🔧 Creating new employee record...");
          const { data: createdEmployee, error: createEmployeeError } = await supabase
            .from("employees")
            .insert({
              full_name: authUser.email.split('@')[0],
              email: authUser.email,
              department: "Unassigned",
              position: "Employee",
              employee_id: `EMP_${Date.now()}` // Generate unique employee ID
            })
            .select()
            .single();
          
          if (createEmployeeError) {
            console.error("❌ Error creating employee record:", createEmployeeError);
            console.error("❌ Error details:", {
              message: createEmployeeError.message,
              details: createEmployeeError.details,
              hint: createEmployeeError.hint,
              code: createEmployeeError.code
            });
            return null;
          }
          
          if (createdEmployee) {
            console.log("✅ New employee record created:", createdEmployee);
            employeeId = createdEmployee.id;
            newEmployee = createdEmployee; // Assign to the declared variable
          } else {
            console.error("❌ Failed to create employee record");
            return null;
          }
        }
        
        // Now create or update user record linking to the employee
        console.log("🔧 Creating/updating user record...");
        const { data: newUser, error: createUserError } = await supabase
          .from("users")
          .upsert({
            auth_user_id: userId,
            employee_id: employeeId,
            email: authUser.email,
            role: "employee",
            status: "active"
          })
          .select()
          .single();
        
        if (createUserError) {
          console.error("❌ Error creating user record:", createUserError);
          console.error("❌ Error details:", {
            message: createUserError.message,
            details: createUserError.details,
            hint: createUserError.hint,
            code: createUserError.code
          });
          return null;
        }
        
        if (newUser) {
          console.log("✅ Employee profile created:", newUser);
          
          // Get employee details for the profile
          const employeeDetails = existingEmployee || newEmployee;
          const profile = {
            id: employeeId,
            auth_user_id: userId,
            email: authUser.email,
            role: newUser.role,
            status: newUser.status,
            full_name: employeeDetails.full_name,
            department: employeeDetails.department,
            position: employeeDetails.position
          };
          console.log("🎯 Final employee profile:", profile);
          setProfileCache(prev => new Map(prev.set(userId, profile)));
          return profile;
        }
      }
      
      // Fallback: If all database operations fail, create a basic profile
      console.log("🔄 Creating fallback profile due to database issues...");
      try {
        const fallbackProfile = {
          id: `fallback_${Date.now()}`,
          auth_user_id: userId,
          email: authUser.email,
          role: authUser.email === 'ifham@udrive.ae' ? 'admin' : 'employee',
          status: 'active',
          full_name: authUser.email === 'ifham@udrive.ae' ? 'Ifham' : authUser.email.split('@')[0],
          department: authUser.email === 'ifham@udrive.ae' ? 'IT' : 'Unassigned',
          position: authUser.email === 'ifham@udrive.ae' ? 'System Administrator' : 'Employee'
        };
        
        console.log("🎯 Fallback profile created:", fallbackProfile);
        console.log("✅ This should resolve the 'No Role' issue and show sidebar panels");
        setProfileCache(prev => new Map(prev.set(userId, fallbackProfile)));
        return fallbackProfile;
      } catch (fallbackError) {
        console.error("❌ Even fallback profile creation failed:", fallbackError);
        return null;
      }
    } catch (error) {
      console.error("Error in getUserProfile:", error);
      return null;
    }
  };

  const signOut = useCallback(async () => {
    try {
      console.log("🔄 Starting sign out process...");
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("❌ Error signing out:", error);
        console.warn("Sign Out Error: Failed to sign out. Please try again.");
        throw error; // Re-throw the error so the calling component can handle it
      } else {
        console.log("✅ Supabase sign out successful, clearing local state...");
        setUser(null);
        setUserProfile(null);
        setRole(null);
        // Clear cache on sign out
        setProfileCache(new Map());
        console.log("✅ User signed out successfully, local state cleared");
      }
    } catch (error) {
      console.error("❌ Error in signOut:", error);
      throw error; // Re-throw the error so the calling component can handle it
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
          console.log("🔄 Starting profile fetch for user:", session.user.id);
          getUserProfile(session.user.id)
            .then(profile => {
              if (!isMounted) return;
              console.log("📋 Profile loaded:", profile);
              setUserProfile(profile);
              // Use the role from the user account, not from employee record
              const detectedRole = profile?.role || 'employee';
              console.log("🔍 Role detection:", { 
                profileRole: profile?.role, 
                detectedRole, 
                profile: profile,
                userId: session.user.id
              });
              setRole(detectedRole);
              console.log("✅ Role set to:", detectedRole);
            })
            .catch(error => {
              if (!isMounted) return;
              console.warn("⚠️ Profile fetch failed:", error);
              console.error("❌ Profile fetch error details:", error);
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
          console.log("🔄 Auth state change - Starting profile fetch for user:", session.user.id);
          getUserProfile(session.user.id)
            .then(profile => {
              if (!isMounted) return;
              setUserProfile(profile);
              // Use the role from the user account, not from employee record
              const detectedRole = profile?.role || 'employee';
              console.log("🔄 Auth state change - Role detection:", { 
                profileRole: profile?.role, 
                detectedRole, 
                profile: profile,
                userId: session.user.id
              });
              setRole(detectedRole);
              console.log("✅ Auth state change - Role set to:", detectedRole);
            })
            .catch(error => {
              if (!isMounted) return;
              console.warn("Profile fetch failed:", error);
              console.error("❌ Auth state change - Profile fetch error details:", error);
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
    },
    // Add a function to check database health
    checkDatabaseHealth: async () => {
      console.log("🔍 Checking database health...");
      try {
        // Test users table
        const { data: usersTest, error: usersError } = await supabase
          .from("users")
          .select("count")
          .limit(1);
        console.log("Users table test:", usersError ? "❌ Failed" : "✅ OK", usersError);
        
        // Test employees table
        const { data: employeesTest, error: employeesError } = await supabase
          .from("employees")
          .select("count")
          .limit(1);
        console.log("Employees table test:", employeesError ? "❌ Failed" : "✅ OK", employeesError);
        
        return {
          users: !usersError,
          employees: !employeesError,
          usersError: usersError?.message,
          employeesError: employeesError?.message
        };
      } catch (error) {
        console.error("Database health check failed:", error);
        return { error: error.message };
      }
    },
    // Add a function to create profile without database operations (for testing)
    createSimpleProfile: (email) => {
      console.log("🔧 Creating simple profile for:", email);
      const simpleProfile = {
        id: `simple_${Date.now()}`,
        auth_user_id: user?.id,
        email: email,
        role: email === 'ifham@udrive.ae' ? 'admin' : 'employee',
        status: 'active',
        full_name: email === 'ifham@udrive.ae' ? 'Ifham' : email.split('@')[0],
        department: email === 'ifham@udrive.ae' ? 'IT' : 'Unassigned',
        position: email === 'ifham@udrive.ae' ? 'System Administrator' : 'Employee'
      };
      
      setUserProfile(simpleProfile);
      setRole(simpleProfile.role);
      console.log("✅ Simple profile created:", simpleProfile);
      return simpleProfile;
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
