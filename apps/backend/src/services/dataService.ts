import { readFile } from 'fs/promises';
import { join } from 'path';

const DATA_PATH = join(process.cwd(), 'data');

export interface ClassInfo {
  name: string;
  source: string;
  primaryAbility?: string;
  complexity?: string;
  hd?: {
    number: number;
    faces: number;
  };
  proficiency?: string[];
}

export interface RaceInfo {
  name: string;
  source: string;
  size?: string[];
  speed?: {
    walk?: number;
    fly?: number;
  };
  ability?: Array<Record<string, number>>;
}

export interface BackgroundInfo {
  name: string;
  source: string;
  ability?: unknown[];
  feats?: unknown[];
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

export interface BackgroundDetail {
  name: string;
  descriptions: BackgroundDescriptionSource[];
}

export interface RaceDetail {
  name: string;
  descriptions: RaceDescriptionSource[];
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

export interface SubclassFeatureInfo {
  name: string;
  level: number;
  entries: string[];
}

export interface SubclassDetail {
  name: string;
  source: string;
  className: string;
  description: string;
  features: SubclassFeatureInfo[];
}

export interface ClassFeatureInfo {
  name: string;
  level: number;
  entries: string[];
}

export interface ClassDetail {
  name: string;
  source: string;
  description: string;
  primaryAbility?: string;
  complexity?: string;
  hd?: { number: number; faces: number };
  proficiency?: string[];
  startingProficiencies?: {
    armor?: string[];
    weapons?: string[];
    skills?: Array<{ choose?: { from: string[]; count: number } }>;
  };
  subclasses: string[];
  features: ClassFeatureInfo[];
}

// Cache for parsed JSON files
const cache = new Map<string, unknown>();

async function readJson<T>(relPath: string): Promise<T> {
  if (cache.has(relPath)) return cache.get(relPath) as T;
  const data = JSON.parse(await readFile(join(DATA_PATH, relPath), 'utf-8'));
  cache.set(relPath, data);
  return data as T;
}

class DataService {
  async getClasses(): Promise<ClassInfo[]> {
    return readJson<ClassInfo[]>('classes.json');
  }

  async getClassDetail(className: string): Promise<ClassDetail | null> {
    try {
      const data = await readJson<{ detail: ClassDetail }>(`classes/${className}.json`);
      return data.detail;
    } catch {
      return null;
    }
  }

  async getSubclassDetail(className: string, subclassName: string): Promise<SubclassDetail | null> {
    try {
      const data = await readJson<{ subclasses: Record<string, SubclassDetail> }>(`classes/${className}.json`);
      return data.subclasses[subclassName.toLowerCase()] || null;
    } catch {
      return null;
    }
  }

  async getRaces(): Promise<RaceInfo[]> {
    const data = await readJson<{ races: RaceDetail[] }>('races.json');
    // Flatten grouped races into individual source entries
    return data.races.flatMap(race =>
      race.descriptions.map(d => ({
        name: race.name,
        source: d.source,
        size: d.size,
        speed: d.speed,
        ability: d.ability,
      }))
    );
  }

  async getRaceDetail(raceName: string): Promise<RaceDetail | null> {
    const data = await readJson<{ races: RaceDetail[] }>('races.json');
    return data.races.find(r => r.name === raceName) || null;
  }

  async getBackgrounds(): Promise<BackgroundInfo[]> {
    const data = await readJson<{ backgrounds: BackgroundDetail[] }>('backgrounds.json');
    // Flatten grouped backgrounds into individual source entries
    return data.backgrounds.flatMap(bg =>
      bg.descriptions.map(d => ({
        name: bg.name,
        source: d.source,
      }))
    );
  }

  async getBackgroundDetail(backgroundName: string): Promise<BackgroundDetail | null> {
    const data = await readJson<{ backgrounds: BackgroundDetail[] }>('backgrounds.json');
    return data.backgrounds.find(
      b => b.name.toLowerCase() === backgroundName.toLowerCase()
    ) || null;
  }

  async getLanguages(): Promise<string[]> {
    const data = await readJson<{ languages: string[] }>('languages.json');
    return data.languages;
  }

  async getSources(): Promise<string[]> {
    const [classes, races, backgrounds] = await Promise.all([
      this.getClasses(),
      this.getRaces(),
      this.getBackgrounds(),
    ]);

    const sources = new Set<string>();
    for (const c of classes) sources.add(c.source);
    for (const r of races) sources.add(r.source);
    for (const b of backgrounds) sources.add(b.source);

    return [...sources].sort();
  }
}

export default new DataService();
