import {
  SanitizerType,
  PumpType,
  FilterType,
  FilterMedia,
  WaterColor,
  PoolProfile
} from '../types';

export const PUMP_PRESETS = [
  {
    id: 'pump_std_small',
    title: 'Standard overfladepumpe (0.25 - 0.5 HK)',
    flowM3h: 6,
    type: 'standard' as PumpType,
    description: 'Typisk for fritstående stål- og ramme-pools (Bestway, Intex, Swim & Fun).',
    imageUrl: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'pump_pro_medium',
    title: 'Professionel cirkulationspumpe m. forfilter (0.75 - 1.0 HK)',
    flowM3h: 11,
    type: 'standard' as PumpType,
    description: 'Standard i nedgravede pools og større havepools. Med grovsigte-kurv.',
    imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'pump_variable',
    title: 'Frekvensstyret / Variabel hastighedspumpe (VS)',
    flowM3h: 15,
    type: 'variable' as PumpType,
    description: 'Energibesparende pumpe der kan køre med lave omdrejninger hele døgnet.',
    imageUrl: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'pump_cartridge',
    title: 'Lille patronfilter-pumpe (Papirfilter)',
    flowM3h: 3,
    type: 'cartridge_pump' as PumpType,
    description: 'Kompakt samlet pumpehoved til mindre overfladepools (1-10 m³).',
    imageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'pump_unknown',
    title: '❓ Ved ikke / Usikker (Tag et billede)',
    flowM3h: 8,
    type: 'unknown' as PumpType,
    description: 'Er du i tvivl om din pumpe-model eller ydelse? Vælg denne og tag et billede af pumpen eller typepladen.',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
  }
];

export const FILTER_PRESETS = [
  {
    type: 'sand_glass' as FilterType,
    media: 'glass' as FilterMedia,
    title: 'Filterglas (AFM / Knust glas)',
    badge: 'Mest populær & hygiejnisk',
    description: 'Små polerede glaspartikler. Forhindrer biofilm, kræver mindre skyllevand og holder op til 10-15 år.',
    iconName: 'Sparkles'
  },
  {
    type: 'sand_glass' as FilterType,
    media: 'filterballs' as FilterMedia,
    title: 'Filterbolde (Aqualoon / Polymer fiber)',
    badge: 'Letvægt & fin filtrering',
    description: 'Mikro-fibernøgler der opfanger helt ned til 1-3 micron. Vaskes i vaskemaskine. OBS: Tåler IKKE flokningsmiddel!',
    iconName: 'CircleDot'
  },
  {
    type: 'sand_glass' as FilterType,
    media: 'sand' as FilterMedia,
    title: 'Kvartssand (0,4 - 0,8 mm)',
    badge: 'Klassisk sandfilter',
    description: 'Traditionelt filtersand. Effektivt og billigt, kræver returskyl hver 1-2 uge. Skiftes hvert 3.-5. år.',
    iconName: 'Layers'
  },
  {
    type: 'cartridge' as FilterType,
    media: 'paper_cartridge' as FilterMedia,
    title: 'Patronfilter (Papir/Lamel)',
    badge: 'Til mindre pools & spabade',
    description: 'Udskifteligt eller afskyleligt papirfilter. Kræver manuel spuling ugentligt.',
    iconName: 'FileText'
  },
  {
    type: 'unknown' as FilterType,
    media: 'unknown' as FilterMedia,
    title: '❓ Ved ikke / Usikker',
    badge: 'Tag et billede',
    description: 'Er du i tvivl om hvad der er i dit filter tank (sand, glas, bolde el. papir)? Vælg denne og tag et billede.',
    iconName: 'HelpCircle'
  }
];

export const WATER_COLOR_OPTIONS = [
  {
    value: 'clear' as WaterColor,
    label: 'Klart & rent vand',
    desc: 'Krystalklart vand uden uklarheder',
    colorBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300',
    dotColor: 'bg-emerald-500',
  },
  {
    value: 'green_algae' as WaterColor,
    label: 'Grønt / Alger',
    desc: 'Begyndende eller kraftig algevækst, glatte bunde',
    colorBg: 'bg-green-500/15 border-green-500/40 text-green-800 dark:text-green-300',
    dotColor: 'bg-green-600',
  },
  {
    value: 'milky_cloudy' as WaterColor,
    label: 'Mælkehvidt / Tåget',
    desc: 'Uklart vand med svævepartikler eller høj pH',
    colorBg: 'bg-sky-500/15 border-sky-500/40 text-sky-800 dark:text-sky-300',
    dotColor: 'bg-sky-300',
  },
  {
    value: 'brown_iron' as WaterColor,
    label: 'Brunt / Rødbrunt',
    desc: 'Jern eller rust i vandet efter påfyldning fra boring',
    colorBg: 'bg-amber-800/15 border-amber-700/40 text-amber-900 dark:text-amber-200',
    dotColor: 'bg-amber-700',
  },
  {
    value: 'yellow_mustard' as WaterColor,
    label: 'Gult / Sennepsalger',
    desc: 'Gult støvagtigt belægning på vægge og i skyggekroge',
    colorBg: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-900 dark:text-yellow-200',
    dotColor: 'bg-yellow-500',
  },
  {
    value: 'purple_copper' as WaterColor,
    label: 'Mørkt / Kobberskær',
    desc: 'Udfældning af kobber fra algicider eller varmeveksler',
    colorBg: 'bg-purple-500/15 border-purple-500/40 text-purple-900 dark:text-purple-300',
    dotColor: 'bg-purple-600',
  }
];

export const SYMPTOM_OPTIONS = [
  { id: 'slimy_walls', label: 'Glatte eller slibrige bassinvægge' },
  { id: 'chlorine_smell', label: 'Stærk klorlugt (skarp lugt)' },
  { id: 'eye_irritation', label: 'Svie i øjne eller kløende hud' },
  { id: 'foam', label: 'Skum på overfladen' },
  { id: 'high_temp', label: 'Vandtemperatur over 26°C' },
  { id: 'scale_tiles', label: 'Hvide kalkaflejringer på liner/fliser' },
  { id: 'well_water', label: 'Fyldt op med grundvand / egen boring' },
];

export const DEFAULT_PROFILE: PoolProfile = {
  id: 'default_pool',
  name: 'Min Havepool',
  volumeM3: 25,
  sanitizerType: 'chlorine_granulate',
  isSaltwaterWithChlorinator: false,
  saltGramsPerLiter: 3.5,
  isStabilizedChlorine: 'yes',
  pumpType: 'standard',
  pumpFlowM3h: 8,
  pumpName: 'Standard poolpumpe',
  filterType: 'sand_glass',
  filterMedia: 'glass',
};
