/**
 * Preprocessing script: reads raw 5etools JSON from data/_raw/
 * and outputs clean, normalized JSON to data/.
 *
 * Run: npm run preprocess -w backend
 */
import { readFile, writeFile, mkdir, access } from 'fs/promises';
import { join } from 'path';
import { cleanMarkup, cleanMarkupDeep } from './lib/markup-cleaner.js';
import { extractEntries, extractFeatDescription } from './lib/entry-extractor.js';

const RAW = join(process.cwd(), 'data', '_raw');
const OUT = join(process.cwd(), 'data');

// --- Complexity map (baked into output instead of controller) ---

const complexityMap: Record<string, { primaryAbility: string; complexity: string }> = {
  Artificer: { primaryAbility: 'Intelligence', complexity: 'High' },
  Barbarian: { primaryAbility: 'Strength', complexity: 'Average' },
  Bard: { primaryAbility: 'Charisma', complexity: 'High' },
  Cleric: { primaryAbility: 'Wisdom', complexity: 'Average' },
  Druid: { primaryAbility: 'Wisdom', complexity: 'High' },
  Fighter: { primaryAbility: 'Strength or Dexterity', complexity: 'Low' },
  Monk: { primaryAbility: 'Dexterity and Wisdom', complexity: 'High' },
  Paladin: { primaryAbility: 'Strength and Charisma', complexity: 'Average' },
  Ranger: { primaryAbility: 'Dexterity and Wisdom', complexity: 'Average' },
  Rogue: { primaryAbility: 'Dexterity', complexity: 'Low' },
  Sorcerer: { primaryAbility: 'Charisma', complexity: 'High' },
  Warlock: { primaryAbility: 'Charisma', complexity: 'High' },
  Wizard: { primaryAbility: 'Intelligence', complexity: 'Average' },
};

const CLASS_NAMES = [
  'artificer', 'barbarian', 'bard', 'cleric', 'druid', 'fighter',
  'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard',
];

// --- Helpers ---

async function readJson(path: string): Promise<any> {
  return JSON.parse(await readFile(path, 'utf-8'));
}

async function writeJson(path: string, data: unknown): Promise<void> {
  await writeFile(path, JSON.stringify(data, null, 2) + '\n');
}

function normalizeSpeed(speed: any): { walk?: number; fly?: number } | undefined {
  if (typeof speed === 'number') return { walk: speed };
  if (speed && typeof speed === 'object') {
    const flySpeed = speed.fly === true ? speed.walk : (typeof speed.fly === 'number' ? speed.fly : undefined);
    return { walk: speed.walk, fly: flySpeed };
  }
  return undefined;
}

// --- Process classes ---

async function processClasses(): Promise<void> {
  await mkdir(join(OUT, 'classes'), { recursive: true });
  const summaries: any[] = [];

  for (const name of CLASS_NAMES) {
    const classData = await readJson(join(RAW, 'class', `class-${name}.json`));
    const oneClass = classData.class?.find((c: any) => c.edition === 'one') || classData.class?.[0];
    if (!oneClass) { console.warn(`Skipping ${name}: no class data`); continue; }

    const classSource = oneClass.source;
    const cm = complexityMap[oneClass.name] || { primaryAbility: '', complexity: 'Average' };

    // Summary
    summaries.push({
      name: oneClass.name,
      source: classSource,
      primaryAbility: cm.primaryAbility,
      complexity: cm.complexity,
      hd: oneClass.hd,
      proficiency: oneClass.proficiency,
    });

    // Fluff description
    let description = '';
    try {
      const fluff = await readJson(join(RAW, 'class', `fluff-class-${name}.json`));
      const classFluff = fluff.classFluff?.find((f: any) => f.source === classSource);
      if (classFluff?.entries) {
        const section = classFluff.entries.find((e: any) => e.type === 'section');
        if (section?.entries) {
          description = extractEntries(section.entries);
        }
      }
    } catch { /* no fluff */ }

    // Subclass names
    const subclasses = (classData.subclass || [])
      .filter((sc: any) => sc.source === classSource && sc.classSource === classSource)
      .map((sc: any) => sc.name);

    // Class features
    const features = (classData.classFeature || [])
      .filter((f: any) => f.source === classSource && f.classSource === classSource)
      .map((f: any) => ({
        name: f.name,
        level: f.level,
        entries: (f.entries || []).filter((e: any) => typeof e === 'string').map(cleanMarkup),
      }))
      .sort((a: any, b: any) => a.level - b.level);

    // Starting proficiencies (clean markup)
    const startingProficiencies = oneClass.startingProficiencies
      ? cleanMarkupDeep(oneClass.startingProficiencies)
      : undefined;

    // Subclass details
    const subclassDetails: Record<string, any> = {};
    const matchingSubclasses = (classData.subclass || [])
      .filter((sc: any) => sc.source === classSource && sc.classSource === classSource);

    for (const sc of matchingSubclasses) {
      const shortName = sc.shortName || sc.name;
      const allFeatures = (classData.subclassFeature || [])
        .filter((f: any) =>
          f.source === classSource && f.subclassSource === classSource &&
          f.subclassShortName === shortName
        )
        .map((f: any) => ({
          name: f.name,
          level: f.level,
          entries: (f.entries || []).filter((e: any) => typeof e === 'string').map(cleanMarkup),
        }));

      // Intro feature (same name as subclass, level 3) gives description
      const introFeature = allFeatures.find((f: any) => f.name === sc.name && f.level === 3);
      const scDescription = introFeature?.entries
        .filter((e: string) => !e.startsWith('{@i '))
        .map(cleanMarkup)
        .join('\n\n') || '';

      const scFeatures = allFeatures.filter((f: any) => f.name !== sc.name);

      subclassDetails[sc.name.toLowerCase()] = {
        name: sc.name,
        source: sc.source,
        className: sc.className,
        description: scDescription,
        features: scFeatures,
      };
    }

    // Write individual class file
    await writeJson(join(OUT, 'classes', `${name}.json`), {
      detail: {
        name: oneClass.name,
        source: classSource,
        description,
        primaryAbility: cm.primaryAbility,
        complexity: cm.complexity,
        hd: oneClass.hd,
        proficiency: oneClass.proficiency,
        startingProficiencies,
        subclasses,
        features,
      },
      subclasses: subclassDetails,
    });

    console.log(`  class: ${oneClass.name} (${subclasses.length} subclasses, ${features.length} features)`);
  }

  await writeJson(join(OUT, 'classes.json'), summaries);
  console.log(`classes.json: ${summaries.length} classes`);
}

// --- Process races ---

async function processRaces(): Promise<void> {
  const raceData = await readJson(join(RAW, 'races.json'));
  let fluffData: any = {};
  try { fluffData = await readJson(join(RAW, 'fluff-races.json')); } catch { /* ok */ }

  // Group by name (only non-copy races)
  const raceByName = new Map<string, any[]>();
  for (const r of raceData.race || []) {
    if (r._copy || !r.name) continue;
    if (!raceByName.has(r.name)) raceByName.set(r.name, []);
    raceByName.get(r.name)!.push(r);
  }

  const races: any[] = [];

  for (const [name, variants] of raceByName) {
    const descriptions: any[] = [];

    // Match fluff by name
    const matchingFluffs = (fluffData.raceFluff || []).filter(
      (f: any) => f.name?.toLowerCase() === name.toLowerCase()
    );

    // Add descriptions from fluff
    for (const fluff of matchingFluffs) {
      const mech = variants.find((r: any) => r.source === fluff.source);
      const languages: string[] = [];
      if (mech?.languageProficiencies) {
        for (const lang of mech.languageProficiencies) {
          Object.keys(lang).filter(k => k !== 'type' && typeof lang[k] === 'boolean' && lang[k]).forEach(k =>
            languages.push(k.charAt(0).toUpperCase() + k.slice(1))
          );
        }
      }

      const traits: string[] = [];
      if (mech?.entries) {
        for (const entry of mech.entries) {
          if (entry && typeof entry === 'object' && entry.name) traits.push(entry.name);
        }
      }

      descriptions.push({
        source: fluff.source || 'Unknown',
        description: fluff.entries ? extractEntries(fluff.entries) : '',
        ability: mech?.ability,
        size: mech?.size,
        speed: mech ? normalizeSpeed(mech.speed) : undefined,
        languages: languages.length > 0 ? languages : undefined,
        traits: traits.length > 0 ? traits : undefined,
      });
    }

    // Add variants without fluff
    for (const mech of variants) {
      if (descriptions.some(d => d.source === mech.source)) continue;

      const languages: string[] = [];
      if (mech.languageProficiencies) {
        for (const lang of mech.languageProficiencies) {
          Object.keys(lang).filter(k => k !== 'type' && typeof lang[k] === 'boolean' && lang[k]).forEach(k =>
            languages.push(k.charAt(0).toUpperCase() + k.slice(1))
          );
        }
      }

      const traits: string[] = [];
      if (mech.entries) {
        for (const entry of mech.entries) {
          if (entry && typeof entry === 'object' && entry.name) traits.push(entry.name);
        }
      }

      descriptions.push({
        source: mech.source || 'Unknown',
        description: '',
        ability: mech.ability,
        size: mech.size,
        speed: normalizeSpeed(mech.speed),
        languages: languages.length > 0 ? languages : undefined,
        traits: traits.length > 0 ? traits : undefined,
      });
    }

    if (descriptions.length > 0) {
      races.push({ name, descriptions });
    }
  }

  await writeJson(join(OUT, 'races.json'), { races });
  console.log(`races.json: ${races.length} races`);
}

// --- Process backgrounds ---

async function processBackgrounds(): Promise<void> {
  const bgData = await readJson(join(RAW, 'backgrounds.json'));
  let fluffData: any = {};
  try { fluffData = await readJson(join(RAW, 'fluff-backgrounds.json')); } catch { /* ok */ }

  // Build feats lookup
  const featsLookup = new Map<string, { name: string; source: string; description: string }>();
  try {
    const featsData = await readJson(join(RAW, 'feats.json'));
    for (const feat of featsData.feat || []) {
      if (feat.name && feat.source) {
        const key = `${feat.name.toLowerCase()}|${feat.source.toLowerCase()}`;
        featsLookup.set(key, {
          name: feat.name,
          source: feat.source,
          description: extractFeatDescription(feat.entries || []),
        });
      }
    }
  } catch { /* ok */ }

  // Group backgrounds by name
  const bgByName = new Map<string, any[]>();
  for (const bg of bgData.background || []) {
    if ((bg.edition !== 'one' && bg.edition) || bg._copy || !bg.name) continue;
    if (!bgByName.has(bg.name)) bgByName.set(bg.name, []);
    bgByName.get(bg.name)!.push(bg);
  }

  const backgrounds: any[] = [];

  for (const [name, variants] of bgByName) {
    const matchingFluffs = (fluffData.backgroundFluff || []).filter(
      (f: any) => f.name?.toLowerCase() === name.toLowerCase()
    );

    const descriptions: any[] = [];

    for (const fluff of matchingFluffs) {
      const mech = variants.find((b: any) => b.source === fluff.source);
      if (!mech) continue;

      descriptions.push({
        source: fluff.source || 'Unknown',
        description: fluff.entries ? extractEntries(fluff.entries) : '',
        ...extractBgMechanics(mech, featsLookup),
      });
    }

    // Only include backgrounds with descriptions
    const withDesc = descriptions.filter(d => d.description.length > 0);
    if (withDesc.length > 0) {
      backgrounds.push({ name, descriptions: withDesc });
    }
  }

  await writeJson(join(OUT, 'backgrounds.json'), { backgrounds });
  console.log(`backgrounds.json: ${backgrounds.length} backgrounds`);
}

function extractBgMechanics(bg: any, featsLookup: Map<string, any>) {
  const result: any = {};

  // Ability bonuses
  result.abilityBonuses = bg.ability?.map((abil: any) => {
    const weighted = abil.choose?.weighted;
    return {
      from: weighted?.from || [],
      count: weighted?.weights?.reduce((a: number, b: number) => Math.max(a, b), 0) || 1,
      weights: weighted?.weights,
    };
  });

  // Resolve feats (refs may contain subtypes like "magic initiate; cleric|xphb")
  const featRefs = (bg.feats || [])
    .map((f: any) => Object.keys(f)[0])
    .filter(Boolean);
  const resolvedFeats = featRefs
    .map((ref: string) => {
      const [rawName, fsrc] = ref.split('|');
      // Strip subtype after semicolon: "magic initiate; cleric" -> "magic initiate"
      const fname = rawName.split(';')[0].trim();
      return featsLookup.get(`${fname.toLowerCase()}|${(fsrc || '').toLowerCase()}`);
    })
    .filter(Boolean);
  if (resolvedFeats.length > 0) result.feats = resolvedFeats;

  // Skill proficiencies
  result.skillProficiencies = (bg.skillProficiencies || [])
    .flatMap((s: any) => Object.keys(s).filter(k => k !== 'type' && s[k] === true));
  if (result.skillProficiencies.length === 0) delete result.skillProficiencies;

  // Tool proficiencies
  result.toolProficiencies = (bg.toolProficiencies || [])
    .flatMap((t: any) => Object.keys(t).filter(k => k !== 'type' && t[k] === true));
  if (result.toolProficiencies.length === 0) delete result.toolProficiencies;

  // Languages
  const languages: string[] = [];
  if (bg.languageProficiencies) {
    for (const lang of bg.languageProficiencies) {
      if (lang.anyStandard) languages.push(`${lang.anyStandard} of your choice`);
      else if (lang.any) languages.push(`${lang.any} of your choice`);
      else {
        Object.keys(lang).filter(k => k !== 'type').forEach(k => languages.push(k));
      }
    }
  }
  if (languages.length > 0) result.languages = languages;

  // Equipment from entries
  if (bg.entries && Array.isArray(bg.entries)) {
    for (const entry of bg.entries) {
      if (entry?.type === 'list' && Array.isArray(entry.items)) {
        const eqItem = entry.items.find((i: any) => i.name === 'Equipment:');
        if (eqItem?.entry && typeof eqItem.entry === 'string') {
          result.equipment = [cleanMarkup(eqItem.entry)];
          break;
        }
      }
    }
  }

  return result;
}

// --- Process languages ---

async function processLanguages(): Promise<void> {
  const data = await readJson(join(RAW, 'languages.json'));

  const priorityMap: Record<string, number> = {
    PHB: 100, XPHB: 90, ERLW: 80, GGR: 70, TCE: 60, MPMM: 50,
  };

  const languageMap = new Map<string, number>();
  for (const lang of data.language || []) {
    const priority = priorityMap[lang.source] || 0;
    if (!languageMap.has(lang.name) || priority > languageMap.get(lang.name)!) {
      languageMap.set(lang.name, priority);
    }
  }

  const languages = [...languageMap.keys()].sort();
  await writeJson(join(OUT, 'languages.json'), { languages });
  console.log(`languages.json: ${languages.length} languages`);
}

// --- Main ---

async function main() {
  // Verify raw data exists
  try {
    await access(RAW);
  } catch {
    console.error(`Raw data not found at ${RAW}`);
    console.error('Place 5etools JSON files in data/_raw/ before running this script.');
    process.exit(1);
  }

  console.log('Preprocessing 5etools data...');
  console.log(`  Raw: ${RAW}`);
  console.log(`  Out: ${OUT}\n`);

  await processClasses();
  console.log();
  await processRaces();
  await processBackgrounds();
  await processLanguages();

  console.log('\nDone!');
}

main().catch(err => {
  console.error('Preprocessing failed:', err);
  process.exit(1);
});
