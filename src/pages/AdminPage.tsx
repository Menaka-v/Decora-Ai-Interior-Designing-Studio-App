import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  ArrowLeft,
  CalendarCheck,
  Download,
  Edit3,
  Eye,
  EyeOff,
  LayoutDashboard,
  Layers,
  Loader2,
  Lock,
  LogOut,
  Menu,
  Moon,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Star,
  Sun,
  Trash2,
  X,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useCatalog } from '../hooks/useCatalog';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '../hooks/useToast';
import { supabase } from '../lib/supabaseClient.js';
import {
  formatSessionRate,
  type SupabaseConsultationRow,
  type SupabaseConsultationStatus,
  type SupabaseDesignerRow,
  type SupabaseStyleCardRow,
} from '../services/supabaseData';

interface AdminPageProps {
  onBackToPublic: () => void;
}

type AdminSection = 'dashboard' | 'bookings' | 'cards';
type CardManageTab = 'designers' | 'style_cards';

const STATUS_OPTIONS: SupabaseConsultationStatus[] = [
  'pending',
  'confirmed',
  'completed',
  'cancelled',
];

const STATUS_STYLE: Record<SupabaseConsultationStatus, string> = {
  pending:
    'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300',
  confirmed:
    'border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-900/60 dark:bg-teal-950/40 dark:text-teal-300',
  completed:
    'border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300',
  cancelled:
    'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300',
};

const CHART_COLORS = [
  '#FF6B5B',
  '#0D9488',
  '#F59E0B',
  '#6D28D9',
  '#0891B2',
  '#EC4899',
  '#84CC16',
];

const FALLBACK_IMAGE = '/src/assets/images/hero_after_living_1794631596792.jpg';

export function AdminPage({ onBackToPublic }: AdminPageProps) {
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();

  const [session, setSession] = useState<Session | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        setSession(data.session ?? null);
      })
      .finally(() => {
        if (mounted) setAuthChecking(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) {
        setSession(nextSession);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) {
      showToast('Please enter both email and password.', 'error');
      return;
    }
    setLoggingIn(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword,
      });
      if (error) {
        showToast(error.message || 'Sign-in failed.', 'error');
        return;
      }
      showToast('Signed in to DecoraAI Admin.', 'success');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Unable to sign in right now.',
        'error',
      );
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      showToast(error.message || 'Failed to sign out.', 'error');
      return;
    }
    showToast('Signed out of Admin Panel.', 'info');
  };

  if (authChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF9F6] px-4 dark:bg-[#0F1117]">
        <div className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
          <div className="h-12 w-12 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-6 w-48 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-4 w-full rounded bg-slate-100 dark:bg-slate-800/70" />
          <div className="h-10 w-full rounded-xl bg-slate-100 dark:bg-slate-800/70" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF9F6] px-4 py-12 dark:bg-[#0F1117]">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF6B5B] via-[#F59E0B] to-[#0D9488] text-white">
              <Lock className="h-5 w-5" />
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </button>
          </div>

          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            DecoraAI Admin Sign In
          </h1>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            Authenticate with your Supabase administrator account to access the
            analytics dashboard, bookings, and catalog cards.
          </p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="supabase-admin-email"
                className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                Email Address
              </label>
              <input
                id="supabase-admin-email"
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="admin@decoraai.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#0D9488] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label
                htmlFor="supabase-admin-password"
                className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="supabase-admin-password"
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-10 pl-3.5 text-sm text-slate-900 focus:border-[#0D9488] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword((prev) => !prev)}
                  aria-label={
                    showLoginPassword ? 'Hide password' : 'Show password'
                  }
                  className="absolute inset-y-0 right-0 flex cursor-pointer items-center px-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showLoginPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6B5B] via-[#F59E0B] to-[#0D9488] py-3 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loggingIn && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{loggingIn ? 'Signing In...' : 'Sign In'}</span>
            </button>
          </form>

          <button
            type="button"
            onClick={onBackToPublic}
            className="mt-5 inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Public Site</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <AdminAuthenticatedShell
      session={session}
      onLogout={() => void handleLogout()}
      onBackToPublic={onBackToPublic}
    />
  );
}

function AdminAuthenticatedShell({
  session,
  onLogout,
  onBackToPublic,
}: {
  session: Session;
  onLogout: () => void;
  onBackToPublic: () => void;
}) {
  const { theme, toggleTheme } = useTheme();
  const { refreshCatalog } = useCatalog();
  const { showToast } = useToast();

  const [section, setSection] = useState<AdminSection>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [loadingData, setLoadingData] = useState(true);
  const [notAuthorized, setNotAuthorized] = useState(false);

  // Supabase tables data
  const [bookings, setBookings] = useState<SupabaseConsultationRow[]>([]);
  const [designers, setDesigners] = useState<SupabaseDesignerRow[]>([]);
  const [styleCards, setStyleCards] = useState<SupabaseStyleCardRow[]>([]);

  // Bookings filters & modals
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    SupabaseConsultationStatus | 'all'
  >('all');
  const [dateFilter, setDateFilter] = useState('');
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [confirmDeleteBookingId, setConfirmDeleteBookingId] = useState<string | null>(
    null,
  );
  const [deletingBookingId, setDeletingBookingId] = useState<string | null>(null);
  const [detailBooking, setDetailBooking] =
    useState<SupabaseConsultationRow | null>(null);

  // Manage Cards state
  const [cardTab, setCardTab] = useState<CardManageTab>('designers');
  const [confirmDeleteCardId, setConfirmDeleteCardId] = useState<string | null>(
    null,
  );
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);

  // Card Add/Edit modal
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [savingCard, setSavingCard] = useState(false);

  // Designer form fields
  const [dName, setDName] = useState('');
  const [dSpecialty, setDSpecialty] = useState('');
  const [dRating, setDRating] = useState(4.9);
  const [dExperience, setDExperience] = useState(5);
  const [dHourlyRate, setDHourlyRate] = useState('$95/session');
  const [dImageUrl, setDImageUrl] = useState('');
  const [dBio, setDBio] = useState('');

  // Style Card form fields
  const [sTitle, setSTitle] = useState('');
  const [sDescription, setSDescription] = useState('');
  const [sImageUrl, setSImageUrl] = useState('');

  const fetchAllAdminData = useCallback(async () => {
    setLoadingData(true);
    setNotAuthorized(false);

    try {
      const [consultationsRes, designersRes, styleCardsRes] = await Promise.all([
        supabase
          .from('consultations')
          .select(
            'id, booking_ref, name, email, phone, room_type, designer, preferred_date, preferred_time, message, status, created_at',
          )
          .order('created_at', { ascending: false }),
        supabase
          .from('designers')
          .select('*')
          .order('name', { ascending: true }),
        supabase
          .from('style_cards')
          .select('id, title, description, image_url')
          .order('title', { ascending: true }),
      ]);

      // If Supabase returns an error or empty consultations data (e.g. RLS blocked non-admin)
      if (
        consultationsRes.error ||
        !consultationsRes.data ||
        consultationsRes.data.length === 0
      ) {
        setNotAuthorized(true);
        if (consultationsRes.error) {
          showToast(consultationsRes.error.message || 'Not authorized.', 'error');
        }
        return;
      }

      if (designersRes.error || styleCardsRes.error) {
        const msg =
          designersRes.error?.message ||
          styleCardsRes.error?.message ||
          'Not authorized.';
        setNotAuthorized(true);
        showToast(msg, 'error');
        return;
      }

      setBookings(consultationsRes.data as SupabaseConsultationRow[]);
      setDesigners((designersRes.data || []) as SupabaseDesignerRow[]);
      setStyleCards((styleCardsRes.data || []) as SupabaseStyleCardRow[]);
    } catch (err) {
      setNotAuthorized(true);
      showToast(
        err instanceof Error ? err.message : 'Failed to load admin data.',
        'error',
      );
    } finally {
      setLoadingData(false);
    }
  }, [showToast]);

  useEffect(() => {
    void fetchAllAdminData();
  }, [fetchAllAdminData]);

  // Dashboard Metrics & Chart Data
  const metrics = useMemo(() => {
    const total = bookings.length;
    const pending = bookings.filter((b) => b.status === 'pending').length;
    const confirmed = bookings.filter((b) => b.status === 'confirmed').length;
    const completed = bookings.filter((b) => b.status === 'completed').length;
    const cancelled = bookings.filter((b) => b.status === 'cancelled').length;

    // Bookings per day (line chart)
    const dayMap = new Map<string, number>();
    for (const b of bookings) {
      const dateStr = (b.created_at || b.preferred_date || '').slice(0, 10);
      if (dateStr) {
        dayMap.set(dateStr, (dayMap.get(dateStr) || 0) + 1);
      }
    }
    const bookingsPerDay = Array.from(dayMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, bookings: count }));

    // Room types (donut chart)
    const roomMap = new Map<string, number>();
    for (const b of bookings) {
      const rt = b.room_type || 'Other';
      roomMap.set(rt, (roomMap.get(rt) || 0) + 1);
    }
    const roomTypes = Array.from(roomMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));

    // Designers requested (bar chart)
    const designerMap = new Map<string, number>();
    for (const b of bookings) {
      const d = b.designer || 'Unassigned';
      designerMap.set(d, (designerMap.get(d) || 0) + 1);
    }
    const topDesigners = Array.from(designerMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, requests]) => ({ name, requests }));

    return {
      total,
      pending,
      confirmed,
      completed,
      cancelled,
      bookingsPerDay,
      roomTypes,
      topDesigners,
    };
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return bookings.filter((b) => {
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      if (dateFilter && b.preferred_date !== dateFilter) return false;
      if (!q) return true;
      return (
        b.booking_ref.toLowerCase().includes(q) ||
        b.name.toLowerCase().includes(q) ||
        b.email.toLowerCase().includes(q) ||
        b.phone.toLowerCase().includes(q) ||
        b.designer.toLowerCase().includes(q) ||
        b.room_type.toLowerCase().includes(q)
      );
    });
  }, [bookings, searchQuery, statusFilter, dateFilter]);

  const handleStatusChange = async (
    row: SupabaseConsultationRow,
    nextStatus: SupabaseConsultationStatus,
  ) => {
    setUpdatingStatusId(row.id);
    try {
      const { error } = await supabase
        .from('consultations')
        .update({ status: nextStatus })
        .eq('id', row.id);

      if (error) {
        showToast(error.message || 'Could not update status.', 'error');
        return;
      }

      setBookings((prev) =>
        prev.map((b) => (b.id === row.id ? { ...b, status: nextStatus } : b)),
      );
      showToast(`${row.booking_ref} updated to ${nextStatus}.`, 'success');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Status update failed.',
        'error',
      );
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleDeleteBooking = async (row: SupabaseConsultationRow) => {
    setDeletingBookingId(row.id);
    try {
      const { error } = await supabase
        .from('consultations')
        .delete()
        .eq('id', row.id);

      if (error) {
        showToast(error.message || 'Could not delete booking.', 'error');
        return;
      }

      setBookings((prev) => prev.filter((b) => b.id !== row.id));
      setConfirmDeleteBookingId(null);
      if (detailBooking?.id === row.id) setDetailBooking(null);
      showToast(`Deleted booking ${row.booking_ref}.`, 'info');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to delete booking.',
        'error',
      );
    } finally {
      setDeletingBookingId(null);
    }
  };

  const handleExportCsv = () => {
    const headers = [
      'Booking Ref',
      'Name',
      'Email',
      'Phone',
      'Room Type',
      'Designer',
      'Preferred Date',
      'Preferred Time',
      'Status',
      'Message',
      'Created At',
    ];
    const esc = (v: string | null | undefined) =>
      `"${String(v ?? '').replace(/"/g, '""')}"`;

    const rows = filteredBookings.map((b) =>
      [
        b.booking_ref,
        b.name,
        b.email,
        b.phone,
        b.room_type,
        b.designer,
        b.preferred_date,
        b.preferred_time,
        b.status,
        b.message,
        b.created_at,
      ]
        .map(esc)
        .join(','),
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `decoraai-bookings-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${filteredBookings.length} booking(s) as CSV.`, 'success');
  };

  // Manage Cards Modal helpers
  const openAddCardModal = () => {
    setEditingCardId(null);
    if (cardTab === 'designers') {
      setDName('');
      setDSpecialty('');
      setDRating(4.9);
      setDExperience(5);
      setDHourlyRate('$95/session');
      setDImageUrl('');
      setDBio('');
    } else {
      setSTitle('');
      setSDescription('');
      setSImageUrl('');
    }
    setCardModalOpen(true);
  };

  const openEditDesignerModal = (row: SupabaseDesignerRow) => {
    setCardTab('designers');
    setEditingCardId(row.id);
    setDName(row.name);
    setDSpecialty(row.specialty || '');
    setDRating(Number(row.rating ?? 4.9));
    setDExperience(
      row.Experience !== null && row.Experience !== undefined
        ? Number(row.Experience)
        : Number(row.experience ?? 5),
    );
    setDHourlyRate(
      formatSessionRate(
        row.session_price ?? row.hourly_rate ?? row.price,
        row.name,
      ),
    );
    setDImageUrl(row.image_url || '');
    setDBio(row.bio || '');
    setCardModalOpen(true);
  };

  const openEditStyleCardModal = (row: SupabaseStyleCardRow) => {
    setCardTab('style_cards');
    setEditingCardId(row.id);
    setSTitle(row.title);
    setSDescription(row.description || '');
    setSImageUrl(row.image_url || '');
    setCardModalOpen(true);
  };

  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCard(true);

    try {
      if (cardTab === 'designers') {
        if (!dName.trim() || !dSpecialty.trim()) {
          showToast('Please enter designer name and specialty.', 'error');
          setSavingCard(false);
          return;
        }
        const normalizedRate = formatSessionRate(dHourlyRate.trim(), dName.trim());
        const normalizedExperience = Math.max(
          0,
          Math.round(Number(dExperience) || 0),
        );
        const basePayload = {
          name: dName.trim(),
          specialty: dSpecialty.trim(),
          rating: Math.max(1, Math.min(5, Number(dRating) || 4.8)),
          image_url: dImageUrl.trim() || null,
          bio: dBio.trim() || null,
        };
        const fullPayload = {
          ...basePayload,
          session_price: normalizedRate,
          Experience: normalizedExperience,
        };

        const isSchemaOrLengthIssue = (msg?: string) => {
          if (!msg) return false;
          const lower = msg.toLowerCase();
          return (
            lower.includes('session_price') ||
            lower.includes('experience') ||
            lower.includes('schema cache') ||
            lower.includes('value too long')
          );
        };

        const saveDesignerRow = async (
          payload: Record<string, unknown>,
        ) => {
          if (editingCardId) {
            return await supabase
              .from('designers')
              .update(payload)
              .eq('id', editingCardId)
              .select()
              .single();
          }
          return await supabase
            .from('designers')
            .insert([payload])
            .select()
            .single();
        };

        let res = await saveDesignerRow(fullPayload);
        let fallbackNote: string | null = null;

        if (res.error && res.error.message.toLowerCase().includes('value too long')) {
          const compactRate = normalizedRate.replace(/\s+/g, '').slice(0, 11);
          res = await saveDesignerRow({
            ...fullPayload,
            session_price: compactRate,
          });
        }

        if (res.error && isSchemaOrLengthIssue(res.error.message)) {
          fallbackNote =
            'Saved core designer details. Run the updated Supabase SQL so Session Price & Experience save cleanly.';
          res = await saveDesignerRow(basePayload);
        }

        if (res.error) throw new Error(res.error.message);

        if (editingCardId) {
          setDesigners((prev) =>
            prev.map((item) =>
              item.id === editingCardId
                ? (res.data as SupabaseDesignerRow)
                : item,
            ),
          );
        } else {
          setDesigners((prev) => [res.data as SupabaseDesignerRow, ...prev]);
        }

        if (fallbackNote) {
          showToast(fallbackNote, 'info');
        } else {
          showToast(
            `${editingCardId ? 'Updated' : 'Added'} designer "${basePayload.name}".`,
            'success',
          );
        }
      } else {
        if (!sTitle.trim()) {
          showToast('Please enter a style card title.', 'error');
          setSavingCard(false);
          return;
        }
        const payload = {
          title: sTitle.trim(),
          description: sDescription.trim() || null,
          image_url: sImageUrl.trim() || null,
        };

        if (editingCardId) {
          const { data, error } = await supabase
            .from('style_cards')
            .update(payload)
            .eq('id', editingCardId)
            .select()
            .single();

          if (error) throw new Error(error.message);
          setStyleCards((prev) =>
            prev.map((item) =>
              item.id === editingCardId ? (data as SupabaseStyleCardRow) : item,
            ),
          );
          showToast(`Updated style card "${payload.title}".`, 'success');
        } else {
          const { data, error } = await supabase
            .from('style_cards')
            .insert([payload])
            .select()
            .single();

          if (error) throw new Error(error.message);
          setStyleCards((prev) => [data as SupabaseStyleCardRow, ...prev]);
          showToast(`Added style card "${payload.title}".`, 'success');
        }
      }

      setCardModalOpen(false);
      void refreshCatalog();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to save card.',
        'error',
      );
    } finally {
      setSavingCard(false);
    }
  };

  const handleDeleteCard = async (id: string, label: string) => {
    setDeletingCardId(id);
    try {
      const table = cardTab === 'designers' ? 'designers' : 'style_cards';
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw new Error(error.message);

      if (cardTab === 'designers') {
        setDesigners((prev) => prev.filter((d) => d.id !== id));
      } else {
        setStyleCards((prev) => prev.filter((s) => s.id !== id));
      }

      setConfirmDeleteCardId(null);
      showToast(`Deleted "${label}".`, 'info');
      void refreshCatalog();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to delete card.',
        'error',
      );
    } finally {
      setDeletingCardId(null);
    }
  };

  // Unauthorized View
  if (!loadingData && notAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF9F6] px-4 dark:bg-[#0F1117]">
        <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm dark:border-rose-900/60 dark:bg-slate-900">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Not authorized
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            Signed in as <span className="font-semibold">{session.user.email}</span>,
            but your account does not have permission to read protected admin
            records from Supabase.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={() => void fetchAllAdminData()}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry</span>
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const navItems: Array<{
    id: AdminSection;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }> = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      id: 'bookings',
      label: 'Bookings',
      icon: <CalendarCheck className="h-4 w-4" />,
      badge: bookings.length,
    },
    {
      id: 'cards',
      label: 'Manage Cards',
      icon: <Layers className="h-4 w-4" />,
      badge: designers.length + styleCards.length,
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#FAF9F6] text-slate-900 dark:bg-[#0F1117] dark:text-slate-100">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Left Admin Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:static lg:translate-x-0 dark:border-slate-800 dark:bg-slate-950 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div>
            <span className="font-display text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              DecoraAI
            </span>
            <p className="text-[11px] font-semibold text-[#0D9488] dark:text-teal-400">
              Admin Control Center
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav aria-label="Admin Sections" className="flex-1 space-y-1.5 p-4">
          {navItems.map((item) => {
            const active = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSection(item.id);
                  setSidebarOpen(false);
                }}
                className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                  active
                    ? 'bg-gradient-to-r from-[#FF6B5B] to-[#F59E0B] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  {item.icon}
                  <span>{item.label}</span>
                </span>
                {typeof item.badge === 'number' && !loadingData && (
                  <span
                    className={`font-mono text-xs tabular-nums ${
                      active
                        ? 'text-white/90'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="space-y-2 border-t border-slate-200 p-4 dark:border-slate-800">
          <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs dark:bg-slate-900">
            <div className="text-[11px] text-slate-400">Signed in as</div>
            <div className="truncate font-semibold text-slate-800 dark:text-slate-100">
              {session.user.email}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              {theme === 'light' ? (
                <>
                  <Moon className="h-3.5 w-3.5" />
                  <span>Dark</span>
                </>
              ) : (
                <>
                  <Sun className="h-3.5 w-3.5" />
                  <span>Light</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onBackToPublic}
              className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Site</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-slate-200 bg-[#FAF9F6]/90 px-4 py-3.5 backdrop-blur-md sm:px-8 dark:border-slate-800 dark:bg-[#0F1117]/90">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 lg:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div>
              <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                {section === 'dashboard'
                  ? 'Analytics Dashboard'
                  : section === 'bookings'
                    ? 'Consultation Bookings'
                    : 'Manage Designers & Style Cards'}
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void fetchAllAdminData()}
            disabled={loadingData}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingData ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>
        </header>

        <main className="flex-1 p-4 sm:p-8">
          {/* LOADING SKELETONS */}
          {loadingData ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div
                    key={n}
                    className="h-28 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="mt-4 h-7 w-12 rounded bg-slate-200 dark:bg-slate-800" />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="h-72 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
                <div className="h-72 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
              </div>
            </div>
          ) : (
            <>
              {/* SECTION A: DASHBOARD */}
              {section === 'dashboard' && (
                <div className="space-y-6">
                  {/* 5 KPI Cards */}
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                    <KpiCard
                      label="Total Bookings"
                      value={metrics.total}
                      accentClass="text-slate-900 dark:text-white"
                      barClass="from-[#FF6B5B] to-[#F59E0B]"
                    />
                    <KpiCard
                      label="Pending"
                      value={metrics.pending}
                      accentClass="text-amber-600 dark:text-amber-400"
                      barClass="from-amber-500 to-amber-400"
                    />
                    <KpiCard
                      label="Confirmed"
                      value={metrics.confirmed}
                      accentClass="text-[#0D9488] dark:text-teal-400"
                      barClass="from-[#0D9488] to-cyan-500"
                    />
                    <KpiCard
                      label="Completed"
                      value={metrics.completed}
                      accentClass="text-indigo-600 dark:text-indigo-400"
                      barClass="from-indigo-500 to-violet-500"
                    />
                    <KpiCard
                      label="Cancelled"
                      value={metrics.cancelled}
                      accentClass="text-rose-600 dark:text-rose-400"
                      barClass="from-rose-500 to-pink-500"
                    />
                  </div>

                  {/* Charts Grid */}
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    {/* Line Chart: Bookings per day */}
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-7 dark:border-slate-800 dark:bg-slate-900">
                      <h2 className="font-sans text-sm font-semibold text-slate-900 dark:text-white">
                        Bookings Per Day
                      </h2>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        Daily consultation volume by submission date
                      </p>
                      <div className="mt-4 h-72 w-full">
                        {metrics.bookingsPerDay.length === 0 ? (
                          <ChartEmptyState message="No booking timeline data yet." />
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={metrics.bookingsPerDay}>
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke={theme === 'dark' ? '#1E293B' : '#E2E8F0'}
                              />
                              <XAxis
                                dataKey="date"
                                tick={{ fontSize: 11, fill: '#94A3B8' }}
                              />
                              <YAxis
                                allowDecimals={false}
                                tick={{ fontSize: 11, fill: '#94A3B8' }}
                              />
                              <Tooltip
                                contentStyle={{
                                  borderRadius: '12px',
                                  border: '1px solid #334155',
                                  backgroundColor:
                                    theme === 'dark' ? '#0F172A' : '#FFFFFF',
                                  color: theme === 'dark' ? '#F8FAFC' : '#0F172A',
                                  fontSize: '12px',
                                }}
                              />
                              <Line
                                type="monotone"
                                dataKey="bookings"
                                stroke="#0D9488"
                                strokeWidth={3}
                                dot={{ r: 4, fill: '#FF6B5B' }}
                                activeDot={{ r: 6 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </section>

                    {/* Donut Chart: Room Types */}
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-5 dark:border-slate-800 dark:bg-slate-900">
                      <h2 className="font-sans text-sm font-semibold text-slate-900 dark:text-white">
                        Room Types Requested
                      </h2>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        Distribution across all consultation requests
                      </p>
                      <div className="mt-4 h-72 w-full">
                        {metrics.roomTypes.length === 0 ? (
                          <ChartEmptyState message="No room type data yet." />
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={metrics.roomTypes}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="48%"
                                innerRadius={56}
                                outerRadius={86}
                                paddingAngle={3}
                              >
                                {metrics.roomTypes.map((entry, idx) => (
                                  <Cell
                                    key={entry.name}
                                    fill={CHART_COLORS[idx % CHART_COLORS.length]}
                                  />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{
                                  borderRadius: '12px',
                                  border: '1px solid #334155',
                                  backgroundColor:
                                    theme === 'dark' ? '#0F172A' : '#FFFFFF',
                                  color: theme === 'dark' ? '#F8FAFC' : '#0F172A',
                                  fontSize: '12px',
                                }}
                              />
                              <Legend
                                wrapperStyle={{ fontSize: '11px' }}
                                iconType="circle"
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </section>

                    {/* Bar Chart: Most Requested Designers */}
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-12 dark:border-slate-800 dark:bg-slate-900">
                      <h2 className="font-sans text-sm font-semibold text-slate-900 dark:text-white">
                        Most Requested Designers
                      </h2>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        Total consultation bookings grouped by interior designer
                      </p>
                      <div className="mt-4 h-72 w-full">
                        {metrics.topDesigners.length === 0 ? (
                          <ChartEmptyState message="No designer request data yet." />
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={metrics.topDesigners}>
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke={theme === 'dark' ? '#1E293B' : '#E2E8F0'}
                              />
                              <XAxis
                                dataKey="name"
                                tick={{ fontSize: 11, fill: '#94A3B8' }}
                              />
                              <YAxis
                                allowDecimals={false}
                                tick={{ fontSize: 11, fill: '#94A3B8' }}
                              />
                              <Tooltip
                                contentStyle={{
                                  borderRadius: '12px',
                                  border: '1px solid #334155',
                                  backgroundColor:
                                    theme === 'dark' ? '#0F172A' : '#FFFFFF',
                                  color: theme === 'dark' ? '#F8FAFC' : '#0F172A',
                                  fontSize: '12px',
                                }}
                              />
                              <Bar dataKey="requests" radius={[8, 8, 0, 0]}>
                                {metrics.topDesigners.map((entry, idx) => (
                                  <Cell
                                    key={entry.name}
                                    fill={CHART_COLORS[idx % CHART_COLORS.length]}
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </section>
                  </div>
                </div>
              )}

              {/* SECTION B: BOOKINGS TABLE */}
              {section === 'bookings' && (
                <div className="space-y-5">
                  {/* Search & Filters Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-1 flex-wrap items-center gap-2.5">
                      <div className="relative min-w-[210px] flex-1 sm:max-w-xs">
                        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search ref, client, designer..."
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-3 pl-9 text-xs text-slate-900 focus:border-[#0D9488] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>

                      <select
                        aria-label="Filter by status"
                        value={statusFilter}
                        onChange={(e) =>
                          setStatusFilter(
                            e.target.value as SupabaseConsultationStatus | 'all',
                          )
                        }
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium capitalize text-slate-800 focus:border-[#0D9488] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      >
                        <option value="all">All Statuses</option>
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center gap-1.5">
                        <input
                          type="date"
                          aria-label="Filter by preferred date"
                          value={dateFilter}
                          onChange={(e) => setDateFilter(e.target.value)}
                          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs tabular-nums text-slate-800 focus:border-[#0D9488] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        />
                        {dateFilter && (
                          <button
                            type="button"
                            onClick={() => setDateFilter('')}
                            className="cursor-pointer rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleExportCsv}
                      disabled={filteredBookings.length === 0}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#0D9488] to-[#0891B2] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-95 disabled:opacity-50"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Export CSV</span>
                    </button>
                  </div>

                  {/* Table or Empty State */}
                  {filteredBookings.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
                      <CalendarCheck className="mx-auto h-8 w-8 text-slate-400" />
                      <h2 className="mt-3 font-display text-xl font-bold text-slate-900 dark:text-white">
                        No Matching Bookings
                      </h2>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        Adjust your search, status filter, or preferred date filter.
                      </p>
                      {(searchQuery || statusFilter !== 'all' || dateFilter) && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            setStatusFilter('all');
                            setDateFilter('');
                          }}
                          className="mt-4 cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          Reset Filters
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] border-collapse text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                              <th className="px-4 py-3.5">Booking Ref</th>
                              <th className="px-4 py-3.5">Client</th>
                              <th className="px-4 py-3.5">Designer &amp; Room</th>
                              <th className="px-4 py-3.5">Schedule</th>
                              <th className="px-4 py-3.5">Status</th>
                              <th className="px-4 py-3.5 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredBookings.map((row) => {
                              const isConfirmingDel =
                                confirmDeleteBookingId === row.id;
                              const isBusy =
                                updatingStatusId === row.id ||
                                deletingBookingId === row.id;
                              return (
                                <tr
                                  key={row.id}
                                  className="align-middle transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                                >
                                  <td className="px-4 py-3.5 whitespace-nowrap">
                                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                                      {row.booking_ref}
                                    </span>
                                    <div className="mt-0.5 tabular-nums text-[11px] text-slate-400">
                                      {new Date(row.created_at).toLocaleDateString()}
                                    </div>
                                  </td>

                                  <td className="px-4 py-3.5">
                                    <div className="font-semibold text-slate-900 dark:text-white">
                                      {row.name}
                                    </div>
                                    <div className="text-slate-500 dark:text-slate-400">
                                      {row.email}
                                    </div>
                                    <div className="font-mono tabular-nums text-[11px] text-slate-400">
                                      {row.phone}
                                    </div>
                                  </td>

                                  <td className="px-4 py-3.5 whitespace-nowrap">
                                    <div className="font-semibold text-slate-900 dark:text-white">
                                      {row.designer}
                                    </div>
                                    <div className="text-[#0D9488] dark:text-teal-400">
                                      {row.room_type}
                                    </div>
                                  </td>

                                  <td className="px-4 py-3.5 whitespace-nowrap tabular-nums">
                                    <div className="font-semibold text-slate-900 dark:text-white">
                                      {row.preferred_date}
                                    </div>
                                    <div className="text-slate-500 dark:text-slate-400">
                                      {row.preferred_time}
                                    </div>
                                  </td>

                                  <td className="px-4 py-3.5 whitespace-nowrap">
                                    <select
                                      aria-label={`Status for ${row.booking_ref}`}
                                      value={row.status}
                                      disabled={isBusy}
                                      onChange={(e) =>
                                        void handleStatusChange(
                                          row,
                                          e.target.value as SupabaseConsultationStatus,
                                        )
                                      }
                                      className={`cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-semibold capitalize focus:outline-none disabled:opacity-60 ${STATUS_STYLE[row.status]}`}
                                    >
                                      {STATUS_OPTIONS.map((st) => (
                                        <option
                                          key={st}
                                          value={st}
                                          className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white"
                                        >
                                          {st}
                                        </option>
                                      ))}
                                    </select>
                                  </td>

                                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                    {isConfirmingDel ? (
                                      <div className="inline-flex items-center gap-1.5">
                                        <button
                                          type="button"
                                          disabled={isBusy}
                                          onClick={() => void handleDeleteBooking(row)}
                                          className="cursor-pointer rounded-lg bg-rose-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                                        >
                                          Confirm
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setConfirmDeleteBookingId(null)
                                          }
                                          className="cursor-pointer rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="inline-flex items-center gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => setDetailBooking(row)}
                                          className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                        >
                                          <Eye className="h-3.5 w-3.5 text-[#0D9488]" />
                                          <span>View</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setConfirmDeleteBookingId(row.id)
                                          }
                                          className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                          <span>Delete</span>
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION C: MANAGE CARDS */}
              {section === 'cards' && (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <div className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          setCardTab('designers');
                          setConfirmDeleteCardId(null);
                        }}
                        className={`cursor-pointer rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
                          cardTab === 'designers'
                            ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                            : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
                        }`}
                      >
                        Designers ({designers.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCardTab('style_cards');
                          setConfirmDeleteCardId(null);
                        }}
                        className={`cursor-pointer rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
                          cardTab === 'style_cards'
                            ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                            : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
                        }`}
                      >
                        Style Cards ({styleCards.length})
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={openAddCardModal}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#FF6B5B] to-[#F59E0B] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-transform hover:scale-[1.02]"
                    >
                      <Plus className="h-4 w-4" />
                      <span>
                        Add New {cardTab === 'designers' ? 'Designer' : 'Style Card'}
                      </span>
                    </button>
                  </div>

                  {cardTab === 'designers' && (
                    <>
                      {designers.length === 0 ? (
                        <EmptyManageCardsState
                          title="No Designers in Supabase"
                          subtitle="Add your first designer card to replace the fallback catalog."
                          buttonLabel="Add New Designer"
                          onAdd={openAddCardModal}
                        />
                      ) : (
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                          {designers.map((d) => {
                            const isConfirming = confirmDeleteCardId === d.id;
                            const isDeleting = deletingCardId === d.id;
                            return (
                              <article
                                key={d.id}
                                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                              >
                                <div className="flex items-center gap-3.5">
                                  <img
                                    src={d.image_url || FALLBACK_IMAGE}
                                    alt={d.name}
                                    referrerPolicy="no-referrer"
                                    className="h-16 w-16 shrink-0 rounded-2xl bg-slate-100 object-cover dark:bg-slate-800"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <h3 className="truncate text-base font-semibold text-slate-900 dark:text-white">
                                      {d.name}
                                    </h3>
                                    <p className="truncate text-xs font-medium text-[#0D9488] dark:text-teal-400">
                                      {d.specialty}
                                    </p>
                                    <div className="mt-1 flex items-center justify-between gap-2 text-xs">
                                      <span className="flex items-center gap-1 font-semibold tabular-nums text-amber-600 dark:text-amber-400">
                                        <Star className="h-3.5 w-3.5 fill-current" />
                                        <span>{Number(d.rating ?? 4.8).toFixed(1)}</span>
                                        <span className="font-normal text-slate-400">
                                          · {d.Experience ?? d.experience ?? 5} yrs
                                        </span>
                                      </span>
                                      <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                                        {formatSessionRate(
                                          d.session_price ?? d.hourly_rate ?? d.price,
                                          d.name,
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <p className="mt-3 flex-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                                  {d.bio || 'No bio added yet.'}
                                </p>

                                <CardButtonsFooter
                                  isConfirming={isConfirming}
                                  isDeleting={isDeleting}
                                  onEdit={() => openEditDesignerModal(d)}
                                  onAskDelete={() => setConfirmDeleteCardId(d.id)}
                                  onCancelDelete={() => setConfirmDeleteCardId(null)}
                                  onConfirmDelete={() =>
                                    void handleDeleteCard(d.id, d.name)
                                  }
                                />
                              </article>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}

                  {cardTab === 'style_cards' && (
                    <>
                      {styleCards.length === 0 ? (
                        <EmptyManageCardsState
                          title="No Style Cards in Supabase"
                          subtitle="Add style cards here to display them in the Design Studio & Home page."
                          buttonLabel="Add New Style Card"
                          onAdd={openAddCardModal}
                        />
                      ) : (
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                          {styleCards.map((card) => {
                            const isConfirming = confirmDeleteCardId === card.id;
                            const isDeleting = deletingCardId === card.id;
                            return (
                              <article
                                key={card.id}
                                className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
                              >
                                <div className="aspect-[16/10] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                                  <img
                                    src={card.image_url || FALLBACK_IMAGE}
                                    alt={card.title}
                                    referrerPolicy="no-referrer"
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                                <div className="flex flex-1 flex-col p-5">
                                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                                    {card.title}
                                  </h3>
                                  <p className="mt-1.5 flex-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                                    {card.description || 'No description provided.'}
                                  </p>

                                  <CardButtonsFooter
                                    isConfirming={isConfirming}
                                    isDeleting={isDeleting}
                                    onEdit={() => openEditStyleCardModal(card)}
                                    onAskDelete={() =>
                                      setConfirmDeleteCardId(card.id)
                                    }
                                    onCancelDelete={() =>
                                      setConfirmDeleteCardId(null)
                                    }
                                    onConfirmDelete={() =>
                                      void handleDeleteCard(card.id, card.title)
                                    }
                                  />
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* VIEW BOOKING DETAILS MODAL */}
      {detailBooking && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Booking details"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
              <div>
                <span className="font-mono text-xs font-bold text-[#0D9488] dark:text-teal-400">
                  {detailBooking.booking_ref}
                </span>
                <h2 className="mt-1 font-display text-xl font-bold text-slate-900 dark:text-white">
                  {detailBooking.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setDetailBooking(null)}
                aria-label="Close modal"
                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <dl className="mt-4 space-y-3 text-xs">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Email</dt>
                <dd className="font-semibold text-slate-900 dark:text-white">
                  {detailBooking.email}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Phone</dt>
                <dd className="font-mono font-semibold tabular-nums text-slate-900 dark:text-white">
                  {detailBooking.phone}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Designer</dt>
                <dd className="font-semibold text-slate-900 dark:text-white">
                  {detailBooking.designer}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Room Type</dt>
                <dd className="font-semibold text-slate-900 dark:text-white">
                  {detailBooking.room_type}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Preferred Slot</dt>
                <dd className="font-semibold tabular-nums text-slate-900 dark:text-white">
                  {detailBooking.preferred_date} · {detailBooking.preferred_time}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Status</dt>
                <dd className="font-semibold capitalize text-slate-900 dark:text-white">
                  {detailBooking.status}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Submitted</dt>
                <dd className="tabular-nums text-slate-700 dark:text-slate-300">
                  {new Date(detailBooking.created_at).toLocaleString()}
                </dd>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-950">
                <dt className="mb-1 text-[11px] font-semibold text-slate-500">
                  Client Project Notes
                </dt>
                <dd className="leading-relaxed text-slate-700 dark:text-slate-200">
                  {detailBooking.message || 'No additional notes provided.'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {/* ADD / EDIT CARD MODAL WITH LIVE PREVIEW */}
      {cardModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={editingCardId ? 'Edit card' : 'Add card'}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
        >
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
              <div>
                <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                  {editingCardId ? 'Edit' : 'Add New'}{' '}
                  {cardTab === 'designers' ? 'Designer' : 'Style Card'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Saves directly to Supabase and updates the live site immediately.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCardModalOpen(false)}
                aria-label="Close modal"
                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={handleSaveCard}
              className="grid grid-cols-1 gap-6 md:grid-cols-12"
            >
              {/* Form Inputs (7 cols) */}
              <div className="space-y-4 md:col-span-7">
                {cardTab === 'designers' ? (
                  <>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                        Designer Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={dName}
                        onChange={(e) => setDName(e.target.value)}
                        placeholder="e.g., Ananya Verma"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-[#0D9488] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                          Specialty *
                        </label>
                        <input
                          type="text"
                          required
                          value={dSpecialty}
                          onChange={(e) => setDSpecialty(e.target.value)}
                          placeholder="Modern & Scandinavian"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-[#0D9488] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                          Rating (1–5)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min={1}
                          max={5}
                          value={dRating}
                          onChange={(e) => setDRating(Number(e.target.value))}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm tabular-nums text-slate-900 focus:border-[#0D9488] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                          Session Price
                        </label>
                        <input
                          type="text"
                          value={dHourlyRate}
                          onChange={(e) => setDHourlyRate(e.target.value)}
                          placeholder="$95/session"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm tabular-nums text-slate-900 focus:border-[#0D9488] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                          Experience (yrs)
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={60}
                          value={dExperience}
                          onChange={(e) => setDExperience(Number(e.target.value))}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm tabular-nums text-slate-900 focus:border-[#0D9488] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                          Image URL
                        </label>
                        <input
                          type="url"
                          value={dImageUrl}
                          onChange={(e) => setDImageUrl(e.target.value)}
                          placeholder="https://images.unsplash.com/..."
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-900 focus:border-[#0D9488] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                        Bio
                      </label>
                      <textarea
                        rows={3}
                        value={dBio}
                        onChange={(e) => setDBio(e.target.value)}
                        placeholder="Design background and spatial philosophy..."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-[#0D9488] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                        Style Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={sTitle}
                        onChange={(e) => setSTitle(e.target.value)}
                        placeholder="e.g., Japandi"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-[#0D9488] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                        Image URL
                      </label>
                      <input
                        type="url"
                        value={sImageUrl}
                        onChange={(e) => setSImageUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-900 focus:border-[#0D9488] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                        Description
                      </label>
                      <textarea
                        rows={3}
                        value={sDescription}
                        onChange={(e) => setSDescription(e.target.value)}
                        placeholder="Warm oak timber, limewash plaster, serene lines..."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-[#0D9488] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Live Card Preview (5 cols) */}
              <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 md:col-span-5 dark:border-slate-800 dark:bg-slate-950">
                <div>
                  <div className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Live Card Preview
                  </div>

                  {cardTab === 'designers' ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                      <div className="flex items-center gap-3">
                        <img
                          src={dImageUrl.trim() || FALLBACK_IMAGE}
                          alt="Designer preview"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.src = FALLBACK_IMAGE;
                          }}
                          className="h-14 w-14 shrink-0 rounded-2xl bg-slate-100 object-cover dark:bg-slate-800"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                            {dName.trim() || 'Designer Name'}
                          </div>
                          <div className="truncate text-xs font-medium text-[#0D9488]">
                            {dSpecialty.trim() || 'Specialty'}
                          </div>
                          <div className="mt-0.5 flex items-center justify-between gap-2 text-xs">
                            <span className="flex items-center gap-1 font-semibold tabular-nums text-amber-600 dark:text-amber-400">
                              <Star className="h-3 w-3 fill-current" />
                              <span>{Number(dRating || 4.8).toFixed(1)}</span>
                              <span className="font-normal text-slate-400">
                                · {dExperience} yrs
                              </span>
                            </span>
                            <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                              {formatSessionRate(
                                dHourlyRate.trim(),
                                dName.trim() || 'Designer',
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                        {dBio.trim() || 'Designer bio will preview here.'}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                      <div className="aspect-[16/10] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                        <img
                          src={sImageUrl.trim() || FALLBACK_IMAGE}
                          alt="Style card preview"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.src = FALLBACK_IMAGE;
                          }}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="p-4">
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">
                          {sTitle.trim() || 'Style Title'}
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                          {sDescription.trim() ||
                            'Style card description will preview here.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-end gap-2.5 border-t border-slate-200 pt-4 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setCardModalOpen(false)}
                    className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingCard}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#0D9488] to-[#0891B2] px-5 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-95 disabled:opacity-60"
                  >
                    {savingCard && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <span>
                      {savingCard
                        ? 'Saving...'
                        : editingCardId
                          ? 'Save Changes'
                          : 'Create Card'}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  accentClass,
  barClass,
}: {
  label: string;
  value: number;
  accentClass: string;
  barClass: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className={`mb-3 h-1 w-10 rounded-full bg-gradient-to-r ${barClass}`} />
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className={`mt-1.5 font-display text-3xl font-bold tabular-nums ${accentClass}`}>
        {value}
      </p>
    </div>
  );
}

function ChartEmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 text-xs text-slate-400 dark:border-slate-800">
      {message}
    </div>
  );
}

function CardButtonsFooter({
  isConfirming,
  isDeleting,
  onEdit,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete,
}: {
  isConfirming: boolean;
  isDeleting: boolean;
  onEdit: () => void;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
}) {
  return (
    <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
      {isConfirming ? (
        <div className="flex w-full items-center justify-between gap-2">
          <span className="text-xs font-medium text-rose-600 dark:text-rose-400">
            Delete permanently?
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={isDeleting}
              onClick={onConfirmDelete}
              className="cursor-pointer rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
            <button
              type="button"
              onClick={onCancelDelete}
              className="cursor-pointer rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <Edit3 className="h-3.5 w-3.5 text-[#0D9488]" />
            <span>Edit</span>
          </button>

          <button
            type="button"
            onClick={onAskDelete}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete</span>
          </button>
        </>
      )}
    </div>
  );
}

function EmptyManageCardsState({
  title,
  subtitle,
  buttonLabel,
  onAdd,
}: {
  title: string;
  subtitle: string;
  buttonLabel: string;
  onAdd: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
      <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
        {title}
      </h2>
      <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
        {subtitle}
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6B5B] to-[#F59E0B] px-5 py-2.5 text-xs font-semibold text-white"
      >
        <Plus className="h-4 w-4" />
        <span>{buttonLabel}</span>
      </button>
    </div>
  );
}
