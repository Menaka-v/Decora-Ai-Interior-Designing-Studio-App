import type { DecorAddon } from '../types/decora';
import type {
  DecorOverlayItem,
  OverlayKind,
  OverlayVariant,
  RegionBoundingBox,
  RegionKey,
} from './types';

function adjustHex(hex: string, lumDelta: number): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return hex;
  const r = Math.max(0, Math.min(255, parseInt(clean.slice(0, 2), 16) + lumDelta));
  const g = Math.max(0, Math.min(255, parseInt(clean.slice(2, 4), 16) + lumDelta));
  const b = Math.max(0, Math.min(255, parseInt(clean.slice(4, 6), 16) + lumDelta));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export const OVERLAY_CATALOG: Array<{
  kind: OverlayKind;
  label: string;
  addon?: DecorAddon;
  defaultColor: string;
  variants: Array<{ id: OverlayVariant; label: string }>;
}> = [
  {
    kind: 'curtains',
    label: 'Curtains',
    addon: 'Curtains',
    defaultColor: '#F3EFE6',
    variants: [
      { id: 'sheer', label: 'Sheer Drapes' },
      { id: 'blackout', label: 'Blackout Pleat' },
      { id: 'floral', label: 'Botanical Floral' },
    ],
  },
  {
    kind: 'plants',
    label: 'Indoor Plants',
    addon: 'Plants',
    defaultColor: '#2F6E49',
    variants: [
      { id: 'monstera', label: 'Monstera Pot' },
      { id: 'snake', label: 'Snake Plant' },
      { id: 'hanging', label: 'Hanging Pothos' },
    ],
  },
  {
    kind: 'rug',
    label: 'Area Rug',
    addon: 'Rugs',
    defaultColor: '#D6C3A5',
    variants: [
      { id: 'rectangular', label: 'Rectangular Woven' },
      { id: 'round', label: 'Round Jute' },
      { id: 'patterned', label: 'Geometric Kilim' },
    ],
  },
  {
    kind: 'wallArt',
    label: 'Wall Art',
    addon: 'Wall Art',
    defaultColor: '#C96F53',
    variants: [
      { id: 'single', label: 'Single Statement' },
      { id: 'triptych', label: '3-Frame Triptych' },
      { id: 'gallery', label: '5-Frame Gallery' },
    ],
  },
  {
    kind: 'floorLamp',
    label: 'Floor Lamp',
    addon: 'Lamps',
    defaultColor: '#F6E3B4',
    variants: [{ id: 'default', label: 'Brass Arc Lamp' }],
  },
  {
    kind: 'tableLamp',
    label: 'Table Lamp',
    addon: 'Lamps',
    defaultColor: '#F2E8D5',
    variants: [{ id: 'default', label: 'Ceramic Shade' }],
  },
  {
    kind: 'mirror',
    label: 'Mirror',
    addon: 'Mirrors',
    defaultColor: '#C59B5F',
    variants: [{ id: 'default', label: 'Arched Brass' }],
  },
  {
    kind: 'shelves',
    label: 'Floating Shelves',
    addon: 'Floating Shelves',
    defaultColor: '#A67B5B',
    variants: [{ id: 'default', label: 'Oak Shelves' }],
  },
  {
    kind: 'cushions',
    label: 'Throw Cushions',
    addon: 'Cushions',
    defaultColor: '#E07A5F',
    variants: [{ id: 'default', label: 'Accent Pair' }],
  },
  {
    kind: 'chandelier',
    label: 'Chandelier',
    addon: 'Chandelier',
    defaultColor: '#D4AF37',
    variants: [{ id: 'default', label: 'Modern Globe' }],
  },
];

export function addonToOverlayKind(addon: DecorAddon): OverlayKind {
  switch (addon) {
    case 'Plants':
      return 'plants';
    case 'Rugs':
      return 'rug';
    case 'Curtains':
      return 'curtains';
    case 'Wall Art':
      return 'wallArt';
    case 'Lamps':
      return 'floorLamp';
    case 'Mirrors':
      return 'mirror';
    case 'Floating Shelves':
      return 'shelves';
    case 'Cushions':
      return 'cushions';
    case 'Chandelier':
      return 'chandelier';
  }
}

/**
 * Computes smart initial coordinates for an overlay based on detected room bounding boxes.
 */
export function createSmartOverlay(
  kind: OverlayKind,
  boxes: Partial<Record<RegionKey, RegionBoundingBox | null>>,
  options?: {
    variant?: OverlayVariant;
    color?: string;
    zIndex?: number;
  },
): DecorOverlayItem {
  const catalogEntry = OVERLAY_CATALOG.find((c) => c.kind === kind) || OVERLAY_CATALOG[0];
  const variant = options?.variant ?? catalogEntry.variants[0].id;
  const color = options?.color ?? catalogEntry.defaultColor;
  const zIndex = options?.zIndex ?? 10;

  let x = 0.5;
  let y = 0.5;
  let width = 0.22;
  let height = 0.25;

  const winBox = boxes.window;
  const wallBox = boxes.wall;
  const floorBox = boxes.floor;
  const furnBox = boxes.furniture;
  const ceilBox = boxes.ceiling;

  if (kind === 'curtains') {
    if (winBox) {
      x = Math.min(0.86, Math.max(0.14, winBox.x + winBox.w * 0.5));
      y = Math.min(0.68, Math.max(0.28, winBox.y + winBox.h * 0.52));
      width = Math.min(0.56, Math.max(0.26, winBox.w * 1.24));
      height = Math.min(0.66, Math.max(0.32, winBox.h * 1.25));
    } else {
      x = 0.5;
      y = 0.38;
      width = 0.34;
      height = 0.44;
    }
  } else if (kind === 'rug') {
    if (floorBox) {
      x = floorBox.x + floorBox.w * 0.5;
      y = floorBox.y + floorBox.h * 0.62;
      width = Math.min(0.58, Math.max(0.34, floorBox.w * 0.62));
      height = Math.min(0.28, Math.max(0.16, floorBox.h * 0.45));
    } else {
      x = 0.5;
      y = 0.78;
      width = 0.44;
      height = 0.22;
    }
  } else if (kind === 'wallArt' || kind === 'mirror' || kind === 'shelves') {
    if (wallBox) {
      // Shift away from window center if a window sits right in the middle
      let targetX = wallBox.x + wallBox.w * 0.5;
      if (winBox && Math.abs(targetX - (winBox.x + winBox.w * 0.5)) < 0.16) {
        targetX = winBox.x > 0.35 ? 0.22 : 0.78;
      }
      x = Math.min(0.82, Math.max(0.18, targetX));
      y = Math.min(0.48, Math.max(0.24, wallBox.y + wallBox.h * 0.38));
    } else {
      x = kind === 'mirror' ? 0.26 : 0.32;
      y = 0.34;
    }
    width = kind === 'wallArt' && variant !== 'single' ? 0.28 : 0.17;
    height = kind === 'mirror' ? 0.28 : 0.19;
  } else if (kind === 'plants') {
    if (variant === 'hanging') {
      x = winBox ? Math.min(0.85, winBox.x + winBox.w * 0.15) : 0.22;
      y = 0.22;
      width = 0.13;
      height = 0.22;
    } else if (floorBox) {
      x = floorBox.x + floorBox.w * 0.18;
      y = floorBox.y + floorBox.h * 0.42;
      width = 0.15;
      height = 0.28;
    } else {
      x = 0.2;
      y = 0.68;
      width = 0.15;
      height = 0.28;
    }
  } else if (kind === 'floorLamp') {
    if (furnBox) {
      x = Math.min(0.88, furnBox.x + furnBox.w + 0.06);
      y = Math.max(0.38, furnBox.y + furnBox.h * 0.35);
    } else if (floorBox) {
      x = floorBox.x + floorBox.w * 0.8;
      y = floorBox.y + floorBox.h * 0.32;
    } else {
      x = 0.78;
      y = 0.56;
    }
    width = 0.15;
    height = 0.36;
  } else if (kind === 'tableLamp') {
    x = furnBox ? Math.min(0.85, furnBox.x + furnBox.w * 0.85) : 0.72;
    y = furnBox ? Math.max(0.32, furnBox.y - 0.02) : 0.54;
    width = 0.11;
    height = 0.17;
  } else if (kind === 'cushions') {
    x = furnBox ? furnBox.x + furnBox.w * 0.42 : 0.48;
    y = furnBox ? furnBox.y + furnBox.h * 0.42 : 0.62;
    width = 0.14;
    height = 0.11;
  } else if (kind === 'chandelier') {
    x = ceilBox ? ceilBox.x + ceilBox.w * 0.5 : 0.5;
    y = ceilBox ? Math.min(0.22, ceilBox.y + ceilBox.h * 0.55) : 0.14;
    width = 0.2;
    height = 0.2;
  }

  return {
    id: `ov-${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    kind,
    variant,
    label: catalogEntry.label,
    x,
    y,
    width,
    height,
    rotation: 0,
    color,
    zIndex,
    opacity: variant === 'sheer' ? 0.84 : 0.96,
  };
}

/**
 * Generates crisp inline SVG markup for any decor overlay item, parameterized
 * by its chosen color, variant, and room average brightness.
 */
export function buildOverlaySvgMarkup(item: DecorOverlayItem): string {
  const c = item.color || '#C96F53';
  const dark = adjustHex(c, -34);
  const light = adjustHex(c, 32);

  switch (item.kind) {
    case 'curtains': {
      const sheerOpacity = item.variant === 'sheer' ? '0.62' : '0.94';
      const floralPattern =
        item.variant === 'floral'
          ? `<g opacity="0.45" fill="${dark}">
               <circle cx="28" cy="70" r="6"/><circle cx="38" cy="120" r="5"/><circle cx="24" cy="170" r="7"/>
               <circle cx="172" cy="80" r="6"/><circle cx="162" cy="135" r="5"/><circle cx="176" cy="180" r="6"/>
             </g>`
          : '';
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 220">
        <defs>
          <linearGradient id="drapeL" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stop-color="${dark}"/>
            <stop offset="35%" stop-color="${c}"/>
            <stop offset="65%" stop-color="${light}"/>
            <stop offset="100%" stop-color="${dark}"/>
          </linearGradient>
        </defs>
        <rect x="6" y="10" width="188" height="6" rx="3" fill="#B8924A"/>
        <circle cx="6" cy="13" r="6" fill="#D4AF37"/>
        <circle cx="194" cy="13" r="6" fill="#D4AF37"/>
        <path d="M12 16 L54 16 L48 214 L10 214 Z" fill="url(#drapeL)" opacity="${sheerOpacity}"/>
        <path d="M22 16 L24 214 M36 16 L34 214" stroke="${dark}" stroke-width="1.5" opacity="0.35"/>
        <path d="M146 16 L188 16 L190 214 L152 214 Z" fill="url(#drapeL)" opacity="${sheerOpacity}"/>
        <path d="M164 16 L166 214 M178 16 L176 214" stroke="${dark}" stroke-width="1.5" opacity="0.35"/>
        ${floralPattern}
      </svg>`;
    }

    case 'plants': {
      if (item.variant === 'snake') {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 200">
          <path d="M44 132 L96 132 L88 188 Q70 194 52 188 Z" fill="#C97B59"/>
          <ellipse cx="70" cy="132" rx="26" ry="6" fill="#8C4F35"/>
          <path d="M56 132 C48 92 46 52 54 22 C62 56 64 96 64 132 Z" fill="${c}"/>
          <path d="M70 132 C66 80 68 38 74 14 C82 44 82 88 78 132 Z" fill="${light}"/>
          <path d="M84 132 C88 94 94 58 98 32 C94 70 90 100 88 132 Z" fill="${dark}"/>
          <path d="M62 132 C56 100 58 68 62 44 C66 72 68 102 68 132 Z" fill="${dark}" opacity="0.7"/>
        </svg>`;
      }
      if (item.variant === 'hanging') {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 180">
          <line x1="70" y1="4" x2="46" y2="54" stroke="#A68B6B" stroke-width="2"/>
          <line x1="70" y1="4" x2="94" y2="54" stroke="#A68B6B" stroke-width="2"/>
          <circle cx="70" cy="6" r="4" fill="#64748B"/>
          <path d="M42 54 L98 54 L90 92 Q70 98 50 92 Z" fill="#EFE7DA" stroke="#D5C7B2" stroke-width="2"/>
          <path d="M48 56 Q30 92 38 140 M60 56 Q52 110 56 158 M80 56 Q88 112 84 150 M94 56 Q110 92 102 132" fill="none" stroke="${dark}" stroke-width="2.5"/>
          <ellipse cx="38" cy="88" rx="9" ry="6" fill="${c}" transform="rotate(-25 38 88)"/>
          <ellipse cx="36" cy="120" rx="10" ry="6" fill="${light}" transform="rotate(-15 36 120)"/>
          <ellipse cx="56" cy="108" rx="10" ry="6" fill="${c}" transform="rotate(15 56 108)"/>
          <ellipse cx="58" cy="144" rx="9" ry="6" fill="${light}" transform="rotate(-20 58 144)"/>
          <ellipse cx="86" cy="100" rx="10" ry="6" fill="${c}" transform="rotate(20 86 100)"/>
          <ellipse cx="84" cy="136" rx="9" ry="6" fill="${dark}" transform="rotate(10 84 136)"/>
          <ellipse cx="104" cy="112" rx="9" ry="6" fill="${light}" transform="rotate(25 104 112)"/>
        </svg>`;
      }
      // Monstera
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 200">
        <path d="M52 134 L108 134 L100 188 Q80 194 60 188 Z" fill="#D9C5B2"/>
        <path d="M52 134 L108 134 L105 150 L55 150 Z" fill="#C4AD96"/>
        <ellipse cx="80" cy="134" rx="28" ry="6" fill="#785A42"/>
        <path d="M80 134 Q68 102 44 76 M80 134 Q82 94 82 54 M80 134 Q96 102 116 74" fill="none" stroke="${dark}" stroke-width="3.5"/>
        <ellipse cx="42" cy="70" rx="26" ry="18" fill="${c}" transform="rotate(-28 42 70)"/>
        <ellipse cx="82" cy="48" rx="24" ry="28" fill="${light}"/>
        <ellipse cx="118" cy="72" rx="26" ry="18" fill="${dark}" transform="rotate(26 118 72)"/>
        <ellipse cx="60" cy="96" rx="20" ry="14" fill="${light}" transform="rotate(-14 60 96)"/>
        <ellipse cx="102" cy="98" rx="20" ry="14" fill="${c}" transform="rotate(16 102 98)"/>
      </svg>`;
    }

    case 'rug': {
      if (item.variant === 'round') {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 120">
          <ellipse cx="120" cy="60" rx="112" ry="50" fill="${c}" stroke="${dark}" stroke-width="3"/>
          <ellipse cx="120" cy="60" rx="92" ry="40" fill="none" stroke="${light}" stroke-width="2" stroke-dasharray="6 4"/>
          <ellipse cx="120" cy="60" rx="64" ry="26" fill="none" stroke="${dark}" stroke-width="1.5" opacity="0.6"/>
        </svg>`;
      }
      if (item.variant === 'patterned') {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 120">
          <polygon points="34,12 226,12 252,108 8,108" fill="${c}" stroke="${dark}" stroke-width="3"/>
          <polygon points="48,22 212,22 232,98 28,98" fill="none" stroke="${light}" stroke-width="2.5"/>
          <polygon points="130,30 175,60 130,90 85,60" fill="${dark}" opacity="0.45"/>
          <polygon points="130,40 158,60 130,80 102,60" fill="${light}" opacity="0.65"/>
        </svg>`;
      }
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 120">
        <polygon points="34,12 226,12 252,108 8,108" fill="${c}" stroke="${dark}" stroke-width="2.5"/>
        <polygon points="44,20 216,20 238,100 22,100" fill="${light}" opacity="0.35"/>
        <line x1="16" y1="108" x2="244" y2="108" stroke="${dark}" stroke-width="3" stroke-dasharray="3 4"/>
      </svg>`;
    }

    case 'wallArt': {
      if (item.variant === 'triptych') {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 110">
          <g stroke="#292524" stroke-width="4" fill="#FAF8F4">
            <rect x="8" y="10" width="64" height="90" rx="2"/>
            <rect x="88" y="10" width="64" height="90" rx="2"/>
            <rect x="168" y="10" width="64" height="90" rx="2"/>
          </g>
          <circle cx="40" cy="48" r="18" fill="${c}" opacity="0.85"/>
          <path d="M18 88 Q40 62 62 88 Z" fill="${dark}" opacity="0.75"/>
          <rect x="102" y="26" width="36" height="46" rx="18" fill="${light}"/>
          <circle cx="200" cy="62" r="16" fill="${dark}" opacity="0.8"/>
          <path d="M180 34 Q200 50 220 34" fill="none" stroke="${c}" stroke-width="4"/>
        </svg>`;
      }
      if (item.variant === 'gallery') {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 140">
          <g stroke="#292524" stroke-width="3.5" fill="#FAF8F4">
            <rect x="10" y="14" width="66" height="52"/>
            <rect x="90" y="8" width="80" height="68"/>
            <rect x="184" y="18" width="66" height="52"/>
            <rect x="34" y="80" width="82" height="50"/>
            <rect x="132" y="84" width="90" height="46"/>
          </g>
          <circle cx="43" cy="40" r="14" fill="${c}"/>
          <rect x="106" y="24" width="48" height="36" rx="4" fill="${dark}" opacity="0.75"/>
          <circle cx="217" cy="44" r="13" fill="${light}"/>
          <path d="M46 120 L74 92 L102 120 Z" fill="${c}" opacity="0.8"/>
          <circle cx="177" cy="107" r="14" fill="${dark}" opacity="0.65"/>
        </svg>`;
      }
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 160">
        <rect x="10" y="10" width="120" height="140" rx="3" fill="#FAF8F4" stroke="#8C6239" stroke-width="6"/>
        <rect x="22" y="22" width="96" height="116" fill="#EFEAE1"/>
        <circle cx="70" cy="64" r="24" fill="${c}" opacity="0.9"/>
        <path d="M26 132 Q70 86 114 132 Z" fill="${dark}" opacity="0.8"/>
      </svg>`;
    }

    case 'floorLamp':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 280">
        <defs>
          <radialGradient id="lampGlow" cx="50%" cy="60%" r="55%">
            <stop offset="0%" stop-color="#FFFBEB" stop-opacity="0.95"/>
            <stop offset="55%" stop-color="${c}" stop-opacity="0.45"/>
            <stop offset="100%" stop-color="${c}" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <ellipse cx="44" cy="95" rx="44" ry="54" fill="url(#lampGlow)"/>
        <ellipse cx="96" cy="264" rx="28" ry="8" fill="#1E293B"/>
        <path d="M96 262 L96 86 Q96 22 44 26 L44 48" fill="none" stroke="#B8924A" stroke-width="5" stroke-linecap="round"/>
        <path d="M20 76 L68 76 L58 46 L30 46 Z" fill="${c}" stroke="#A17C38" stroke-width="2"/>
      </svg>`;

    case 'tableLamp':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 160">
        <defs>
          <radialGradient id="tlGlow" cx="50%" cy="55%" r="55%">
            <stop offset="0%" stop-color="#FEF3C7" stop-opacity="0.9"/>
            <stop offset="100%" stop-color="#F59E0B" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <circle cx="60" cy="68" r="52" fill="url(#tlGlow)"/>
        <path d="M26 78 L94 78 L82 28 L38 28 Z" fill="${c}" stroke="${dark}" stroke-width="2"/>
        <rect x="56" y="78" width="8" height="22" fill="#B8924A"/>
        <ellipse cx="60" cy="122" rx="22" ry="26" fill="#475569"/>
        <ellipse cx="60" cy="146" rx="26" ry="6" fill="#1E293B"/>
      </svg>`;

    case 'mirror':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 200">
        <defs>
          <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#F8FAFC"/>
            <stop offset="45%" stop-color="#CBD5E1"/>
            <stop offset="100%" stop-color="#E2E8F0"/>
          </linearGradient>
        </defs>
        <path d="M20 184 L20 68 A50 50 0 0 1 120 68 L120 184 Z" fill="url(#glass)" stroke="${c}" stroke-width="8"/>
        <path d="M36 146 L94 42" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round" opacity="0.65"/>
        <path d="M52 162 L106 64" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity="0.45"/>
      </svg>`;

    case 'shelves':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 130">
        <rect x="16" y="44" width="168" height="10" rx="2" fill="${c}" stroke="${dark}" stroke-width="1.5"/>
        <rect x="34" y="18" width="10" height="26" fill="#0D9488"/>
        <rect x="46" y="22" width="9" height="22" fill="#E07A5F"/>
        <rect x="57" y="16" width="11" height="28" fill="#475569"/>
        <path d="M134 28 L156 28 L152 44 L138 44 Z" fill="#FAF8F4" stroke="#CBD5E1" stroke-width="1.5"/>
        <circle cx="145" cy="22" r="9" fill="#2F6E49"/>
        <rect x="16" y="102" width="168" height="10" rx="2" fill="${c}" stroke="${dark}" stroke-width="1.5"/>
        <circle cx="54" cy="90" r="12" fill="#D97706" opacity="0.85"/>
        <rect x="116" y="76" width="12" height="26" fill="#1E293B"/>
        <rect x="130" y="80" width="10" height="22" fill="#94A3B8"/>
      </svg>`;

    case 'cushions':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 90">
        <rect x="12" y="16" width="58" height="58" rx="12" fill="${c}" stroke="${dark}" stroke-width="2" transform="rotate(-7 41 45)"/>
        <rect x="66" y="14" width="58" height="58" rx="12" fill="${light}" stroke="${c}" stroke-width="2" transform="rotate(8 95 43)"/>
      </svg>`;

    case 'chandelier':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 140">
        <defs>
          <radialGradient id="chGlow" cx="50%" cy="65%" r="50%">
            <stop offset="0%" stop-color="#FFFBEB" stop-opacity="0.85"/>
            <stop offset="100%" stop-color="#F59E0B" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <ellipse cx="90" cy="84" rx="82" ry="48" fill="url(#chGlow)"/>
        <rect x="87" y="4" width="6" height="46" fill="${c}"/>
        <line x1="26" y1="54" x2="154" y2="54" stroke="${c}" stroke-width="4" stroke-linecap="round"/>
        <line x1="56" y1="54" x2="56" y2="76" stroke="${c}" stroke-width="2.5"/>
        <line x1="124" y1="54" x2="124" y2="76" stroke="${c}" stroke-width="2.5"/>
        <circle cx="28" cy="68" r="13" fill="#FFFBEB" stroke="${c}" stroke-width="2"/>
        <circle cx="56" cy="86" r="13" fill="#FFFBEB" stroke="${c}" stroke-width="2"/>
        <circle cx="90" cy="72" r="15" fill="#FFFBEB" stroke="${c}" stroke-width="2"/>
        <circle cx="124" cy="86" r="13" fill="#FFFBEB" stroke="${c}" stroke-width="2"/>
        <circle cx="152" cy="68" r="13" fill="#FFFBEB" stroke="${c}" stroke-width="2"/>
      </svg>`;
  }
}

export function buildOverlayDataUri(item: DecorOverlayItem): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(buildOverlaySvgMarkup(item))}`;
}

/**
 * Renders the edited base canvas plus all SVG overlays (with drop shadow and
 * brightness matching to room brightness) into a single downloadable PNG data URL.
 */
export async function flattenStudioToPng(
  baseCanvas: HTMLCanvasElement,
  overlays: DecorOverlayItem[],
  roomAvgBrightness: number,
): Promise<string> {
  const out = document.createElement('canvas');
  out.width = baseCanvas.width;
  out.height = baseCanvas.height;
  const ctx = out.getContext('2d');
  if (!ctx) return baseCanvas.toDataURL('image/png');

  ctx.drawImage(baseCanvas, 0, 0);

  const sorted = [...overlays].sort((a, b) => a.zIndex - b.zIndex);
  const brightnessPct = Math.round(78 + (Math.max(40, Math.min(220, roomAvgBrightness)) / 220) * 32);

  for (const item of sorted) {
    const svgUri = buildOverlayDataUri(item);
    const img = await new Promise<HTMLImageElement | null>((resolve) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => resolve(null);
      el.src = svgUri;
    });
    if (!img) continue;

    const pxW = item.width * out.width;
    const pxH = item.height * out.height;
    const cx = item.x * out.width;
    const cy = item.y * out.height;

    ctx.save();
    ctx.globalAlpha = item.opacity;
    ctx.filter = `brightness(${brightnessPct}%) drop-shadow(0px 10px 14px rgba(15,23,42,0.28))`;
    ctx.translate(cx, cy);
    ctx.rotate((item.rotation * Math.PI) / 180);
    ctx.drawImage(img, -pxW / 2, -pxH / 2, pxW, pxH);
    ctx.restore();
  }

  return out.toDataURL('image/png');
}
