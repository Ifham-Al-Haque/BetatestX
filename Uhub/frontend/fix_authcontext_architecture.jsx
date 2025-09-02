// CORRECT ARCHITECTURE: Fix AuthContext to follow proper users vs employees separation
// Replace the problematic section in src/context/AuthContext.jsx

// OLD CODE (lines 240-350 approximately):
// This was creating employee records for every user - WRONG!

// NEW CODE - CORRECT ARCHITECTURE:
// Only create user records for application access, don't create employee records automatically

} else {
  // Regular user, create basic user profile (NO employee record needed)
  console.log("👤 Creating basic user profile for regular user...");
  
  // Create user record for application access only
  console.log("🔧 Creating user record...");
  const { data: newUser, error: createUserError } = await supabase
    .from("users")
    .upsert({
      auth_user_id: userId,
      email: authUser.email,
      role: "employee", // Default role
      status: "active",
      full_name: authUser.email.split('@')[0]
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
    console.log("✅ User profile created:", newUser);
    
    // Create profile from user data only (no employee data needed)
    const profile = {
      id: userId,
      auth_user_id: userId,
      email: authUser.email,
      role: newUser.role,
      status: newUser.status,
      full_name: newUser.full_name || authUser.email.split('@')[0],
      department: 'Unassigned', // Default department
      position: 'User' // Default position
    };
    console.log("🎯 Created profile from user data:", profile);
    setProfileCache(prev => new Map(prev.set(userId, profile)));
    return profile;
  } else {
    console.error("❌ Failed to create user record");
    return null;
  }
}
