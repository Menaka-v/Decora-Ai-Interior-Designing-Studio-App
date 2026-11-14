# DecoraAI — Browser-Native Virtual Interior Design & Analytics Studio

![DecoraAI Studio Preview](./docs/studio-demo.gif)

**Live Demo:** `https://decoraai-demo.example.com` *(replace with your deployed URL)*

DecoraAI is a 100% free, zero-API-key virtual interior design studio and design analytics dashboard. Upload any room photo (or launch with a built-in sample room), segment architectural regions directly inside the browser using `@huggingface/transformers`, repaint walls/ceilings/furniture with luminance-preserving HSL pixel processing, preview procedural perspective-scaled floors, arrange smart SVG decor overlays, and explore usage trends on an interactive Recharts dashboard.

---

## Features

- **Supabase-powered booking and Admin Panel:** consultations saved to a real database, with a dashboard, status updates, and card managemen
-  **100% Client-Side & Free (No API Keys):** Runs entirely in the browser with zero external paid AI image APIs or user keys.
- **Upload Quality Checks & Auto-Resizing:** Checks brightness, resolution (`< 600px` wide), and sharpness (Laplacian variance) while auto-resizing large photos to max `1600px` on the long edge.
- **Built-In Sample Rooms:** Instant `"Try sample room"` picker featuring well-lit Living Room, Bedroom, and Kitchen photos.
- **In-Browser Room Region Segmentation:** Uses `Xenova/segformer-b0-finetuned-ade-512-512` via `@huggingface/transformers` to isolate walls, ceiling, floor, windows, doors, curtains, furniture, and rugs—plus **Brush**, **Eraser**, **Refine edges**, and **Magic Wand** flood-fill tools.
- **Realistic HSL Surface Recoloring:** Preserves original plaster texture, highlights, and shadows by transferring Hue & Saturation inside feathered surface masks while retaining original luminance.
- **Procedural Perspective Flooring:** Generates tileable `Light Wood`, `Dark Wood`, `Marble`, `Gray Tiles`, `Carpet`, and `Concrete` textures on offscreen `<canvas>` with a live perspective-scale slider.
- **Smart SVG Decor Overlays:** Auto-places curtains over windows, rugs on the foreground floor, wall art/mirrors on clear walls, plants near corners, and chandeliers on the ceiling—all draggable, resizable, rotatable, and color-customizable.
- **Deterministic Extra-Instructions Parser & Idea Chips:** Translates natural-language phrases across 45+ named colors (`"Paint the walls sage green"`, `"Add sheer white curtains"`, `"Switch floor to marble"`) and flags impossible structural requests with practical alternatives.
- **8 One-Click Style Presets with Live Room Previews:** Compare `Modern`, `Minimalist`, `Scandinavian`, `Bohemian`, `Luxury`, `Coastal`, `Japandi`, and `Industrial` rendered on your own room thumbnail before applying.
- **Before / After Slider, Undo/Redo, PNG Export & Saved Gallery:** Stacked canvas slider with mouse/touch drag, 25-step Undo/Redo history, `Download PNG` flattening, and `My Designs` gallery with side-by-side comparison.
- **Design Analytics Dashboard (`Insights`):** Tracks styles, wall color hex swatches, add-ons, flooring trends, and daily activity in `localStorage` with `Recharts` charts, automated insight findings, `"Load demo data"`, and `"Export data as CSV"`.

---

## Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Motion
- **Database and Auth:** Supabase (PostgreSQL, Row Level Security)
- **In-Browser ML:** `@huggingface/transformers` (`Xenova/segformer-b0-finetuned-ade-512-512`)
- **Canvas & Graphics:** HTML5 Canvas 2D (`ImageData` HSL pipeline, procedural noise/veining textures, SVG-to-PNG compositor)
- **Analytics & Visualization:** Recharts (`BarChart`, `PieChart`, `LineChart`), `localStorage` telemetry + CSV export

---

## How It Works

1. **Image Normalization (`src/studio/imageQuality.ts`):** Uploaded photos are resized to a max long edge of `1600px` and scanned for average brightness and Laplacian blur variance.
2. **Neural Segmentation (`src/studio/segmentation.ts`):** SegFormer ADE20K classifies every pixel into architectural masks (`wall`, `ceiling`, `floor`, `window`, `door`, `curtain`, `furniture`, `rug`) and extracts normalized bounding boxes.
3. **Luminance-Preserving Recoloring (`src/studio/recolor.ts`):** Every pixel inside a feathered surface mask converts from RGB to HSL, adopting the target paint Hue/Saturation while retaining original Lightness so natural shadows remain intact.
4. **Procedural Flooring (`src/studio/floorTextures.ts`):** Offscreen canvas noise synthesizes wood grain, marble veining, grout tiles, carpet weave, and concrete, then projects them into the floor mask with depth-based perspective scaling.
5. **Smart Overlays & Parser (`src/studio/overlays.ts`, `src/studio/parser.ts`):** SVG decor elements position themselves automatically from detected bounding boxes and match room brightness, while keyword rules map user phrases to studio state changes.
6. **Analytics Engine (`src/studio/analytics.ts`):** Studio actions log structured events locally for visualization in `InsightsPage.tsx` and export to CSV.

---

## First Load Note

On your first visit to the **Design Studio**, `@huggingface/transformers` downloads `Xenova/segformer-b0-finetuned-ade-512-512` (~15 MB) directly from Hugging Face Hub and caches it in your browser's Cache Storage. Subsequent visits load directly from your browser cache in seconds. If offline or blocked by a network proxy, DecoraAI automatically enables the **Magic Wand** and **Brush** tools so every feature still works.

---

## Tips for Best Results

- Shoot in bright, even natural daylight with curtains open and indoor lights balanced.
- Stand back so at least one main wall and part of the floor are clearly visible.
- Use **Refine edges** or the **Eraser** tool (`Mask: Walls`) if bright sunlight causes wall masks to touch window frames.
- Drag **Before / After** to verify architectural details stay untouched while paint, floor, and lighting change.

---

## Limitations and Future Work

- **Limitations:** Semantic segmentation runs on a lightweight 512×512 mobile vision backbone (`segformer-b0`), so complex clutter or glass reflections may occasionally need quick Brush or Magic Wand touch-ups. Furniture style silhouettes cannot be structurally rebuilt without server-side diffusion models, so decor is added via parameterized 2D/SVG overlays.
- **Future Work:**
  - Perspective homography warp (`4-corner` transform) for rectangular area rugs and hardwood planks.
  - WebGPU acceleration toggle when available in Chromium browsers for sub-second segmentation.
  - Exportable shopping bill-of-materials breakdown tied to selected wall paint colors, floor area, and decor items.

---

## What I Learned

- Running transformer vision models (`SegFormer`) client-side via ONNX/WASM eliminates API latency and cost while preserving user privacy.
- Replacing flat color overlays with per-pixel **HSL luminance preservation** + **separable mask feathering** dramatically improves photorealism on painted walls and upholstery.
- Designing deterministic rule-based NLP parsers and procedural canvas textures provides instant, predictable feedback for portfolio demos and data analytics workflows.

---

## Supabase setup

DecoraAI connects directly from the browser to Supabase using `@supabase/supabase-js` (`src/lib/supabaseClient.js`)—no custom backend server is required.

### Environment Variables

Create a `.env` file (ignored by Git) based on `.env.example`:

```env
VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_your_key_here"
```

### Why the Publishable Key Is Safe in the Frontend

Supabase **publishable** (`sb_publishable_...` / `anon`) keys are explicitly designed to be embedded in browser and mobile clients. They carry only unauthenticated/authenticated user context (`anon` or `authenticated` JWT claims) and cannot bypass database security rules on their own. **Never** put a `service_role` or secret key in frontend `.env` files—secret keys bypass Row Level Security completely.

### Tables

1. **`consultations`** — `id`, `booking_ref`, `name`, `email`, `phone`, `room_type`, `designer`, `preferred_date`, `preferred_time`, `message`, `status` (`pending`, `confirmed`, `completed`, `cancelled`), `created_at`
2. **`designers`** — `id`, `name`, `specialty`, `rating`, `image_url`, `bio`
3. **`style_cards`** — `id`, `title`, `description`, `image_url`

### Row Level Security (RLS)

All security enforcement lives in PostgreSQL RLS policies on Supabase:
- **`consultations`**:
  - `INSERT` is allowed for public visitors (`anon`) so anyone can submit a consultation request. Because public visitors do not have `SELECT` access to other clients' personal data, the booking form performs `.insert(...)` **without** chaining `.select()`.
  - `SELECT`, `UPDATE`, and `DELETE` are restricted to authorized admin sessions (`authenticated` users matching your admin RLS policy). If a signed-in user lacks permission, Supabase returns an error or empty set and `/admin` displays **Not authorized**.
- **`designers` & `style_cards`**:
  - `SELECT` is publicly readable so the Booking page and Design Studio load live catalog cards (automatically falling back to built-in defaults if the tables are empty).
  - `INSERT`, `UPDATE`, and `DELETE` are restricted to authorized admin users via RLS.

---

## Running Locally

```bash
npm install
npm run dev
```

## Author



Open `http://localhost:3000` in your browser, and visit `/admin` to sign in to the Admin Panel.
