import {
  PoolProfile,
  WaterTest,
  DiagnosticResult,
  ChemicalAction,
} from '../types';

export function calculateDiagnostic(
  profile: PoolProfile,
  test: WaterTest
): DiagnosticResult {
  const vol = Math.max(1, profile.volumeM3 || 25);
  const actions: ChemicalAction[] = [];
  const warnings: string[] = [];
  const filterAndPumpAdvice: string[] = [];

  // Recommended pump running time
  const waterTemp = test.waterTempC ?? 22;
  let recommendedPumpHours = Math.min(24, Math.max(8, Math.round(waterTemp / 2) + 2));
  if (test.waterColor !== 'clear') {
    recommendedPumpHours = 24; // Continuous filtration for compromised water
  }

  // 1. Water Color Analysis & Immediate Steps
  let colorTitle = 'Klart og sundt poolvand';
  let colorDesc = 'Vandet fremstår klart uden tegn på algevækst eller urenheder.';
  let colorCauses: string[] = [];
  let colorImmediateAction: string[] = [];

  switch (test.waterColor) {
    case 'green_algae':
      colorTitle = 'Grønt / Algepræget vand';
      colorDesc = 'Grønt vand skyldes algevækst. Dette opstår typisk ved for lavt frit klor, høj temperatur eller ubalance i pH.';
      colorCauses = [
        'Manglende eller nedbrudt klor i vandet',
        'pH-værdi uden for intervallet 7,2 - 7,4 (for højt pH hæmmer klorens virkning)',
        'Høj Cyanursyre (Klorlås)',
        'For kort filtrationstid på pumpen'
      ];
      colorImmediateAction = [
        'Justér pH til præcis 7,2 først!',
        'Udfør en kraftig chokklorering',
        'Lad pumpen køre uafbrudt i 24 timer',
        'Udfør returskyl eller vask af filtermedie'
      ];
      break;

    case 'milky_cloudy':
      colorTitle = 'Mælkehvidt / Tåget vand';
      colorDesc = 'Uklart vand skyldes ophobning af mikroskopiske partikler, høj alkalinitet eller manglende filtrering.';
      colorCauses = [
        'Organiske partikler og mikroskopisk snavs',
        'Høj pH eller høj alkalinitet (kalkudfældning)',
        'Brug af klorfri midler uden tilstrækkelig filtrering'
      ];
      colorImmediateAction = [
        'Tjek og korrigér pH til 7,2',
        'Kør pumpen kontinuerligt i 24-48 timer',
        profile.filterMedia === 'filterballs'
          ? 'Rens dine filterbolde grundigt i vaskemaskine'
          : 'Tilsæt flokningsmiddel (eller flokningspude i skimmer) og foretag returskyl'
      ];
      break;

    case 'brown_iron':
      colorTitle = 'Brunt / Rødbrunt / Rustfarvet vand';
      colorDesc = 'Brunt eller rødligt vand skyldes jern eller mangan i vandet, typisk fra egen boring eller ældre jernrør.';
      colorCauses = [
        'Ophobning af udskilt jern/mangan efter kloring af grundvand',
        'Rørkorrosion'
      ];
      colorImmediateAction = [
        'Tilsæt metalsamler / metallisk binding (Sequestering agent)',
        'Chokklorér for at udfælde jernet fuldstændigt',
        'Lad filteret opfange jernpartiklerne og lav hyppige returskyl eller rengøring af patron',
        'Brug ascorbinsyre (C-vitamin) til genstridige pletter på pooldugen'
      ];
      break;

    case 'yellow_mustard':
      colorTitle = 'Gult / Sennepsfarvede alger';
      colorDesc = 'Sennepsalger sætter sig som et fint gult støv på bund og vægge. De er modstandsdygtige over for almindelige klorniveauer.';
      colorCauses = [
        'Gule klor-resistente alger'
      ];
      colorImmediateAction = [
        'Børst vægge og bund grundigt igennem',
        'Super-chokklorér (3x normal dosis)',
        'Rengør alt pooludstyr, legetøj og slanger med kloropløsning'
      ];
      break;

    case 'purple_copper':
      colorTitle = 'Lilla / Mørkt kobberholdigt vand';
      colorDesc = 'Mørkt eller lilla vand indikerer højt kobberindhold, ofte fra kobberbaserede algefjernere eller varmevekslere.';
      colorCauses = [
        'Overdosering af kobberholdig algefjerner',
        'Tæring af kobberkomponenter i opvarmningsanlæg'
      ];
      colorImmediateAction = [
        'Mål kobberindhold og udskift delvist vandet',
        'Tilsæt metal-out / metalfjerner',
        'Undgå kobberbaserede algicider fremover'
      ];
      break;
  }

  // 2. Symptoms Analysis
  if (test.waterSymptoms.includes('slimy_walls')) {
    warnings.push('Glatte eller slibrige vægge er et tidligt tegn på algevækst. Børst væggene grundigt før kemibehandling.');
  }
  if (test.waterSymptoms.includes('chlorine_smell') || test.waterSymptoms.includes('eye_irritation')) {
    warnings.push('Stærk klorlugt eller svie i øjnene skyldes BUNDET KLOR (kloraminer), ikkeproduktivt frit klor. En chokklorering er påkrævet for at nedbryde kloraminerne (break-point chlorination).');
  }

  // 3. pH Analysis & Dosage
  if (test.ph !== null) {
    if (test.ph > 7.6) {
      const diff = test.ph - 7.2;
      // Approx 10g pH Minus per m3 per 0.1 pH decrease
      const doseGrams = Math.round(vol * diff * 10 * 10);
      actions.push({
        chemical: 'ph_minus',
        title: 'pH-Minus Granulat',
        doseAmount: `${doseGrams} g`,
        instructions: `Opløs ${doseGrams}g pH-Minus i en spand poolvand og fordél det langs kanten med pumpen igang. Sænker pH med ${diff.toFixed(1)} til målværdi 7,2.`,
        priority: test.ph > 7.8 ? 'high' : 'medium',
      });
    } else if (test.ph < 7.0) {
      const diff = 7.2 - test.ph;
      // Approx 10g pH Plus per m3 per 0.1 pH increase
      const doseGrams = Math.round(vol * diff * 10 * 10);
      actions.push({
        chemical: 'ph_plus',
        title: 'pH-Plus Granulat',
        doseAmount: `${doseGrams} g`,
        instructions: `Opløs ${doseGrams}g pH-Plus i en spand varmt vand og hæld det foran indløbsdyserne. Hæver pH med ${diff.toFixed(1)} til målværdi 7,2.`,
        priority: test.ph < 6.8 ? 'high' : 'medium',
      });
    }
  }

  // 4. Chlorine / Sanitizer Analysis
  const fc = test.freeChlorinePpm;
  if (fc !== null) {
    if (test.waterColor === 'green_algae' || test.waterColor === 'yellow_mustard' || (fc < 0.5 && !profile.isSaltwaterWithChlorinator)) {
      // Need Shock Chlorine
      const targetPpm = test.waterColor === 'green_algae' ? 10 : 3;
      const currentPpm = fc;
      const neededPpm = Math.max(2, targetPpm - currentPpm);
      // Approx 1.5g chlorine shock granulate per m3 to raise 1 ppm
      const shockGrams = Math.round(vol * neededPpm * 1.5);
      
      actions.push({
        chemical: 'chlorine_shock',
        title: 'Chokklorering (Hurtigklor Granulat)',
        doseAmount: `${shockGrams} g`,
        instructions: `Opløs ${shockGrams}g chokklor i en spand vand og hæld jævnt i poolen. Lad pumpen køre kontinuerligt. Badning frarådes indtil klor falder under 3 ppm.`,
        priority: 'high',
      });
    } else if (fc < 1.0 && profile.isSaltwaterWithChlorinator) {
      actions.push({
        chemical: 'chlorine_shock',
        title: 'Saltklorinator Boost / Chok',
        doseAmount: 'Aktiver BOOST-funktion',
        instructions: `Sæt din saltklorinator på 'Boost' eller 'Super-chlorinate' i 24 timer, eller tilsæt ${Math.round(vol * 3)}g chokklor manuelt.`,
        priority: 'medium',
      });
    } else if (fc > 4.0) {
      warnings.push(`Klorindholdet er højt (${fc} ppm). Stop tilførsel af klor og lad sollys/UV nedbryde det naturligt før badning.`);
    }
  }

  // 5. Saltwater check
  if (profile.isSaltwaterWithChlorinator) {
    const targetSalt = profile.saltGramsPerLiter || 3.5;
    const currentSalt = test.saltGramsPerLiter ?? null;
    if (currentSalt !== null && currentSalt < targetSalt) {
      const diffG = targetSalt - currentSalt;
      const neededKg = Math.round(vol * diffG);
      actions.push({
        chemical: 'salt',
        title: 'Poolsalt (Uden jod)',
        doseAmount: `${neededKg} kg`,
        instructions: `Hæld ${neededKg} kg ren poolsalt direkte i poolen (ikke i skimmeren). Børst bunden indtil salten er helt opløst før du starter klorinatoren.`,
        priority: 'medium',
      });
    }
  }

  // 6. Alkalinity (TA) Analysis
  if (test.alkalinityPpm !== null) {
    if (test.alkalinityPpm < 80) {
      const diff = 100 - test.alkalinityPpm;
      // Approx 18g Alka-Plus per m3 to raise TA by 10 ppm
      const alkaGrams = Math.round((vol * diff * 18) / 10);
      actions.push({
        chemical: 'alka_plus',
        title: 'Alka Plus (Alkalinitet-Forøger)',
        doseAmount: `${alkaGrams} g`,
        instructions: `Opløs ${alkaGrams}g Alka Plus i vand og tilsæt over 2-3 omgange. Stabiliserer pH-værdien og forhindrer pH-udsving.`,
        priority: 'medium',
      });
    } else if (test.alkalinityPpm > 150) {
      warnings.push(`Alkaliniteten er høj (${test.alkalinityPpm} ppm). Dette kan gøre det svært at sænke pH. Sænk pH gradvist med pH-Minus i små portioner foran indløbsdysen.`);
    }
  }

  // 7. Cyanuric Acid (CYA / Klorlås warning!)
  if (test.cyanuricAcidPpm !== null) {
    if (test.cyanuricAcidPpm > 70) {
      warnings.push(`CRITICAL: KLORLÅS DEKTEKTERET! Cyanursyre (stabilisator) er på ${test.cyanuricAcidPpm} ppm (grænse er 50 ppm). Klor kan ikke længere desinficere vandet uanset hvor meget klor du tilsætter!`);
      const replacePercent = Math.min(60, Math.round(((test.cyanuricAcidPpm - 40) / test.cyanuricAcidPpm) * 100));
      actions.push({
        chemical: 'water_change',
        title: 'Delvis Vandudskiftning (Klorlås løsning)',
        doseAmount: `Tøm ca. ${replacePercent}% af vandet (${Math.round((vol * replacePercent) / 100)} m³)`,
        instructions: `Cyanursyre kan ikkefjernes kemisk. Tøm ca. ${replacePercent}% af poolens vand ud og fyld op med friskt postevand. Skift fremover til ustabiliseret klor (Calciumhypoklorit) eller flydende klor.`,
        priority: 'high',
      });
    } else if (test.cyanuricAcidPpm > 50) {
      warnings.push(`Høj Cyanursyre (${test.cyanuricAcidPpm} ppm). Du er tæt på klorlås. Undgå at bruge flere multilange klortabletter med stabilisator.`);
    }
  }

  // 8. Filter Media Specific Guidance
  switch (profile.filterMedia) {
    case 'filterballs':
      filterAndPumpAdvice.push('EFILTERBOLDE RÅD: Brug ALDRIG flydende flokningsmiddel eller flokningspuder i skimmeren med filterbolde! Flokningsmiddel limer boldene sammen og ødelægger filtreringen. Vask filterboldene i vaskemaskine ved 30°C (uden sæbe) eller skyl dem grundigt i en spand.');
      filterAndPumpAdvice.push('Bemærk: Man kan ikkereturskylle (backwash) filterbolde effektivt via 6-vejs ventilen. Snavs skal fjernes manuelt.');
      break;

    case 'sand':
      filterAndPumpAdvice.push('FILTERSAND RÅD: Foretag et 3 minutters returskyl (Backwash) indtil skueglasset er helt klart, efterfulgt af 1 minuts skyl (Rinse) for at sætte sandet.');
      filterAndPumpAdvice.push('Ombytning af sand anbefales hvert 3.-5. år da sandkornene slibes runde over tid.');
      break;

    case 'glass':
      filterAndPumpAdvice.push('FILTERGLAS RÅD: Filterglas modstår bakteriefilm betydeligt bedre end sand. Udfør et hurtigt 2 minutters returskyl.');
      break;

    case 'paper_cartridge':
      filterAndPumpAdvice.push('PATRONFILTER RÅD: Tag papirpatronen ud og skyl alle folder grundigt med en kraftig stråle fra haveslangen. Læg i patronrens/afkalker én gang om måneden.');
      break;
  }

  // Pump capacity calculation check
  const totalVolumeToTurnover = vol * 2; // Recommended turnover 2-3x volume per day
  const dailyPumpOutputM3 = profile.pumpFlowM3h * recommendedPumpHours;
  if (dailyPumpOutputM3 < totalVolumeToTurnover) {
    filterAndPumpAdvice.push(`PUMPETID ADVARSEL: Din pumpe (${profile.pumpFlowM3h} m³/t) kører ${recommendedPumpHours}t/døgn = ${dailyPumpOutputM3} m³. For din pool på ${vol} m³ anbefales minimum ${totalVolumeToTurnover} m³ filtrering pr. døgn. Øg pumpetiden til mindst ${Math.ceil(totalVolumeToTurnover / profile.pumpFlowM3h)} timer.`);
  } else {
    filterAndPumpAdvice.push(`PUMPE STATUS: Din pumpe giver ${dailyPumpOutputM3} m³ filtrering pr. døgn ved ${recommendedPumpHours} timers kørsel, hvilket er optimalt for din pool på ${vol} m³.`);
  }

  // Overall status evaluation
  let status: DiagnosticResult['status'] = 'perfect';
  if (test.waterColor !== 'clear' || (test.cyanuricAcidPpm && test.cyanuricAcidPpm > 70)) {
    status = 'critical';
  } else if (actions.some(a => a.priority === 'high') || warnings.length > 0) {
    status = 'action_required';
  } else if (actions.length > 0) {
    status = 'warning';
  }

  const summary = status === 'perfect' 
    ? 'Dine vandværdier er i balance og poolvandet fremstår sundt og rent!'
    : status === 'critical'
    ? 'Poolvandet kræver akut handling! Følg nedenstående chokbehandling og filtreringsinstruktioner.'
    : 'Der er behov for et par kemiske justeringer for at bringe vandet i perfekt balance.';

  return {
    status,
    summary,
    waterColorAnalysis: {
      title: colorTitle,
      description: colorDesc,
      causes: colorCauses,
      immediateAction: colorImmediateAction,
    },
    chemicalActions: actions,
    filterAndPumpAdvice,
    warnings,
    recommendedPumpHours,
  };
}
