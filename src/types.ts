export type SanitizerType = 
  | 'saltwater' 
  | 'chlorine_tablets' 
  | 'chlorine_granulate' 
  | 'liquid_chlorine' 
  | 'chlorine_free';

export type StabilizedChlorineType = 'yes' | 'no' | 'unknown';

export type PumpType = 'standard' | 'variable' | 'cartridge_pump' | 'booster' | 'unknown';

export type FilterType = 'sand_glass' | 'cartridge' | 'de' | 'unknown';

export type FilterMedia = 'glass' | 'filterballs' | 'sand' | 'paper_cartridge' | 'unknown';

export type WaterColor = 
  | 'clear' 
  | 'green_algae' 
  | 'milky_cloudy' 
  | 'brown_iron' 
  | 'yellow_mustard' 
  | 'purple_copper';

export interface PoolProfile {
  id: string;
  name: string;
  volumeM3: number;
  sanitizerType: SanitizerType;
  isSaltwaterWithChlorinator: boolean;
  saltGramsPerLiter?: number;
  isStabilizedChlorine: StabilizedChlorineType;
  pumpType: PumpType;
  pumpFlowM3h: number;
  pumpName?: string;
  pumpImagePreset?: string;
  customPumpImageUrl?: string;
  customPoolWaterImageUrl?: string;
  customDisinfectionImageUrl?: string;
  filterType: FilterType;
  filterMedia: FilterMedia;
  customFilterImageUrl?: string;
}

export interface WaterTest {
  id: string;
  date: string;
  ph: number | null;
  freeChlorinePpm: number | null;
  totalChlorinePpm?: number | null;
  alkalinityPpm: number | null;
  cyanuricAcidPpm: number | null;
  saltGramsPerLiter?: number | null;
  waterColor: WaterColor;
  waterSymptoms: string[];
  waterTempC: number | null;
  notes?: string;
  photoUrl?: string;
  measurementImageUrl?: string;
}

export interface ChemicalAction {
  chemical: 'ph_minus' | 'ph_plus' | 'chlorine_shock' | 'chlorine_tab' | 'alka_plus' | 'flocculant' | 'ascorbic_acid' | 'water_change' | 'salt';
  title: string;
  doseAmount: string;
  instructions: string;
  priority: 'high' | 'medium' | 'low';
}

export interface DiagnosticResult {
  status: 'perfect' | 'warning' | 'action_required' | 'critical';
  summary: string;
  waterColorAnalysis: {
    title: string;
    description: string;
    causes: string[];
    immediateAction: string[];
  };
  chemicalActions: ChemicalAction[];
  filterAndPumpAdvice: string[];
  warnings: string[];
  recommendedPumpHours: number;
}

export interface AiDiagnosisResponse {
  analysis: string;
  detectedValues?: {
    ph?: number;
    freeChlorinePpm?: number;
    alkalinityPpm?: number;
    cyanuricAcidPpm?: number;
    waterColor?: WaterColor;
  };
  recommendations: string[];
  equipmentInsights?: string;
}
