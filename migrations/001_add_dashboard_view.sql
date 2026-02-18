-- Add dashboard_view preference to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS dashboard_view TEXT DEFAULT 'overview';

-- Update existing users to have default 'overview' view
UPDATE users SET dashboard_view = 'overview' WHERE dashboard_view IS NULL;

-- Create migration for user preferences if needed
-- This can be used to store additional user preferences in the future
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  dashboard_view TEXT DEFAULT 'overview',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "allow_all_user_preferences" ON user_preferences FOR ALL USING (true) WITH CHECK (true);
