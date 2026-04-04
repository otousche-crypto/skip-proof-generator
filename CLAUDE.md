@AGENTS.md

# Skip Proof Generator

App web pour composer des boucles audio "skip-proof" de **1818ms** destinées à être gravées sur vinyle pour le DJing (scratch). L'utilisateur assemble des samples sur une timeline, ajuste le pitch, et exporte en MP3.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript 5**
- **Zustand 5** pour le state management
- **Tailwind CSS 4** (via PostCSS, config inline dans `globals.css`)
- **lamejs** pour l'export MP3
- **Web Audio API** pour la lecture et le preview des samples

## Commandes

```bash
npm run dev     # Serveur de développement
npm run build   # Build production
npm run start   # Serveur production
npm run lint    # ESLint (Next.js core-web-vitals + TypeScript)
```

## Architecture

```
src/
├── app/
│   ├── page.tsx          # Page unique (SPA), orchestre tous les composants
│   ├── layout.tsx         # Layout racine (Inter + JetBrains Mono)
│   └── globals.css        # Variables CSS custom + theme Tailwind inline
├── components/
│   ├── SampleLibrary.tsx  # Sidebar : liste des samples par catégorie
│   ├── Waveform.tsx       # Timeline visuelle des samples placés
│   ├── WaveformToolbar.tsx # Contrôles play/pause/stop + snap + loop mode
│   ├── VinylDisk.tsx      # Vinyle animé (rotation pendant la lecture)
│   ├── PitchControl.tsx   # Contrôle de pitch par sample + master pitch
│   ├── ExportButton.tsx   # Export de la composition en MP3
│   └── Transport.tsx      # (Contrôles de transport)
├── hooks/
│   ├── useAudioEngine.ts  # Lecture audio (Web Audio API), loop, pause/resume
│   └── useSamples.ts      # Chargement des samples depuis /samples/samples.json
├── store/
│   └── composition.ts     # Store Zustand : composition, snap, BPM, pitch
└── types/
    ├── index.ts           # Types métier : Sample, PlacedSample, Composition
    └── lamejs.d.ts        # Déclarations de types pour lamejs
```

## Concepts métier

- **Skip-proof** : boucle audio de durée fixe (1818ms) conçue pour tourner en boucle sur un vinyle sans saut d'aiguille
- **Composition** : séquence de `PlacedSample` positionnés sur une timeline de 1818ms
- **PlacedSample** : instance d'un sample placé à `startMs` avec un `pitch` (affecte la durée : `durationMs = originalDuration / pitch`)
- **Catégories de samples** : Classic FX, Sentences, Words
- **Loop modes** : 2bars (133⅓ BPM), 3bars (100 BPM), 4bars (66⅔ BPM)
- **Snap magnétique** : accrochage aux demi-temps avec seuil de 8% (`snapToGrid` dans composition.ts)
- **Résolution d'overlaps** : déplacement automatique des samples voisins pour éviter les chevauchements

## Conventions

- Path alias `@/*` → `./src/*`
- Dark theme uniquement (variables CSS dans `:root` de globals.css)
- Couleurs d'accent : orange `#FF6B00` et violet `#7C3AED`
- Composants client uniquement (`"use client"`) — pas de RSC
- Samples audio servis depuis `public/samples/` (sous-dossiers par catégorie)
- Manifest des samples : `public/samples/samples.json`
- Pas de tests configurés
- Pas de base de données — tout est côté client
