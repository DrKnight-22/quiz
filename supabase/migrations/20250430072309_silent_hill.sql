/*
  # Admin Registration Schema Updates

  1. Changes
    - Add admin registration request table
    - Add policies for admin registration
    - Add profiles table if not exists
*/

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  email TEXT,
  role TEXT CHECK (role IN ('admin', 'teacher', 'student')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

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

-- Add policies for profiles
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users only"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);