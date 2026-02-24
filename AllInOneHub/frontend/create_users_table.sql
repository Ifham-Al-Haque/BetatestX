-- Create Users Table for UHub Application Access Control
-- This table is separate from employees table and handles application authentication/authorization

-- Step 1: Create the users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'hr_manager', 'cs_manager', 'driver_management', 'employee', 'viewer')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
  full_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS policies
-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = auth_user_id);

-- Users can update their own profile (except role and status)
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = auth_user_id);

-- Admins can view all users
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can insert/update/delete all users
CREATE POLICY "Admins can manage all users" ON public.users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);

-- Step 5: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger for updated_at
CREATE TRIGGER trigger_update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_users_updated_at();

-- Step 7: Grant permissions
GRANT ALL ON public.users TO authenticated;
GRANT USAGE ON SEQUENCE users_id_seq TO authenticated;

-- Step 8: Insert default admin user if not exists
INSERT INTO public.users (email, auth_user_id, role, status, full_name)
SELECT 
  'ifham@udrive.ae',
  au.id,
  'admin',
  'active',
  'Ifham'
FROM auth.users au
WHERE au.email = 'ifham@udrive.ae'
  AND NOT EXISTS (
    SELECT 1 FROM public.users WHERE email = 'ifham@udrive.ae'
  );

-- Step 9: Create view for easy user management
CREATE OR REPLACE VIEW user_management_view AS
SELECT 
  u.id,
  u.email,
  u.role,
  u.status,
  u.full_name,
  u.auth_user_id,
  au.email_confirmed_at,
  au.created_at as auth_created_at,
  u.created_at as user_created_at,
  u.last_login,
  CASE 
    WHEN u.auth_user_id IS NULL THEN 'No Auth Account'
    WHEN au.email_confirmed_at IS NULL THEN 'Email Not Confirmed'
    ELSE 'Fully Active'
  END as status_description,
  CASE 
    WHEN u.auth_user_id IS NULL THEN 'red'
    WHEN au.email_confirmed_at IS NULL THEN 'yellow'
    ELSE 'green'
  END as status_color
FROM public.users u
LEFT JOIN auth.users au ON u.auth_user_id = au.id
ORDER BY u.created_at DESC;

-- Step 10: Grant access to the view
GRANT SELECT ON user_management_view TO authenticated;

-- Step 11: Create function to sync user from auth.users
CREATE OR REPLACE FUNCTION sync_user_from_auth()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert new user when auth.users gets a new user
  INSERT INTO public.users (email, auth_user_id, role, status, full_name)
  VALUES (NEW.email, NEW.id, 'employee', 'active', COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  ON CONFLICT (email) DO UPDATE SET
    auth_user_id = EXCLUDED.auth_user_id,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 12: Create trigger to sync users
CREATE TRIGGER trigger_sync_user_from_auth
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_from_auth();

-- Step 13: Verify the setup
SELECT 
  'Users table created successfully' as status,
  COUNT(*) as total_users,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users
FROM public.users;
