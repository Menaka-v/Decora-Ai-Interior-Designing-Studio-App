import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import type { AppPage } from './Navbar';

interface FooterProps {
  onNavigate: (page: AppPage) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 py-10 sm:flex-row sm:items-center sm:px-6 lg:px-8">
        <div>
          <span className="font-display text-xl font-bold text-slate-900 dark:text-white">
            DecoraAI
          </span>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Virtual interior design studio &amp; personal consultation platform
          </p>
          <p className="mt-1 text-xs font-medium text-teal-700 dark:text-teal-400">
            Demo mode: runs fully in your browser. No data leaves your device.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-sm text-slate-600 dark:text-slate-300">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="cursor-pointer hover:text-slate-900 dark:hover:text-white"
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => onNavigate('studio')}
            className="cursor-pointer hover:text-slate-900 dark:hover:text-white"
          >
            Studio
          </button>
          <button
            type="button"
            onClick={() => onNavigate('designs')}
            className="cursor-pointer hover:text-slate-900 dark:hover:text-white"
          >
            My Designs
          </button>
          <button
            type="button"
            onClick={() => onNavigate('insights')}
            className="cursor-pointer hover:text-slate-900 dark:hover:text-white"
          >
            Insights
          </button>
          <button
            type="button"
            onClick={() => onNavigate('consultations')}
            className="cursor-pointer hover:text-slate-900 dark:hover:text-white"
          >
            Consultations
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {theme === 'light' ? (
              <>
                <Moon className="h-3.5 w-3.5" />
                <span>Dark Mode</span>
              </>
            ) : (
              <>
                <Sun className="h-3.5 w-3.5" />
                <span>Light Mode</span>
              </>
            )}
          </button>
        </div>
      </div>
    </footer>
  );
}
