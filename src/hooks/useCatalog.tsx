import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  DESIGN_STYLES,
  SAMPLE_DESIGNERS,
  SAMPLE_ROOMS,
  type DesignStyleItem,
} from '../data/catalog';
import {
  fetchPublicDesignersFromSupabase,
  fetchPublicStyleCardsFromSupabase,
} from '../services/supabaseData';
import type { Designer, DesignStyleId, RoomType } from '../types/decora';

export interface SampleRoomItem {
  id: string;
  label: string;
  roomType: RoomType;
  imageUrl: string;
}

interface CatalogStore {
  styles: DesignStyleItem[];
  designers: Designer[];
  sampleRooms: SampleRoomItem[];
}

interface CatalogContextValue extends CatalogStore {
  loadingCatalog: boolean;
  stylesFromSupabase: boolean;
  designersFromSupabase: boolean;
  refreshCatalog: () => Promise<void>;
  addStyle: (input: Omit<DesignStyleItem, 'id'> & { id?: string }) => DesignStyleItem;
  updateStyle: (id: string, patch: Partial<Omit<DesignStyleItem, 'id'>>) => void;
  removeStyle: (id: string) => void;
  addDesigner: (input: Omit<Designer, 'id'>) => Designer;
  updateDesigner: (id: string, patch: Partial<Omit<Designer, 'id'>>) => void;
  removeDesigner: (id: string) => void;
  addSampleRoom: (input: Omit<SampleRoomItem, 'id'>) => SampleRoomItem;
  updateSampleRoom: (id: string, patch: Partial<Omit<SampleRoomItem, 'id'>>) => void;
  removeSampleRoom: (id: string) => void;
  resetCatalog: () => void;
}

const STORAGE_KEY = 'decoraai_admin_catalog_v1';

const DEFAULT_STORE: CatalogStore = {
  styles: DESIGN_STYLES,
  designers: SAMPLE_DESIGNERS,
  sampleRooms: SAMPLE_ROOMS,
};

function loadInitialStore(): CatalogStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STORE;
    const parsed = JSON.parse(raw) as Partial<CatalogStore>;
    return {
      styles: Array.isArray(parsed.styles) && parsed.styles.length > 0 ? parsed.styles : DEFAULT_STORE.styles,
      designers:
        Array.isArray(parsed.designers) && parsed.designers.length > 0
          ? parsed.designers
          : DEFAULT_STORE.designers,
      sampleRooms:
        Array.isArray(parsed.sampleRooms) && parsed.sampleRooms.length > 0
          ? parsed.sampleRooms
          : DEFAULT_STORE.sampleRooms,
    };
  } catch {
    return DEFAULT_STORE;
  }
}

const CatalogContext = createContext<CatalogContextValue | undefined>(undefined);

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<CatalogStore>(() => loadInitialStore());
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [stylesFromSupabase, setStylesFromSupabase] = useState(false);
  const [designersFromSupabase, setDesignersFromSupabase] = useState(false);

  const refreshCatalog = useCallback(async () => {
    setLoadingCatalog(true);
    try {
      const [remoteDesigners, remoteStyles] = await Promise.all([
        fetchPublicDesignersFromSupabase(),
        fetchPublicStyleCardsFromSupabase(),
      ]);

      setDesignersFromSupabase(Boolean(remoteDesigners && remoteDesigners.length > 0));
      setStylesFromSupabase(Boolean(remoteStyles && remoteStyles.length > 0));

      setStore((prev) => ({
        ...prev,
        designers:
          remoteDesigners && remoteDesigners.length > 0
            ? remoteDesigners
            : SAMPLE_DESIGNERS,
        styles:
          remoteStyles && remoteStyles.length > 0
            ? remoteStyles
            : DESIGN_STYLES,
      }));
    } finally {
      setLoadingCatalog(false);
    }
  }, []);

  useEffect(() => {
    void refreshCatalog();
  }, [refreshCatalog]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      // Ignore storage quota errors
    }
  }, [store]);

  const addStyle: CatalogContextValue['addStyle'] = (input) => {
    const slugBase = input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const id = (input.id || `${slugBase || 'style'}-${Date.now().toString(36)}`) as DesignStyleId;
    const created: DesignStyleItem = {
      id,
      name: input.name,
      tagline: input.tagline,
      palette: input.palette,
      imageUrl: input.imageUrl,
      materials: input.materials,
    };
    setStore((prev) => ({ ...prev, styles: [created, ...prev.styles] }));
    return created;
  };

  const updateStyle: CatalogContextValue['updateStyle'] = (id, patch) => {
    setStore((prev) => ({
      ...prev,
      styles: prev.styles.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  };

  const removeStyle: CatalogContextValue['removeStyle'] = (id) => {
    setStore((prev) => ({
      ...prev,
      styles: prev.styles.filter((s) => s.id !== id),
    }));
  };

  const addDesigner: CatalogContextValue['addDesigner'] = (input) => {
    const created: Designer = {
      ...input,
      id: `designer-${Date.now().toString(36)}`,
    };
    setStore((prev) => ({ ...prev, designers: [created, ...prev.designers] }));
    return created;
  };

  const updateDesigner: CatalogContextValue['updateDesigner'] = (id, patch) => {
    setStore((prev) => ({
      ...prev,
      designers: prev.designers.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    }));
  };

  const removeDesigner: CatalogContextValue['removeDesigner'] = (id) => {
    setStore((prev) => ({
      ...prev,
      designers: prev.designers.filter((d) => d.id !== id),
    }));
  };

  const addSampleRoom: CatalogContextValue['addSampleRoom'] = (input) => {
    const created: SampleRoomItem = {
      ...input,
      id: `sample-${Date.now().toString(36)}`,
    };
    setStore((prev) => ({ ...prev, sampleRooms: [created, ...prev.sampleRooms] }));
    return created;
  };

  const updateSampleRoom: CatalogContextValue['updateSampleRoom'] = (id, patch) => {
    setStore((prev) => ({
      ...prev,
      sampleRooms: prev.sampleRooms.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));
  };

  const removeSampleRoom: CatalogContextValue['removeSampleRoom'] = (id) => {
    setStore((prev) => ({
      ...prev,
      sampleRooms: prev.sampleRooms.filter((r) => r.id !== id),
    }));
  };

  const resetCatalog = () => {
    setStore(DEFAULT_STORE);
  };

  return (
    <CatalogContext.Provider
      value={{
        styles: store.styles,
        designers: store.designers,
        sampleRooms: store.sampleRooms,
        loadingCatalog,
        stylesFromSupabase,
        designersFromSupabase,
        refreshCatalog,
        addStyle,
        updateStyle,
        removeStyle,
        addDesigner,
        updateDesigner,
        removeDesigner,
        addSampleRoom,
        updateSampleRoom,
        removeSampleRoom,
        resetCatalog,
      }}
    >
      {children}
    </CatalogContext.Provider>
  );
}

export function useCatalog(): CatalogContextValue {
  const ctx = useContext(CatalogContext);
  if (!ctx) {
    throw new Error('useCatalog must be used inside CatalogProvider');
  }
  return ctx;
}
