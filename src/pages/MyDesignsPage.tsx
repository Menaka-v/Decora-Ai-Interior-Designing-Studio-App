import { useEffect, useMemo, useState } from 'react';
import {
  CheckSquare,
  Columns2,
  Heart,
  Plus,
  Search,
  Square,
  Trash2,
  Wand2,
  X,
} from 'lucide-react';
import { DesignCompareModal } from '../components/DesignCompareModal';
import { ROOM_TYPES } from '../data/catalog';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { designsApi } from '../services/api';
import type { SavedDesign } from '../types/decora';

interface MyDesignsPageProps {
  refreshSignal: number;
  onOpenInStudio: (design: SavedDesign) => void;
  onGoToStudio: () => void;
}

export function MyDesignsPage({
  refreshSignal,
  onOpenInStudio,
  onGoToStudio,
}: MyDesignsPageProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [designs, setDesigns] = useState<SavedDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [roomFilter, setRoomFilter] = useState<string>('All');
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  const [editingTagsId, setEditingTagsId] = useState<string | null>(null);
  const [newTagText, setNewTagText] = useState('');

  const loadDesigns = async (activeUserId?: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const res = await designsApi.list(activeUserId);
      setDesigns(res.designs);
      setSelectedCompareIds([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load saved designs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDesigns(user?.id);
  }, [refreshSignal, user?.id]);

  const filteredDesigns = useMemo(() => {
    const q = search.trim().toLowerCase();
    return designs.filter((d) => {
      if (onlyFavorites && !d.isFavorite) return false;
      if (roomFilter !== 'All' && d.roomType !== roomFilter) return false;
      if (!q) return true;
      return (
        d.title.toLowerCase().includes(q) ||
        d.style.toLowerCase().includes(q) ||
        d.roomType.toLowerCase().includes(q) ||
        d.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [designs, search, roomFilter, onlyFavorites]);

  const handleToggleFavorite = async (id: string) => {
    try {
      const res = await designsApi.toggleFavorite(id, user?.id);
      setDesigns((prev) => prev.map((d) => (d.id === id ? res.design : d)));
      showToast(
        res.design.isFavorite ? 'Added to favorites.' : 'Removed from favorites.',
        'info',
      );
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Could not update favorite.',
        'error',
      );
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await designsApi.remove(id, user?.id);
      setDesigns((prev) => prev.filter((d) => d.id !== id));
      setSelectedCompareIds((prev) => prev.filter((cid) => cid !== id));
      showToast('Design deleted from gallery.', 'info');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Could not delete design.',
        'error',
      );
    }
  };

  const handleAddTag = async (design: SavedDesign) => {
    const tag = newTagText.trim();
    if (!tag) return;
    try {
      const updatedTags = Array.from(new Set([...design.tags, tag]));
      const res = await designsApi.updateTags(design.id, updatedTags, user?.id);
      setDesigns((prev) => prev.map((d) => (d.id === design.id ? res.design : d)));
      setNewTagText('');
      showToast(`Tag "${tag}" added.`, 'success');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Could not update tags.',
        'error',
      );
    }
  };

  const handleRemoveTag = async (design: SavedDesign, tagToRemove: string) => {
    try {
      const updatedTags = design.tags.filter((t) => t !== tagToRemove);
      const res = await designsApi.updateTags(design.id, updatedTags, user?.id);
      setDesigns((prev) => prev.map((d) => (d.id === design.id ? res.design : d)));
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Could not remove tag.',
        'error',
      );
    }
  };

  const toggleCompareSelection = (id: string) => {
    setSelectedCompareIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= 2) {
        return [prev[1], id];
      }
      return [...prev, id];
    });
  };

  const comparePair = useMemo(() => {
    if (selectedCompareIds.length !== 2) return null;
    const left = designs.find((d) => d.id === selectedCompareIds[0]);
    const right = designs.find((d) => d.id === selectedCompareIds[1]);
    if (!left || !right) return null;
    return { left, right };
  }, [designs, selectedCompareIds]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {user ? `${user.name}'s Designs` : 'My Designs'}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {user
              ? `Showing saved room concepts for ${user.email}.`
              : 'Organize saved concepts with tags, star favorites, and compare any two redesigns side-by-side.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {selectedCompareIds.length > 0 && (
            <button
              type="button"
              disabled={selectedCompareIds.length !== 2}
              onClick={() => setCompareModalOpen(true)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#6D28D9] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-opacity disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap"
            >
              <Columns2 className="h-4 w-4" />
              <span>
                {selectedCompareIds.length === 2
                  ? 'Compare Selected (2)'
                  : 'Select 1 More to Compare'}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={onGoToStudio}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6B5B] to-[#F59E0B] px-4 py-2.5 text-xs font-semibold text-white shadow-sm whitespace-nowrap"
          >
            <Wand2 className="h-4 w-4" />
            <span>New Redesign</span>
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, style, or tag..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-3 pl-9 text-xs text-slate-900 focus:border-[#0D9488] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            aria-label="Filter by room type"
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 focus:border-[#0D9488] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="All">All Rooms</option>
            {ROOM_TYPES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setOnlyFavorites(false)}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                !onlyFavorites
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              All ({designs.length})
            </button>
            <button
              type="button"
              onClick={() => setOnlyFavorites(true)}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                onlyFavorites
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Favorites ({designs.filter((d) => d.isFavorite).length})
            </button>
          </div>
        </div>
      </div>

      {/* States */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">
          {error}
        </div>
      ) : filteredDesigns.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">
            No matching designs yet
          </h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Generate a room concept in the Design Studio and click Save to build your
            personal lookbook.
          </p>
          <button
            type="button"
            onClick={onGoToStudio}
            className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#0D9488] px-5 py-2.5 text-xs font-semibold text-white"
          >
            Go to Design Studio
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredDesigns.map((design) => {
            const heroVar =
              design.generatedImages[design.selectedVariationIndex] ||
              design.generatedImages[0];
            const isSelected = selectedCompareIds.includes(design.id);
            const isEditingTags = editingTagsId === design.id;

            return (
              <article
                key={design.id}
                className={`flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all dark:bg-slate-900 ${
                  isSelected
                    ? 'border-[#6D28D9] ring-2 ring-[#6D28D9]/30'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img
                    src={heroVar?.imageUrl || design.originalImage}
                    alt={design.title}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />

                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void handleToggleFavorite(design.id)}
                      aria-label={
                        design.isFavorite
                          ? 'Remove from favorites'
                          : 'Add to favorites'
                      }
                      className={`inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl backdrop-blur-sm transition-colors ${
                        design.isFavorite
                          ? 'bg-[#FF6B5B] text-white'
                          : 'bg-slate-950/65 text-white hover:bg-slate-950/85'
                      }`}
                    >
                      <Heart
                        className={`h-4 w-4 ${design.isFavorite ? 'fill-current' : ''}`}
                      />
                    </button>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {design.roomType} · {design.style} ·{' '}
                    {new Date(design.createdAt).toLocaleDateString()}
                  </div>

                  <h3 className="mt-1 text-base font-semibold text-slate-900 dark:text-white">
                    {design.title}
                  </h3>

                  {/* Customizations summary */}
                  <div className="mt-2 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <span
                      className="inline-block h-3 w-3 rounded-full border border-slate-300"
                      style={{ backgroundColor: design.customizations.wallColor }}
                    />
                    <span className="truncate">
                      {design.customizations.wallColorName} ·{' '}
                      {design.customizations.flooring} ·{' '}
                      {design.customizations.lightingMood}
                    </span>
                  </div>

                  {/* Clean unboxed tags + inline tag editor */}
                  <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                    {design.tags.map((tag, idx) => (
                      <span
                        key={`${design.id}-${tag}`}
                        className="inline-flex items-center gap-1"
                      >
                        {idx > 0 && <span aria-hidden="true">·</span>}
                        <span>{tag}</span>
                        {isEditingTags && (
                          <button
                            type="button"
                            onClick={() => void handleRemoveTag(design, tag)}
                            aria-label={`Remove tag ${tag}`}
                            className="cursor-pointer text-rose-500 hover:text-rose-700"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </span>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTagsId(isEditingTags ? null : design.id);
                        setNewTagText('');
                      }}
                      className="ml-1 cursor-pointer text-xs font-medium text-[#0D9488] hover:underline"
                    >
                      {isEditingTags ? 'Done' : '+ Tag'}
                    </button>
                  </div>

                  {isEditingTags && (
                    <div className="mt-2.5 flex items-center gap-1.5">
                      <input
                        type="text"
                        value={newTagText}
                        onChange={(e) => setNewTagText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            void handleAddTag(design);
                          }
                        }}
                        placeholder="Add tag..."
                        className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 focus:border-[#0D9488] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                      <button
                        type="button"
                        onClick={() => void handleAddTag(design)}
                        className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg bg-[#0D9488] text-white"
                        aria-label="Save tag"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Card Footer Actions */}
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => toggleCompareSelection(design.id)}
                      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                        isSelected
                          ? 'bg-[#6D28D9] text-white'
                          : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {isSelected ? (
                        <CheckSquare className="h-3.5 w-3.5" />
                      ) : (
                        <Square className="h-3.5 w-3.5" />
                      )}
                      <span>{isSelected ? 'Selected' : 'Compare'}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenInStudio(design)}
                        className="cursor-pointer rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        Remix
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(design.id)}
                        aria-label={`Delete ${design.title}`}
                        className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-rose-900 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Side-by-Side & Visual Slider Comparison Modal */}
      {compareModalOpen && comparePair && (
        <DesignCompareModal
          leftDesign={comparePair.left}
          rightDesign={comparePair.right}
          onClose={() => setCompareModalOpen(false)}
        />
      )}
    </div>
  );
}
