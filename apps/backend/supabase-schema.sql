-- Supabase Schema for D&D Character Creator
-- Run this SQL in your Supabase project's SQL Editor

-- Enable UUID extension (usually already enabled in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on email for fast lookups
CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- API KEYS TABLE
-- ============================================
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL UNIQUE,
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);

-- ============================================
-- ALIGNMENT ENUM TYPE
-- ============================================
CREATE TYPE alignment AS ENUM (
  'LAWFUL_GOOD',
  'LAWFUL_NEUTRAL',
  'LAWFUL_EVIL',
  'NEUTRAL_GOOD',
  'TRUE_NEUTRAL',
  'NEUTRAL_EVIL',
  'CHAOTIC_GOOD',
  'CHAOTIC_NEUTRAL',
  'CHAOTIC_EVIL'
);

-- ============================================
-- CHARACTERS TABLE
-- ============================================
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  class TEXT NOT NULL,
  background TEXT NOT NULL,
  species TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 20),

  -- Ability scores (flattened from embedded object)
  strength INTEGER NOT NULL CHECK (strength >= 1 AND strength <= 30),
  dexterity INTEGER NOT NULL CHECK (dexterity >= 1 AND dexterity <= 30),
  constitution INTEGER NOT NULL CHECK (constitution >= 1 AND constitution <= 30),
  intelligence INTEGER NOT NULL CHECK (intelligence >= 1 AND intelligence <= 30),
  wisdom INTEGER NOT NULL CHECK (wisdom >= 1 AND wisdom <= 30),
  charisma INTEGER NOT NULL CHECK (charisma >= 1 AND charisma <= 30),

  -- Alignment
  alignment alignment NOT NULL,

  -- Other fields
  languages TEXT[] DEFAULT '{}',
  appearance TEXT,
  lore TEXT,

  -- Creator
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on character_id for fast lookups
CREATE INDEX idx_characters_character_id ON characters(character_id);

-- ============================================
-- AUTO-UPDATE TRIGGER FOR updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER characters_updated_at
  BEFORE UPDATE ON characters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (Optional - disabled by default)
-- ============================================
-- Uncomment these lines if you want to enable RLS:
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since we're using API key auth):
-- CREATE POLICY "Allow all operations" ON users FOR ALL USING (true);
-- CREATE POLICY "Allow all operations" ON characters FOR ALL USING (true);
