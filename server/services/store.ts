import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserModel } from '../models/User.ts';
import { DesignModel } from '../models/Design.ts';
import { ConsultationModel } from '../models/Consultation.ts';

export type UserRole = 'user' | 'admin';
export type ConsultationStatus = 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  preferredStyle?: string;
  createdAt: string;
}

export interface StoredVariation {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  palette: string[];
  highlights: string[];
  estimatedCost: string;
  isLiveAiRender: boolean;
  addonChecks?: Array<{
    addon: string;
    present: boolean;
    retried: boolean;
    statusText: string;
  }>;
  promptUsed?: string;
}

export interface StoredDesign {
  id: string;
  userId?: string | null;
  title: string;
  originalImage: string;
  generatedImages: StoredVariation[];
  selectedVariationIndex: number;
  style: string;
  styleId: string;
  roomType: string;
  customizations: {
    wallColor: string;
    wallColorName: string;
    flooring: string;
    furnitureStyle: string;
    sofaBedColor: string;
    lightingMood: string;
    decorAddons: string[];
    budgetLevel: string;
    extraInstructions: string;
  };
  tags: string[];
  isFavorite: boolean;
  createdAt: string;
}

export interface StoredConsultation {
  id: string;
  userId?: string | null;
  designerId: string;
  designerName: string;
  name: string;
  email: string;
  phone: string;
  roomType: string;
  preferredDate: string;
  preferredTime: string;
  message: string;
  status: ConsultationStatus;
  referenceCode: string;
  createdAt: string;
}

interface LocalDbSchema {
  users: StoredUser[];
  designs: StoredDesign[];
  consultations: StoredConsultation[];
  seededAdminDefaults?: boolean;
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'decoraai.json');

let usingMongo = false;

const SEED_DESIGNS: StoredDesign[] = [
  {
    id: 'seed-design-1',
    userId: null,
    title: 'Sunlit Scandinavian Living Room',
    originalImage: '/src/assets/images/hero_before_living_1794631596061.jpg',
    generatedImages: [
      {
        id: 'seed-var-1',
        title: 'Teal Velvet & Herringbone Oak',
        subtitle: 'Warm sunlit Scandinavian transformation preserving window geometry',
        imageUrl: '/src/assets/images/hero_after_living_1794631596792.jpg',
        palette: ['#F7F4EE', '#0F5E66', '#E86A58', '#C68B3A'],
        highlights: [
          'Deep teal velvet three-seater with coral cushions',
          'Warm herringbone oak planks & woven jute rug',
          'Sculptural brass arc floor lamp & indoor monstera',
        ],
        estimatedCost: '$2,400 – $3,100',
        isLiveAiRender: false,
      },
    ],
    selectedVariationIndex: 0,
    style: 'Scandinavian',
    styleId: 'scandinavian',
    roomType: 'Living Room',
    customizations: {
      wallColor: '#F7F4EE',
      wallColorName: 'Warm Alabaster',
      flooring: 'Wood',
      furnitureStyle: 'Curved Bouclé & Velvet',
      sofaBedColor: '#0F5E66',
      lightingMood: 'Natural Daylight',
      decorAddons: ['Plants', 'Rugs', 'Wall Art', 'Lamps'],
      budgetLevel: 'Standard',
      extraInstructions: 'Keep the right-side window uncluttered and add a reading lamp.',
    },
    tags: ['Living Room', 'Teal Accent', 'Sunlit'],
    isFavorite: true,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'seed-design-2',
    userId: null,
    title: 'Serene Japandi Oak Bedroom',
    originalImage: '/src/assets/images/hero_before_living_1794631596061.jpg',
    generatedImages: [
      {
        id: 'seed-var-2',
        title: 'Limewash Plaster & Ash Timber',
        subtitle: 'Low-profile organic sanctuary with soft diffused daylight',
        imageUrl: '/src/assets/images/style_japandi_bedroom_1794631597258.jpg',
        palette: ['#E8DFD1', '#A65D3B', '#D5C7B2', '#5C6451'],
        highlights: [
          'Low ash wood platform frame with terracotta linen',
          'Handcrafted rice-paper pendant lantern',
          'Textured limewash plaster walls & olive branch ceramic',
        ],
        estimatedCost: '$1,850 – $2,400',
        isLiveAiRender: false,
      },
    ],
    selectedVariationIndex: 0,
    style: 'Japandi',
    styleId: 'japandi',
    roomType: 'Bedroom',
    customizations: {
      wallColor: '#E8DFD1',
      wallColorName: 'Warm Limewash',
      flooring: 'Wood',
      furnitureStyle: 'Low Organic Timber',
      sofaBedColor: '#A65D3B',
      lightingMood: 'Warm',
      decorAddons: ['Plants', 'Curtains', 'Lamps'],
      budgetLevel: 'Standard',
      extraInstructions: 'Soft tactile linens and clutter-free bedside surfaces.',
    },
    tags: ['Bedroom', 'Calm', 'Organic'],
    isFavorite: false,
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

const todayPlusDays = (days: number): string => {
  const d = new Date(Date.now() + days * 86400000);
  return d.toISOString().slice(0, 10);
};

const SEED_CONSULTATIONS: StoredConsultation[] = [
  {
    id: 'seed-cns-1',
    userId: null,
    designerId: 'designer-ananya',
    designerName: 'Ananya Verma',
    name: 'Priya Nair',
    email: 'priya.nair@example.com',
    phone: '+1 (415) 555-0142',
    roomType: 'Living Room',
    preferredDate: todayPlusDays(2),
    preferredTime: '11:00 AM',
    message: 'Want warm Scandinavian oak flooring, sage walls, and linen curtains for our sunlit apartment.',
    status: 'Pending',
    referenceCode: 'DEC-84A2K',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'seed-cns-2',
    userId: null,
    designerId: 'designer-marcus',
    designerName: 'Marcus Vance',
    name: 'Daniel Brooks',
    email: 'daniel.brooks@example.com',
    phone: '+1 (312) 555-0189',
    roomType: 'Office',
    preferredDate: todayPlusDays(3),
    preferredTime: '01:30 PM',
    message: 'Converting spare room into an industrial-warm studio office with acoustic wood slats.',
    status: 'Confirmed',
    referenceCode: 'DEC-39M7Q',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'seed-cns-3',
    userId: null,
    designerId: 'designer-elena',
    designerName: 'Elena Rostova',
    name: 'Sophia Chen',
    email: 'sophia.chen@example.com',
    phone: '+1 (212) 555-0114',
    roomType: 'Bedroom',
    preferredDate: todayPlusDays(4),
    preferredTime: '03:30 PM',
    message: 'Interested in Japandi limewash palette and low ash timber bed frame.',
    status: 'Confirmed',
    referenceCode: 'DEC-51R9P',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'seed-cns-4',
    userId: null,
    designerId: 'designer-ananya',
    designerName: 'Ananya Verma',
    name: 'Rahul Mehta',
    email: 'rahul.mehta@example.com',
    phone: '+1 (650) 555-0196',
    roomType: 'Dining',
    preferredDate: todayPlusDays(-3),
    preferredTime: '05:00 PM',
    message: 'Completed walkthrough for 6-seater walnut dining area and pendant chandelier placement.',
    status: 'Completed',
    referenceCode: 'DEC-72V4N',
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
  {
    id: 'seed-cns-5',
    userId: null,
    designerId: 'designer-elena',
    designerName: 'Elena Rostova',
    name: 'Claire Bennett',
    email: 'claire.bennett@example.com',
    phone: '+1 (206) 555-0167',
    roomType: 'Kitchen',
    preferredDate: todayPlusDays(1),
    preferredTime: '09:30 AM',
    message: 'Need to reschedule kitchen island lighting review to next month.',
    status: 'Cancelled',
    referenceCode: 'DEC-18C6T',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
];

function createDefaultAdminUser(): StoredUser {
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@decoraai.com').toLowerCase().trim();
  const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
  return {
    id: 'usr_admin_decoraai',
    name: 'Studio Admin',
    email: adminEmail,
    passwordHash: bcrypt.hashSync(adminPass, 10),
    role: 'admin',
    preferredStyle: 'modern',
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
  };
}

function ensureAdminAndSeedInDb(db: LocalDbSchema): LocalDbSchema {
  let dirty = false;
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@decoraai.com').toLowerCase().trim();
  const hasAdmin = db.users.some((u) => u.email === adminEmail);
  if (!hasAdmin) {
    db.users.unshift(createDefaultAdminUser());
    dirty = true;
  } else {
    db.users = db.users.map((u) =>
      u.email === adminEmail && u.role !== 'admin' ? { ...u, role: 'admin' } : u,
    );
  }

  if (!db.seededAdminDefaults) {
    if (db.consultations.length === 0) {
      db.consultations = [...SEED_CONSULTATIONS];
    }
    db.seededAdminDefaults = true;
    dirty = true;
  }

  if (dirty) {
    writeLocalDb(db);
  }
  return db;
}

function ensureLocalDb(): LocalDbSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    const initial: LocalDbSchema = {
      users: [createDefaultAdminUser()],
      designs: SEED_DESIGNS,
      consultations: [...SEED_CONSULTATIONS],
      seededAdminDefaults: true,
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<LocalDbSchema>;
    const db: LocalDbSchema = {
      users: Array.isArray(parsed.users)
        ? parsed.users.map((u) => ({ ...u, role: u.role === 'admin' ? 'admin' : 'user' }))
        : [],
      designs: Array.isArray(parsed.designs) ? parsed.designs : SEED_DESIGNS,
      consultations: Array.isArray(parsed.consultations) ? parsed.consultations : [],
      seededAdminDefaults: Boolean(parsed.seededAdminDefaults),
    };
    return ensureAdminAndSeedInDb(db);
  } catch {
    const fallback: LocalDbSchema = {
      users: [createDefaultAdminUser()],
      designs: SEED_DESIGNS,
      consultations: [...SEED_CONSULTATIONS],
      seededAdminDefaults: true,
    };
    writeLocalDb(fallback);
    return fallback;
  }
}

function writeLocalDb(db: LocalDbSchema): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf8');
}

async function ensureMongoAdminSeeded(): Promise<void> {
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@decoraai.com').toLowerCase().trim();
  const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
  const existing = await UserModel.findOne({ email: adminEmail }).lean();
  if (!existing) {
    await UserModel.create({
      name: 'Studio Admin',
      email: adminEmail,
      passwordHash: bcrypt.hashSync(adminPass, 10),
      role: 'admin',
      preferredStyle: 'modern',
    });
  } else if (existing.role !== 'admin') {
    await UserModel.updateOne({ _id: existing._id }, { $set: { role: 'admin' } });
  }

  const count = await ConsultationModel.countDocuments();
  if (count === 0) {
    await ConsultationModel.insertMany(
      SEED_CONSULTATIONS.map((c) => ({
        userId: null,
        designerId: c.designerId,
        designerName: c.designerName,
        name: c.name,
        email: c.email,
        phone: c.phone,
        roomType: c.roomType,
        preferredDate: c.preferredDate,
        preferredTime: c.preferredTime,
        message: c.message,
        status: c.status,
        referenceCode: c.referenceCode,
      })),
    );
  }
}

/**
 * Connect to MongoDB if MONGODB_URI is provided and reachable; otherwise operate seamlessly
 * with the persistent local JSON store so all endpoints function immediately.
 */
export async function connectDatabase(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri || (uri.includes('127.0.0.1') && !process.env.FORCE_MONGO)) {
    ensureLocalDb();
    usingMongo = false;
    return;
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2500 });
    usingMongo = true;
    await ensureMongoAdminSeeded();
    console.log('[DecoraAI] Connected to MongoDB via Mongoose');
  } catch {
    ensureLocalDb();
    usingMongo = false;
    console.log('[DecoraAI] MongoDB unavailable; running with local persistent store');
  }
}

export function isMongoConnected(): boolean {
  return usingMongo && mongoose.connection.readyState === 1;
}

export const store = {
  async findUserByEmail(email: string): Promise<StoredUser | null> {
    const normalized = email.toLowerCase().trim();
    if (isMongoConnected()) {
      const doc = await UserModel.findOne({ email: normalized }).lean();
      if (!doc) return null;
      return {
        id: String(doc._id),
        name: doc.name,
        email: doc.email,
        passwordHash: doc.passwordHash,
        role: doc.role === 'admin' ? 'admin' : 'user',
        preferredStyle: doc.preferredStyle,
        createdAt: new Date(doc.createdAt).toISOString(),
      };
    }
    const db = ensureLocalDb();
    return db.users.find((u) => u.email === normalized) ?? null;
  },

  async findUserById(id: string): Promise<StoredUser | null> {
    if (isMongoConnected()) {
      const doc = await UserModel.findById(id).lean();
      if (!doc) return null;
      return {
        id: String(doc._id),
        name: doc.name,
        email: doc.email,
        passwordHash: doc.passwordHash,
        role: doc.role === 'admin' ? 'admin' : 'user',
        preferredStyle: doc.preferredStyle,
        createdAt: new Date(doc.createdAt).toISOString(),
      };
    }
    const db = ensureLocalDb();
    return db.users.find((u) => u.id === id) ?? null;
  },

  async createUser(input: {
    name: string;
    email: string;
    passwordHash: string;
    role?: UserRole;
    preferredStyle?: string;
  }): Promise<StoredUser> {
    const normalized = input.email.toLowerCase().trim();
    const role: UserRole = input.role === 'admin' ? 'admin' : 'user';
    if (isMongoConnected()) {
      const created = await UserModel.create({
        name: input.name.trim(),
        email: normalized,
        passwordHash: input.passwordHash,
        role,
        preferredStyle: input.preferredStyle || 'modern',
      });
      return {
        id: String(created._id),
        name: created.name,
        email: created.email,
        passwordHash: created.passwordHash,
        role: created.role === 'admin' ? 'admin' : 'user',
        preferredStyle: created.preferredStyle,
        createdAt: created.createdAt.toISOString(),
      };
    }
    const db = ensureLocalDb();
    const user: StoredUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: input.name.trim(),
      email: normalized,
      passwordHash: input.passwordHash,
      role,
      preferredStyle: input.preferredStyle || 'modern',
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    writeLocalDb(db);
    return user;
  },

  async updateUserProfile(
    id: string,
    updates: { name?: string; preferredStyle?: string },
  ): Promise<StoredUser | null> {
    if (isMongoConnected()) {
      const doc = await UserModel.findByIdAndUpdate(
        id,
        {
          ...(updates.name ? { name: updates.name.trim() } : {}),
          ...(updates.preferredStyle ? { preferredStyle: updates.preferredStyle } : {}),
        },
        { new: true },
      ).lean();
      if (!doc) return null;
      return {
        id: String(doc._id),
        name: doc.name,
        email: doc.email,
        passwordHash: doc.passwordHash,
        role: doc.role === 'admin' ? 'admin' : 'user',
        preferredStyle: doc.preferredStyle,
        createdAt: new Date(doc.createdAt).toISOString(),
      };
    }
    const db = ensureLocalDb();
    const idx = db.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    db.users[idx] = {
      ...db.users[idx],
      ...(updates.name ? { name: updates.name.trim() } : {}),
      ...(updates.preferredStyle ? { preferredStyle: updates.preferredStyle } : {}),
    };
    writeLocalDb(db);
    return db.users[idx];
  },

  async listUsersSummary(): Promise<
    Array<{
      id: string;
      name: string;
      email: string;
      role: UserRole;
      preferredStyle?: string;
      createdAt: string;
    }>
  > {
    if (isMongoConnected()) {
      const docs = await UserModel.find().sort({ createdAt: -1 }).lean();
      return docs.map((u) => ({
        id: String(u._id),
        name: u.name,
        email: u.email,
        role: u.role === 'admin' ? 'admin' : 'user',
        preferredStyle: u.preferredStyle,
        createdAt: new Date(u.createdAt).toISOString(),
      }));
    }
    const db = ensureLocalDb();
    return [...db.users]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role === 'admin' ? 'admin' : 'user',
        preferredStyle: u.preferredStyle,
        createdAt: u.createdAt,
      }));
  },

  async listDesigns(userId?: string | null): Promise<StoredDesign[]> {
    if (isMongoConnected()) {
      const query = userId ? { $or: [{ userId }, { userId: null }] } : { userId: null };
      const docs = await DesignModel.find(query).sort({ createdAt: -1 }).lean();
      return docs.map((d) => ({
        id: String(d._id),
        userId: d.userId ?? null,
        title: d.title,
        originalImage: d.originalImage,
        generatedImages: d.generatedImages,
        selectedVariationIndex: d.selectedVariationIndex ?? 0,
        style: d.style,
        styleId: d.styleId,
        roomType: d.roomType,
        customizations: d.customizations,
        tags: d.tags ?? [],
        isFavorite: Boolean(d.isFavorite),
        createdAt: new Date(d.createdAt).toISOString(),
      }));
    }
    const db = ensureLocalDb();
    return db.designs
      .filter((d) => (userId ? d.userId === userId || !d.userId : !d.userId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getDesignById(id: string): Promise<StoredDesign | null> {
    if (isMongoConnected()) {
      const d = await DesignModel.findById(id).lean();
      if (!d) return null;
      return {
        id: String(d._id),
        userId: d.userId ?? null,
        title: d.title,
        originalImage: d.originalImage,
        generatedImages: d.generatedImages,
        selectedVariationIndex: d.selectedVariationIndex ?? 0,
        style: d.style,
        styleId: d.styleId,
        roomType: d.roomType,
        customizations: d.customizations,
        tags: d.tags ?? [],
        isFavorite: Boolean(d.isFavorite),
        createdAt: new Date(d.createdAt).toISOString(),
      };
    }
    const db = ensureLocalDb();
    return db.designs.find((d) => d.id === id) ?? null;
  },

  async createDesign(
    input: Omit<StoredDesign, 'id' | 'createdAt'>,
  ): Promise<StoredDesign> {
    if (isMongoConnected()) {
      const created = await DesignModel.create(input);
      return {
        id: String(created._id),
        userId: created.userId ?? null,
        title: created.title,
        originalImage: created.originalImage,
        generatedImages: created.generatedImages,
        selectedVariationIndex: created.selectedVariationIndex ?? 0,
        style: created.style,
        styleId: created.styleId,
        roomType: created.roomType,
        customizations: created.customizations,
        tags: created.tags ?? [],
        isFavorite: Boolean(created.isFavorite),
        createdAt: created.createdAt.toISOString(),
      };
    }
    const db = ensureLocalDb();
    const record: StoredDesign = {
      ...input,
      id: `dsn_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    db.designs.unshift(record);
    writeLocalDb(db);
    return record;
  },

  async toggleFavoriteDesign(id: string): Promise<StoredDesign | null> {
    if (isMongoConnected()) {
      const doc = await DesignModel.findById(id);
      if (!doc) return null;
      doc.isFavorite = !doc.isFavorite;
      await doc.save();
      return {
        id: String(doc._id),
        userId: doc.userId ?? null,
        title: doc.title,
        originalImage: doc.originalImage,
        generatedImages: doc.generatedImages,
        selectedVariationIndex: doc.selectedVariationIndex ?? 0,
        style: doc.style,
        styleId: doc.styleId,
        roomType: doc.roomType,
        customizations: doc.customizations,
        tags: doc.tags ?? [],
        isFavorite: doc.isFavorite,
        createdAt: doc.createdAt.toISOString(),
      };
    }
    const db = ensureLocalDb();
    const idx = db.designs.findIndex((d) => d.id === id);
    if (idx === -1) return null;
    db.designs[idx].isFavorite = !db.designs[idx].isFavorite;
    writeLocalDb(db);
    return db.designs[idx];
  },

  async updateDesignTags(id: string, tags: string[]): Promise<StoredDesign | null> {
    const cleanTags = Array.from(
      new Set(tags.map((t) => t.trim()).filter((t) => t.length > 0).slice(0, 8)),
    );
    if (isMongoConnected()) {
      const doc = await DesignModel.findByIdAndUpdate(
        id,
        { tags: cleanTags },
        { new: true },
      ).lean();
      if (!doc) return null;
      return {
        id: String(doc._id),
        userId: doc.userId ?? null,
        title: doc.title,
        originalImage: doc.originalImage,
        generatedImages: doc.generatedImages,
        selectedVariationIndex: doc.selectedVariationIndex ?? 0,
        style: doc.style,
        styleId: doc.styleId,
        roomType: doc.roomType,
        customizations: doc.customizations,
        tags: doc.tags ?? [],
        isFavorite: Boolean(doc.isFavorite),
        createdAt: new Date(doc.createdAt).toISOString(),
      };
    }
    const db = ensureLocalDb();
    const idx = db.designs.findIndex((d) => d.id === id);
    if (idx === -1) return null;
    db.designs[idx].tags = cleanTags;
    writeLocalDb(db);
    return db.designs[idx];
  },

  async deleteDesign(id: string): Promise<boolean> {
    if (isMongoConnected()) {
      const res = await DesignModel.findByIdAndDelete(id);
      return Boolean(res);
    }
    const db = ensureLocalDb();
    const before = db.designs.length;
    db.designs = db.designs.filter((d) => d.id !== id);
    if (db.designs.length !== before) {
      writeLocalDb(db);
      return true;
    }
    return false;
  },

  async listConsultations(userId?: string | null): Promise<StoredConsultation[]> {
    if (isMongoConnected()) {
      const query = userId ? { userId } : { userId: null };
      const docs = await ConsultationModel.find(query).sort({ createdAt: -1 }).lean();
      return docs.map((c) => ({
        id: String(c._id),
        userId: c.userId ?? null,
        designerId: c.designerId,
        designerName: c.designerName,
        name: c.name,
        email: c.email,
        phone: c.phone,
        roomType: c.roomType,
        preferredDate: c.preferredDate,
        preferredTime: c.preferredTime,
        message: c.message ?? '',
        status: c.status as ConsultationStatus,
        referenceCode: c.referenceCode,
        createdAt: new Date(c.createdAt).toISOString(),
      }));
    }
    const db = ensureLocalDb();
    return db.consultations
      .filter((c) => (userId ? c.userId === userId : false))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async listAllConsultations(): Promise<StoredConsultation[]> {
    if (isMongoConnected()) {
      const docs = await ConsultationModel.find().sort({ createdAt: -1 }).lean();
      return docs.map((c) => ({
        id: String(c._id),
        userId: c.userId ?? null,
        designerId: c.designerId,
        designerName: c.designerName,
        name: c.name,
        email: c.email,
        phone: c.phone,
        roomType: c.roomType,
        preferredDate: c.preferredDate,
        preferredTime: c.preferredTime,
        message: c.message ?? '',
        status: c.status as ConsultationStatus,
        referenceCode: c.referenceCode,
        createdAt: new Date(c.createdAt).toISOString(),
      }));
    }
    const db = ensureLocalDb();
    return [...db.consultations].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  async createConsultation(
    input: Omit<StoredConsultation, 'id' | 'createdAt' | 'referenceCode' | 'status'>,
  ): Promise<StoredConsultation> {
    const referenceCode = `DEC-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    if (isMongoConnected()) {
      const created = await ConsultationModel.create({
        ...input,
        status: 'Confirmed',
        referenceCode,
      });
      return {
        id: String(created._id),
        userId: created.userId ?? null,
        designerId: created.designerId,
        designerName: created.designerName,
        name: created.name,
        email: created.email,
        phone: created.phone,
        roomType: created.roomType,
        preferredDate: created.preferredDate,
        preferredTime: created.preferredTime,
        message: created.message ?? '',
        status: created.status as ConsultationStatus,
        referenceCode: created.referenceCode,
        createdAt: created.createdAt.toISOString(),
      };
    }
    const db = ensureLocalDb();
    const record: StoredConsultation = {
      ...input,
      id: `cns_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      status: 'Confirmed',
      referenceCode,
      createdAt: new Date().toISOString(),
    };
    db.consultations.unshift(record);
    writeLocalDb(db);
    return record;
  },

  async updateConsultationStatus(
    id: string,
    status: ConsultationStatus,
  ): Promise<StoredConsultation | null> {
    if (isMongoConnected()) {
      const doc = await ConsultationModel.findByIdAndUpdate(
        id,
        { status },
        { new: true },
      ).lean();
      if (!doc) return null;
      return {
        id: String(doc._id),
        userId: doc.userId ?? null,
        designerId: doc.designerId,
        designerName: doc.designerName,
        name: doc.name,
        email: doc.email,
        phone: doc.phone,
        roomType: doc.roomType,
        preferredDate: doc.preferredDate,
        preferredTime: doc.preferredTime,
        message: doc.message ?? '',
        status: doc.status as ConsultationStatus,
        referenceCode: doc.referenceCode,
        createdAt: new Date(doc.createdAt).toISOString(),
      };
    }
    const db = ensureLocalDb();
    const idx = db.consultations.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    db.consultations[idx] = { ...db.consultations[idx], status };
    writeLocalDb(db);
    return db.consultations[idx];
  },

  async deleteConsultation(id: string): Promise<boolean> {
    if (isMongoConnected()) {
      const res = await ConsultationModel.findByIdAndDelete(id);
      return Boolean(res);
    }
    const db = ensureLocalDb();
    const before = db.consultations.length;
    db.consultations = db.consultations.filter((c) => c.id !== id);
    if (db.consultations.length !== before) {
      writeLocalDb(db);
      return true;
    }
    return false;
  },
};
