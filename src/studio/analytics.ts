import type { DecorAddon, FlooringType, RoomType } from '../types/decora';

const ANALYTICS_STORAGE_KEY = 'decoraai_analytics_events_v1';

export interface DesignAnalyticsEvent {
  id: string;
  timestamp: string;
  action: 'preset_applied' | 'design_saved' | 'png_downloaded' | 'instruction_applied' | 'room_edited';
  style: string;
  wallColor: string;
  wallColorName: string;
  floorType: FlooringType;
  furnitureColor: string;
  addOns: DecorAddon[];
  roomType: RoomType;
  instructionKeywords: string[];
}

export function readAnalyticsEvents(): DesignAnalyticsEvent[] {
  try {
    const raw = localStorage.getItem(ANALYTICS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as DesignAnalyticsEvent[]) : [];
  } catch {
    return [];
  }
}

export function logDesignEvent(
  event: Omit<DesignAnalyticsEvent, 'id' | 'timestamp'>,
): DesignAnalyticsEvent[] {
  const nextItem: DesignAnalyticsEvent = {
    ...event,
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
  };
  const existing = readAnalyticsEvents();
  const updated = [nextItem, ...existing].slice(0, 400);
  try {
    localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore quota issues
  }
  return updated;
}

export function clearAnalyticsEvents(): void {
  try {
    localStorage.removeItem(ANALYTICS_STORAGE_KEY);
  } catch {
    // Ignore storage issues
  }
}

export function seedDemoAnalytics(): DesignAnalyticsEvent[] {
  const now = Date.now();
  const day = 86400000;

  const templates: Array<Omit<DesignAnalyticsEvent, 'id' | 'timestamp'> & { daysAgo: number }> = [
    {
      daysAgo: 13,
      action: 'design_saved',
      style: 'Scandinavian',
      wallColor: '#A9BFA8',
      wallColorName: 'Sage Mist',
      floorType: 'Light Wood',
      furnitureColor: '#E3DAC9',
      addOns: ['Plants', 'Curtains', 'Rugs'],
      roomType: 'Living Room',
      instructionKeywords: ['sage green', 'sheer curtains', 'monstera'],
    },
    {
      daysAgo: 12,
      action: 'preset_applied',
      style: 'Modern',
      wallColor: '#F3F0EA',
      wallColorName: 'Warm Alabaster',
      floorType: 'Light Wood',
      furnitureColor: '#0F5E66',
      addOns: ['Wall Art', 'Lamps', 'Rugs'],
      roomType: 'Living Room',
      instructionKeywords: ['floor lamp', 'triptych'],
    },
    {
      daysAgo: 11,
      action: 'design_saved',
      style: 'Japandi',
      wallColor: '#D4B99E',
      wallColorName: 'Sandstone Clay',
      floorType: 'Light Wood',
      furnitureColor: '#5C6451',
      addOns: ['Plants', 'Floating Shelves', 'Lamps'],
      roomType: 'Bedroom',
      instructionKeywords: ['shelves', 'snake plant'],
    },
    {
      daysAgo: 10,
      action: 'png_downloaded',
      style: 'Scandinavian',
      wallColor: '#A9BFA8',
      wallColorName: 'Sage Mist',
      floorType: 'Light Wood',
      furnitureColor: '#DFD5BE',
      addOns: ['Plants', 'Rugs', 'Curtains', 'Mirrors'],
      roomType: 'Bedroom',
      instructionKeywords: ['sage green', 'mirror', 'brighter'],
    },
    {
      daysAgo: 9,
      action: 'design_saved',
      style: 'Luxury',
      wallColor: '#384659',
      wallColorName: 'Deep Slate',
      floorType: 'Marble',
      furnitureColor: '#1E3A5F',
      addOns: ['Chandelier', 'Mirrors', 'Curtains'],
      roomType: 'Living Room',
      instructionKeywords: ['marble', 'chandelier'],
    },
    {
      daysAgo: 8,
      action: 'instruction_applied',
      style: 'Bohemian',
      wallColor: '#D9785C',
      wallColorName: 'Sunlit Terracotta',
      floorType: 'Dark Wood',
      furnitureColor: '#D49A2A',
      addOns: ['Rugs', 'Plants', 'Cushions'],
      roomType: 'Living Room',
      instructionKeywords: ['terracotta', 'patterned rug', 'cozy'],
    },
    {
      daysAgo: 7,
      action: 'design_saved',
      style: 'Coastal',
      wallColor: '#7DB9B6',
      wallColorName: 'Coastal Teal',
      floorType: 'Light Wood',
      furnitureColor: '#F5EFE0',
      addOns: ['Curtains', 'Rugs', 'Plants'],
      roomType: 'Kitchen',
      instructionKeywords: ['teal', 'sheer curtains'],
    },
    {
      daysAgo: 6,
      action: 'preset_applied',
      style: 'Scandinavian',
      wallColor: '#A9BFA8',
      wallColorName: 'Sage Mist',
      floorType: 'Light Wood',
      furnitureColor: '#E3DAC9',
      addOns: ['Plants', 'Curtains', 'Wall Art'],
      roomType: 'Office',
      instructionKeywords: ['sage green', 'gallery wall'],
    },
    {
      daysAgo: 5,
      action: 'png_downloaded',
      style: 'Industrial',
      wallColor: '#78716C',
      wallColorName: 'Warm Slate',
      floorType: 'Gray Tiles',
      furnitureColor: '#9A5B32',
      addOns: ['Wall Art', 'Lamps'],
      roomType: 'Office',
      instructionKeywords: ['gray tiles', 'floor lamp'],
    },
    {
      daysAgo: 4,
      action: 'design_saved',
      style: 'Minimalist',
      wallColor: '#F5F5F4',
      wallColorName: 'Pure Chalk',
      floorType: 'Concrete',
      furnitureColor: '#CBD5E1',
      addOns: ['Mirrors', 'Plants'],
      roomType: 'Bedroom',
      instructionKeywords: ['mirror', 'brighter'],
    },
    {
      daysAgo: 3,
      action: 'design_saved',
      style: 'Scandinavian',
      wallColor: '#A9BFA8',
      wallColorName: 'Sage Mist',
      floorType: 'Marble',
      furnitureColor: '#0F5E66',
      addOns: ['Plants', 'Rugs', 'Lamps', 'Curtains'],
      roomType: 'Living Room',
      instructionKeywords: ['sage green', 'marble', 'plants'],
    },
    {
      daysAgo: 2,
      action: 'png_downloaded',
      style: 'Modern',
      wallColor: '#F3F0EA',
      wallColorName: 'Warm Alabaster',
      floorType: 'Light Wood',
      furnitureColor: '#E06655',
      addOns: ['Wall Art', 'Rugs', 'Cushions'],
      roomType: 'Living Room',
      instructionKeywords: ['coral sofa', 'rugs'],
    },
    {
      daysAgo: 1,
      action: 'design_saved',
      style: 'Luxury',
      wallColor: '#384659',
      wallColorName: 'Deep Slate',
      floorType: 'Marble',
      furnitureColor: '#334155',
      addOns: ['Chandelier', 'Mirrors', 'Rugs'],
      roomType: 'Dining',
      instructionKeywords: ['chandelier', 'marble'],
    },
    {
      daysAgo: 0,
      action: 'design_saved',
      style: 'Scandinavian',
      wallColor: '#A9BFA8',
      wallColorName: 'Sage Mist',
      floorType: 'Light Wood',
      furnitureColor: '#E3DAC9',
      addOns: ['Plants', 'Curtains', 'Rugs', 'Lamps'],
      roomType: 'Living Room',
      instructionKeywords: ['cozy', 'sage green', 'curtains'],
    },
  ];

  const demoEvents: DesignAnalyticsEvent[] = templates.map((t, idx) => ({
    id: `demo-${idx}-${now}`,
    timestamp: new Date(now - t.daysAgo * day).toISOString(),
    action: t.action,
    style: t.style,
    wallColor: t.wallColor,
    wallColorName: t.wallColorName,
    floorType: t.floorType,
    furnitureColor: t.furnitureColor,
    addOns: t.addOns,
    roomType: t.roomType,
    instructionKeywords: t.instructionKeywords,
  }));

  try {
    localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(demoEvents));
  } catch {
    // Ignore storage errors
  }

  return demoEvents;
}

export interface AnalyticsSummary {
  totalDesigns: number;
  mostPopularStyle: { name: string; count: number; sharePct: number };
  mostUsedColor: { name: string; hex: string; count: number; sharePct: number };
  avgAddonsPerDesign: number;
  styleCounts: Array<{ name: string; count: number }>;
  wallColorSlices: Array<{ name: string; hex: string; count: number }>;
  addonFrequency: Array<{ name: string; count: number }>;
  floorDistribution: Array<{ name: string; count: number }>;
  designsOverTime: Array<{ date: string; count: number }>;
  insights: string[];
}

export function computeAnalyticsSummary(events: DesignAnalyticsEvent[]): AnalyticsSummary {
  const totalDesigns = events.length;

  const styleMap = new Map<string, number>();
  const colorMap = new Map<string, { name: string; hex: string; count: number }>();
  const addonMap = new Map<string, number>();
  const floorMap = new Map<string, number>();
  const dayMap = new Map<string, number>();

  let totalAddons = 0;

  for (const e of events) {
    styleMap.set(e.style, (styleMap.get(e.style) || 0) + 1);

    const colorKey = `${e.wallColorName}|${e.wallColor.toUpperCase()}`;
    const existingColor = colorMap.get(colorKey);
    if (existingColor) {
      existingColor.count += 1;
    } else {
      colorMap.set(colorKey, {
        name: e.wallColorName,
        hex: e.wallColor.toUpperCase(),
        count: 1,
      });
    }

    const floorLabel = e.floorType === 'Original' ? 'Original Floor' : e.floorType;
    floorMap.set(floorLabel, (floorMap.get(floorLabel) || 0) + 1);

    totalAddons += e.addOns.length;
    for (const addon of e.addOns) {
      addonMap.set(addon, (addonMap.get(addon) || 0) + 1);
    }

    const dayKey = new Date(e.timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    dayMap.set(dayKey, (dayMap.get(dayKey) || 0) + 1);
  }

  const styleCounts = Array.from(styleMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const wallColorSlices = Array.from(colorMap.values()).sort((a, b) => b.count - a.count);

  const addonFrequency = Array.from(addonMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const floorDistribution = Array.from(floorMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const designsOverTime = Array.from(
    events
      .slice()
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .reduce((acc, item) => {
        const label = new Date(item.timestamp).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
        acc.set(label, (acc.get(label) || 0) + 1);
        return acc;
      }, new Map<string, number>()),
  ).map(([date, count]) => ({ date, count }));

  const topStyle = styleCounts[0]
    ? {
        name: styleCounts[0].name,
        count: styleCounts[0].count,
        sharePct: Math.round((styleCounts[0].count / Math.max(1, totalDesigns)) * 100),
      }
    : { name: 'None yet', count: 0, sharePct: 0 };

  const topColor = wallColorSlices[0]
    ? {
        name: wallColorSlices[0].name,
        hex: wallColorSlices[0].hex,
        count: wallColorSlices[0].count,
        sharePct: Math.round((wallColorSlices[0].count / Math.max(1, totalDesigns)) * 100),
      }
    : { name: 'None yet', hex: '#A9BFA8', count: 0, sharePct: 0 };

  const avgAddonsPerDesign =
    totalDesigns > 0 ? Number((totalAddons / totalDesigns).toFixed(1)) : 0;

  const insights: string[] = [];
  if (totalDesigns > 0) {
    insights.push(
      `${topColor.name} (${topColor.hex}) is the most popular wall color (${topColor.sharePct}% of recorded edits).`,
    );
    insights.push(
      `${topStyle.name} leads style preference at ${topStyle.sharePct}% across ${totalDesigns} studio sessions.`,
    );
    if (addonFrequency[0]) {
      const topAddonPct = Math.round((addonFrequency[0].count / totalDesigns) * 100);
      insights.push(
        `${addonFrequency[0].name} is the #1 decor add-on, appearing in ${topAddonPct}% of designs (avg ${avgAddonsPerDesign} add-ons/room).`,
      );
    }
    if (floorDistribution[0]) {
      const topFloorPct = Math.round((floorDistribution[0].count / totalDesigns) * 100);
      insights.push(
        `${floorDistribution[0].name} accounts for ${topFloorPct}% of flooring selections.`,
      );
    }
  }

  return {
    totalDesigns,
    mostPopularStyle: topStyle,
    mostUsedColor: topColor,
    avgAddonsPerDesign,
    styleCounts,
    wallColorSlices,
    addonFrequency,
    floorDistribution,
    designsOverTime,
    insights,
  };
}

export function exportAnalyticsCsv(events: DesignAnalyticsEvent[]): void {
  const headers = [
    'id',
    'timestamp',
    'action',
    'roomType',
    'style',
    'wallColorName',
    'wallColorHex',
    'floorType',
    'furnitureColor',
    'addOns',
    'instructionKeywords',
  ];

  const escapeCsv = (val: string) => `"${val.replace(/"/g, '""')}"`;

  const rows = events.map((e) =>
    [
      e.id,
      e.timestamp,
      e.action,
      e.roomType,
      e.style,
      e.wallColorName,
      e.wallColor,
      e.floorType,
      e.furnitureColor,
      e.addOns.join('; '),
      e.instructionKeywords.join('; '),
    ]
      .map((cell) => escapeCsv(String(cell)))
      .join(','),
  );

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `decoraai-design-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
