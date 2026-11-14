import { useState } from 'react';
import { ArrowRight, ChevronDown, Sparkles, Sun, Moon } from 'lucide-react';
import { motion } from 'motion/react';
import { BeforeAfterSlider } from '../components/BeforeAfterSlider';
import {
  FAQS,
  HERO_AFTER_IMAGE,
  HERO_BEFORE_IMAGE,
  TESTIMONIALS,
} from '../data/catalog';
import { useCatalog } from '../hooks/useCatalog';
import { useTheme } from '../hooks/useTheme';
import type { DesignStyleId } from '../types/decora';

interface LandingPageProps {
  onStartStudio: (styleId?: DesignStyleId) => void;
  onBookConsultation: () => void;
}

export function LandingPage({
  onStartStudio,
  onBookConsultation,
}: LandingPageProps) {
  const { styles } = useCatalog();
  const { theme, toggleTheme } = useTheme();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="relative overflow-hidden">
      {/* Subtle colorful ambient gradients */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-36 -left-32 h-96 w-96 rounded-full bg-gradient-to-br from-[#FF6B5B]/20 via-[#F59E0B]/15 to-transparent blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-24 -right-32 h-96 w-96 rounded-full bg-gradient-to-bl from-[#0D9488]/20 via-[#6D28D9]/15 to-transparent blur-3xl"
      />

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 pt-10 pb-16 sm:px-6 lg:px-8 lg:pt-14 lg:pb-24">
        <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="flex flex-col justify-center lg:col-span-5"
          >
            <div className="mb-4 flex items-center gap-3 text-xs font-medium text-slate-600 dark:text-slate-400">
              <span>Virtual Interior Studio</span>
              <span aria-hidden="true">·</span>
              <span>4 Instant Variations</span>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex cursor-pointer items-center gap-1 text-slate-700 hover:text-[#FF6B5B] dark:text-slate-300"
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

            <h1
              className="font-display text-balance font-bold tracking-tight text-slate-900 dark:text-white"
              style={{ fontSize: 'clamp(2.25rem, 4vw, 3.65rem)', lineHeight: 1.08 }}
            >
              Reimagine Any Room Before You Move a Single Chair.
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-300">
              Upload a photo of your living room, bedroom, or office. Pick from 10
              curated styles, customize wall paint, flooring, and lighting, and
              preview four redesigned concepts while keeping your walls and windows
              intact.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => onStartStudio()}
                className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-gradient-to-r from-[#FF6B5B] via-[#F59E0B] to-[#0D9488] px-6 py-3.5 text-sm font-semibold text-white shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap shrink-0"
              >
                <span>Upload Your Room</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <a
                href="#featured-styles"
                className="inline-flex items-center rounded-2xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                Explore 10 Styles
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="flex flex-col justify-center lg:col-span-7"
          >
            <BeforeAfterSlider
              beforeImage={HERO_BEFORE_IMAGE}
              afterImage={HERO_AFTER_IMAGE}
              beforeLabel="Original Room"
              afterLabel="Modern Scandinavian Edit"
              aspectClassName="aspect-[16/10]"
            />
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Drag the handle to compare before and after</span>
              <span>Preserves window placement & floor plan</span>
            </div>
          </motion.div>
        </div>

        {/* Full-width metric strip below hero split */}
        <div className="mt-12 grid grid-cols-2 gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-4 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <div className="font-display text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
              10 Styles
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              From Japandi to Traditional Indian
            </p>
          </div>
          <div>
            <div className="font-display text-2xl font-bold tabular-nums text-[#0D9488]">
              4 Variations
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Generated simultaneously per room
            </p>
          </div>
          <div>
            <div className="font-display text-2xl font-bold tabular-nums text-[#FF6B5B]">
              10MB Max
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              JPG & PNG instant room uploads
            </p>
          </div>
          <div>
            <div className="font-display text-2xl font-bold tabular-nums text-[#6D28D9]">
              1-on-1 Experts
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Book real interior architects anytime
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-y border-slate-200 bg-white py-16 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              How DecoraAI Transforms Your Space
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Three guided steps from a quick smartphone photo to a complete room
              blueprint.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                step: '01. Upload Your Room Photo',
                desc: 'Drag and drop a JPG or PNG photo of your room, or test immediately with one of our sunlit architectural presets.',
                accent: 'from-[#FF6B5B]/15 to-[#F59E0B]/10',
              },
              {
                step: '02. Customize Style & Materials',
                desc: 'Pick your room type, design aesthetic, exact hex wall color, flooring material, sofa color, lighting mood, and budget tier.',
                accent: 'from-[#0D9488]/15 to-[#0891B2]/10',
              },
              {
                step: '03. Compare, Save & Consult',
                desc: 'Inspect 4 generated variations with our before/after slider, save favorites with custom tags, or book an interior architect.',
                accent: 'from-[#6D28D9]/15 to-[#EC4899]/10',
              },
            ].map((item) => (
              <div
                key={item.step}
                className={`rounded-2xl border border-slate-200 bg-gradient-to-br ${item.accent} p-6 dark:border-slate-800`}
              >
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {item.step}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Design Styles */}
      <section
        id="featured-styles"
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Ten Curated Interior Styles
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Select any aesthetic to launch the Design Studio pre-configured with its
              signature palette and materials.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onStartStudio()}
            className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-[#0D9488] hover:underline whitespace-nowrap"
          >
            <span>Open Full Style Studio</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {styles.map((style) => (
            <button
              key={style.id}
              type="button"
              onClick={() => onStartStudio(style.id)}
              className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition-transform hover:-translate-y-1 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                  src={style.imageUrl}
                  alt={`${style.name} interior style`}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    {style.name}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    {style.palette.map((hex) => (
                      <span
                        key={hex}
                        className="h-3.5 w-3.5 rounded-full border border-slate-200 dark:border-slate-700"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  {style.tagline}
                </p>
                <div className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                  {style.materials}
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Testimonials (Claim-to-Proof Adjacency) */}
      <section className="border-y border-slate-200 bg-white py-16 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Designed with Real Homeowners
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Verified room transformations combining Studio previews with human
                architectural guidance.
              </p>
            </div>
            <button
              type="button"
              onClick={onBookConsultation}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-100 whitespace-nowrap dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <span>Book a Consultation</span>
            </button>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((item) => (
              <blockquote
                key={item.name}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-[#FAF9F6] p-6 dark:border-slate-800 dark:bg-slate-900"
              >
                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                  “{item.quote}”
                </p>
                <footer className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-800">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    {item.name}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {item.role} · {item.outcome}
                  </div>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Everything you need to know before uploading your first room photo.
          </p>
        </div>

        <div className="mt-10 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={faq.q} className="p-5">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 text-left"
                >
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 flex flex-col items-center justify-between gap-6 rounded-2xl bg-gradient-to-r from-[#FF6B5B] via-[#6D28D9] to-[#0D9488] p-8 text-white sm:flex-row">
          <div>
            <h3 className="font-display text-2xl font-bold">
              Ready to see your room redesigned?
            </h3>
            <p className="mt-1 text-sm text-white/90">
              Generate four tailored variations in seconds inside the Design Studio.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onStartStudio()}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm transition-transform hover:scale-105 whitespace-nowrap shrink-0"
          >
            <Sparkles className="h-4 w-4 text-[#FF6B5B]" />
            <span>Launch Design Studio</span>
          </button>
        </div>
      </section>
    </div>
  );
}
