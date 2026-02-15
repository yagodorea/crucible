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

class DataService {
  private classesCache: ClassInfo[] | null = null;
  private racesCache: RaceInfo[] | null = null;
  private backgroundsCache: BackgroundInfo[] | null = null;

  async getClasses(): Promise<ClassInfo[]> {
    if (this.classesCache) {
      return this.classesCache;
    }

    const classFiles = [
      'barbarian', 'bard', 'cleric', 'druid', 'fighter',
      'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard'
    ];

    const classes: ClassInfo[] = [];

    for (const className of classFiles) {
      try {
        const filePath = join(DATA_PATH, 'class', `class-${className}.json`);
        const fileContent = await readFile(filePath, 'utf-8');
        const data = JSON.parse(fileContent);

        if (data.class && data.class.length > 0) {
          // Get the XPHB edition if available, otherwise the first one
          const classData = data.class.find((c: {edition?: string}) => c.edition === 'one') || data.class[0];
          classes.push(classData as ClassInfo);
        }
      } catch (error) {
        console.error(`Error loading class ${className}:`, error);
      }
    }

    this.classesCache = classes;
    return classes;
  }

  async getRaces(): Promise<RaceInfo[]> {
    if (this.racesCache) {
      return this.racesCache;
    }

    try {
      const filePath = join(DATA_PATH, 'races.json');
      const fileContent = await readFile(filePath, 'utf-8');
      const data = JSON.parse(fileContent);

      // Filter for 2024 edition races
      const races = data.race?.filter((r: {edition?: string; _copy?: unknown}) =>
        (r.edition === 'one' || !r.edition) && !r._copy
      ) || [];

      this.racesCache = races;
      return races;
    } catch (error) {
      console.error('Error loading races:', error);
      return [];
    }
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

  async getBackgrounds(): Promise<BackgroundInfo[]> {
    if (this.backgroundsCache) {
      return this.backgroundsCache;
    }

    try {
      const filePath = join(DATA_PATH, 'backgrounds.json');
      const fileContent = await readFile(filePath, 'utf-8');
      const data = JSON.parse(fileContent);

      // Filter for 2024 edition backgrounds
      const backgrounds = data.background?.filter((b: {edition?: string; _copy?: unknown}) =>
        (b.edition === 'one' || !b.edition) && !b._copy
      ) || [];

      this.backgroundsCache = backgrounds;
      return backgrounds;
    } catch (error) {
      console.error('Error loading backgrounds:', error);
      return [];
    }
  }
}

export default new DataService();
