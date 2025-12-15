-- Create login_history table for tracking user logins
CREATE TABLE IF NOT EXISTS login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (public access)
-- Adjust these policies based on your security requirements
CREATE POLICY "Allow public SELECT on login_history"
  ON login_history FOR SELECT
  USING (true);

CREATE POLICY "Allow public INSERT on login_history"
  ON login_history FOR INSERT
  WITH CHECK (true);

-- Create index for better query performance (ordered by timestamp descending)
CREATE INDEX IF NOT EXISTS idx_login_history_timestamp 
  ON login_history(timestamp DESC);

-- Create index on email for filtering
CREATE INDEX IF NOT EXISTS idx_login_history_email 
  ON login_history(email);

