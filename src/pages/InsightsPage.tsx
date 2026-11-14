import { useMemo, useState } from 'react';
import {
  BarChart3,
  Database,
  Download,
  Lightbulb,
  Trash2,
  Wand2,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useToast } from '../hooks/useToast';
import {
  clearAnalyticsEvents,
  computeAnalyticsSummary,
  exportAnalyticsCsv,
  readAnalyticsEvents,
  seedDemoAnalytics,
  type DesignAnalyticsEvent,
} from '../studio/analytics';

interface InsightsPageProps {
  onGoToStudio: () => void;
}

export function InsightsPage({ onGoToStudio }: InsightsPageProps) {
  const { showToast } = useToast();
  const [events, setEvents] = useState<DesignAnalyticsEvent[]>(() =>
    readAnalyticsEvents(),
  );

  const summary = useMemo(() => computeAnalyticsSummary(events), [events]);

  const handleLoadDemo = () => {
    const seeded = seedDemoAnalytics();
    setEvents(seeded);
    showToast('Loaded 14 sample design analytics sessions.', 'success');
  };

  const handleClear = () => {
    clearAnalyticsEvents();
    setEvents([]);
    showToast('Cleared analytics logs.', 'info');
  };

  const handleExportCsv = () => {
    if (events.length === 0) {
      showToast('Load demo data or create studio edits before exporting CSV.', 'info');
      return;
    }
    exportAnalyticsCsv(events);
    showToast('Downloaded design analytics CSV.', 'success');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Design Insights
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Browser-local telemetry across style presets, wall palettes, procedural floors, and decor add-ons.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleLoadDemo}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            <Database className="h-3.5 w-3.5 text-[#6D28D9]" />
            <span>Load demo data</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#0D9488] px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-700"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export data as CSV</span>
          </button>

          {events.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear analytics data"
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:border-slate-700 dark:bg-slate-900 dark:text-rose-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {events.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <BarChart3 className="mx-auto h-10 w-10 text-[#0D9488]" />
          <h2 className="mt-4 font-display text-2xl font-bold text-slate-900 dark:text-white">
            No Design Events Recorded Yet
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-slate-600 dark:text-slate-300">
            Apply a style preset, run extra instructions, or save a room in the Design Studio to track real usage—or populate realistic sample records immediately.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleLoadDemo}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#6D28D9] px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:opacity-95"
            >
              <Database className="h-4 w-4" />
              <span>Load demo data</span>
            </button>
            <button
              type="button"
              onClick={onGoToStudio}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6B5B] to-[#F59E0B] px-5 py-2.5 text-xs font-semibold text-white shadow-sm"
            >
              <Wand2 className="h-4 w-4" />
              <span>Open Design Studio</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 4 KPI Cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Total Designs Logged
              </div>
              <div className="mt-2 font-display text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
                {summary.totalDesigns}
              </div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Tracked in localStorage
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Most Popular Style
              </div>
              <div className="mt-2 font-display text-2xl font-bold text-[#FF6B5B]">
                {summary.mostPopularStyle.name}
              </div>
              <div className="mt-1 text-xs tabular-nums text-slate-500 dark:text-slate-400">
                {summary.mostPopularStyle.sharePct}% of total sessions ({summary.mostPopularStyle.count})
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Most Used Wall Color
              </div>
              <div className="mt-2 flex items-center gap-2.5">
                <span
                  className="inline-block h-6 w-6 shrink-0 rounded-full border border-slate-300 dark:border-slate-600"
                  style={{ backgroundColor: summary.mostUsedColor.hex }}
                />
                <span className="truncate font-display text-xl font-bold text-slate-900 dark:text-white">
                  {summary.mostUsedColor.name}
                </span>
              </div>
              <div className="mt-1 font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                {summary.mostUsedColor.hex} · {summary.mostUsedColor.sharePct}% share
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Avg Add-ons / Design
              </div>
              <div className="mt-2 font-display text-3xl font-bold tabular-nums text-[#0D9488]">
                {summary.avgAddonsPerDesign}
              </div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Decor layers per room
              </div>
            </div>
          </div>

          {/* Rule-based Insights Callout */}
          {summary.insights.length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <Lightbulb className="h-4 w-4 text-[#F59E0B]" />
                <span>Automated Analytical Findings</span>
              </div>
              <ul className="grid grid-cols-1 gap-2.5 text-xs text-slate-700 md:grid-cols-2 dark:text-slate-300">
                {summary.insights.map((line) => (
                  <li
                    key={line}
                    className="rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-2.5 dark:border-slate-800 dark:bg-slate-950"
                  >
                    {line}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Charts Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* 1. Most Popular Styles (BarChart) */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
                Most Popular Interior Styles
              </h2>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.styleCounts} margin={{ top: 8, right: 16, left: -12, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Designs" radius={[6, 6, 0, 0]} fill="#FF6B5B" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* 2. Most Used Wall Colors (Pie / Donut with actual hex colors) */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
                Wall Color Distribution (Actual Swatches)
              </h2>
              <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-2">
                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={summary.wallColorSlices}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={84}
                        paddingAngle={2}
                      >
                        {summary.wallColorSlices.map((slice) => (
                          <Cell
                            key={`${slice.name}-${slice.hex}`}
                            fill={slice.hex}
                            stroke="#64748B"
                            strokeWidth={1}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 text-xs">
                  {summary.wallColorSlices.slice(0, 6).map((slice) => (
                    <div
                      key={`${slice.name}-${slice.hex}-legend`}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <span
                          className="h-3.5 w-3.5 shrink-0 rounded-full border border-slate-300"
                          style={{ backgroundColor: slice.hex }}
                        />
                        <span className="truncate text-slate-700 dark:text-slate-200">
                          {slice.name}
                        </span>
                      </span>
                      <span className="font-mono tabular-nums text-slate-500">
                        {slice.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* 3. Add-on Usage Frequency (Horizontal BarChart) */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
                Decor Add-on Frequency
              </h2>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={summary.addonFrequency}
                    layout="vertical"
                    margin={{ top: 8, right: 20, left: 24, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Uses" radius={[0, 6, 6, 0]} fill="#0D9488" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* 4. Floor Type Distribution */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
                Floor Material Distribution
              </h2>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.floorDistribution} margin={{ top: 8, right: 16, left: -12, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Selections" radius={[6, 6, 0, 0]} fill="#6D28D9" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          {/* 5. Designs Created Over Time (LineChart) */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
              Design Activity Over Time
            </h2>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={summary.designsOverTime} margin={{ top: 8, right: 20, left: -12, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Edits"
                    stroke="#F59E0B"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#FF6B5B' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
