/*
  # Initial Schema for SPC QUIZ ONLINE

  1. New Tables
    - `profiles` - User profiles with role information
    - `courses` - Available courses/subjects
    - `quizzes` - Quiz information
    - `questions` - Quiz questions
    - `options` - Question options
    - `quiz_results` - Student quiz results
    
  2. Security
    - Enable RLS on all tables
    - Add policies for proper data access
*/

-- Create profiles table to extend auth.users
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Create quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  time_limit INTEGER, -- in minutes
  passing_score INTEGER DEFAULT 70, -- percentage
  question_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'true_false')),
  points INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Create options table
CREATE TABLE IF NOT EXISTS options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE options ENABLE ROW LEVEL SECURITY;

-- Create quiz_results table
CREATE TABLE IF NOT EXISTS quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL, -- percentage
  time_taken INTEGER, -- in seconds
  answers JSONB, -- store student answers
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

-- Add trigger to update quizzes.question_count when questions are added or removed
CREATE OR REPLACE FUNCTION update_quiz_question_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Update the question count for the quiz
    UPDATE quizzes
    SET question_count = (
      SELECT COUNT(*) FROM questions WHERE quiz_id = NEW.quiz_id
    )
    WHERE id = NEW.quiz_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Update the question count for the quiz
    UPDATE quizzes
    SET question_count = (
      SELECT COUNT(*) FROM questions WHERE quiz_id = OLD.quiz_id
    )
    WHERE id = OLD.quiz_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_quiz_question_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON questions
FOR EACH ROW
EXECUTE FUNCTION update_quiz_question_count();

-- RLS Policies

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admin can view all profiles"
  ON profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin can insert profiles"
  ON profiles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin can update profiles"
  ON profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Courses policies
CREATE POLICY "Anyone can view courses"
  ON courses
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can insert/update/delete courses"
  ON courses
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Quizzes policies
CREATE POLICY "Anyone can view active quizzes"
  ON quizzes
  FOR SELECT
  TO authenticated
  USING (is_active = true OR 
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND (role = 'admin' OR role = 'teacher')
    )
  );

CREATE POLICY "Teachers can view their own quizzes"
  ON quizzes
  FOR SELECT
  USING (
    teacher_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Teachers can insert their own quizzes"
  ON quizzes
  FOR INSERT
  WITH CHECK (
    teacher_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Teachers can update their own quizzes"
  ON quizzes
  FOR UPDATE
  USING (
    teacher_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Teachers can delete their own quizzes"
  ON quizzes
  FOR DELETE
  USING (
    teacher_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Questions policies
CREATE POLICY "Anyone can view questions"
  ON questions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teachers can insert/update/delete questions"
  ON questions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM quizzes
      WHERE quizzes.id = questions.quiz_id
      AND (quizzes.teacher_id = auth.uid() OR
           EXISTS (
             SELECT 1 FROM profiles
             WHERE id = auth.uid() AND role = 'admin'
           )
          )
    )
  );

-- Options policies
CREATE POLICY "Anyone can view options"
  ON options
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teachers can insert/update/delete options"
  ON options
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM questions
      JOIN quizzes ON questions.quiz_id = quizzes.id
      WHERE questions.id = options.question_id
      AND (quizzes.teacher_id = auth.uid() OR
           EXISTS (
             SELECT 1 FROM profiles
             WHERE id = auth.uid() AND role = 'admin'
           )
          )
    )
  );

-- Quiz results policies
CREATE POLICY "Students can view their own results"
  ON quiz_results
  FOR SELECT
  USING (
    student_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND (role = 'admin' OR role = 'teacher')
    )
  );

CREATE POLICY "Students can insert their own results"
  ON quiz_results
  FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Teachers can view results for their quizzes"
  ON quiz_results
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM quizzes
      WHERE quizzes.id = quiz_results.quiz_id
      AND (quizzes.teacher_id = auth.uid() OR
           EXISTS (
             SELECT 1 FROM profiles
             WHERE id = auth.uid() AND role = 'admin'
           )
          )
    )
  );

-- Insert initial admin user (change the email/password before running in production)
INSERT INTO auth.users (id, email, email_confirmed_at, role)
VALUES (
  gen_random_uuid(),
  'admin@spcquiz.com',
  now(),
  'authenticated'
) ON CONFLICT DO NOTHING;

-- Get the user id
DO $$
DECLARE
  user_id UUID;
BEGIN
  SELECT id INTO user_id FROM auth.users WHERE email = 'admin@spcquiz.com';
  
  -- Insert admin profile
  INSERT INTO profiles (id, full_name, email, role)
  VALUES (
    user_id,
    'System Administrator',
    'admin@spcquiz.com',
    'admin'
  ) ON CONFLICT DO NOTHING;
END $$;