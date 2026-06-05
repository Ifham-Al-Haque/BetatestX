-- Fix duplicate create_notification RPC overloads (PGRST203) and role-based delivery.
-- Run in Supabase SQL Editor after backing up. Safe to re-run.

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS func
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'create_notification',
        'create_notifications_for_users',
        'create_notifications_for_role'
      )
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func || ' CASCADE';
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type VARCHAR(50),
  p_title VARCHAR(255),
  p_message TEXT,
  p_data JSONB DEFAULT '{}',
  p_priority VARCHAR(20) DEFAULT 'medium',
  p_action_url TEXT DEFAULT NULL,
  p_action_label VARCHAR(100) DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id, type, title, message, data, priority,
    action_url, action_label, expires_at
  ) VALUES (
    p_user_id, p_type, p_title, p_message, p_data, p_priority,
    p_action_url, p_action_label, p_expires_at
  )
  RETURNING id INTO notification_id;

  RETURN notification_id;
END;
$$;

CREATE OR REPLACE FUNCTION create_notifications_for_users(
  p_user_ids UUID[],
  p_type VARCHAR(50),
  p_title VARCHAR(255),
  p_message TEXT,
  p_data JSONB DEFAULT '{}',
  p_priority VARCHAR(20) DEFAULT 'medium',
  p_action_url TEXT DEFAULT NULL,
  p_action_label VARCHAR(100) DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID;
  notification_count INTEGER := 0;
BEGIN
  IF p_user_ids IS NULL THEN
    RETURN 0;
  END IF;

  FOREACH uid IN ARRAY p_user_ids
  LOOP
    IF uid IS NOT NULL THEN
      PERFORM create_notification(
        uid, p_type, p_title, p_message, p_data,
        p_priority, p_action_url, p_action_label, p_expires_at
      );
      notification_count := notification_count + 1;
    END IF;
  END LOOP;

  RETURN notification_count;
END;
$$;

-- Resolve role → auth user ids from public.users (UHub account holders).
CREATE OR REPLACE FUNCTION create_notifications_for_role(
  p_role VARCHAR(50),
  p_type VARCHAR(50),
  p_title VARCHAR(255),
  p_message TEXT,
  p_data JSONB DEFAULT '{}',
  p_priority VARCHAR(20) DEFAULT 'medium',
  p_action_url TEXT DEFAULT NULL,
  p_action_label VARCHAR(100) DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_ids UUID[];
BEGIN
  SELECT ARRAY_AGG(DISTINCT u.auth_user_id)
  INTO user_ids
  FROM public.users u
  WHERE u.role = p_role
    AND u.auth_user_id IS NOT NULL
    AND (u.status IS NULL OR u.status = 'active');

  RETURN create_notifications_for_users(
    user_ids, p_type, p_title, p_message, p_data,
    p_priority, p_action_url, p_action_label, p_expires_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION create_notification TO authenticated;
GRANT EXECUTE ON FUNCTION create_notifications_for_users TO authenticated;
GRANT EXECUTE ON FUNCTION create_notifications_for_role TO authenticated;
