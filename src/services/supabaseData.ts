import { supabase } from '../lib/supabaseClient.js';
import type { Designer, DesignStyleId, RoomType } from '../types/decora';
import { DESIGN_STYLES, type DesignStyleItem } from '../data/catalog';
import { STUDIO_STYLE_PRESETS, type StylePresetDefinition } from '../studio/presets';

export type SupabaseConsultationStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled';

export interface SupabaseConsultationRow {
  id: string;
  booking_ref: string;
  name: string;
  email: string;
  phone: string;
  room_type: string;
  designer: string;
  preferred_date: string;
  preferred_time: string;
  message: string | null;
  status: SupabaseConsultationStatus;
  created_at: string;
}

export interface SupabaseDesignerRow {
  id: string;
  name: string;
  specialty: string;
  rating: number | null;
  image_url: string | null;
  bio: string | null;
  session_price?: string | number | null;
  hourly_rate?: string | number | null;
  price?: string | number | null;
  Experience?: number | null;
  experience?: number | null;
}

export interface SupabaseStyleCardRow {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
}

export function generateBookingRef(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `DEC-${code}`;
}

export async function insertPublicConsultation(input: {
  booking_ref: string;
  name: string;
  email: string;
  phone: string;
  room_type: RoomType;
  designer: string;
  preferred_date: string;
  preferred_time: string;
  message: string;
}): Promise<void> {
  // IMPORTANT: Do NOT call .select() after .insert() so public RLS insert-only policies succeed.
  const { error } = await supabase.from('consultations').insert([
    {
      booking_ref: input.booking_ref,
      name: input.name,
      email: input.email,
      phone: input.phone,
      room_type: input.room_type,
      designer: input.designer,
      preferred_date: input.preferred_date,
      preferred_time: input.preferred_time,
      message: input.message || '',
      status: 'pending',
    },
  ]);

  if (error) {
    throw new Error(error.message || 'Unable to save consultation booking.');
  }
}

export function formatSessionRate(
  raw: string | number | null | undefined,
  designerName: string,
): string {
  if (raw !== null && raw !== undefined && String(raw).trim() !== '') {
    const str = String(raw).trim();
    if (/^\d+(\.\d+)?$/.test(str)) {
      return `$${str}/session`;
    }
    return str;
  }

  const lower = designerName.trim().toLowerCase();
  if (lower.includes('marcus')) return '$85/session';
  if (lower.includes('elena')) return '$110/session';
  return '$95/session';
}

export function mapSupabaseDesignerToCatalog(row: SupabaseDesignerRow): Designer {
  const rawRate = row.session_price ?? row.hourly_rate ?? row.price;
  const rawYears = row.Experience ?? row.experience;
  return {
    id: String(row.id),
    name: row.name,
    title: 'Interior Designer',
    specialty: row.specialty || 'Residential Interiors',
    rating: Number(row.rating ?? 4.9),
    reviewCount: 38,
    hourlyRate: formatSessionRate(rawRate, row.name),
    avatarUrl:
      row.image_url || '/src/assets/images/designer_ananya_1794631599566.jpg',
    experienceYears:
      rawYears !== null && rawYears !== undefined && Number.isFinite(Number(rawYears))
        ? Number(rawYears)
        : 8,
    bio: row.bio || 'Curated residential design & space planning specialist.',
  };
}

export function mapSupabaseStyleCardToCatalog(
  row: SupabaseStyleCardRow,
): DesignStyleItem {
  const lower = row.title.trim().toLowerCase();
  const matchedDefault = DESIGN_STYLES.find(
    (d) => d.name.toLowerCase() === lower || d.id === lower,
  );
  const slug = lower.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  return {
    id: (matchedDefault?.id || slug || String(row.id)) as DesignStyleId,
    name: row.title,
    tagline: row.description || matchedDefault?.tagline || 'Curated interior aesthetic',
    palette: matchedDefault?.palette || ['#F7F4EE', '#0D9488', '#FF6B5B'],
    imageUrl:
      row.image_url ||
      matchedDefault?.imageUrl ||
      '/src/assets/images/hero_after_living_1794631596792.jpg',
    materials: matchedDefault?.materials || 'Curated architectural finishes',
  };
}

export function mapStyleCardToStudioPreset(
  card: DesignStyleItem,
  index: number,
): StylePresetDefinition {
  const lower = card.name.trim().toLowerCase();
  const exactPreset = STUDIO_STYLE_PRESETS.find(
    (p) => p.id === card.id || p.name.toLowerCase() === lower,
  );
  if (exactPreset) {
    return {
      ...exactPreset,
      name: card.name,
    };
  }

  // Fallback to deterministic preset settings for custom Admin-added style cards
  const base = STUDIO_STYLE_PRESETS[index % STUDIO_STYLE_PRESETS.length];
  return {
    ...base,
    id: card.id,
    name: card.name,
    wallColor: card.palette[0] || base.wallColor,
    wallColorName: `${card.name} Tone`,
    sofaBedColor: card.palette[1] || base.sofaBedColor,
    ceilingColor: '#FAF8F4',
  };
}

export async function fetchPublicDesignersFromSupabase(): Promise<Designer[] | null> {
  try {
    const { data, error } = await supabase
      .from('designers')
      .select('*')
      .order('name', { ascending: true });

    if (error || !data || data.length === 0) {
      return null;
    }
    return (data as SupabaseDesignerRow[]).map(mapSupabaseDesignerToCatalog);
  } catch {
    return null;
  }
}

export async function fetchPublicStyleCardsFromSupabase(): Promise<
  DesignStyleItem[] | null
> {
  try {
    const { data, error } = await supabase
      .from('style_cards')
      .select('id, title, description, image_url')
      .order('title', { ascending: true });

    if (error || !data || data.length === 0) {
      return null;
    }
    return (data as SupabaseStyleCardRow[]).map(mapSupabaseStyleCardToCatalog);
  } catch {
    return null;
  }
}
