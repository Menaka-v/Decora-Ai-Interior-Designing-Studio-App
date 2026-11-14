export type RoomType =
  | 'Living Room'
  | 'Bedroom'
  | 'Kitchen'
  | 'Bathroom'
  | 'Office'
  | 'Dining'
  | 'Kids Room';

export type DesignStyleId =
  | 'modern'
  | 'minimalist'
  | 'scandinavian'
  | 'bohemian'
  | 'industrial'
  | 'luxury'
  | 'traditional-indian'
  | 'japandi'
  | 'coastal'
  | 'mid-century';

export type FlooringType =
  | 'Original'
  | 'Light Wood'
  | 'Dark Wood'
  | 'Marble'
  | 'Gray Tiles'
  | 'Carpet'
  | 'Concrete'
  | 'Wood'
  | 'Tiles';

export type LightingMood = 'Warm' | 'Cool' | 'Natural Daylight' | 'Evening';
export type BudgetLevel = 'Economy' | 'Standard' | 'Premium';
export type DecorAddon =
  | 'Plants'
  | 'Rugs'
  | 'Curtains'
  | 'Wall Art'
  | 'Lamps'
  | 'Mirrors'
  | 'Floating Shelves'
  | 'Cushions'
  | 'Chandelier';

export interface Customizations {
  wallColor: string;
  wallColorName: string;
  wallIntensity: number;
  ceilingColor: string;
  ceilingColorName: string;
  ceilingIntensity: number;
  flooring: FlooringType;
  floorPerspectiveScale: number;
  furnitureStyle: string;
  sofaBedColor: string;
  furnitureIntensity: number;
  lightingMood: LightingMood;
  brightness: number;
  contrast: number;
  warmth: number;
  vignette: number;
  decorAddons: DecorAddon[];
  budgetLevel: BudgetLevel;
  extraInstructions: string;
}

export interface GeneratedVariation {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  palette: string[];
  highlights: string[];
  estimatedCost: string;
  isLiveAiRender: boolean;
}

export interface SavedDesign {
  id: string;
  userId?: string | null;
  title: string;
  originalImage: string;
  generatedImages: GeneratedVariation[];
  selectedVariationIndex: number;
  style: string;
  styleId: DesignStyleId;
  roomType: RoomType;
  customizations: Customizations;
  tags: string[];
  isFavorite: boolean;
  createdAt: string;
}

export interface Designer {
  id: string;
  name: string;
  title: string;
  specialty: string;
  rating: number;
  reviewCount: number;
  hourlyRate: string;
  avatarUrl: string;
  experienceYears: number;
  bio: string;
}

export type ConsultationStatus = 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';

export type UserRole = 'user' | 'admin';

export interface Consultation {
  id: string;
  userId?: string | null;
  designerId: string;
  designerName: string;
  name: string;
  email: string;
  phone: string;
  roomType: RoomType;
  preferredDate: string;
  preferredTime: string;
  message: string;
  status: ConsultationStatus;
  referenceCode: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role?: UserRole;
  preferredStyle?: DesignStyleId;
  createdAt: string;
}

export interface AdminUserSummary {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  preferredStyle?: string;
  createdAt: string;
}
