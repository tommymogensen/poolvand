import express from 'express';
import path from 'path';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;
const sharedDiagnosesFile = path.join(process.env.DATA_DIR || path.join(process.cwd(), 'data'), 'shared-diagnoses.json');
const sharedDiagnosisLifetimeMs = 14 * 24 * 60 * 60 * 1000;

app.use(express.json({ limit: '20mb' }));

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

type SharedDiagnosis = {
  id: string;
  createdAt: string;
  profile: unknown;
  test: unknown;
  result: unknown;
  facebookQuestion?: string;
};

async function readSharedDiagnoses(): Promise<SharedDiagnosis[]> {
  try {
    const contents = await fs.readFile(sharedDiagnosesFile, 'utf8');
    const records = JSON.parse(contents);
    if (!Array.isArray(records)) return [];

    const now = Date.now();
    const activeRecords = records.filter(record => {
      const createdAt = Date.parse(record.createdAt);
      return Number.isFinite(createdAt) && now - createdAt < sharedDiagnosisLifetimeMs;
    });

    if (activeRecords.length !== records.length) {
      await writeSharedDiagnoses(activeRecords);
    }

    return activeRecords;
  } catch (error: any) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
}

async function writeSharedDiagnoses(records: SharedDiagnosis[]) {
  await fs.mkdir(path.dirname(sharedDiagnosesFile), { recursive: true });
  const temporaryFile = `${sharedDiagnosesFile}.tmp`;
  await fs.writeFile(temporaryFile, JSON.stringify(records), 'utf8');
  await fs.rename(temporaryFile, sharedDiagnosesFile);
}

const cleanupSharedDiagnoses = () => {
  readSharedDiagnoses().catch(error => console.error('Unable to remove expired shared diagnoses:', error));
};

cleanupSharedDiagnoses();
setInterval(cleanupSharedDiagnoses, 60 * 60 * 1000).unref();

app.post('/api/shared-diagnoses', async (req, res) => {
  const { profile, test, result, facebookQuestion } = req.body || {};

  if (!profile || !test || !result || typeof profile !== 'object' || typeof test !== 'object' || typeof result !== 'object') {
    return res.status(400).json({ error: 'Diagnosen mangler nødvendige oplysninger.' });
  }

  try {
    const diagnosis: SharedDiagnosis = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      profile,
      test,
      result,
      facebookQuestion: typeof facebookQuestion === 'string' ? facebookQuestion.slice(0, 1000) : undefined,
    };
    const records = await readSharedDiagnoses();
    records.unshift(diagnosis);
    await writeSharedDiagnoses(records);
    res.status(201).json({ id: diagnosis.id, createdAt: diagnosis.createdAt });
  } catch (error) {
    console.error('Unable to save shared diagnosis:', error);
    res.status(500).json({ error: 'Kunne ikke gemme diagnosen.' });
  }
});

app.get('/api/admin/sessions', async (req, res) => {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const suppliedPassword = req.header('x-admin-password');

  if (!adminPassword) {
    return res.status(503).json({ error: 'Admin-siden er ikke konfigureret. Sæt ADMIN_PASSWORD som miljøvariabel.' });
  }

  if (suppliedPassword !== adminPassword) {
    return res.status(401).json({ error: 'Forkert adgangskode.' });
  }

  try {
    const sessions = await readSharedDiagnoses();
    res.json({
      sessions: sessions.map(session => {
        const profile = session.profile as Record<string, unknown>;
        const test = session.test as Record<string, unknown>;
        const result = session.result as Record<string, unknown>;

        return {
          id: session.id,
          createdAt: session.createdAt,
          volumeM3: profile.volumeM3 ?? null,
          sanitizerType: profile.sanitizerType ?? null,
          waterColor: test.waterColor ?? null,
          ph: test.ph ?? null,
          freeChlorinePpm: test.freeChlorinePpm ?? null,
          status: result.status ?? null,
        };
      }),
    });
  } catch (error) {
    console.error('Unable to list shared diagnoses:', error);
    res.status(500).json({ error: 'Kunne ikke hente sessionerne.' });
  }
});

app.get('/api/shared-diagnoses/:id', async (req, res) => {
  try {
    const diagnosis = (await readSharedDiagnoses()).find(record => record.id === req.params.id);
    if (!diagnosis) return res.status(404).json({ error: 'Diagnosen blev ikke fundet.' });
    res.json(diagnosis);
  } catch (error) {
    console.error('Unable to load shared diagnosis:', error);
    res.status(500).json({ error: 'Kunne ikke hente diagnosen.' });
  }
});

function extractReplyText(payload: any): string {
  const choiceContent = payload?.choices?.[0]?.message?.content;

  if (typeof choiceContent === 'string' && choiceContent.trim()) {
    return choiceContent;
  }

  if (Array.isArray(choiceContent)) {
    const textParts = choiceContent
      .filter((part: any) => part?.type === 'text' && typeof part.text === 'string')
      .map((part: any) => part.text.trim())
      .filter(Boolean);

    if (textParts.length > 0) {
      return textParts.join('\n\n');
    }
  }

  const outputText = payload?.output_text;
  if (typeof outputText === 'string' && outputText.trim()) {
    return outputText;
  }

  return '';
}

// AI Pool Doctor endpoint
app.post('/api/pool-doctor', async (req, res) => {
  try {
    const { prompt, imageBase64, poolProfile, waterTest } = req.body;

    const apiKey = process.env.AI_API_KEY;
    const apiUrl = process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions';
    const aiModel = process.env.AI_MODEL || 'gpt-4o-mini';

    if (!apiKey) {
      return res.status(500).json({
        error: 'AI_API_KEY er ikke konfigureret i miljøvariablerne.',
      });
    }

    const systemInstruction = `
Du er 'Pool-Doktoren', en erfaren og certificeret specialist i svømmebassin-kemi, vandpleje, pumper og filteranlæg.
Du hjælper pool-ejere med at diagnosticere deres poolvand, læse målestrimler/test-sæt, og identificere pumper, filtre og mekaniske problemer.

Svar altid på professionelt, venligt og lettilgængeligt DANSK.
Brug pæne overskrifter, punktopstillinger og fremhæv vigtige tal (f.eks. gram klor, pH-værdier og driftstimer).

Husk særligt disse vigtige faglige principper:
1. pH-skal altid være i intervallet 7,2 - 7,4 før kloring har optimal effekt.
2. Frit klor bør være 1,0 - 2,0 ppm (eller op til 5,0-10 ppm ved chokklorering mod alger).
3. Hvis der er målt Cyanursyre (stabilisator) over 70 ppm, er der Klorlås (vandet skal delvist udskiftes, da klor mister sin virkning).
4. Filterbolde (Aqualoon) må ALDRIG bruges med flydende flokningsmiddel / klaring (da det klumper boldene sammen). De skal vaskes i vaskemaskine ved 30°C.
5. Ved saltklorinator skal saltindholdet typisk være 3,0 - 4,0 g/l (3000-4000 ppm).
6. Hvis brugeren uploader et billede af en teststrimmel, skal du forsøge at aflæse farvefelterne for pH, Klor, Alkalinitet og CYA så præcist som muligt.
7. Hvis brugeren uploader et billede af en pumpe eller et filter, skal du identificere typen (cirkulationspumpe, patronfilter, sandfiltertank osv.) og give praktiske råd til tryk, returskyl og vedligeholdelse.
`;

    const userContextStr = `
POOL PROFIL:
- Pool Volumen: ${poolProfile?.volumeM3 || 25} m³ (${(poolProfile?.volumeM3 || 25) * 1000} Liter)
- Desinfektion: ${poolProfile?.sanitizerType || 'klor'} (Saltklorinator: ${poolProfile?.isSaltwaterWithChlorinator ? 'Ja' : 'Nej'})
- Stabiliseret klor: ${poolProfile?.isStabilizedChlorine || 'Ukendt'}
- Pumpe: ${poolProfile?.pumpName || poolProfile?.pumpType || 'Standard'} (Kapacitet: ${poolProfile?.pumpFlowM3h || 8} m³/t)
- Filter: ${poolProfile?.filterType || 'sand_glass'} med medie: ${poolProfile?.filterMedia || 'glas'}

SENE MÅLINGER:
- Vandfarve: ${waterTest?.waterColor || 'Ukendt'}
- pH: ${waterTest?.ph ?? 'Ikke målt'}
- Frit klor: ${waterTest?.freeChlorinePpm ?? 'Ikke målt'} ppm
- Alkalinitet: ${waterTest?.alkalinityPpm ?? 'Ikke målt'} ppm
- Cyanursyre: ${waterTest?.cyanuricAcidPpm ?? 'Ikke målt'} ppm
- Symptomer: ${waterTest?.waterSymptoms?.join(', ') || 'Ingen angivet'}

SPØRGSMÅL FRA BRUGEREN:
${prompt || 'Giv mig en vurdering af mit poolvand og udstyr baseret på oplysningerne.'}
`;

    let userContent: any;

    if (imageBase64) {
      const match = imageBase64.match(/^data:(image\/\w+);base64,(.+)$/);
      const mimeType = match ? match[1] : 'image/jpeg';
      const cleanData = match ? match[2] : imageBase64;

      userContent = [
        {
          type: 'text',
          text: userContextStr,
        },
        {
          type: 'image_url',
          image_url: {
            url: `data:${mimeType};base64,${cleanData}`,
          },
        },
      ];
    } else {
      userContent = userContextStr;
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: aiModel,
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content: systemInstruction,
          },
          {
            role: 'user',
            content: userContent,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return res.status(502).json({
        error: 'AI-tjenesten returnerede en fejl.',
        details: errorBody || response.statusText,
      });
    }

    const data = await response.json();

    const replyText = extractReplyText(data) || 'Beklager, kunne ikke generere analyse.';

    res.json({ answer: replyText });
  } catch (err: any) {
    console.error('Error in /api/pool-doctor:', err);
    res.status(500).json({
      error: 'Fejl under behandling af pool-analyse.',
      details: err?.message || String(err),
    });
  }
});

async function startServer() {
  const listenPort = Number(process.env.PORT || PORT);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(listenPort, '0.0.0.0', () => {
    console.log(`PoolVand Hjaelper server koerer paa http://localhost:${listenPort}`);
  });
}

startServer();
