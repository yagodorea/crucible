-- Add created_by column to characters table (FK to users)
ALTER TABLE characters
  ADD COLUMN created_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Create index for fast lookups by creator
CREATE INDEX idx_characters_created_by ON characters(created_by);
