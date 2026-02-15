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

class DataService {
  private classesCache: ClassInfo[] | null = null;
  private racesCache: RaceInfo[] | null = null;
  private backgroundsCache: BackgroundInfo[] | null = null;

  async getClasses(): Promise<ClassInfo[]> {
    if (this.classesCache) {
      return this.classesCache;
    }

    const classFiles = [
      'artificer', 'barbarian', 'bard', 'cleric', 'druid', 'fighter',
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

  async getClassDetail(className: string): Promise<ClassDetail | null> {
    try {
      const classFilePath = join(DATA_PATH, 'class', `class-${className}.json`);
      const classContent = await readFile(classFilePath, 'utf-8');
      const classData = JSON.parse(classContent);

      // Get the "one" edition class data
      const oneClass = classData.class?.find((c: { edition?: string }) => c.edition === 'one');
      if (!oneClass) return null;

      const classSource = oneClass.source;

      // Read fluff file for description
      let description = '';
      try {
        const fluffFilePath = join(DATA_PATH, 'class', `fluff-class-${className}.json`);
        const fluffContent = await readFile(fluffFilePath, 'utf-8');
        const fluffData = JSON.parse(fluffContent);

        const classFluff = fluffData.classFluff?.find(
          (f: { source?: string }) => f.source === classSource
        );
        if (classFluff?.entries) {
          // Extract text entries from the first section
          const section = classFluff.entries.find(
            (e: { type?: string }) => e.type === 'section'
          );
          if (section?.entries) {
            description = section.entries
              .filter((e: unknown) => typeof e === 'string')
              .join('\n\n');
          }
        }
      } catch {
        // Fluff file may not exist for all classes
      }

      // Extract subclass names matching the class source
      const subclasses = (classData.subclass || [])
        .filter(
          (sc: { source?: string; classSource?: string }) =>
            sc.source === classSource && sc.classSource === classSource
        )
        .map((sc: { name: string }) => sc.name);

      // Extract class features from the class source
      const features: ClassFeatureInfo[] = (classData.classFeature || [])
        .filter(
          (f: { source?: string; classSource?: string }) =>
            f.source === classSource && f.classSource === classSource
        )
        .map((f: { name: string; level: number; entries?: unknown[] }) => ({
          name: f.name,
          level: f.level,
          entries: (f.entries || []).filter((e: unknown) => typeof e === 'string'),
        }))
        .sort((a: ClassFeatureInfo, b: ClassFeatureInfo) => a.level - b.level);

      return {
        name: oneClass.name,
        source: oneClass.source,
        description,
        hd: oneClass.hd,
        proficiency: oneClass.proficiency,
        startingProficiencies: oneClass.startingProficiencies,
        subclasses,
        features,
      };
    } catch (error) {
      console.error(`Error loading class detail for ${className}:`, error);
      return null;
    }
  }

  async getSubclassDetail(className: string, subclassName: string): Promise<SubclassDetail | null> {
    try {
      const classFilePath = join(DATA_PATH, 'class', `class-${className}.json`);
      const classContent = await readFile(classFilePath, 'utf-8');
      const classData = JSON.parse(classContent);

      // Get the class source from the "one" edition
      const oneClass = classData.class?.find((c: { edition?: string }) => c.edition === 'one');
      if (!oneClass) return null;
      const classSource = oneClass.source;

      // Find the subclass entry matching the class source
      const subclass = (classData.subclass || []).find(
        (sc: { name: string; source?: string; classSource?: string }) =>
          sc.source === classSource && sc.classSource === classSource &&
          sc.name.toLowerCase() === subclassName.toLowerCase()
      );
      if (!subclass) return null;

      // Extract text entries from matching subclassFeature entries
      const shortName = subclass.shortName || subclass.name;
      const allFeatures: SubclassFeatureInfo[] = (classData.subclassFeature || [])
        .filter(
          (f: { source?: string; subclassSource?: string; subclassShortName?: string }) =>
            f.source === classSource && f.subclassSource === classSource &&
            f.subclassShortName === shortName
        )
        .map((f: { name: string; level: number; entries?: unknown[] }) => ({
          name: f.name,
          level: f.level,
          entries: (f.entries || []).filter((e: unknown) => typeof e === 'string'),
        }));

      // The level 3 intro feature (same name as subclass) gives the description
      const introFeature = allFeatures.find(
        (f: SubclassFeatureInfo) => f.name === subclass.name && f.level === 3
      );
      const description = introFeature?.entries
        .filter((e: string) => !e.startsWith('{@i '))
        .join('\n\n') || '';

      // All other features are the ability features
      const features = allFeatures.filter(
        (f: SubclassFeatureInfo) => f.name !== subclass.name
      );

      return {
        name: subclass.name,
        source: subclass.source,
        className: subclass.className,
        description,
        features,
      };
    } catch (error) {
      console.error(`Error loading subclass detail for ${className}/${subclassName}:`, error);
      return null;
    }
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
