/*
  # Admin Registration Schema Updates

  1. Changes
    - Add admin registration request table
    - Add policies for admin registration
*/

-- Create admin registration requests table
CREATE TABLE IF NOT EXISTS admin_registration_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_registration_requests ENABLE ROW LEVEL SECURITY;

-- Policies for admin registration requests
CREATE POLICY "Anyone can create registration requests"
  ON admin_registration_requests
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Only admins can view registration requests"
  ON admin_registration_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can update registration requests"
  ON admin_registration_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );