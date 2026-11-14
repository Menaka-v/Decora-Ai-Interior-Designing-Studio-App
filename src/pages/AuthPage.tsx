import React, { useState } from 'react';
import { Eye, EyeOff, LogOut, ShieldCheck, UserCheck } from 'lucide-react';
import { DESIGN_STYLES } from '../data/catalog';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import type { DesignStyleId, UserProfile } from '../types/decora';

interface AuthPageProps {
  onSuccessNavigate: (user: UserProfile) => void;
  onOpenAdmin?: () => void;
}

export function AuthPage({ onSuccessNavigate, onOpenAdmin }: AuthPageProps) {
  const { user, login, register, updateProfile, logout } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [preferredStyle, setPreferredStyle] = useState<DesignStyleId>('modern');
  const [submitting, setSubmitting] = useState(false);

  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileStyle, setProfileStyle] = useState<DesignStyleId>(
    user?.preferredStyle || 'modern',
  );

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'register' && password !== confirmPassword) {
      showToast('Passwords do not match. Please check and try again.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      let loggedIn: UserProfile;
      if (mode === 'login') {
        loggedIn = await login(email, password);
        showToast(
          loggedIn.role === 'admin'
            ? 'Signed in as Studio Admin.'
            : 'Signed in to DecoraAI.',
          'success',
        );
      } else {
        loggedIn = await register({ name, email, password, preferredStyle });
        showToast('Account created and saved to Supabase.', 'success');
      }
      onSuccessNavigate(loggedIn);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Authentication failed.',
        'error',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateProfile({
        name: profileName || user?.name,
        preferredStyle: profileStyle,
      });
      showToast('Profile preferences updated.', 'success');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to update profile.',
        'error',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF6B5B] to-[#6D28D9] text-lg font-bold text-white">
                {user.name.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                    {user.name}
                  </h1>
                  {user.role === 'admin' && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-[#0D9488] dark:bg-teal-950/60 dark:text-teal-300">
                      <ShieldCheck className="h-3 w-3" />
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {user.email} · Member since{' '}
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                logout();
                showToast('Signed out.', 'info');
              }}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>

          {user.role === 'admin' && onOpenAdmin && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-teal-200 bg-teal-50/70 p-4 dark:border-teal-900/60 dark:bg-teal-950/30">
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">
                  Administrator Access Active
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Manage all client consultation bookings, statuses, and catalog cards.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenAdmin}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#0D9488] px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Open Admin Dashboard</span>
              </button>
            </div>
          )}

          <form onSubmit={handleProfileSave} className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="profile-name"
                className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                Display Name
              </label>
              <input
                id="profile-name"
                type="text"
                value={profileName || user.name}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#0D9488] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label
                htmlFor="profile-style"
                className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                Preferred Interior Style
              </label>
              <select
                id="profile-style"
                value={profileStyle || user.preferredStyle || 'modern'}
                onChange={(e) =>
                  setProfileStyle(e.target.value as DesignStyleId)
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#0D9488] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {DESIGN_STYLES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#0D9488] px-5 py-2.5 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
            >
              <UserCheck className="h-4 w-4" />
              <span>{submitting ? 'Saving...' : 'Save Preferences'}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
          {mode === 'login' ? 'Welcome Back' : 'Create Your Studio Account'}
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Sync your saved room concepts, favorites, and designer bookings across
          sessions.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`cursor-pointer rounded-lg py-2 text-xs font-semibold transition-colors ${
              mode === 'login'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`cursor-pointer rounded-lg py-2 text-xs font-semibold transition-colors ${
              mode === 'register'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleAuthSubmit} className="mt-5 space-y-4">
          {mode === 'register' && (
            <div>
              <label
                htmlFor="auth-name"
                className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                Full Name
              </label>
              <input
                id="auth-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Maya Kapoor"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#0D9488] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="auth-email"
              className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              Email Address
            </label>
            <input
              id="auth-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#0D9488] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="auth-password"
              className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-10 pl-3.5 text-sm text-slate-900 focus:border-[#0D9488] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 flex cursor-pointer items-center px-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label
                htmlFor="auth-confirm-password"
                className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="auth-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-10 pl-3.5 text-sm text-slate-900 focus:border-[#0D9488] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={
                    showConfirmPassword
                      ? 'Hide confirm password'
                      : 'Show confirm password'
                  }
                  className="absolute inset-y-0 right-0 flex cursor-pointer items-center px-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {confirmPassword.length > 0 && password !== confirmPassword && (
                <p className="mt-1 text-xs font-medium text-rose-600 dark:text-rose-400">
                  Passwords do not match.
                </p>
              )}
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label
                htmlFor="auth-style"
                className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                Favorite Interior Style
              </label>
              <select
                id="auth-style"
                value={preferredStyle}
                onChange={(e) =>
                  setPreferredStyle(e.target.value as DesignStyleId)
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#0D9488] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {DESIGN_STYLES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full cursor-pointer rounded-xl bg-gradient-to-r from-[#FF6B5B] via-[#F59E0B] to-[#0D9488] py-3 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? 'Please wait...'
              : mode === 'login'
                ? 'Sign In'
                : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
