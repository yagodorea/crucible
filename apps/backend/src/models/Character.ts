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
  law_chaos: 'lawful' | 'neutral' | 'chaotic' | null;
  good_evil: 'good' | 'neutral' | 'evil' | null;
  languages: string[];
  appearance: string | null;
  lore: string | null;
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

export interface IAlignment {
  lawChaos: 'lawful' | 'neutral' | 'chaotic';
  goodEvil: 'good' | 'neutral' | 'evil';
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
  alignment: IAlignment;
  languages: string[];
  appearance?: string;
  lore?: string;
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
  alignment: IAlignment;
  languages?: string[];
  appearance?: string;
  lore?: string;
}

// Transform DB row to API response format
export function toCharacterResponse(row: DbCharacter): CharacterResponse {
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
    alignment: {
      lawChaos: row.law_chaos || 'neutral',
      goodEvil: row.good_evil || 'neutral'
    },
    languages: row.languages || [],
    appearance: row.appearance || undefined,
    lore: row.lore || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// Transform API input to DB format for insert
export function toDbInsert(input: CharacterInput, characterId: string): Omit<DbCharacter, 'id' | 'created_at' | 'updated_at'> {
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
    law_chaos: input.alignment.lawChaos,
    good_evil: input.alignment.goodEvil,
    languages: input.languages || [],
    appearance: input.appearance || null,
    lore: input.lore || null
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

  if (input.abilityScores) {
    update.strength = input.abilityScores.strength;
    update.dexterity = input.abilityScores.dexterity;
    update.constitution = input.abilityScores.constitution;
    update.intelligence = input.abilityScores.intelligence;
    update.wisdom = input.abilityScores.wisdom;
    update.charisma = input.abilityScores.charisma;
  }

  if (input.alignment) {
    update.law_chaos = input.alignment.lawChaos;
    update.good_evil = input.alignment.goodEvil;
  }

  return update;
}
