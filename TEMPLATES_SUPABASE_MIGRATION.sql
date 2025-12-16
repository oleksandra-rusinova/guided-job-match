-- Templates Supabase Migration
-- This SQL script creates all necessary tables for storing templates in Supabase
-- Run this in your Supabase SQL Editor to enable cloud storage for templates

-- ============================================================================
-- Question Templates Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS question_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  step_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE question_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public SELECT on question_templates" ON question_templates;
DROP POLICY IF EXISTS "Allow public INSERT on question_templates" ON question_templates;
DROP POLICY IF EXISTS "Allow public UPDATE on question_templates" ON question_templates;
DROP POLICY IF EXISTS "Allow public DELETE on question_templates" ON question_templates;

-- Create policies to allow all operations (public access)
-- Adjust these policies based on your security requirements
CREATE POLICY "Allow public SELECT on question_templates"
  ON question_templates FOR SELECT
  USING (true);

CREATE POLICY "Allow public INSERT on question_templates"
  ON question_templates FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public UPDATE on question_templates"
  ON question_templates FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public DELETE on question_templates"
  ON question_templates FOR DELETE
  USING (true);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_question_templates_created_at 
  ON question_templates(created_at DESC);

-- ============================================================================
-- Prototype Templates Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS prototype_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  prototype_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE prototype_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public SELECT on prototype_templates" ON prototype_templates;
DROP POLICY IF EXISTS "Allow public INSERT on prototype_templates" ON prototype_templates;
DROP POLICY IF EXISTS "Allow public UPDATE on prototype_templates" ON prototype_templates;
DROP POLICY IF EXISTS "Allow public DELETE on prototype_templates" ON prototype_templates;

-- Create policies to allow all operations (public access)
CREATE POLICY "Allow public SELECT on prototype_templates"
  ON prototype_templates FOR SELECT
  USING (true);

CREATE POLICY "Allow public INSERT on prototype_templates"
  ON prototype_templates FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public UPDATE on prototype_templates"
  ON prototype_templates FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public DELETE on prototype_templates"
  ON prototype_templates FOR DELETE
  USING (true);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_prototype_templates_created_at 
  ON prototype_templates(created_at DESC);

-- ============================================================================
-- Application Step Templates Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS application_step_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  step_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE application_step_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public SELECT on application_step_templates" ON application_step_templates;
DROP POLICY IF EXISTS "Allow public INSERT on application_step_templates" ON application_step_templates;
DROP POLICY IF EXISTS "Allow public UPDATE on application_step_templates" ON application_step_templates;
DROP POLICY IF EXISTS "Allow public DELETE on application_step_templates" ON application_step_templates;

-- Create policies to allow all operations (public access)
CREATE POLICY "Allow public SELECT on application_step_templates"
  ON application_step_templates FOR SELECT
  USING (true);

CREATE POLICY "Allow public INSERT on application_step_templates"
  ON application_step_templates FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public UPDATE on application_step_templates"
  ON application_step_templates FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public DELETE on application_step_templates"
  ON application_step_templates FOR DELETE
  USING (true);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_application_step_templates_created_at 
  ON application_step_templates(created_at DESC);

-- ============================================================================
-- Verification Queries (Optional - run these to verify tables were created)
-- ============================================================================
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('question_templates', 'prototype_templates', 'application_step_templates');

