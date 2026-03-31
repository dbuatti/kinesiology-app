-- Add notion_planner_id to track the Yearly Planner database entry separately
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS notion_planner_id TEXT;