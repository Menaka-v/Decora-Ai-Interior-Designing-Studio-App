import type { Customizations, DecorAddon, FlooringType } from '../types/decora';
import { createSmartOverlay } from './overlays';
import type {
  DecorOverlayItem,
  OverlayKind,
  OverlayVariant,
  RegionBoundingBox,
  RegionKey,
} from './types';

export const COLOR_DICTIONARY: Record<string, { name: string; hex: string }> = {
  'sage green': { name: 'Sage Green', hex: '#9CAF9C' },
  sage: { name: 'Sage', hex: '#9CAF9C' },
  emerald: { name: 'Emerald', hex: '#1F6F54' },
  'forest green': { name: 'Forest Green', hex: '#28543C' },
  olive: { name: 'Olive', hex: '#6F7D4E' },
  mint: { name: 'Mint', hex: '#A7D7C5' },
  teal: { name: 'Teal', hex: '#0D9488' },
  'coastal teal': { name: 'Coastal Teal', hex: '#5BA3A0' },
  turquoise: { name: 'Turquoise', hex: '#38B2AC' },
  'navy blue': { name: 'Navy Blue', hex: '#1E3A5F' },
  navy: { name: 'Navy', hex: '#1E3A5F' },
  'sky blue': { name: 'Sky Blue', hex: '#8ECAE6' },
  'baby blue': { name: 'Baby Blue', hex: '#A8D0E6' },
  cobalt: { name: 'Cobalt', hex: '#244B8A' },
  indigo: { name: 'Indigo', hex: '#3B429F' },
  blue: { name: 'Soft Blue', hex: '#5D8AA8' },
  terracotta: { name: 'Terracotta', hex: '#D9785C' },
  'burnt orange': { name: 'Burnt Orange', hex: '#C85A32' },
  rust: { name: 'Rust', hex: '#B44B2B' },
  coral: { name: 'Coral', hex: '#FF6B5B' },
  peach: { name: 'Peach', hex: '#F4A28C' },
  'blush pink': { name: 'Blush Pink', hex: '#EAB8C0' },
  blush: { name: 'Blush', hex: '#EAB8C0' },
  'dusty rose': { name: 'Dusty Rose', hex: '#C7858E' },
  rose: { name: 'Rose', hex: '#D47B86' },
  pink: { name: 'Soft Pink', hex: '#E8A5B2' },
  burgundy: { name: 'Burgundy', hex: '#6D2434' },
  crimson: { name: 'Crimson', hex: '#A62C37' },
  maroon: { name: 'Maroon', hex: '#6A222B' },
  mustard: { name: 'Mustard', hex: '#D49A2A' },
  ochre: { name: 'Ochre', hex: '#C68B2C' },
  gold: { name: 'Warm Gold', hex: '#D4AF37' },
  golden: { name: 'Golden', hex: '#D4AF37' },
  yellow: { name: 'Butter Yellow', hex: '#F3D999' },
  amber: { name: 'Amber', hex: '#D97706' },
  lavender: { name: 'Lavender', hex: '#C7B8E8' },
  lilac: { name: 'Lilac', hex: '#D6C6EB' },
  plum: { name: 'Plum', hex: '#6D3B6E' },
  cream: { name: 'Warm Cream', hex: '#F5EFE0' },
  alabaster: { name: 'Alabaster', hex: '#F7F4EE' },
  ivory: { name: 'Ivory', hex: '#FAF6EB' },
  white: { name: 'Pure White', hex: '#F8FAFC' },
  beige: { name: 'Warm Beige', hex: '#DFD2BE' },
  sand: { name: 'Sandstone', hex: '#D4B99E' },
  oatmeal: { name: 'Oatmeal', hex: '#E3DAC9' },
  taupe: { name: 'Taupe', hex: '#9E8F82' },
  'warm gray': { name: 'Warm Gray', hex: '#A8A29E' },
  gray: { name: 'Soft Gray', hex: '#9CA3AF' },
  grey: { name: 'Soft Grey', hex: '#9CA3AF' },
  slate: { name: 'Slate', hex: '#475569' },
  charcoal: { name: 'Charcoal', hex: '#334155' },
  black: { name: 'Matte Black', hex: '#26292E' },
  espresso: { name: 'Espresso', hex: '#4B3629' },
  walnut: { name: 'Walnut', hex: '#6F4E37' },
  mahogany: { name: 'Mahogany', hex: '#5C2C20' },
};

const SORTED_COLOR_NAMES = Object.keys(COLOR_DICTIONARY).sort((a, b) => b.length - a.length);

export const STARTER_IDEA_GROUPS: Array<{
  group: string;
  chipClass: string;
  ideas: string[];
}> = [
  {
    group: 'Cozy',
    chipClass:
      'border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200',
    ideas: [
      'Add a floor lamp and warm cushions',
      'Make the room cozy and warm',
      'Add a rectangular cream rug',
    ],
  },
  {
    group: 'Windows',
    chipClass:
      'border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-200',
    ideas: [
      'Add sheer white curtains',
      'Add blackout curtains in navy blue',
      'Add floral curtains',
    ],
  },
  {
    group: 'Walls',
    chipClass:
      'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200',
    ideas: [
      'Paint the walls sage green',
      'Add a gallery wall with frames',
      'Add floating shelves',
    ],
  },
  {
    group: 'Furniture',
    chipClass:
      'border-violet-200 bg-violet-50 text-violet-800 hover:bg-violet-100 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-violet-200',
    ideas: [
      'Change sofa to deep teal',
      'Switch floor to light wood',
      'Switch floor to marble',
    ],
  },
  {
    group: 'Greenery',
    chipClass:
      'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200',
    ideas: [
      'Add a monstera plant',
      'Add hanging plants near the window',
      'Add a snake plant',
    ],
  },
  {
    group: 'Luxury',
    chipClass:
      'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-800 hover:bg-fuchsia-100 dark:border-fuchsia-900/60 dark:bg-fuchsia-950/40 dark:text-fuchsia-200',
    ideas: [
      'Add a gold chandelier',
      'Add a patterned rug in terracotta',
    ],
  },
  {
    group: 'Space',
    chipClass:
      'border-teal-200 bg-teal-50 text-teal-800 hover:bg-teal-100 dark:border-teal-900/60 dark:bg-teal-950/40 dark:text-teal-200',
    ideas: [
      'Make the room look brighter and spacious',
      'Add a large mirror on the wall',
    ],
  },
];

const IMPOSSIBLE_REQUESTS: Array<{ pattern: RegExp; item: string; suggestion: string }> = [
  {
    pattern: /\b(swimming pool|pool|hot tub|jacuzzi)\b/i,
    item: 'swimming pool',
    suggestion: 'Try coastal teal walls, sheer white curtains, and light oak flooring instead.',
  },
  {
    pattern: /\b(knock down|remove wall|demolish|tear down|open concept)\b/i,
    item: 'structural wall demolition',
    suggestion: 'Try "Add a large mirror" and "Make the room look brighter and spacious" to open up the space visually.',
  },
  {
    pattern: /\b(staircase|elevator|balcony|skylight)\b/i,
    item: 'structural architecture changes',
    suggestion: 'Try brightening the lighting or changing ceiling paint to Crisp Chalk instead.',
  },
  {
    pattern: /\b(car|lamborghini|aquarium|waterfall)\b/i,
    item: 'non-interior architectural objects',
    suggestion: 'Try adding indoor plants, wall art, or a statement chandelier.',
  },
];

function findColorInText(text: string): { name: string; hex: string } | null {
  const lower = text.toLowerCase();
  for (const key of SORTED_COLOR_NAMES) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`\\b${escaped}\\b`, 'i').test(lower)) {
      return COLOR_DICTIONARY[key];
    }
  }
  return null;
}

export interface InstructionParseOutcome {
  nextCustomizations: Customizations;
  newOverlays: DecorOverlayItem[];
  appliedChecklist: string[];
  keywordsMatched: string[];
  warningMessage: string | null;
}

/**
 * Deterministic keyword parser that translates plain-English instructions into
 * immediate color, flooring, lighting, and SVG overlay edits — zero AI API calls.
 */
export function parseExtraInstructions(
  rawText: string,
  currentCustomizations: Customizations,
  currentOverlays: DecorOverlayItem[],
  boxes: Partial<Record<RegionKey, RegionBoundingBox | null>>,
): InstructionParseOutcome {
  const text = rawText.trim();
  if (!text) {
    return {
      nextCustomizations: currentCustomizations,
      newOverlays: [],
      appliedChecklist: [],
      keywordsMatched: [],
      warningMessage: 'Type a design instruction or click a starter idea chip below.',
    };
  }

  let next = { ...currentCustomizations, decorAddons: [...currentCustomizations.decorAddons] };
  const newOverlays: DecorOverlayItem[] = [];
  const appliedChecklist: string[] = [];
  const keywordsMatched: string[] = [];

  // Check impossible requests first
  let warningMessage: string | null = null;
  for (const imp of IMPOSSIBLE_REQUESTS) {
    if (imp.pattern.test(text)) {
      warningMessage = `Cannot add ${imp.item} with photo surface editing. ${imp.suggestion}`;
      break;
    }
  }

  // Split into clauses so colors bind cleanly to the right subject (e.g. "navy curtains and sage walls")
  const clauses = text
    .split(/(?:\.|,|;|\band\b|\bwith\b)/i)
    .map((c) => c.trim())
    .filter(Boolean);

  const ensureAddon = (addon: DecorAddon) => {
    if (!next.decorAddons.includes(addon)) {
      next.decorAddons.push(addon);
    }
  };

  const addOverlayIfNeeded = (
    kind: OverlayKind,
    variant: OverlayVariant,
    color: string | undefined,
    labelText: string,
  ) => {
    const alreadyExists =
      currentOverlays.some((o) => o.kind === kind && o.variant === variant) ||
      newOverlays.some((o) => o.kind === kind && o.variant === variant);

    if (!alreadyExists) {
      newOverlays.push(
        createSmartOverlay(kind, boxes, {
          variant,
          color,
          zIndex: 10 + currentOverlays.length + newOverlays.length,
        }),
      );
    } else if (color) {
      // Update existing overlay color when re-specified
      const existing = currentOverlays.find((o) => o.kind === kind);
      if (existing) existing.color = color;
    }
    if (!appliedChecklist.includes(labelText)) {
      appliedChecklist.push(labelText);
    }
  };

  for (const clause of clauses) {
    const lower = clause.toLowerCase();
    const clauseColor = findColorInText(clause);

    // 1. Walls color
    if (/\b(wall|walls|paint)\b/i.test(lower) && clauseColor) {
      next.wallColor = clauseColor.hex;
      next.wallColorName = clauseColor.name;
      next.wallIntensity = Math.max(next.wallIntensity, 70);
      appliedChecklist.push(`Walls painted ${clauseColor.name}`);
      keywordsMatched.push('wall color');
    }

    // 2. Ceiling color
    if (/\b(ceiling)\b/i.test(lower) && clauseColor) {
      next.ceilingColor = clauseColor.hex;
      next.ceilingColorName = clauseColor.name;
      next.ceilingIntensity = Math.max(next.ceilingIntensity, 60);
      appliedChecklist.push(`Ceiling tinted ${clauseColor.name}`);
      keywordsMatched.push('ceiling color');
    }

    // 3. Sofa / furniture color
    if (/\b(sofa|couch|bed|furniture|upholstery|sectional|armchair)\b/i.test(lower) && clauseColor) {
      next.sofaBedColor = clauseColor.hex;
      next.furnitureIntensity = Math.max(next.furnitureIntensity, 75);
      appliedChecklist.push(`Furniture set to ${clauseColor.name}`);
      keywordsMatched.push('furniture color');
    }

    // 4. Flooring
    if (/\b(floor|flooring|plank|wood|marble|tile|tiles|carpet|concrete)\b/i.test(lower) && !/\brug\b/i.test(lower)) {
      let chosenFloor: FlooringType | null = null;
      if (/\bdark wood|walnut|espresso\b/i.test(lower)) chosenFloor = 'Dark Wood';
      else if (/\blight wood|oak|wood\b/i.test(lower)) chosenFloor = 'Light Wood';
      else if (/\bmarble\b/i.test(lower)) chosenFloor = 'Marble';
      else if (/\btile|tiles|gray tile\b/i.test(lower)) chosenFloor = 'Gray Tiles';
      else if (/\bcarpet\b/i.test(lower)) chosenFloor = 'Carpet';
      else if (/\bconcrete\b/i.test(lower)) chosenFloor = 'Concrete';

      if (chosenFloor) {
        next.flooring = chosenFloor;
        appliedChecklist.push(`${chosenFloor} floor applied`);
        keywordsMatched.push(chosenFloor.toLowerCase());
      }
    }

    // 5. Curtains / Blinds
    if (/\b(curtain|curtains|drape|drapes|blinds)\b/i.test(lower)) {
      ensureAddon('Curtains');
      const variant: OverlayVariant = /\bsheer\b/i.test(lower)
        ? 'sheer'
        : /\bfloral|botanical\b/i.test(lower)
          ? 'floral'
          : /\bblackout|navy|dark\b/i.test(lower)
            ? 'blackout'
            : 'sheer';
      addOverlayIfNeeded('curtains', variant, clauseColor?.hex, 'Curtains added');
      keywordsMatched.push('curtains');
    }

    // 6. Plants / Greenery
    if (/\b(plant|plants|monstera|snake|pothos|hanging|greenery|foliage)\b/i.test(lower)) {
      ensureAddon('Plants');
      const variant: OverlayVariant = /\bhanging\b/i.test(lower)
        ? 'hanging'
        : /\bsnake\b/i.test(lower)
          ? 'snake'
          : 'monstera';
      addOverlayIfNeeded('plants', variant, clauseColor?.hex, 'Plants added');
      keywordsMatched.push('plants');
    }

    // 7. Rug
    if (/\b(rug|rugs|kilim)\b/i.test(lower)) {
      ensureAddon('Rugs');
      const variant: OverlayVariant = /\bround|circle\b/i.test(lower)
        ? 'round'
        : /\bpattern|patterned|kilim|geometric|boho\b/i.test(lower)
          ? 'patterned'
          : 'rectangular';
      addOverlayIfNeeded('rug', variant, clauseColor?.hex, 'Rug added');
      keywordsMatched.push('rug');
    }

    // 8. Wall Art / Frames / Gallery wall
    if (/\b(frame|frames|painting|gallery|art|artwork|picture|pictures)\b/i.test(lower)) {
      ensureAddon('Wall Art');
      const variant: OverlayVariant = /\bgallery|5|five\b/i.test(lower)
        ? 'gallery'
        : /\btriptych|3|three\b/i.test(lower)
          ? 'triptych'
          : 'single';
      addOverlayIfNeeded('wallArt', variant, clauseColor?.hex, 'Wall art added');
      keywordsMatched.push('wall art');
    }

    // 9. Lamps & Chandelier
    if (/\bchandelier\b/i.test(lower)) {
      ensureAddon('Chandelier');
      addOverlayIfNeeded('chandelier', 'default', clauseColor?.hex, 'Chandelier added');
      keywordsMatched.push('chandelier');
    } else if (/\btable lamp\b/i.test(lower)) {
      ensureAddon('Lamps');
      addOverlayIfNeeded('tableLamp', 'default', clauseColor?.hex, 'Table lamp added');
      keywordsMatched.push('table lamp');
    } else if (/\b(floor lamp|lamp|light|lights|reading corner)\b/i.test(lower)) {
      ensureAddon('Lamps');
      addOverlayIfNeeded('floorLamp', 'default', clauseColor?.hex, 'Floor lamp added');
      keywordsMatched.push('lamp');
    }

    // 10. Mirror
    if (/\bmirror\b/i.test(lower)) {
      ensureAddon('Mirrors');
      addOverlayIfNeeded('mirror', 'default', clauseColor?.hex, 'Mirror added');
      keywordsMatched.push('mirror');
    }

    // 11. Floating shelves
    if (/\b(shelf|shelves|floating shelves|bookshelf)\b/i.test(lower)) {
      ensureAddon('Floating Shelves');
      addOverlayIfNeeded('shelves', 'default', clauseColor?.hex, 'Floating shelves added');
      keywordsMatched.push('shelves');
    }

    // 12. Cushions / Throws
    if (/\b(cushion|cushions|pillow|pillows)\b/i.test(lower)) {
      ensureAddon('Cushions');
      addOverlayIfNeeded('cushions', 'default', clauseColor?.hex, 'Cushions added');
      keywordsMatched.push('cushions');
    }

    // 13. Lighting & spatial mood
    if (/\b(bright|brighter|spacious|airy|daylight|sunlit)\b/i.test(lower)) {
      next.brightness = Math.min(35, Math.max(next.brightness, 14));
      next.contrast = Math.min(25, Math.max(next.contrast, 8));
      next.lightingMood = 'Natural Daylight';
      appliedChecklist.push('Brightness & space lifted');
      keywordsMatched.push('brighter');
    }

    if (/\b(warm|cozy|evening|hygge)\b/i.test(lower)) {
      next.warmth = Math.min(40, Math.max(next.warmth, 18));
      next.vignette = Math.min(50, Math.max(next.vignette, 22));
      next.lightingMood = 'Warm';
      appliedChecklist.push('Warm cozy mood applied');
      keywordsMatched.push('cozy');
    }

    if (/\b(cool|crisp|nordic)\b/i.test(lower)) {
      next.warmth = Math.max(-35, Math.min(next.warmth, -14));
      next.lightingMood = 'Cool';
      appliedChecklist.push('Cool crisp lighting applied');
      keywordsMatched.push('cool');
    }
  }

  // Fallback if user wrote only a color name without specifying a surface
  if (appliedChecklist.length === 0) {
    const soloColor = findColorInText(text);
    if (soloColor) {
      next.wallColor = soloColor.hex;
      next.wallColorName = soloColor.name;
      next.wallIntensity = Math.max(next.wallIntensity, 70);
      appliedChecklist.push(`Walls painted ${soloColor.name}`);
      keywordsMatched.push(soloColor.name.toLowerCase());
    } else if (!warningMessage) {
      warningMessage =
        'No recognized keywords found. Try phrases like "Paint walls sage green", "Add sheer white curtains", "Switch floor to marble", or click a starter chip.';
    }
  }

  return {
    nextCustomizations: next,
    newOverlays,
    appliedChecklist: Array.from(new Set(appliedChecklist)),
    keywordsMatched: Array.from(new Set(keywordsMatched)),
    warningMessage,
  };
}
