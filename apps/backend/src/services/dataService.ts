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
  private featsCache: Map<string, FeatDetail> | null = null;

  private async getFeatsLookup(): Promise<Map<string, FeatDetail>> {
    if (this.featsCache) {
      return this.featsCache;
    }

    try {
      const filePath = join(DATA_PATH, 'feats.json');
      const fileContent = await readFile(filePath, 'utf-8');
      const data = JSON.parse(fileContent);

      const lookup = new Map<string, FeatDetail>();
      for (const feat of data.feat || []) {
        const featObj = feat as { name?: string; source?: string; entries?: unknown[] };
        if (featObj.name && featObj.source) {
          const key = `${featObj.name.toLowerCase()}|${featObj.source.toLowerCase()}`;
          lookup.set(key, {
            name: featObj.name,
            source: featObj.source,
            description: this.extractFeatDescription(featObj.entries || []),
          });
        }
      }

      this.featsCache = lookup;
      return lookup;
    } catch (error) {
      console.error('Error loading feats:', error);
      return new Map();
    }
  }

  private extractFeatDescription(entries: unknown[]): string {
    const result: string[] = [];

    const cleanMarkup = (text: string): string => {
      // Extract text from {@...} markup, keeping the words
      // Handles: {@tag text|...} and {@tag text}
      let cleaned = text.replace(/{@\w+\s+([^|}]+)(?:\|[^}]*)?}/g, '$1');
      // Handles: {@tagtext|...} and {@tagtext}
      cleaned = cleaned.replace(/{@\w+([^|}\s]+)(?:\||})[^}]*}/g, '$1');
      return cleaned;
    };

    for (const entry of entries) {
      if (typeof entry === 'string') {
        result.push(cleanMarkup(entry));
      } else if (entry && typeof entry === 'object') {
        const obj = entry as Record<string, unknown>;
        if (obj.type === 'entries' && obj.name && Array.isArray(obj.entries)) {
          const subEntries = (obj.entries as unknown[])
            .filter((e: unknown) => typeof e === 'string')
            .map((e: string) => cleanMarkup(e));
          if (subEntries.length > 0) {
            result.push(`${obj.name}: ${subEntries.join(' ')}`);
          }
        } else if (obj.entry) {
          if (typeof obj.entry === 'string') {
            result.push(cleanMarkup(obj.entry));
          }
        }
      }
    }

    return result.join(' ').replace(/\s+/g, ' ').trim();
  }

  private cleanMarkupInArray(arr: unknown[]): unknown[] {
    const cleanMarkup = (text: string): string => {
      // Handles: {@tag text|...} and {@tag text}
      let cleaned = text.replace(/{@\w+\s+([^|}]+)(?:\|[^}]*)?}/g, '$1');
      // Handles: {@tagtext|...} and {@tagtext}
      cleaned = cleaned.replace(/{@\w+([^|}\s]+)(?:\||})[^}]*}/g, '$1');
      return cleaned;
    };

    return arr.map(item => {
      if (typeof item === 'string') {
        return cleanMarkup(item);
      } else if (Array.isArray(item)) {
        return this.cleanMarkupInArray(item);
      } else if (item && typeof item === 'object') {
        const cleaned: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(item)) {
          if (typeof value === 'string') {
            cleaned[key] = cleanMarkup(value);
          } else if (Array.isArray(value)) {
            cleaned[key] = this.cleanMarkupInArray(value);
          } else {
            cleaned[key] = value;
          }
        }
        return cleaned;
      }
      return item;
    });
  }

  private resolveFeatReferences(featRefs: string[], featsLookup: Map<string, FeatDetail>): FeatDetail[] {
    return featRefs
      .map(ref => {
        const [name, source] = ref.split('|');
        const key = `${name.toLowerCase()}|${(source || '').toLowerCase()}`;
        return featsLookup.get(key);
      })
      .filter((f): f is FeatDetail => f !== undefined);
  }

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
            description = this.extractFluffDescription(section.entries);
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
        .map((f: { name: string; level: number; entries?: unknown[] }) => {
          const rawEntries = (f.entries || []).filter((e: unknown) => typeof e === 'string');
          return {
            name: f.name,
            level: f.level,
            entries: this.cleanMarkupInArray(rawEntries) as string[],
          };
        })
        .sort((a: ClassFeatureInfo, b: ClassFeatureInfo) => a.level - b.level);

      // Clean markup in startingProficiencies arrays
      const cleanedProficiencies = oneClass.startingProficiencies
        ? this.cleanMarkupInArray([oneClass.startingProficiencies])[0] as Record<string, unknown>
        : undefined;

      return {
        name: oneClass.name,
        source: oneClass.source,
        description,
        hd: oneClass.hd,
        proficiency: oneClass.proficiency,
        startingProficiencies: cleanedProficiencies,
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
        .map((f: { name: string; level: number; entries?: unknown[] }) => {
          const rawEntries = (f.entries || []).filter((e: unknown) => typeof e === 'string');
          return {
            name: f.name,
            level: f.level,
            entries: this.cleanMarkupInArray(rawEntries) as string[],
          };
        });

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

  async getBackgroundDetail(backgroundName: string): Promise<BackgroundDetail | null> {
    try {
      // Read backgrounds.json for mechanical data
      const bgFilePath = join(DATA_PATH, 'backgrounds.json');
      const bgContent = await readFile(bgFilePath, 'utf-8');
      const bgData = JSON.parse(bgContent);

      // Read fluff-backgrounds.json for descriptions
      const fluffFilePath = join(DATA_PATH, 'fluff-backgrounds.json');
      const fluffContent = await readFile(fluffFilePath, 'utf-8');
      const fluffData = JSON.parse(fluffContent);

      // Get feats lookup for resolving feat references
      const featsLookup = await this.getFeatsLookup();

      // Get all 2024 edition backgrounds by name
      const backgroundByName = new Map<string, Array<{ source: string; abilityBonuses?: Array<{ from: string[]; count: number; weights?: number[] }>; feats?: FeatDetail[]; skillProficiencies?: string[]; toolProficiencies?: string[]; languages?: string[]; equipment?: string[] }>>();

      (bgData.background || []).forEach((bg: { name?: string; edition?: string; source?: string; _copy?: unknown; ability?: unknown[]; feats?: unknown[]; skillProficiencies?: unknown[]; toolProficiencies?: unknown[]; languageProficiencies?: unknown[]; entries?: unknown[] }) => {
        if ((bg.edition === 'one' || (!bg.edition && !bg._copy)) && bg.name) {
          if (!backgroundByName.has(bg.name)) {
            backgroundByName.set(bg.name, []);
          }
          backgroundByName.get(bg.name)!.push(this.extractBackgroundMechanics(bg, featsLookup));
        }
      });

      const matchingBackgrounds = backgroundByName.get(backgroundName);
      if (!matchingBackgrounds || matchingBackgrounds.length === 0) return null;

      // Find all matching fluffs by name
      const matchingFluffs = (fluffData.backgroundFluff || []).filter(
        (f: { name?: string }) => f.name?.toLowerCase() === backgroundName.toLowerCase()
      );

      // Combine mechanical data with descriptions for each source
      const descriptions: BackgroundDescriptionSource[] = matchingFluffs.map((fluff: { source?: string; entries?: unknown[] }) => {
        const matchingMechanics = matchingBackgrounds.find(b => b.source === fluff.source);
        return {
          source: fluff.source || 'Unknown',
          description: fluff.entries ? this.extractFluffDescription(fluff.entries) : '',
          abilityBonuses: matchingMechanics?.abilityBonuses,
          feats: matchingMechanics?.feats,
          skillProficiencies: matchingMechanics?.skillProficiencies,
          toolProficiencies: matchingMechanics?.toolProficiencies,
          languages: matchingMechanics?.languages,
          equipment: matchingMechanics?.equipment,
        };
      }).filter((d: BackgroundDescriptionSource) => d.description.length > 0);

      if (descriptions.length === 0) return null;

      return {
        name: backgroundName,
        descriptions,
      };
    } catch (error) {
      console.error(`Error loading background detail for ${backgroundName}:`, error);
      return null;
    }
  }

  private extractBackgroundMechanics(bg: { source?: string; ability?: unknown[]; feats?: unknown[]; skillProficiencies?: unknown[]; toolProficiencies?: unknown[]; languageProficiencies?: unknown[]; entries?: unknown[] }, featsLookup: Map<string, FeatDetail>) {
    const mechanics: { source: string; abilityBonuses?: Array<{ from: string[]; count: number; weights?: number[] }>; feats?: FeatDetail[]; skillProficiencies?: string[]; toolProficiencies?: string[]; languages?: string[]; equipment?: string[] } = {
      source: bg.source || 'Unknown',
    };

    // Extract ability bonuses
    mechanics.abilityBonuses = bg.ability?.map((abil: unknown) => {
      const abilObj = abil as { choose?: { weighted?: { from?: string[]; weights?: number[] } } };
      const weighted = abilObj.choose?.weighted;
      return {
        from: weighted?.from || [],
        count: weighted?.weights?.reduce((a: number, b: number) => Math.max(a, b), 0) || 1,
        weights: weighted?.weights,
      };
    });

    // Extract and resolve feats
    const featRefs = bg.feats?.map((f: unknown) => {
      const fObj = f as Record<string, unknown>;
      return Object.keys(fObj)[0];
    }).filter((f: string | undefined): f is string => f !== undefined) || [];
    mechanics.feats = this.resolveFeatReferences(featRefs, featsLookup);

    // Extract skill proficiencies
    mechanics.skillProficiencies = bg.skillProficiencies
      ?.flatMap((s: unknown) => {
        const sObj = s as Record<string, unknown>;
        return Object.keys(sObj).filter(k => k !== 'type' && typeof sObj[k] === 'boolean' && sObj[k] === true);
      })
      || [];

    // Extract tool proficiencies
    mechanics.toolProficiencies = bg.toolProficiencies
      ?.flatMap((t: unknown) => {
        const tObj = t as Record<string, unknown>;
        return Object.keys(tObj).filter(k => k !== 'type' && typeof tObj[k] === 'boolean' && tObj[k] === true);
      })
      || [];

    // Extract languages
    const languages: string[] = [];
    if (bg.languageProficiencies) {
      for (const lang of bg.languageProficiencies as unknown[]) {
        const langObj = lang as Record<string, unknown>;
        if (langObj.anyStandard) languages.push(`${langObj.anyStandard} of your choice`);
        else if (langObj.any) languages.push(`${langObj.any} of your choice`);
        else {
          Object.keys(langObj).filter(k => k !== 'type').forEach(k => languages.push(k));
        }
      }
    }
    mechanics.languages = languages.length > 0 ? languages : undefined;

    // Extract equipment from entries
    let equipmentEntry = '';
    if (bg.entries && Array.isArray(bg.entries)) {
      for (const entry of bg.entries) {
        if (entry && typeof entry === 'object') {
          const entryObj = entry as Record<string, unknown>;
          if (entryObj.type === 'list' && Array.isArray(entryObj.items)) {
            const equipmentItem = entryObj.items?.find(
              (item: unknown) => {
                const itemObj = item as Record<string, unknown>;
                return itemObj.name === 'Equipment:';
              }
            );
            if (equipmentItem && typeof (equipmentItem as Record<string, unknown>).entry === 'string') {
              equipmentEntry = (equipmentItem as Record<string, unknown>).entry as string;
              break;
            }
          }
        }
      }
    }
    mechanics.equipment = equipmentEntry ? [equipmentEntry] : undefined;

    return mechanics;
  }

  private extractFluffDescription(entries: unknown[]): string {
    const result: string[] = [];

    const cleanMarkup = (text: string): string => {
      // Extract text from {@...} markup, keeping the words
      // Handles: {@tag text|...} and {@tag text}
      let cleaned = text.replace(/{@\w+\s+([^|}]+)(?:\|[^}]*)?}/g, '$1');
      // Handles: {@tagtext|...} and {@tagtext}
      cleaned = cleaned.replace(/{@\w+([^|}\s]+)(?:\||})[^}]*}/g, '$1');
      return cleaned;
    };

    for (const entry of entries) {
      if (typeof entry === 'string') {
        result.push(cleanMarkup(entry));
      } else if (entry && typeof entry === 'object') {
        const obj = entry as Record<string, unknown>;
        const type = obj.type as string;

        // Handle nested entries
        if (type === 'entries' && Array.isArray(obj.entries)) {
          result.push(this.extractFluffDescription(obj.entries));
        } else if (obj.entry) {
          if (typeof obj.entry === 'string') {
            result.push(cleanMarkup(obj.entry));
          } else if (Array.isArray(obj.entry)) {
            result.push(this.extractFluffDescription(obj.entry));
          }
        }
        // Handle table rows (array of cells)
        else if (type === 'row' && Array.isArray(obj.row)) {
          for (const cell of obj.row) {
            if (typeof cell === 'string') {
              result.push(cleanMarkup(cell));
            } else if (cell && typeof cell === 'object') {
              const cellObj = cell as Record<string, unknown>;
              if (typeof cellObj.entry === 'string') {
                result.push(cleanMarkup(cellObj.entry));
              } else if (Array.isArray(cellObj.entry)) {
                result.push(this.extractFluffDescription(cellObj.entry));
              }
            }
          }
        }
        // Handle quotes
        else if (type === 'quote' && Array.isArray(obj.entries)) {
          result.push(this.extractFluffDescription(obj.entries));
        }
        // Handle inline wrapper (usually just contains entries)
        else if (type === 'inline' && Array.isArray(obj.entries)) {
          result.push(this.extractFluffDescription(obj.entries));
        }
        // Handle other objects with entries array
        else if (Array.isArray(obj.entries)) {
          result.push(this.extractFluffDescription(obj.entries));
        }
      }
    }

    return result.join('\n\n');
  }

  async getRaceDetail(raceName: string): Promise<RaceDetail | null> {
    try {
      // Read races.json for mechanical data
      const raceFilePath = join(DATA_PATH, 'races.json');
      const raceContent = await readFile(raceFilePath, 'utf-8');
      const raceData = JSON.parse(raceContent);

      // Read fluff-races.json for descriptions
      let fluffData: { raceFluff?: unknown[] } | null = null;
      try {
        const fluffFilePath = join(DATA_PATH, 'fluff-races.json');
        const fluffContent = await readFile(fluffFilePath, 'utf-8');
        fluffData = JSON.parse(fluffContent);
      } catch {
        // Fluff file may not exist for all races
      }

      // Get all races by name (including non-2024 editions for NPCs like Gnoll)
      const raceByName = new Map<string, Array<{ source: string; ability?: Array<Record<string, number>>; size?: string[]; speed?: { walk?: number; fly?: number }; languages?: string[]; traits?: string[] }>>();

      (raceData.race || []).forEach((r: { name?: string; edition?: string; source?: string; _copy?: unknown; ability?: Array<Record<string, number>>; size?: string[]; speed?: { walk?: number; fly?: number }; languageProficiencies?: unknown[]; entries?: unknown[] }) => {
        // Include races that don't have _copy (not duplicates of other races)
        if (!r._copy && r.name) {
          if (!raceByName.has(r.name)) {
            raceByName.set(r.name, []);
          }
          raceByName.get(r.name)!.push(this.extractRaceMechanics(r));
        }
      });

      const matchingRaces = raceByName.get(raceName);
      if (!matchingRaces || matchingRaces.length === 0) return null;

      // Find all matching fluffs by name
      const matchingFluffs = (fluffData?.raceFluff || []).filter(
        (f: unknown) => (f as { name?: string }).name?.toLowerCase() === raceName.toLowerCase()
      );

      // First, add descriptions from races that have fluff
      const descriptions: RaceDescriptionSource[] = matchingFluffs.map((fluff: unknown) => {
        const fluffObj = fluff as { source?: string; entries?: unknown[] };
        const matchingMechanics = matchingRaces.find(r => r.source === fluffObj.source);
        return {
          source: fluffObj.source || 'Unknown',
          description: fluffObj.entries ? this.extractFluffDescription(fluffObj.entries) : '',
          ability: matchingMechanics?.ability,
          size: matchingMechanics?.size,
          speed: matchingMechanics?.speed,
          languages: matchingMechanics?.languages,
          traits: matchingMechanics?.traits,
        };
      });

      // Then, add any races that have mechanical data but no fluff
      for (const raceMechanics of matchingRaces) {
        if (!descriptions.some(d => d.source === raceMechanics.source)) {
          descriptions.push({
            source: raceMechanics.source,
            description: '',
            ability: raceMechanics.ability,
            size: raceMechanics.size,
            speed: raceMechanics.speed,
            languages: raceMechanics.languages,
            traits: raceMechanics.traits,
          });
        }
      }

      if (descriptions.length === 0) return null;

      return {
        name: raceName,
        descriptions,
      };
    } catch (error) {
      console.error(`Error loading race detail for ${raceName}:`, error);
      return null;
    }
  }

  private extractRaceMechanics(race: { source?: string; ability?: Array<Record<string, number>>; size?: string[]; speed?: { walk?: number; fly?: number }; languageProficiencies?: unknown[]; entries?: unknown[] }) {
    const mechanics: { source: string; ability?: Array<Record<string, number>>; size?: string[]; speed?: { walk?: number; fly?: number }; languages?: string[]; traits?: string[] } = {
      source: race.source || 'Unknown',
    };

    // Extract ability scores
    mechanics.ability = race.ability;

    // Extract size
    mechanics.size = race.size;

    // Extract speed
    mechanics.speed = race.speed;

    // Extract languages
    const languages: string[] = [];
    if (race.languageProficiencies) {
      for (const lang of race.languageProficiencies as unknown[]) {
        const langObj = lang as Record<string, unknown>;
        Object.keys(langObj).filter(k => k !== 'type' && typeof langObj[k] === 'boolean' && langObj[k] === true).forEach(k => languages.push(k.charAt(0).toUpperCase() + k.slice(1)));
      }
    }
    mechanics.languages = languages.length > 0 ? languages : undefined;

    // Extract trait names from entries
    const traits: string[] = [];
    if (race.entries && Array.isArray(race.entries)) {
      for (const entry of race.entries) {
        if (entry && typeof entry === 'object') {
          const entryObj = entry as Record<string, unknown>;
          if (entryObj.name && typeof entryObj.name === 'string') {
            traits.push(entryObj.name);
          }
        }
      }
    }
    mechanics.traits = traits.length > 0 ? traits : undefined;

    return mechanics;
  }

}

export default new DataService();
