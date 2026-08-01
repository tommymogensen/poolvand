import React, { useEffect, useState } from 'react';
import {
  WaterColor,
  PoolProfile,
  WaterTest,
  DiagnosticResult,
  SanitizerType,
  StabilizedChlorineType,
  PumpType,
  FilterType,
  FilterMedia
} from '../types';
import {
  WATER_COLOR_OPTIONS,
  SYMPTOM_OPTIONS,
  PUMP_PRESETS,
  FILTER_PRESETS
} from '../lib/constants';
import { calculateDiagnostic } from '../lib/poolCalculator';
import {
  Droplets,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Sparkles,
  Camera,
  Upload,
  Layers,
  ShieldAlert,
  ArrowUpRight,
  Filter,
  Check,
  Copy,
  Share2,
  MessageSquare
} from 'lucide-react';

interface DiagnosticWizardProps {
  profile: PoolProfile;
  onUpdateProfile: (updated: PoolProfile) => void;
}

export const DiagnosticWizard: React.FC<DiagnosticWizardProps> = ({
  profile,
  onUpdateProfile
}) => {
  // Wizard steps:
  // 1: Basis-info (Pool-størrelse, pumpe & filter)
  // 2: Vandets farve, symptomer & temperatur
  // 3: Desinfektion, klor & salt
  // 4: Vandmålinger (pH, klor, alkalinitet)
  // 5: Diagnose, kemiberegning & Facebook-oversigt
  const [step, setStep] = useState<number>(1);

  // Form State
  const [waterColor, setWaterColor] = useState<WaterColor>('clear');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [waterTempC, setWaterTempC] = useState<number>(24);

  // Equipment state (synced with profile or override)
  const [volumeM3, setVolumeM3] = useState<number>(profile.volumeM3 || 25);
  const [pumpType, setPumpType] = useState<PumpType>(profile.pumpType || 'standard');
  const [pumpFlowM3h, setPumpFlowM3h] = useState<number>(profile.pumpFlowM3h || 8);
  const [pumpImage, setPumpImage] = useState<string>(profile.customPumpImageUrl || '');
  const [poolWaterImage, setPoolWaterImage] = useState<string>(profile.customPoolWaterImageUrl || '');
  const [filterType, setFilterType] = useState<FilterType>(profile.filterType || 'sand_glass');
  const [filterMedia, setFilterMedia] = useState<FilterMedia>(profile.filterMedia || 'glass');
  const [filterImage, setFilterImage] = useState<string>(profile.customFilterImageUrl || '');
  const [disinfectionImage, setDisinfectionImage] = useState<string>(profile.customDisinfectionImageUrl || '');
  const [measurementImage, setMeasurementImage] = useState<string>('');

  // Sanitizer state
  const [isSaltwater, setIsSaltwater] = useState<boolean>(profile.isSaltwaterWithChlorinator || false);
  const [sanitizerType, setSanitizerType] = useState<SanitizerType>(profile.sanitizerType || 'chlorine_granulate');
  const [isStabilized, setIsStabilized] = useState<StabilizedChlorineType>(profile.isStabilizedChlorine || 'yes');
  const [saltGL, setSaltGL] = useState<number>(profile.saltGramsPerLiter || 3.5);

  // Measurements
  const [hasMeasuredPh, setHasMeasuredPh] = useState<boolean>(true);
  const [phValue, setPhValue] = useState<number>(7.6);

  const [hasMeasuredChlorine, setHasMeasuredChlorine] = useState<boolean>(true);
  const [chlorineValue, setChlorineValue] = useState<number>(0.2);

  const [hasMeasuredAlkalinity, setHasMeasuredAlkalinity] = useState<boolean>(false);
  const [alkalinityValue, setAlkalinityValue] = useState<number>(100);

  const [hasMeasuredCya, setHasMeasuredCya] = useState<boolean>(false);
  const [cyaValue, setCyaValue] = useState<number>(40);

  // Results & History status
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);

  // Facebook share state
  const [copiedFacebook, setCopiedFacebook] = useState<boolean>(false);
  const [showFacebookPreview, setShowFacebookPreview] = useState<boolean>(false);
  const [customFacebookQuestion, setCustomFacebookQuestion] = useState<string>(
    'Hvad er jeres erfaring eller bedste råd til mine målinger? På forhånd mange tak!'
  );
  const [shareUrl, setShareUrl] = useState<string>('');
  const [isCreatingShare, setIsCreatingShare] = useState<boolean>(false);
  const [shareError, setShareError] = useState<string>('');
  const [copiedShareUrl, setCopiedShareUrl] = useState<boolean>(false);

  const buildProfile = (): PoolProfile => ({
    ...profile,
    volumeM3,
    pumpType,
    pumpFlowM3h,
    customPumpImageUrl: pumpImage,
    customPoolWaterImageUrl: poolWaterImage,
    filterType,
    filterMedia,
    customFilterImageUrl: filterImage,
    customDisinfectionImageUrl: disinfectionImage,
    isSaltwaterWithChlorinator: isSaltwater,
    sanitizerType: isSaltwater ? 'saltwater' : sanitizerType,
    isStabilizedChlorine: isStabilized,
    saltGramsPerLiter: saltGL,
  });

  const buildTest = (): WaterTest => ({
    id: Date.now().toString(),
    date: new Date().toISOString(),
    ph: hasMeasuredPh ? phValue : null,
    freeChlorinePpm: hasMeasuredChlorine ? chlorineValue : null,
    alkalinityPpm: hasMeasuredAlkalinity ? alkalinityValue : null,
    cyanuricAcidPpm: hasMeasuredCya ? cyaValue : null,
    saltGramsPerLiter: isSaltwater ? saltGL : null,
    waterColor,
    waterSymptoms: symptoms,
    waterTempC,
    measurementImageUrl: measurementImage,
  });

  useEffect(() => {
    const sharedId = new URLSearchParams(window.location.search).get('diagnose');
    if (!sharedId) return;

    fetch(`/api/shared-diagnoses/${encodeURIComponent(sharedId)}`)
      .then(async response => {
        if (!response.ok) throw new Error('Delingslinket findes ikke eller er udløbet.');
        return response.json();
      })
      .then(shared => {
        const sharedProfile = shared.profile as PoolProfile;
        const sharedTest = shared.test as WaterTest;
        setVolumeM3(sharedProfile.volumeM3);
        setPumpType(sharedProfile.pumpType);
        setPumpFlowM3h(sharedProfile.pumpFlowM3h);
        setPumpImage(sharedProfile.customPumpImageUrl || '');
        setPoolWaterImage(sharedProfile.customPoolWaterImageUrl || '');
        setFilterType(sharedProfile.filterType);
        setFilterMedia(sharedProfile.filterMedia);
        setFilterImage(sharedProfile.customFilterImageUrl || '');
        setDisinfectionImage(sharedProfile.customDisinfectionImageUrl || '');
        setIsSaltwater(sharedProfile.isSaltwaterWithChlorinator);
        setSanitizerType(sharedProfile.sanitizerType);
        setIsStabilized(sharedProfile.isStabilizedChlorine);
        setSaltGL(sharedProfile.saltGramsPerLiter || 3.5);
        setWaterColor(sharedTest.waterColor);
        setSymptoms(sharedTest.waterSymptoms || []);
        setWaterTempC(sharedTest.waterTempC || 24);
        setMeasurementImage(sharedTest.measurementImageUrl || '');
        setHasMeasuredPh(sharedTest.ph !== null);
        setPhValue(sharedTest.ph ?? 7.6);
        setHasMeasuredChlorine(sharedTest.freeChlorinePpm !== null);
        setChlorineValue(sharedTest.freeChlorinePpm ?? 0.2);
        setHasMeasuredAlkalinity(sharedTest.alkalinityPpm !== null);
        setAlkalinityValue(sharedTest.alkalinityPpm ?? 100);
        setHasMeasuredCya(sharedTest.cyanuricAcidPpm !== null);
        setCyaValue(sharedTest.cyanuricAcidPpm ?? 40);
        setDiagnosticResult(shared.result as DiagnosticResult);
        setCustomFacebookQuestion(shared.facebookQuestion || '');
        setShareUrl(window.location.href);
        setStep(5);
      })
      .catch(error => setShareError(error.message));
  }, []);

  // Toggle symptom selection
  const toggleSymptom = (id: string) => {
    setSymptoms(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  // Handle pump photo upload
  const handlePumpImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPumpImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle filter photo upload
  const handleFilterImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilterImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setImage: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  // Run computation
  const handleCalculate = () => {
    const updatedProfile = buildProfile();
    onUpdateProfile(updatedProfile);
    const test = buildTest();

    const res = calculateDiagnostic(updatedProfile, test);
    setDiagnosticResult(res);
    setStep(5);
    setShareUrl('');
    setShareError('');
  };

  const handleCreateShare = async () => {
    if (!diagnosticResult) return;
    setIsCreatingShare(true);
    setShareError('');

    try {
      const response = await fetch('/api/shared-diagnoses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: buildProfile(),
          test: buildTest(),
          result: diagnosticResult,
          facebookQuestion: customFacebookQuestion,
        }),
      });
      const saved = await response.json();
      if (!response.ok) throw new Error(saved.error || 'Kunne ikke oprette delingslinket.');

      const url = `${window.location.origin}${window.location.pathname}?diagnose=${saved.id}`;
      window.history.replaceState({}, '', url);
      setShareUrl(url);
    } catch (error: any) {
      setShareError(error.message || 'Kunne ikke oprette delingslinket.');
    } finally {
      setIsCreatingShare(false);
    }
  };

  const handleCopyShareUrl = () => {
    if (!shareUrl) return;
    const copied = () => {
      setCopiedShareUrl(true);
      setTimeout(() => setCopiedShareUrl(false), 4000);
    };

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(shareUrl).then(copied).catch(() => fallbackCopy(shareUrl));
    } else {
      fallbackCopy(shareUrl);
    }
  };

  // Generate clean formatted text post for Facebook pool groups
  const generateFacebookText = (): string => {
    const colorObj = WATER_COLOR_OPTIONS.find(c => c.value === waterColor);
    const selectedSymptomsLabels = SYMPTOM_OPTIONS.filter(s => symptoms.includes(s.id)).map(s => s.label);
    const filterMediaObj = FILTER_PRESETS.find(f => f.media === filterMedia);
    const sanitizerLabel = isSaltwater
      ? `Saltvand m. klorinator (${saltGL} g/L)`
      : sanitizerType === 'chlorine_tablets'
      ? 'Klortabletter (Multi-tabs / Langsomklor)'
      : sanitizerType === 'chlorine_granulate'
      ? 'Klor-granulat (Hurtigklor / Chokklor)'
      : sanitizerType === 'liquid_chlorine'
      ? 'Flydende klor (Natriumhypoklorit)'
      : 'Klorfri / Aktivt ilt';

    const pumpLabelText = pumpType === 'unknown'
      ? `Ved ikke / Usikker ${pumpImage ? '📷 (Billede vedhæftet opslaget)' : '(Se billede i opslag)'}`
      : `~${pumpFlowM3h} m³/t`;

    const filterLabelText = filterMedia === 'unknown'
      ? `Ved ikke / Usikker ${filterImage ? '📷 (Billede af filter vedhæftet)' : '(Se billede i opslag)'}`
      : filterMediaObj?.title || 'Sand/Glasfilter';

    let text = `📋 **POOL VANDANALYSE & HJÆLP SØGES**\n\n`;
    text += `🏊‍♂️ **POOL BASIS INFO:**\n`;
    text += `• Poolstørrelse: ${volumeM3} m³ (${volumeM3 * 1000} Liter)\n`;
    text += `• Desinfektion: ${sanitizerLabel}\n`;
    text += `• Filter-medie: ${filterLabelText}\n`;
    text += `• Pumpe-kapacitet: ${pumpLabelText}\n`;
    text += `• Vandtemperatur: ${waterTempC} °C\n\n`;

    text += `💧 **MÅLT VANDKVALITET:**\n`;
    text += `• pH-værdi: ${hasMeasuredPh ? phValue.toFixed(1) : 'Ikke målt'}${hasMeasuredPh ? (phValue < 7.2 ? ' (For lav)' : phValue > 7.4 ? ' (For høj)' : ' (Ideel 7.2-7.4)') : ''}\n`;
    text += `• Frit Klor: ${hasMeasuredChlorine ? `${chlorineValue.toFixed(1)} ppm` : 'Ikke målt'}${hasMeasuredChlorine ? (chlorineValue < 1.0 ? ' (For lavt)' : chlorineValue > 2.0 ? ' (Højt)' : ' (Ideelt 1.0-2.0)') : ''}\n`;
    text += `• Alkalinitet (TA): ${hasMeasuredAlkalinity ? `${alkalinityValue} ppm` : 'Ikke målt'}\n`;
    text += `• Cyanursyre (CYA / Klorlås): ${hasMeasuredCya ? `${cyaValue} ppm ${cyaValue > 70 ? '⚠️ (KLORLÅS!)' : ''}` : 'Ikke målt'}\n\n`;

    text += `🎨 **VANDETS UDSEENDE & SYMPTOMER:**\n`;
    text += `• Farve: ${colorObj?.label || 'Klart'}\n`;
    text += `• Symptomer: ${selectedSymptomsLabels.length > 0 ? selectedSymptomsLabels.join(', ') : 'Ingen udover måling'}\n\n`;

    if (diagnosticResult) {
      text += `🧪 **POOLMASTER BEREGNET KEMI-PLAN:**\n`;
      if (diagnosticResult.chemicalActions.length === 0) {
        text += `• Ingen kemi nødvendig! Målingerne er ideelle.\n`;
      } else {
        diagnosticResult.chemicalActions.forEach((act, idx) => {
          text += `${idx + 1}. ${act.title}: Dosis ${act.doseAmount}\n`;
        });
      }
      text += `• Anbefalet pumpetid: ${diagnosticResult.recommendedPumpHours} timer/døgn\n\n`;
    }

    text += `💬 **Spørgsmål til gruppen:** ${customFacebookQuestion || 'Hvad vil I anbefale som næste skridt?'}`;
    if (shareUrl) text += `\n\n🔗 Se hele diagnosen: ${shareUrl}`;
    return text;
  };

  const handleCopyFacebook = () => {
    const text = generateFacebookText();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedFacebook(true);
        setTimeout(() => setCopiedFacebook(false), 4000);
      }).catch(() => {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  };

  const fallbackCopy = (text: string) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    setCopiedFacebook(true);
    setTimeout(() => setCopiedFacebook(false), 4000);
  };

  const selectedPump = PUMP_PRESETS.find(p => p.type === pumpType && p.flowM3h === pumpFlowM3h);
  const selectedFilter = FILTER_PRESETS.find(f => f.type === filterType && f.media === filterMedia);
  const selectedColor = WATER_COLOR_OPTIONS.find(color => color.value === waterColor);
  const selectedSymptoms = SYMPTOM_OPTIONS.filter(symptom => symptoms.includes(symptom.id));
  const sanitizerLabel = isSaltwater
    ? 'Saltvand med klorinator'
    : sanitizerType === 'chlorine_tablets'
    ? 'Klortabletter'
    : sanitizerType === 'chlorine_granulate'
    ? 'Klor-granulat'
    : sanitizerType === 'liquid_chlorine'
    ? 'Flydende klor'
    : 'Klorfri / aktivt ilt';

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      {step < 5 && (
        <div className="mb-8 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-end mb-3">
            <span className="text-xs font-bold px-3 py-1 rounded-md bg-sky-50 text-sky-700 border border-sky-200">
              Trin {step} af 4
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex border border-slate-200">
            <div
              className="bg-sky-600 h-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* STEP 1: POOL BASIS INFO & UDSTYR */}
      {step === 1 && (
        <div className="bg-white rounded-xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-slate-800 font-bold mb-1 flex items-center text-sm uppercase tracking-wide">
              <span className="w-2 h-4 bg-sky-500 rounded mr-2"></span>
              1. Basis-Info: Poolstørrelse & Udstyr
            </h2>
            <p className="text-xs text-slate-500 mb-6 pl-4">
              Start med at angive din pools vandvolumen samt filter- og pumpetype.
            </p>

            {/* Pool Volume */}
            <div className="mb-6 p-5 bg-sky-50 rounded-xl border border-sky-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="text-sm font-bold text-sky-900 block">
                    Poolens Samlede Vandvolumen (m³)
                  </label>
                  <p className="text-xs text-sky-700">
                    Brugt til præcis kemiberegning (1 m³ = 1.000 liter vand)
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    max="300"
                    value={volumeM3}
                    onChange={e => setVolumeM3(Number(e.target.value))}
                    className="w-24 px-3 py-2 bg-white border border-sky-300 rounded-lg text-center font-black text-base text-slate-800 shadow-sm"
                  />
                  <span className="text-xs font-bold text-sky-900">
                    m³ ({volumeM3 * 1000} L)
                  </span>
                </div>
              </div>

              {/* Volume Quick Presets */}
              <div className="pt-2 border-t border-sky-200/60 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-sky-800 mr-1">Hurtig-valg:</span>
                {[10, 15, 20, 25, 30, 45, 60].map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVolumeM3(v)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      volumeM3 === v
                        ? 'bg-sky-700 text-white shadow-sm'
                        : 'bg-white text-sky-800 border border-sky-200 hover:bg-sky-100'
                    }`}
                  >
                    {v} m³
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-800">Billede af pool eller vand</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Valgfrit: vis poolens udseende i den delte diagnose.</p>
                </div>
                <label className="cursor-pointer px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Upload
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, setPoolWaterImage)} />
                </label>
              </div>
              {poolWaterImage && <img src={poolWaterImage} alt="Uploadet billede af pool eller vand" className="w-full max-h-56 object-cover rounded-lg border border-slate-200" />}
            </div>

            {/* Pump & Filter Section */}
            <div className="space-y-6 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Hvilken type pumpe har du?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  {PUMP_PRESETS.map(p => {
                    const isSelected =
                      p.id === 'pump_unknown'
                        ? pumpType === 'unknown'
                        : pumpType === p.type && pumpFlowM3h === p.flowM3h;

                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          setPumpType(p.type);
                          setPumpFlowM3h(p.flowM3h);
                        }}
                        className={`p-3.5 rounded-xl border cursor-pointer transition flex space-x-3 items-center ${
                          isSelected
                            ? 'border-2 border-sky-500 bg-sky-50 shadow-sm'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-800">
                            {p.title}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {p.id === 'pump_unknown'
                              ? 'Vælg hvis du er usikker'
                              : `Kapacitet: ~${p.flowM3h} m³/time`}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Camera / Photo Upload for Pump */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                        <Camera className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">
                          {pumpType === 'unknown'
                            ? '📸 Tag et billede af din pumpe / typeplade'
                            : 'Valgfrit: Upload et billede af din pumpe'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Billedet gemmes med dine oplysninger og kan vedhæftes i Facebook-opslag
                        </div>
                      </div>
                    </div>

                    <label className="px-3 py-1.5 rounded-lg bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs cursor-pointer transition flex items-center space-x-1.5 shadow-sm">
                      <Camera className="w-3.5 h-3.5" />
                      <span>{pumpImage ? 'Skift Billede' : 'Tag / Vælg Billede'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePumpImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {pumpImage && (
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <img src={pumpImage} alt="Pumpe" className="w-12 h-12 rounded-lg object-cover border border-slate-300" />
                        <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Billede af pumpe gemt!
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPumpImage('')}
                        className="text-[11px] text-rose-600 hover:underline font-semibold"
                      >
                        Slet billede
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Filter type & media selector */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Hvilket filtermedie bruger din pool? (Glas, bolde, sand, papir)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  {FILTER_PRESETS.map(f => (
                    <div
                      key={f.media}
                      onClick={() => {
                        setFilterType(f.type);
                        setFilterMedia(f.media);
                      }}
                      className={`p-4 rounded-xl border cursor-pointer transition ${
                        filterMedia === f.media
                          ? 'border-2 border-sky-500 bg-sky-50 shadow-sm'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-slate-800">
                          {f.title}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          f.media === 'unknown'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-sky-100 text-sky-800'
                        }`}>
                          {f.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {f.description}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Camera / Photo Upload for Filter */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                        <Camera className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">
                          {filterMedia === 'unknown'
                            ? '📸 Tag et billede af dit filter / din filtertank'
                            : 'Valgfrit: Upload et billede af dit filter'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Tag et billede af tanken, ventilen eller mediet til hjælp
                        </div>
                      </div>
                    </div>

                    <label className="px-3 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs cursor-pointer transition flex items-center space-x-1.5 shadow-sm">
                      <Camera className="w-3.5 h-3.5" />
                      <span>{filterImage ? 'Skift Billede' : 'Tag / Vælg Billede'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFilterImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {filterImage && (
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <img src={filterImage} alt="Filter" className="w-12 h-12 rounded-lg object-cover border border-slate-300" />
                        <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Billede af filter gemt!
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFilterImage('')}
                        className="text-[11px] text-rose-600 hover:underline font-semibold"
                      >
                        Slet billede
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end">
            <button
              onClick={() => setStep(2)}
              className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-bold text-sm transition shadow-md"
            >
              <span>Næste: Vandets Udseende & Tilstand</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: WATER COLOR & SYMPTOMS & TEMPERATURE */}
      {step === 2 && (
        <div className="bg-white rounded-xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-slate-800 font-bold mb-1 flex items-center text-sm uppercase tracking-wide">
              <span className="w-2 h-4 bg-teal-500 rounded mr-2"></span>
              2. Vandets Udseende, Farve & Symptomer
            </h2>
            <p className="text-xs text-slate-500 mb-4 pl-4">
              Vandets farve og overflade giver direkte ledetråde om alger, jern eller kemisk ubalance.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {WATER_COLOR_OPTIONS.map(opt => (
                <div
                  key={opt.value}
                  onClick={() => setWaterColor(opt.value)}
                  className={`p-4 rounded-xl border cursor-pointer transition flex items-start space-x-3 ${
                    waterColor === opt.value
                      ? 'border-2 border-sky-500 bg-sky-50 shadow-sm'
                      : 'border-slate-200 hover:bg-slate-50 bg-white'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full mt-1 shrink-0 ${opt.dotColor}`} />
                  <div>
                    <div className="font-bold text-sm text-slate-800">
                      {opt.label}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {opt.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <h2 className="text-slate-800 font-bold mb-2 flex items-center text-sm uppercase tracking-wide">
              <span className="w-2 h-4 bg-indigo-500 rounded mr-2"></span>
              Oplever du andre symptomer eller tilstande?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SYMPTOM_OPTIONS.map(sym => (
                <label
                  key={sym.id}
                  className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer text-xs font-medium transition ${
                    symptoms.includes(sym.id)
                      ? 'bg-sky-50 border-sky-500 text-sky-900 font-bold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={symptoms.includes(sym.id)}
                    onChange={() => toggleSymptom(sym.id)}
                    className="rounded text-sky-600 focus:ring-sky-500 h-4 w-4"
                  />
                  <span>{sym.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              onClick={() => setStep(1)}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-sm transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Tilbage</span>
            </button>

            <button
              onClick={() => setStep(3)}
              className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-bold text-sm transition shadow-md"
            >
              <span>Næste: Klor & Saltvand</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: DESINFEKTION, KLOR & SALTVAND */}
      {step === 3 && (
        <div className="bg-white rounded-xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-slate-800 font-bold mb-1 flex items-center text-sm uppercase tracking-wide">
              <span className="w-2 h-4 bg-indigo-500 rounded mr-2"></span>
              3. Desinfektion & Klor-Type
            </h2>
            <p className="text-xs text-slate-500 mb-4 pl-4">
              Fortæl os om din pool bruger saltklorinator, tabletter, granulat eller klorfri midler.
            </p>

            {/* Saltwater query */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 mb-6">
              <label className="block text-sm font-bold text-slate-800 mb-2">
                Er det en saltvandspool med klorinator (saltcelle)?
              </label>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => {
                    setIsSaltwater(true);
                    setSanitizerType('saltwater');
                  }}
                  className={`flex-1 py-3 px-4 rounded-xl border text-sm font-bold transition ${
                    isSaltwater
                      ? 'border-2 border-sky-500 bg-sky-50 text-sky-900 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Ja, Saltvand m. Klorinator
                </button>

                <button
                  onClick={() => {
                    setIsSaltwater(false);
                    if (sanitizerType === 'saltwater') setSanitizerType('chlorine_granulate');
                  }}
                  className={`flex-1 py-3 px-4 rounded-xl border text-sm font-bold transition ${
                    !isSaltwater
                      ? 'border-2 border-sky-500 bg-sky-50 text-sky-900 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Nej, Almindelig Klor / Klorfri
                </button>
              </div>

              {isSaltwater && (
                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">
                    Målt saltkoncentration (hvis kendt):
                  </span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      step="0.1"
                      value={saltGL}
                      onChange={e => setSaltGL(Number(e.target.value))}
                      className="w-20 px-2 py-1 bg-white border border-slate-300 rounded font-bold text-center text-slate-800"
                    />
                    <span className="text-slate-500">g/L (promille)</span>
                  </div>
                </div>
              )}
            </div>

            {/* Chlorine Type */}
            {!isSaltwater && (
              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Hvilken type klor / desinfektion bruges primært?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: 'chlorine_tablets', label: 'Klortabletter (Langsomklor / Multi-tabs 200g)', desc: 'Lægges i skimmer eller klor-dispenser' },
                    { id: 'chlorine_granulate', label: 'Klor-granulat (Hurtigklor / Chokklor)', desc: 'Opløses i spand før tilsætning' },
                    { id: 'liquid_chlorine', label: 'Flydende klor (Natriumhypoklorit)', desc: 'Ofte med automatisk doseringsanlæg' },
                    { id: 'chlorine_free', label: 'Klorfri / Aktivt Ilt (Hydrogenperoxid)', desc: 'Skånsomt alternativ til følsom hud' },
                  ].map(item => (
                    <div
                      key={item.id}
                      onClick={() => setSanitizerType(item.id as SanitizerType)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition ${
                        sanitizerType === item.id
                          ? 'border-2 border-sky-500 bg-sky-50 shadow-sm'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-bold text-xs text-slate-800">
                        {item.label}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {item.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stabilized chlorine query */}
            <div className="p-4 bg-amber-50 rounded-xl border-l-4 border-amber-400">
              <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">
                Vigtigt spørgsmål: Bruges der STABILISERET klor?
              </label>
              <p className="text-xs text-amber-800 mb-3">
                Stabiliseret klor indeholder Cyanursyre (CYA), som beskytter kloren mod solens UV-stråler, men kan ophobes og skabe <strong>Klorlås</strong> over tid.
              </p>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'yes', label: 'Ja, Stabiliseret' },
                  { id: 'no', label: 'Nej, Ustabiliseret' },
                  { id: 'unknown', label: 'Ved ikke' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setIsStabilized(opt.id as StabilizedChlorineType)}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold transition ${
                      isStabilized === opt.id
                        ? 'border-2 border-amber-500 bg-white text-amber-900 shadow-sm'
                        : 'border-amber-200 bg-amber-100/60 text-amber-800 hover:bg-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-800">Billede af desinfektion</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Valgfrit: fx klorprodukt, saltanlæg eller doseringsudstyr.</p>
                </div>
                <label className="cursor-pointer px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Upload
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, setDisinfectionImage)} />
                </label>
              </div>
              {disinfectionImage && <img src={disinfectionImage} alt="Uploadet billede af desinfektion" className="w-full max-h-56 object-cover rounded-lg border border-slate-200" />}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              onClick={() => setStep(2)}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-sm transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Tilbage</span>
            </button>

            <button
              onClick={() => setStep(4)}
              className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-bold text-sm transition shadow-md"
            >
              <span>Næste: Vandmålinger</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: WATER TEST MEASUREMENTS */}
      {step === 4 && (
        <div className="bg-white rounded-xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-slate-800 font-bold mb-1 flex items-center text-sm uppercase tracking-wide">
              <span className="w-2 h-4 bg-rose-500 rounded mr-2"></span>
              4. Indtast dine seneste vandmålinger
            </h2>
            <p className="text-xs text-slate-500 mb-6 pl-4">
              Målinger fra teststrimler, dråbesæt eller digital fotometer giver det mest præcise resultat.
            </p>

            {/* pH Input */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={hasMeasuredPh}
                    onChange={e => setHasMeasuredPh(e.target.checked)}
                    className="rounded text-sky-600 focus:ring-sky-500 h-4 w-4"
                  />
                  <span className="font-bold text-xs uppercase tracking-wide text-slate-700">
                    pH Værdi (Ideel: 7.2 - 7.4)
                  </span>
                </div>
                {hasMeasuredPh && (
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                      phValue >= 7.2 && phValue <= 7.4
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {phValue.toFixed(1)}
                  </span>
                )}
              </div>

              {hasMeasuredPh && (
                <div className="mt-3 space-y-2">
                  <input
                    type="range"
                    min="6.2"
                    max="8.4"
                    step="0.1"
                    value={phValue}
                    onChange={e => setPhValue(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>6.2</span>
                    <span className="text-emerald-600 font-bold">7.2 - 7.4</span>
                    <span>8.4</span>
                  </div>
                </div>
              )}
            </div>

            {/* Chlorine Input */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={hasMeasuredChlorine}
                    onChange={e => setHasMeasuredChlorine(e.target.checked)}
                    className="rounded text-sky-600 focus:ring-sky-500 h-4 w-4"
                  />
                  <span className="font-bold text-xs uppercase tracking-wide text-slate-700">
                    Klor (ppm) (Ideel: 1.0 - 2.0 ppm)
                  </span>
                </div>
                {hasMeasuredChlorine && (
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                      chlorineValue >= 1.0 && chlorineValue <= 2.5
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {chlorineValue.toFixed(1)} ppm
                  </span>
                )}
              </div>

              {hasMeasuredChlorine && (
                <div className="mt-3 space-y-2">
                  <input
                    type="range"
                    min="0.0"
                    max="6.0"
                    step="0.1"
                    value={chlorineValue}
                    onChange={e => setChlorineValue(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>0.0</span>
                    <span className="text-emerald-600 font-bold">1.0 - 2.0</span>
                    <span>6.0+</span>
                  </div>
                </div>
              )}
            </div>

            {/* Alkalinity Input */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={hasMeasuredAlkalinity}
                    onChange={e => setHasMeasuredAlkalinity(e.target.checked)}
                    className="rounded text-sky-600 focus:ring-sky-500 h-4 w-4"
                  />
                  <span className="font-bold text-xs uppercase tracking-wide text-slate-700">
                    Alkalinitet (ppm) (Ideel: 80 - 120 ppm)
                  </span>
                </div>
                {hasMeasuredAlkalinity && (
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800">
                    {alkalinityValue} ppm
                  </span>
                )}
              </div>

              {hasMeasuredAlkalinity && (
                <div className="mt-3 space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="200"
                    step="5"
                    value={alkalinityValue}
                    onChange={e => setAlkalinityValue(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>0</span>
                    <span className="text-emerald-600 font-bold">80 - 120</span>
                    <span>200</span>
                  </div>
                </div>
              )}
            </div>

            {/* Cyanuric Acid (CYA) Input */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={hasMeasuredCya}
                    onChange={e => setHasMeasuredCya(e.target.checked)}
                    className="rounded text-sky-600 focus:ring-sky-500 h-4 w-4"
                  />
                  <span className="font-bold text-xs uppercase tracking-wide text-slate-700">
                    Cyanursyre (CYA) (Ideel: 30 - 50 ppm)
                  </span>
                </div>
                {hasMeasuredCya && (
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                      cyaValue > 70
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-sky-100 text-sky-800'
                    }`}
                  >
                    {cyaValue} ppm {cyaValue > 70 && '(Klorlås!)'}
                  </span>
                )}
              </div>

              {hasMeasuredCya && (
                <div className="mt-3">
                  <input
                    type="number"
                    value={cyaValue}
                    onChange={e => setCyaValue(Number(e.target.value))}
                    className="w-32 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-center text-slate-800"
                  />
                  {cyaValue > 70 && (
                    <p className="text-xs text-rose-600 font-bold mt-1">
                      Advarsel: Over 70 ppm betyder klorlås. Klor vil ikke længere desinficere.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="mt-5 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-800">Billede af vandmålinger</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Valgfrit: upload fx teststrimmel, dråbetest eller fotometer.</p>
                </div>
                <label className="cursor-pointer px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Upload
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, setMeasurementImage)} />
                </label>
              </div>
              {measurementImage && <img src={measurementImage} alt="Uploadet billede af vandmålinger" className="w-full max-h-56 object-cover rounded-lg border border-slate-200" />}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              onClick={() => setStep(3)}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-sm transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Tilbage</span>
            </button>

            <button
              onClick={handleCalculate}
              className="w-full sm:w-auto py-4 px-8 bg-sky-700 text-white rounded-xl font-bold text-base shadow-lg hover:bg-sky-800 flex items-center justify-center transition-all group"
            >
              <Sparkles className="w-5 h-5 mr-2 text-sky-200" />
              <span>Generer Opslag</span>
              <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: DIAGNOSTIC & FACEBOOK EXPORT CARD */}
      {step === 5 && diagnosticResult && (
        <div className="space-y-6">
          {/* Complete input summary */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div>
              <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Layers className="w-5 h-5 text-sky-600" />
                Dine indtastninger
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                Hele grundlaget for denne diagnose — klar til at gennemgå eller dele.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs">
                <h5 className="font-bold text-slate-800">Pool & vand</h5>
                <div className="flex justify-between gap-3"><span className="text-slate-500">Poolstørrelse</span><span className="font-semibold text-slate-800">{volumeM3} m³ ({volumeM3 * 1000} L)</span></div>
                <div className="flex justify-between gap-3"><span className="text-slate-500">Vandtemperatur</span><span className="font-semibold text-slate-800">{waterTempC} °C</span></div>
                <div className="flex justify-between gap-3"><span className="text-slate-500">Vandets udseende</span><span className="font-semibold text-slate-800 text-right">{selectedColor?.label || 'Ikke angivet'}</span></div>
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-500 block mb-1">Symptomer</span>
                  <span className="font-semibold text-slate-800">{selectedSymptoms.length ? selectedSymptoms.map(symptom => symptom.label).join(', ') : 'Ingen angivet'}</span>
                </div>
                {poolWaterImage && <img src={poolWaterImage} alt="Uploadet billede af pool eller vand" className="w-full h-40 object-cover rounded-lg border border-slate-200 mt-3" />}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs">
                <h5 className="font-bold text-slate-800">Desinfektion</h5>
                <div className="flex justify-between gap-3"><span className="text-slate-500">Metode</span><span className="font-semibold text-slate-800 text-right">{sanitizerLabel}</span></div>
                {isSaltwater && <div className="flex justify-between gap-3"><span className="text-slate-500">Saltindhold</span><span className="font-semibold text-slate-800">{saltGL} g/L</span></div>}
                <div className="flex justify-between gap-3"><span className="text-slate-500">Stabiliseret klor</span><span className="font-semibold text-slate-800">{isStabilized === 'yes' ? 'Ja' : isStabilized === 'no' ? 'Nej' : 'Ukendt'}</span></div>
                {disinfectionImage && <img src={disinfectionImage} alt="Uploadet billede af desinfektion" className="w-full h-40 object-cover rounded-lg border border-slate-200 mt-3" />}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs">
                <h5 className="font-bold text-slate-800">Pumpe</h5>
                <div className="flex justify-between gap-3"><span className="text-slate-500">Type</span><span className="font-semibold text-slate-800 text-right">{selectedPump?.title || (pumpType === 'unknown' ? 'Ukendt' : pumpType)}</span></div>
                <div className="flex justify-between gap-3"><span className="text-slate-500">Kapacitet</span><span className="font-semibold text-slate-800">{pumpFlowM3h} m³/t</span></div>
                {pumpImage && <img src={pumpImage} alt="Uploadet billede af pumpe" className="w-full h-40 object-cover rounded-lg border border-slate-200 mt-3" />}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs">
                <h5 className="font-bold text-slate-800">Filter</h5>
                <div className="flex justify-between gap-3"><span className="text-slate-500">Filtertype</span><span className="font-semibold text-slate-800 text-right">{selectedFilter?.title || 'Ukendt'}</span></div>
                <div className="flex justify-between gap-3"><span className="text-slate-500">Filtermedie</span><span className="font-semibold text-slate-800">{selectedFilter?.badge || filterMedia}</span></div>
                {filterImage && <img src={filterImage} alt="Uploadet billede af filter" className="w-full h-40 object-cover rounded-lg border border-slate-200 mt-3" />}
              </div>
            </div>

            <div className="rounded-xl border border-sky-100 bg-sky-50 p-4">
              <h5 className="font-bold text-sky-950 text-sm mb-3">Vandmålinger</h5>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div><span className="text-slate-500 block">pH</span><span className="font-bold text-slate-800">{hasMeasuredPh ? phValue.toFixed(1) : 'Ikke målt'}</span></div>
                <div><span className="text-slate-500 block">Frit klor</span><span className="font-bold text-slate-800">{hasMeasuredChlorine ? `${chlorineValue.toFixed(1)} ppm` : 'Ikke målt'}</span></div>
                <div><span className="text-slate-500 block">Alkalinitet</span><span className="font-bold text-slate-800">{hasMeasuredAlkalinity ? `${alkalinityValue} ppm` : 'Ikke målt'}</span></div>
                <div><span className="text-slate-500 block">Cyanursyre</span><span className="font-bold text-slate-800">{hasMeasuredCya ? `${cyaValue} ppm` : 'Ikke målt'}</span></div>
              </div>
              {measurementImage && <img src={measurementImage} alt="Uploadet billede af vandmålinger" className="w-full max-h-64 object-cover rounded-lg border border-sky-200 mt-4" />}
            </div>
          </div>

          {/* Permanent share link */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-sky-600" />
                  Gem og del diagnosen
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  Opret et permanent link med et unikt ID, som kan indsættes i fx Facebook.
                </p>
              </div>
              {!shareUrl && (
                <button
                  onClick={handleCreateShare}
                  disabled={isCreatingShare}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-sky-700 hover:bg-sky-800 disabled:bg-sky-300 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{isCreatingShare ? 'Gemmer...' : 'Gem & få delingslink'}</span>
                </button>
              )}
            </div>

            <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3">
              Af hensyn til privatliv slettes den gemte diagnose, inklusive eventuelle billeder, automatisk 14 dage efter oprettelsen.
            </p>

            {shareError && (
              <p className="text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">
                {shareError}
              </p>
            )}

            {shareUrl && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 space-y-2">
                <p className="text-xs font-bold text-emerald-900">Dit delingslink er klar</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    readOnly
                    value={shareUrl}
                    aria-label="Delingslink"
                    className="min-w-0 flex-1 px-3 py-2 rounded-lg border border-emerald-200 bg-white text-xs text-slate-700"
                  />
                  <button
                    onClick={handleCopyShareUrl}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2"
                  >
                    {copiedShareUrl ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedShareUrl ? 'Kopieret' : 'Kopiér link'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Critical Warnings */}
          {diagnosticResult.warnings.length > 0 && (
            <div className="p-5 bg-rose-50 border border-rose-200 rounded-xl">
              <h4 className="text-sm font-bold text-rose-900 flex items-center gap-2 mb-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                Vigtige Advarsler & Bemærkninger
              </h4>
              <ul className="space-y-2">
                {diagnosticResult.warnings.map((warn, i) => (
                  <li key={i} className="text-xs text-rose-800 font-medium flex items-start space-x-2">
                    <span className="text-rose-600">•</span>
                    <span>{warn}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
