-- Migration: Combine law_chaos and good_evil into single alignment enum
-- This migration consolidates the two separate alignment axes into a single D&D-style alignment enum

-- Step 1: Create the new combined alignment enum
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

-- Step 2: Add the new alignment column (temporary nullable)
ALTER TABLE characters ADD COLUMN alignment alignment;

-- Step 3: Migrate existing data from law_chaos and good_evil to alignment
UPDATE characters
SET alignment = CASE
  WHEN law_chaos = 'lawful' AND good_evil = 'good' THEN 'LAWFUL_GOOD'::alignment
  WHEN law_chaos = 'lawful' AND good_evil = 'neutral' THEN 'LAWFUL_NEUTRAL'::alignment
  WHEN law_chaos = 'lawful' AND good_evil = 'evil' THEN 'LAWFUL_EVIL'::alignment
  WHEN law_chaos = 'neutral' AND good_evil = 'good' THEN 'NEUTRAL_GOOD'::alignment
  WHEN law_chaos = 'neutral' AND good_evil = 'neutral' THEN 'TRUE_NEUTRAL'::alignment
  WHEN law_chaos = 'neutral' AND good_evil = 'evil' THEN 'NEUTRAL_EVIL'::alignment
  WHEN law_chaos = 'chaotic' AND good_evil = 'good' THEN 'CHAOTIC_GOOD'::alignment
  WHEN law_chaos = 'chaotic' AND good_evil = 'neutral' THEN 'CHAOTIC_NEUTRAL'::alignment
  WHEN law_chaos = 'chaotic' AND good_evil = 'evil' THEN 'CHAOTIC_EVIL'::alignment
  ELSE 'TRUE_NEUTRAL'::alignment -- Default fallback
END;

-- Step 4: Make the new column NOT NULL
ALTER TABLE characters ALTER COLUMN alignment SET NOT NULL;

-- Step 5: Drop the old columns
ALTER TABLE characters DROP COLUMN law_chaos;
ALTER TABLE characters DROP COLUMN good_evil;

-- Step 6: Drop the old enum types
DROP TYPE law_chaos;
DROP TYPE good_evil;
