-- SQL script to ensure all specified admin users are correctly set up in the database
-- This script will create/update user records for all admin users with the 'admin' role

-- Process each admin user individually
DO $$
DECLARE
    admin_email TEXT;
    auth_user_uuid UUID;
    employee_record_id UUID;
    current_role TEXT;
BEGIN
    -- Process ifham@udrive.ae
    admin_email := 'ifham@udrive.ae';
    SELECT id INTO auth_user_uuid FROM auth.users WHERE email = admin_email;
    
    IF auth_user_uuid IS NOT NULL THEN
        RAISE NOTICE 'Processing admin user: % (Auth ID: %)', admin_email, auth_user_uuid;
        
        -- Ensure an employee record exists for the admin user
        SELECT id INTO employee_record_id FROM public.employees WHERE email = admin_email;
        
        IF employee_record_id IS NULL THEN
            RAISE NOTICE 'Creating employee record for %', admin_email;
            INSERT INTO public.employees (full_name, email, department, position, employee_id, status)
            VALUES (SPLIT_PART(admin_email, '@', 1), admin_email, 'IT', 'System Administrator', 'EMP_' || REPLACE(gen_random_uuid()::TEXT, '-', ''), 'active')
            RETURNING id INTO employee_record_id;
        ELSE
            RAISE NOTICE 'Employee record already exists for % (Employee ID: %)', admin_email, employee_record_id;
            -- Update existing employee record if needed
            UPDATE public.employees 
            SET department = 'IT', position = 'System Administrator', status = 'active', updated_at = NOW()
            WHERE id = employee_record_id;
        END IF;
        
        -- Ensure a user record exists in public.users and has the 'admin' role
        INSERT INTO public.users (email, auth_user_id, role, status, full_name, employee_id)
        VALUES (admin_email, auth_user_uuid, 'admin', 'active', SPLIT_PART(admin_email, '@', 1), employee_record_id)
        ON CONFLICT (email) DO UPDATE SET
            auth_user_id = EXCLUDED.auth_user_id,
            role = 'admin',
            status = 'active',
            full_name = EXCLUDED.full_name,
            employee_id = EXCLUDED.employee_id,
            updated_at = NOW();
            
        RAISE NOTICE 'User % ensured to be admin in public.users.', admin_email;
    ELSE
        RAISE NOTICE 'Auth user not found for email: %. Please ensure the user has signed up via the application first.', admin_email;
    END IF;
    
    -- Process saman@udrive.ae
    admin_email := 'saman@udrive.ae';
    SELECT id INTO auth_user_uuid FROM auth.users WHERE email = admin_email;
    
    IF auth_user_uuid IS NOT NULL THEN
        RAISE NOTICE 'Processing admin user: % (Auth ID: %)', admin_email, auth_user_uuid;
        
        -- Ensure an employee record exists for the admin user
        SELECT id INTO employee_record_id FROM public.employees WHERE email = admin_email;
        
        IF employee_record_id IS NULL THEN
            RAISE NOTICE 'Creating employee record for %', admin_email;
            INSERT INTO public.employees (full_name, email, department, position, employee_id, status)
            VALUES (SPLIT_PART(admin_email, '@', 1), admin_email, 'IT', 'System Administrator', 'EMP_' || REPLACE(gen_random_uuid()::TEXT, '-', ''), 'active')
            RETURNING id INTO employee_record_id;
        ELSE
            RAISE NOTICE 'Employee record already exists for % (Employee ID: %)', admin_email, employee_record_id;
            -- Update existing employee record if needed
            UPDATE public.employees 
            SET department = 'IT', position = 'System Administrator', status = 'active', updated_at = NOW()
            WHERE id = employee_record_id;
        END IF;
        
        -- Ensure a user record exists in public.users and has the 'admin' role
        INSERT INTO public.users (email, auth_user_id, role, status, full_name, employee_id)
        VALUES (admin_email, auth_user_uuid, 'admin', 'active', SPLIT_PART(admin_email, '@', 1), employee_record_id)
        ON CONFLICT (email) DO UPDATE SET
            auth_user_id = EXCLUDED.auth_user_id,
            role = 'admin',
            status = 'active',
            full_name = EXCLUDED.full_name,
            employee_id = EXCLUDED.employee_id,
            updated_at = NOW();
            
        RAISE NOTICE 'User % ensured to be admin in public.users.', admin_email;
    ELSE
        RAISE NOTICE 'Auth user not found for email: %. Please ensure the user has signed up via the application first.', admin_email;
    END IF;
    
    -- Process talha@udrive.ae
    admin_email := 'talha@udrive.ae';
    SELECT id INTO auth_user_uuid FROM auth.users WHERE email = admin_email;
    
    IF auth_user_uuid IS NOT NULL THEN
        RAISE NOTICE 'Processing admin user: % (Auth ID: %)', admin_email, auth_user_uuid;
        
        -- Ensure an employee record exists for the admin user
        SELECT id INTO employee_record_id FROM public.employees WHERE email = admin_email;
        
        IF employee_record_id IS NULL THEN
            RAISE NOTICE 'Creating employee record for %', admin_email;
            INSERT INTO public.employees (full_name, email, department, position, employee_id, status)
            VALUES (SPLIT_PART(admin_email, '@', 1), admin_email, 'IT', 'System Administrator', 'EMP_' || REPLACE(gen_random_uuid()::TEXT, '-', ''), 'active')
            RETURNING id INTO employee_record_id;
        ELSE
            RAISE NOTICE 'Employee record already exists for % (Employee ID: %)', admin_email, employee_record_id;
            -- Update existing employee record if needed
            UPDATE public.employees 
            SET department = 'IT', position = 'System Administrator', status = 'active', updated_at = NOW()
            WHERE id = employee_record_id;
        END IF;
        
        -- Ensure a user record exists in public.users and has the 'admin' role
        INSERT INTO public.users (email, auth_user_id, role, status, full_name, employee_id)
        VALUES (admin_email, auth_user_uuid, 'admin', 'active', SPLIT_PART(admin_email, '@', 1), employee_record_id)
        ON CONFLICT (email) DO UPDATE SET
            auth_user_id = EXCLUDED.auth_user_id,
            role = 'admin',
            status = 'active',
            full_name = EXCLUDED.full_name,
            employee_id = EXCLUDED.employee_id,
            updated_at = NOW();
            
        RAISE NOTICE 'User % ensured to be admin in public.users.', admin_email;
    ELSE
        RAISE NOTICE 'Auth user not found for email: %. Please ensure the user has signed up via the application first.', admin_email;
    END IF;
    
    -- Process services@udrive.ae
    admin_email := 'services@udrive.ae';
    SELECT id INTO auth_user_uuid FROM auth.users WHERE email = admin_email;
    
    IF auth_user_uuid IS NOT NULL THEN
        RAISE NOTICE 'Processing admin user: % (Auth ID: %)', admin_email, auth_user_uuid;
        
        -- Ensure an employee record exists for the admin user
        SELECT id INTO employee_record_id FROM public.employees WHERE email = admin_email;
        
        IF employee_record_id IS NULL THEN
            RAISE NOTICE 'Creating employee record for %', admin_email;
            INSERT INTO public.employees (full_name, email, department, position, employee_id, status)
            VALUES (SPLIT_PART(admin_email, '@', 1), admin_email, 'IT', 'System Administrator', 'EMP_' || REPLACE(gen_random_uuid()::TEXT, '-', ''), 'active')
            RETURNING id INTO employee_record_id;
        ELSE
            RAISE NOTICE 'Employee record already exists for % (Employee ID: %)', admin_email, employee_record_id;
            -- Update existing employee record if needed
            UPDATE public.employees 
            SET department = 'IT', position = 'System Administrator', status = 'active', updated_at = NOW()
            WHERE id = employee_record_id;
        END IF;
        
        -- Ensure a user record exists in public.users and has the 'admin' role
        INSERT INTO public.users (email, auth_user_id, role, status, full_name, employee_id)
        VALUES (admin_email, auth_user_uuid, 'admin', 'active', SPLIT_PART(admin_email, '@', 1), employee_record_id)
        ON CONFLICT (email) DO UPDATE SET
            auth_user_id = EXCLUDED.auth_user_id,
            role = 'admin',
            status = 'active',
            full_name = EXCLUDED.full_name,
            employee_id = EXCLUDED.employee_id,
            updated_at = NOW();
            
        RAISE NOTICE 'User % ensured to be admin in public.users.', admin_email;
    ELSE
        RAISE NOTICE 'Auth user not found for email: %. Please ensure the user has signed up via the application first.', admin_email;
    END IF;
    
    RAISE NOTICE 'Verifying analytics access for all admin users...';
    -- Verify analytics access for all admin users
    FOR admin_email IN SELECT unnest(ARRAY['ifham@udrive.ae', 'saman@udrive.ae', 'talha@udrive.ae', 'services@udrive.ae'])
    LOOP
        SELECT role INTO current_role FROM public.users WHERE email = admin_email;
        IF current_role = 'admin' THEN
            RAISE NOTICE '✅ User % has admin role and should have analytics access.', admin_email;
        ELSE
            RAISE NOTICE '❌ User % does NOT have admin role. Current role: %', admin_email, current_role;
        END IF;
    END LOOP;
    
END $$;

-- Final verification query
SELECT 
    'Final Verification' as step,
    u.email,
    u.role,
    u.status,
    e.full_name,
    e.department,
    e.position
FROM public.users u
LEFT JOIN public.employees e ON u.employee_id = e.id
WHERE u.email IN ('ifham@udrive.ae', 'saman@udrive.ae', 'talha@udrive.ae', 'services@udrive.ae')
ORDER BY u.email;