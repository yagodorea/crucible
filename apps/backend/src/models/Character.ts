// Alignment type - single enum combining law/chaos and good/evil axes
export type Alignment =
  | 'LAWFUL_GOOD'
  | 'LAWFUL_NEUTRAL'
  | 'LAWFUL_EVIL'
  | 'NEUTRAL_GOOD'
  | 'TRUE_NEUTRAL'
  | 'NEUTRAL_EVIL'
  | 'CHAOTIC_GOOD'
  | 'CHAOTIC_NEUTRAL'
  | 'CHAOTIC_EVIL';

// Database row type (flat structure matching Supabase table)
export interface DbCharacter {
  id: string;
  character_id: string;
  name: string;
  class: string;
  background: string;
  species: string;
  level: number;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  alignment: Alignment;
  languages: string[];
  appearance: string | null;
  lore: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// API response type (nested structure for frontend compatibility)
export interface IAbilityScores {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export interface CharacterResponse {
  id: string;
  characterId: string;
  name: string;
  class: string;
  background: string;
  species: string;
  level: number;
  abilityScores: IAbilityScores;
  alignment: Alignment;
  languages: string[];
  appearance?: string;
  lore?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Input type for creating/updating characters
export interface CharacterInput {
  name: string;
  class: string;
  background: string;
  species: string;
  level: number;
  abilityScores: IAbilityScores;
  alignment: Alignment;
  languages?: string[];
  appearance?: string;
  lore?: string;
}

// DB row with joined user name
export interface DbCharacterWithCreator extends DbCharacter {
  users?: { name: string } | null;
}

// Transform DB row to API response format
export function toCharacterResponse(row: DbCharacterWithCreator): CharacterResponse {
  return {
    id: row.id,
    characterId: row.character_id,
    name: row.name,
    class: row.class,
    background: row.background,
    species: row.species,
    level: row.level,
    abilityScores: {
      strength: row.strength,
      dexterity: row.dexterity,
      constitution: row.constitution,
      intelligence: row.intelligence,
      wisdom: row.wisdom,
      charisma: row.charisma
    },
    alignment: row.alignment,
    languages: row.languages || [],
    appearance: row.appearance || undefined,
    lore: row.lore || undefined,
    createdBy: row.users?.name || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// Transform API input to DB format for insert
export function toDbInsert(input: CharacterInput, characterId: string, userId?: string): Omit<DbCharacter, 'id' | 'created_at' | 'updated_at'> {
  return {
    character_id: characterId,
    name: input.name,
    class: input.class,
    background: input.background,
    species: input.species,
    level: input.level,
    strength: input.abilityScores.strength,
    dexterity: input.abilityScores.dexterity,
    constitution: input.abilityScores.constitution,
    intelligence: input.abilityScores.intelligence,
    wisdom: input.abilityScores.wisdom,
    charisma: input.abilityScores.charisma,
    alignment: input.alignment,
    languages: input.languages || [],
    appearance: input.appearance || null,
    lore: input.lore || null,
    created_by: userId || null
  };
}

// Transform API input to DB format for update (partial)
export function toDbUpdate(input: Partial<CharacterInput>): Record<string, unknown> {
  const update: Record<string, unknown> = {};

  if (input.name !== undefined) update.name = input.name;
  if (input.class !== undefined) update.class = input.class;
  if (input.background !== undefined) update.background = input.background;
  if (input.species !== undefined) update.species = input.species;
  if (input.level !== undefined) update.level = input.level;
  if (input.languages !== undefined) update.languages = input.languages;
  if (input.appearance !== undefined) update.appearance = input.appearance;
  if (input.lore !== undefined) update.lore = input.lore;
  if (input.alignment !== undefined) update.alignment = input.alignment;

  if (input.abilityScores) {
    update.strength = input.abilityScores.strength;
    update.dexterity = input.abilityScores.dexterity;
    update.constitution = input.abilityScores.constitution;
    update.intelligence = input.abilityScores.intelligence;
    update.wisdom = input.abilityScores.wisdom;
    update.charisma = input.abilityScores.charisma;
  }


  return update;
}
