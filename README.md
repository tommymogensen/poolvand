# PoolVand Hjaelper

Webapp til poolvands-diagnose, kemi-beregning og AI-baseret raadgivning.

## Lokal udvikling

Forudsætninger: Node.js 20+

1. Installer afhaengigheder:
   npm install
2. Opret [.env.local](.env.local) fra [.env.example](.env.example)
3. Udfyld mindst:
   AI_API_KEY
4. Start appen:
   npm run dev

## Produktion lokalt

1. Byg appen:
   npm run build
2. Start serveren:
   npm start

## Deploy til CapRover

Projektet indeholder nu:

- captain-definition
- Dockerfile
- .dockerignore

Deploy:

1. Push koden til dit repo.
2. Opret en ny app i CapRover.
3. Vaelg deploy via Git eller tar/zip upload.
4. Saet miljoevariabler i CapRover app config:
   AI_API_KEY (paakraevet)
   AI_API_URL (valgfri)
   AI_MODEL (valgfri)
5. Deploy appen.

### Admin-side

Sæt miljøvariablen `ADMIN_PASSWORD` og gå derefter til `/admin`. Her kan du se alle gemte, delbare diagnoser fra de seneste 14 dage. Siden er beskyttet af adgangskoden og viser kun et kort overblik; hver session kan åbnes i en ny fane.

Appen bruger PORT fra miljoevariabler automatisk (CapRover-kompatibelt).

### Delbare diagnoser

Resultatsiden kan gemme en diagnose og oprette et unikt delingslink, som kan indsættes i fx et Facebook-opslag. I CapRover skal du oprette en persistent mappe, der mapper `/app/data` i containeren, så links fortsat virker efter nye deploys.
