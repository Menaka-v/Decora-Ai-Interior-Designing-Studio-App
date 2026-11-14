import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient.js';
import type { DesignStyleId, UserProfile } from '../types/decora';

const ADMIN_EMAIL = 'mithujei1213@gmail.com';

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserProfile>;
  register: (input: {
    name: string;
    email: string;
    password: string;
    preferredStyle?: DesignStyleId;
  }) => Promise<UserProfile>;
  updateProfile: (input: {
    name?: string;
    preferredStyle?: DesignStyleId;
  }) => Promise<UserProfile>;
  logout: () => Promise<void>;
}

function mapSupabaseUser(sbUser: User | null): UserProfile | null {
  if (!sbUser) return null;
  const email = sbUser.email || '';
  const meta = (sbUser.user_metadata || {}) as Record<string, unknown>;
  const name =
    (typeof meta.name === 'string' && meta.name.trim()) ||
    email.split('@')[0] ||
    'DecoraAI Member';
  const preferredStyle =
    typeof meta.preferredStyle === 'string'
      ? (meta.preferredStyle as DesignStyleId)
      : 'modern';

  return {
    id: sbUser.id,
    name,
    email,
    role: email.toLowerCase() === ADMIN_EMAIL ? 'admin' : 'user',
    preferredStyle,
    createdAt: sbUser.created_at || new Date().toISOString(),
  };
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        setUser(mapSupabaseUser(data.session?.user ?? null));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) {
        setUser(mapSupabaseUser(nextSession?.user ?? null));
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error || !data.user) {
      throw new Error(error?.message || 'Invalid email or password.');
    }
    const mapped = mapSupabaseUser(data.user)!;
    setUser(mapped);
    return mapped;
  }, []);

  const register = useCallback(
    async (input: {
      name: string;
      email: string;
      password: string;
      preferredStyle?: DesignStyleId;
    }) => {
      const { data, error } = await supabase.auth.signUp({
        email: input.email.trim(),
        password: input.password,
        options: {
          data: {
            full_name: input.name.trim(),
            name: input.name.trim(),
            preferredStyle: input.preferredStyle || 'modern',
          },
        },
      });
      if (error) {
        throw new Error(error.message || 'Could not create account.');
      }
      if (!data.session || !data.user) {
        throw new Error(
          'Account created! Please check your email to confirm, or disable "Confirm email" in Supabase Authentication settings for instant sign-in.',
        );
      }
      const mapped = mapSupabaseUser(data.user)!;
      setUser(mapped);
      return mapped;
    },
    [],
  );

  const updateProfile = useCallback(
    async (input: { name?: string; preferredStyle?: DesignStyleId }) => {
      const { data, error } = await supabase.auth.updateUser({
        data: {
          ...(input.name !== undefined ? { name: input.name.trim() } : {}),
          ...(input.preferredStyle !== undefined
            ? { preferredStyle: input.preferredStyle }
            : {}),
        },
      });
      if (error || !data.user) {
        throw new Error(error?.message || 'Failed to update profile.');
      }
      const mapped = mapSupabaseUser(data.user)!;
      setUser(mapped);
      return mapped;
    },
    [],
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, updateProfile, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
