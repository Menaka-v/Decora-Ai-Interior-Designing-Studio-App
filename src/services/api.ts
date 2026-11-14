import type {
  AdminUserSummary,
  Consultation,
  ConsultationStatus,
  Customizations,
  DesignStyleId,
  GeneratedVariation,
  RoomType,
  SavedDesign,
  UserProfile,
} from '../types/decora';

const TOKEN_KEY = 'decoraai_auth_token';
const LOCAL_DESIGNS_KEY = 'decoraai_local_designs';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Ignore storage quota errors
  }
}

function getDesignsStorageKey(userId?: string | null): string {
  return userId ? `decoraai_designs_${userId}` : LOCAL_DESIGNS_KEY;
}

function readLocalDesigns(userId?: string | null): SavedDesign[] {
  try {
    const raw = localStorage.getItem(getDesignsStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedDesign[]) : [];
  } catch {
    return [];
  }
}

function writeLocalDesigns(designs: SavedDesign[], userId?: string | null): void {
  try {
    localStorage.setItem(getDesignsStorageKey(userId), JSON.stringify(designs));
  } catch {
    throw new Error(
      'Browser storage is full. Delete an older saved design in My Designs and try again.',
    );
  }
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers);

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(path, {
    ...options,
    headers,
  });

  const data = (await res.json().catch(() => ({}))) as { error?: string } & T;
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

export const authApi = {
  register(input: {
    name: string;
    email: string;
    password: string;
    preferredStyle?: DesignStyleId;
  }) {
    return apiRequest<{ token: string; user: UserProfile }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  login(input: { email: string; password: string }) {
    return apiRequest<{ token: string; user: UserProfile }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  me() {
    return apiRequest<{ user: UserProfile }>('/api/auth/me');
  },

  updateProfile(input: { name?: string; preferredStyle?: DesignStyleId }) {
    return apiRequest<{ user: UserProfile }>('/api/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },
};

export const designsApi = {
  async list(userId?: string | null): Promise<{ designs: SavedDesign[] }> {
    const local = readLocalDesigns(userId).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return { designs: local };
  },

  async save(
    input: {
      title: string;
      originalImage: string;
      generatedImages: GeneratedVariation[];
      selectedVariationIndex: number;
      style: string;
      styleId: DesignStyleId;
      roomType: RoomType;
      customizations: Customizations;
      tags: string[];
    },
    userId?: string | null,
  ): Promise<{ design: SavedDesign }> {
    const localDesign: SavedDesign = {
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: input.title,
      originalImage: input.originalImage,
      generatedImages: input.generatedImages,
      selectedVariationIndex: input.selectedVariationIndex,
      style: input.style,
      styleId: input.styleId,
      roomType: input.roomType,
      customizations: input.customizations,
      tags: input.tags,
      isFavorite: false,
      createdAt: new Date().toISOString(),
    };

    const existing = readLocalDesigns(userId);
    writeLocalDesigns([localDesign, ...existing], userId);
    return { design: localDesign };
  },

  async toggleFavorite(
    id: string,
    userId?: string | null,
  ): Promise<{ design: SavedDesign }> {
    const local = readLocalDesigns(userId);
    const updatedLocal = local.map((d) =>
      d.id === id ? { ...d, isFavorite: !d.isFavorite } : d,
    );
    writeLocalDesigns(updatedLocal, userId);
    const localMatch = updatedLocal.find((d) => d.id === id);
    if (!localMatch) {
      throw new Error('Could not find saved design.');
    }
    return { design: localMatch };
  },

  async updateTags(
    id: string,
    tags: string[],
    userId?: string | null,
  ): Promise<{ design: SavedDesign }> {
    const local = readLocalDesigns(userId);
    const updatedLocal = local.map((d) => (d.id === id ? { ...d, tags } : d));
    writeLocalDesigns(updatedLocal, userId);
    const localMatch = updatedLocal.find((d) => d.id === id);
    if (!localMatch) {
      throw new Error('Could not find saved design.');
    }
    return { design: localMatch };
  },

  async remove(
    id: string,
    userId?: string | null,
  ): Promise<{ ok: boolean; id: string }> {
    const local = readLocalDesigns(userId);
    writeLocalDesigns(
      local.filter((d) => d.id !== id),
      userId,
    );
    return { ok: true, id };
  },
};

export const consultationsApi = {
  list() {
    return apiRequest<{ consultations: Consultation[] }>('/api/consultations');
  },

  listAllAdmin() {
    return apiRequest<{
      consultations: Consultation[];
      users: AdminUserSummary[];
    }>('/api/consultations/admin/all');
  },

  create(input: {
    designerId: string;
    designerName: string;
    name: string;
    email: string;
    phone: string;
    roomType: RoomType;
    preferredDate: string;
    preferredTime: string;
    message: string;
  }) {
    return apiRequest<{ consultation: Consultation }>('/api/consultations', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  updateStatus(id: string, status: ConsultationStatus) {
    return apiRequest<{ consultation: Consultation }>(
      `/api/consultations/${encodeURIComponent(id)}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      },
    );
  },

  remove(id: string) {
    return apiRequest<{ ok: boolean; id: string }>(
      `/api/consultations/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
      },
    );
  },
};
