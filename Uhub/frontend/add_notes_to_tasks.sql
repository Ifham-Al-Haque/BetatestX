-- Add Notes Column to Tasks Table
-- This script adds a notes field to the tasks table for additional information

-- Add notes column if it doesn't exist
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add comment to document the column
COMMENT ON COLUMN tasks.notes IS 'Additional notes and information about the task, visible to all assigned users and the task creator';

