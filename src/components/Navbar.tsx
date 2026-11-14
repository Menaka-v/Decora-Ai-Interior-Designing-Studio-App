import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export type AppPage =
  | 'home'
  | 'studio'
  | 'designs'
  | 'insights'
  | 'consultations'
  | 'admin'
  | 'auth';

interface NavbarProps {
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
}

export function Navbar({ currentPage, onNavigate }: NavbarProps) {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: Array<{ id: AppPage; label: string }> = [
    { id: 'home', label: 'Home' },
    { id: 'studio', label: 'Studio' },
    { id: 'designs', label: 'My Designs' },
    { id: 'insights', label: 'Insights' },
    { id: 'consultations', label: 'Consultations' },
    { id: 'auth', label: user ? 'Profile' : 'Sign In' },
  ];

  const handleSelect = (page: AppPage) => {
    onNavigate(page);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-[#FAF9F6]/90 backdrop-blur-md dark:border-slate-800/80 dark:bg-[#0F1117]/90">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Zone 1: Single-element brand wordmark */}
        <button
          type="button"
          onClick={() => handleSelect('home')}
          className="font-display cursor-pointer text-2xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 transition-opacity hover:opacity-80 dark:text-white"
        >
          DecoraAI
        </button>

        {/* Zone 2: Concise single-line text links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden items-center gap-5 lg:gap-6 md:flex"
        >
          {navItems.map((item) => {
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`cursor-pointer border-b-2 py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'border-[#FF6B5B] text-slate-900 dark:text-white'
                    : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:text-white'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single primary CTA + mobile drawer button */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() =>
              handleSelect(currentPage === 'studio' ? 'consultations' : 'studio')
            }
            className="hidden cursor-pointer rounded-xl bg-gradient-to-r from-[#FF6B5B] to-[#F59E0B] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap shrink-0 sm:inline-flex"
          >
            {currentPage === 'studio' ? 'Book Designer' : 'Open Studio'}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition-colors hover:bg-slate-100 md:hidden dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileOpen && (
        <nav
          aria-label="Mobile Navigation"
          className="border-t border-slate-200 bg-white px-4 py-3 md:hidden dark:border-slate-800 dark:bg-slate-950"
        >
          <div className="flex flex-col gap-1">
            {navItems.map((item) => {
              const active = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                    active
                      ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
                      : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900'
                  }`}
                >
                  <span>{item.label}</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => handleSelect('studio')}
              className="mt-2 w-full rounded-xl bg-gradient-to-r from-[#FF6B5B] to-[#F59E0B] px-4 py-2.5 text-center text-sm font-semibold text-white"
            >
              Open Studio
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}
