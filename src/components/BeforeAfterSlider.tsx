import React, { useRef, useState } from 'react';
import { ImageOff, MoveHorizontal } from 'lucide-react';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  aspectClassName?: string;
}

export function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeLabel = 'Before',
  afterLabel = 'After',
  aspectClassName = 'aspect-[16/9]',
}: BeforeAfterSliderProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<number>(52);
  const [dragging, setDragging] = useState(false);
  const [beforeErr, setBeforeErr] = useState(false);
  const [afterErr, setAfterErr] = useState(false);

  const updateFromClientX = (clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.max(4, Math.min(96, pct)));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFromClientX(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    updateFromClientX(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    setDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setPosition((p) => Math.max(4, p - 4));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setPosition((p) => Math.min(96, p + 4));
    }
  };

  return (
    <div
      ref={containerRef}
      role="slider"
      tabIndex={0}
      aria-label="Before and after room comparison slider"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(position)}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={`relative w-full select-none overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF6B5B] dark:border-slate-800 dark:bg-slate-900 ${aspectClassName} cursor-ew-resize touch-none`}
    >
      {/* After image (full width base) */}
      {afterErr ? (
        <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-teal-500/20 to-amber-500/20 text-slate-600 dark:text-slate-300">
          <ImageOff className="mb-2 h-8 w-8 opacity-60" />
          <span className="text-sm font-medium">{afterLabel} preview unavailable</span>
        </div>
      ) : (
        <img
          src={afterImage}
          alt={afterLabel}
          referrerPolicy="no-referrer"
          draggable={false}
          onError={() => setAfterErr(true)}
          className="h-full w-full object-cover"
        />
      )}

      {/* Before image (clipped on left) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        {beforeErr ? (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 text-slate-600 dark:from-slate-800 dark:to-slate-900 dark:text-slate-300">
            <ImageOff className="mb-2 h-8 w-8 opacity-60" />
            <span className="text-sm font-medium">{beforeLabel} preview unavailable</span>
          </div>
        ) : (
          <img
            src={beforeImage}
            alt={beforeLabel}
            referrerPolicy="no-referrer"
            draggable={false}
            onError={() => setBeforeErr(true)}
            className="h-full w-full object-cover"
          />
        )}
      </div>

      {/* Labels with accessible scrim */}
      <div className="pointer-events-none absolute top-3 left-3 rounded-lg bg-slate-950/70 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
        {beforeLabel}
      </div>
      <div className="pointer-events-none absolute top-3 right-3 rounded-lg bg-slate-950/70 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
        {afterLabel}
      </div>

      {/* Divider line & drag handle */}
      <div
        className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_12px_rgba(0,0,0,0.45)]"
        style={{ left: `${position}%` }}
      >
        <div className="absolute top-1/2 left-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-slate-900/90 text-white shadow-md">
          <MoveHorizontal className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
