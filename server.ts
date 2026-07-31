import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '20mb' }));

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
