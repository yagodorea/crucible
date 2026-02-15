export interface AbilityScores {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

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

export interface Character {
  characterId?: string;
  name: string;
  class: string;
  background: string;
  species: string;
  level: number;
  abilityScores: AbilityScores;
  alignment: Alignment | '';
  languages: string[];
  appearance?: string;
  lore?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ClassInfo {
  name: string;
  source: string;
  primaryAbility: string;
  complexity: string;
  hd?: {
    number: number;
    faces: number;
  };
}

export interface ClassFeatureInfo {
  name: string;
  level: number;
  entries: string[];
}

export interface ClassDetailInfo {
  name: string;
  source: string;
  description: string;
  primaryAbility: string;
  complexity: string;
  hd?: {
    number: number;
    faces: number;
  };
  proficiency?: string[];
  startingProficiencies?: {
    armor?: string[];
    weapons?: string[];
    skills?: Array<{ choose?: { from: string[]; count: number } }>;
  };
  subclasses: string[];
  features: ClassFeatureInfo[];
}

export interface SubclassFeatureInfo {
  name: string;
  level: number;
  entries: string[];
}

export interface SubclassDetailInfo {
  name: string;
  source: string;
  className: string;
  description: string;
  features: SubclassFeatureInfo[];
}

export interface RaceInfo {
  name: string;
  source: string;
  size?: string[];
  speed?: {
    walk?: number;
    fly?: number;
  };
}

export interface BackgroundInfo {
  name: string;
  source: string;
}

export interface FeatDetail {
  name: string;
  source: string;
  description: string;
}

export interface BackgroundDescriptionSource {
  source: string;
  description: string;
  abilityBonuses?: Array<{ from: string[]; count: number; weights?: number[] }>;
  feats?: FeatDetail[];
  skillProficiencies?: string[];
  toolProficiencies?: string[];
  languages?: string[];
  equipment?: string[];
}

export interface BackgroundDetailInfo {
  name: string;
  descriptions: BackgroundDescriptionSource[];
}

export interface RaceDescriptionSource {
  source: string;
  description: string;
  ability?: Array<Record<string, number>>;
  size?: string[];
  speed?: {
    walk?: number;
    fly?: number;
  };
  languages?: string[];
  traits?: string[];
}

export interface RaceDetailInfo {
  name: string;
  descriptions: RaceDescriptionSource[];
}
