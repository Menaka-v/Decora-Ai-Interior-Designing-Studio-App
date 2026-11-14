import type {
  BudgetLevel,
  Customizations,
  DecorAddon,
  Designer,
  DesignStyleId,
  FlooringType,
  LightingMood,
  RoomType,
} from '../types/decora';

export const HERO_BEFORE_IMAGE =
  '/src/assets/images/hero_before_living_1794631596061.jpg';
export const HERO_AFTER_IMAGE =
  '/src/assets/images/hero_after_living_1794631596792.jpg';

export const ROOM_TYPES: RoomType[] = [
  'Living Room',
  'Bedroom',
  'Kitchen',
  'Bathroom',
  'Office',
  'Dining',
  'Kids Room',
];

export interface DesignStyleItem {
  id: DesignStyleId;
  name: string;
  tagline: string;
  palette: [string, string, string];
  imageUrl: string;
  materials: string;
}

export const DESIGN_STYLES: DesignStyleItem[] = [
  {
    id: 'modern',
    name: 'Modern',
    tagline: 'Clean geometry, sculptural lighting, crisp contrast',
    palette: ['#F7F4EE', '#0F5E66', '#E86A58'],
    imageUrl: '/src/assets/images/hero_after_living_1794631596792.jpg',
    materials: 'Matte lacquer, brushed brass, velvet',
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    tagline: 'Quiet surfaces, serene light, intentional negative space',
    palette: ['#FAFAFA', '#D6D3CD', '#2E2E2E'],
    imageUrl: '/src/assets/images/style_japandi_bedroom_1794631597258.jpg',
    materials: 'Raw linen, micro-cement, pale ash',
  },
  {
    id: 'scandinavian',
    name: 'Scandinavian',
    tagline: 'Warm timber, cozy textiles, bright nordic daylight',
    palette: ['#F5F2EB', '#C69F68', '#266150'],
    imageUrl: '/assets/aistudio/images_f54f068d.jpg',
    materials: 'Herringbone oak, bouclé, wool rugs',
  },
  {
    id: 'bohemian',
    name: 'Bohemian',
    tagline: 'Layered kilim rugs, rattan curves, lush indoor foliage',
    palette: ['#FDF4E7', '#D97706', '#C2410C'],
    imageUrl: '/src/assets/images/style_bohemian_living_1794631597893.jpg',
    materials: 'Rattan, hand-knotted wool, terracotta',
  },
  {
    id: 'industrial',
    name: 'Industrial',
    tagline: 'Black steel framing, exposed masonry, cognac leather',
    palette: ['#E7E5E4', '#1F2937', '#9A5B32'],
    imageUrl: '/src/assets/images/style_industrial_office_1794631599597.jpg',
    materials: 'Blackened steel, reclaimed oak, saddle leather',
  },
  {
    id: 'luxury',
    name: 'Luxury',
    tagline: 'Calacatta marble, fluted walnut, warm architectural glow',
    palette: ['#18181B', '#D4AF37', '#F5F5F4'],
    imageUrl: '/src/assets/images/style_luxury_kitchen_1794631598877.jpg',
    materials: 'Fluted walnut, veined marble, burnished brass',
  },
  {
    id: 'traditional-indian',
    name: 'Traditional Indian',
    tagline: 'Carved rosewood, handloom silks, glowing brass lanterns',
    palette: ['#F3E4CE', '#0E7490', '#D97706'],
    imageUrl: '/src/assets/images/style_indian_living_1794631598221.jpg',
    materials: 'Teak & cane, sandstone, hand-dyed silk',
  },
  {
    id: 'japandi',
    name: 'Japandi',
    tagline: 'Wabi-sabi craft meets functional Nordic calm',
    palette: ['#EFE9DF', '#A65D3B', '#5C6451'],
    imageUrl: '/src/assets/images/style_japandi_living_1794654851218.jpg',
    materials: 'Limewash plaster, ash timber, rice paper',
  },
  {
    id: 'coastal',
    name: 'Coastal',
    tagline: 'Breezy linen drapes, whitewashed oak, sea-glass tones',
    palette: ['#F8FAFC', '#0891B2', '#D6B88D'],
    imageUrl: '/src/assets/images/style_coastal_dining_1794631599127.jpg',
    materials: 'Seagrass weave, sheer linen, bleached oak',
  },
  {
    id: 'mid-century',
    name: 'Mid-Century',
    tagline: 'Tapered walnut legs, mustard & teal icons, geometric art',
    palette: ['#F7F1E5', '#D97706', '#0F766E'],
    imageUrl: '/src/assets/images/style_industrial_office_1794631599597.jpg',
    materials: 'American walnut, brass, textured tweed',
  },
];

export const WALL_COLOR_PRESETS = [
  { name: 'Warm Alabaster', hex: '#F7F4EE' },
  { name: 'Sage Mist', hex: '#A9BFA8' },
  { name: 'Sunlit Terracotta', hex: '#D9785C' },
  { name: 'Coastal Teal', hex: '#5BA3A0' },
  { name: 'Lavender Chalk', hex: '#C7B8E8' },
  { name: 'Soft Buttercream', hex: '#F3D999' },
  { name: 'Deep Slate', hex: '#384659' },
  { name: 'Sandstone Clay', hex: '#D4B99E' },
];

export const CEILING_COLOR_PRESETS = [
  { name: 'Crisp Chalk', hex: '#FAFAFA' },
  { name: 'Warm Ivory', hex: '#F6F1E7' },
  { name: 'Soft Sky', hex: '#DCEAF2' },
  { name: 'Pale Putty', hex: '#E5DFD5' },
  { name: 'Muted Sage', hex: '#D6E0D5' },
  { name: 'Charcoal Mood', hex: '#334155' },
];

export const FLOORING_OPTIONS: FlooringType[] = [
  'Original',
  'Light Wood',
  'Dark Wood',
  'Marble',
  'Gray Tiles',
  'Carpet',
  'Concrete',
];

export const FURNITURE_STYLE_OPTIONS = [
  'Curved Bouclé & Velvet',
  'Sleek Contemporary Low-Profile',
  'Carved Solid Timber',
  'Modular Lounge Seating',
  'Minimalist Steel & Leather',
];

export const SOFA_COLOR_PRESETS = [
  { name: 'Deep Teal', hex: '#0F5E66' },
  { name: 'Coral Velvet', hex: '#E06655' },
  { name: 'Warm Oat', hex: '#DFD5BE' },
  { name: 'Marigold', hex: '#D98A2B' },
  { name: 'Cognac Leather', hex: '#9A5B32' },
  { name: 'Charcoal', hex: '#334155' },
];

export const LIGHTING_MOODS: LightingMood[] = [
  'Natural Daylight',
  'Warm',
  'Evening',
  'Cool',
];

export const DECOR_ADDONS: DecorAddon[] = [
  'Plants',
  'Rugs',
  'Curtains',
  'Wall Art',
  'Lamps',
  'Mirrors',
  'Floating Shelves',
  'Cushions',
  'Chandelier',
];

export const BUDGET_LEVELS: BudgetLevel[] = ['Economy', 'Standard', 'Premium'];

export const DEFAULT_CUSTOMIZATIONS: Customizations = {
  wallColor: '#A9BFA8',
  wallColorName: 'Sage Mist',
  wallIntensity: 0,
  ceilingColor: '#FAFAFA',
  ceilingColorName: 'Crisp Chalk',
  ceilingIntensity: 0,
  flooring: 'Original',
  floorPerspectiveScale: 0.65,
  furnitureStyle: 'Curved Bouclé & Velvet',
  sofaBedColor: '#0F5E66',
  furnitureIntensity: 0,
  lightingMood: 'Natural Daylight',
  brightness: 0,
  contrast: 0,
  warmth: 0,
  vignette: 0,
  decorAddons: [],
  budgetLevel: 'Standard',
  extraInstructions: '',
};

export const SAMPLE_ROOMS: Array<{
  id: string;
  label: string;
  roomType: RoomType;
  imageUrl: string;
}> = [
  {
    id: 'sample-living',
    label: 'Living Room',
    roomType: 'Living Room',
    imageUrl: '/src/assets/images/hero_before_living_1794631596061.jpg',
  },
  {
    id: 'sample-bedroom',
    label: 'Bedroom',
    roomType: 'Bedroom',
    imageUrl: '/src/assets/images/style_japandi_bedroom_1794631597258.jpg',
  },
  {
    id: 'sample-kitchen',
    label: 'Kitchen',
    roomType: 'Kitchen',
    imageUrl: '/src/assets/images/style_luxury_kitchen_1794631598877.jpg',
  },
];

export const SAMPLE_DESIGNERS: Designer[] = [
  {
    id: 'designer-ananya',
    name: 'Ananya Verma',
    title: 'Principal Interior Architect',
    specialty: 'Traditional Indian, Modern & Vibrant Color Stories',
    rating: 4.9,
    reviewCount: 142,
    hourlyRate: '$95 / session',
    avatarUrl: '/src/assets/images/designer_ananya_1794631599566.jpg',
    experienceYears: 9,
    bio: 'Specializes in marrying artisanal woodwork, brass accents, and joyful color palettes with functional modern apartment layouts.',
  },
  {
    id: 'designer-marcus',
    name: 'Marcus Lindqvist',
    title: 'Senior Spatial & Furniture Designer',
    specialty: 'Scandinavian, Japandi & Minimalist Spaces',
    rating: 4.8,
    reviewCount: 118,
    hourlyRate: '$85 / session',
    avatarUrl: '/src/assets/images/designer_marcus_1794631600188.jpg',
    experienceYears: 11,
    bio: 'Focuses on daylight optimization, sustainable oak joinery, and calm acoustic layouts for open-plan homes and home offices.',
  },
  {
    id: 'designer-elena',
    name: 'Elena Vance',
    title: 'Lead Material & Textile Stylist',
    specialty: 'Bohemian, Coastal & Mid-Century Renovations',
    rating: 5.0,
    reviewCount: 96,
    hourlyRate: '$110 / session',
    avatarUrl: '/src/assets/images/designer_elena_1794631600989.jpg',
    experienceYears: 12,
    bio: 'Crafts tactile rooms with curated textiles, statement lighting, and high-impact budget transformations without structural demolition.',
  },
];

export const TESTIMONIALS = [
  {
    name: 'Priya Nair',
    role: 'Homeowner · Bengaluru',
    quote:
      'Before spending anything on custom carpentry, we tested Scandinavian and Japandi palettes directly on our living room photo. Seeing warm oak flooring and sage walls side-by-side saved three weeks of indecision.',
    outcome: 'Completed living room refresh in 18 days',
  },
  {
    name: 'David & Claire Miller',
    role: 'Apartment Renovators · Seattle',
    quote:
      'Comparing two saved studio concepts made choosing between Calacatta marble and light oak effortless. Our consultation with Marcus finalized the lighting plan in 45 minutes.',
    outcome: '24% under renovation budget',
  },
  {
    name: 'Hannah Brooks',
    role: 'Creative Director · Austin',
    quote:
      'Being able to brush wall masks cleanly around our windows and drag plants and rugs into exact corners gave us a true room plan in minutes.',
    outcome: '4 studio concepts turned into final build',
  },
];

export const FAQS = [
  {
    q: 'Does DecoraAI run completely free in my browser without API keys?',
    a: 'Yes. Room segmentation uses an in-browser neural model (@huggingface/transformers), wall/ceiling/furniture recoloring uses luminance-preserving HSL pixel processing, floors are procedurally textured, and decor items are interactive SVG overlays—100% free with zero API keys.',
  },
  {
    q: 'What photo formats and sizes work best?',
    a: 'Upload clear, well-lit JPG or PNG photos up to 10MB where walls and floor are visible. Large photos are automatically resized to 1600px on the long edge for fast, crisp editing.',
  },
  {
    q: 'Can I fix areas if wall paint touches a window or trim?',
    a: 'Yes. Toggle the detected region highlights, use the Brush and Eraser tools with adjustable radius, click Refine Edges, or use the Magic Wand selector to isolate exact surfaces.',
  },
  {
    q: 'Can I save my edits and inspect design analytics?',
    a: 'Yes. Save any room edit to My Designs (stored locally in your browser and synced when connected), download a flattened PNG, and open the Insights page to analyze style, color, floor, and add-on trends.',
  },
];
