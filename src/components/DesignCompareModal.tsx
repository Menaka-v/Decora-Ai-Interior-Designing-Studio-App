import { useState } from 'react';
import { Columns2, MoveHorizontal, X } from 'lucide-react';
import type { SavedDesign } from '../types/decora';
import { BeforeAfterSlider } from './BeforeAfterSlider';

interface DesignCompareModalProps {
  leftDesign: SavedDesign;
  rightDesign: SavedDesign;
  onClose: () => void;
}

export function DesignCompareModal({
  leftDesign,
  rightDesign,
  onClose,
}: DesignCompareModalProps) {
  const [mode, setMode] = useState<'side-by-side' | 'slider'>('side-by-side');

  const leftVar =
    leftDesign.generatedImages[leftDesign.selectedVariationIndex] ||
    leftDesign.generatedImages[0];
  const rightVar =
    rightDesign.generatedImages[rightDesign.selectedVariationIndex] ||
    rightDesign.generatedImages[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Compare two saved designs"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
    >
      <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Design Comparison Studio
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {leftDesign.title} · {rightDesign.title}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setMode('side-by-side')}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  mode === 'side-by-side'
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <Columns2 className="h-3.5 w-3.5" />
                Side-by-Side
              </button>
              <button
                type="button"
                onClick={() => setMode('slider')}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  mode === 'slider'
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <MoveHorizontal className="h-3.5 w-3.5" />
                Visual Slider
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close comparison modal"
              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {mode === 'slider' ? (
          <div className="mb-6">
            <BeforeAfterSlider
              beforeImage={leftVar?.imageUrl || leftDesign.originalImage}
              afterImage={rightVar?.imageUrl || rightDesign.originalImage}
              beforeLabel={leftDesign.title}
              afterLabel={rightDesign.title}
              aspectClassName="aspect-[16/9]"
            />
          </div>
        ) : (
          <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-2">
            {[
              { design: leftDesign, variation: leftVar, slot: 'Design A' },
              { design: rightDesign, variation: rightVar, slot: 'Design B' },
            ].map(({ design, variation, slot }) => (
              <div
                key={design.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-slate-200 dark:bg-slate-800">
                  <img
                    src={variation?.imageUrl || design.originalImage}
                    alt={design.title}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {slot} · {design.roomType} · {design.style}
                  </div>
                  <h3 className="mt-1 text-base font-semibold text-slate-900 dark:text-white">
                    {design.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Synchronized specification comparison */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800/70 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 font-semibold">Specification</th>
                <th className="px-4 py-3 font-semibold">{leftDesign.title}</th>
                <th className="px-4 py-3 font-semibold">{rightDesign.title}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-900">
              <tr>
                <td className="px-4 py-2.5 font-medium text-slate-500 dark:text-slate-400">
                  Style & Room
                </td>
                <td className="px-4 py-2.5 text-slate-800 dark:text-slate-200">
                  {leftDesign.style} · {leftDesign.roomType}
                </td>
                <td className="px-4 py-2.5 text-slate-800 dark:text-slate-200">
                  {rightDesign.style} · {rightDesign.roomType}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-medium text-slate-500 dark:text-slate-400">
                  Wall Finish
                </td>
                <td className="px-4 py-2.5 text-slate-800 dark:text-slate-200">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="inline-block h-3.5 w-3.5 rounded-full border border-slate-300"
                      style={{
                        backgroundColor: leftDesign.customizations.wallColor,
                      }}
                    />
                    {leftDesign.customizations.wallColorName}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-slate-800 dark:text-slate-200">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="inline-block h-3.5 w-3.5 rounded-full border border-slate-300"
                      style={{
                        backgroundColor: rightDesign.customizations.wallColor,
                      }}
                    />
                    {rightDesign.customizations.wallColorName}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-medium text-slate-500 dark:text-slate-400">
                  Flooring
                </td>
                <td className="px-4 py-2.5 text-slate-800 dark:text-slate-200">
                  {leftDesign.customizations.flooring}
                </td>
                <td className="px-4 py-2.5 text-slate-800 dark:text-slate-200">
                  {rightDesign.customizations.flooring}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-medium text-slate-500 dark:text-slate-400">
                  Lighting & Budget
                </td>
                <td className="px-4 py-2.5 text-slate-800 dark:text-slate-200">
                  {leftDesign.customizations.lightingMood} ·{' '}
                  {leftDesign.customizations.budgetLevel}
                </td>
                <td className="px-4 py-2.5 text-slate-800 dark:text-slate-200">
                  {rightDesign.customizations.lightingMood} ·{' '}
                  {rightDesign.customizations.budgetLevel}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-medium text-slate-500 dark:text-slate-400">
                  Decor Add-ons
                </td>
                <td className="px-4 py-2.5 text-slate-800 dark:text-slate-200">
                  {leftDesign.customizations.decorAddons.join(', ') || 'None'}
                </td>
                <td className="px-4 py-2.5 text-slate-800 dark:text-slate-200">
                  {rightDesign.customizations.decorAddons.join(', ') || 'None'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
