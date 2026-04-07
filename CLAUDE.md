@AGENTS.md

# Skip Proof Generator

App web pour composer des boucles audio "skip-proof" de **1818ms** destinées à être gravées sur vinyle pour le DJing (scratch). L'utilisateur assemble des samples sur une timeline, ajuste le pitch, et exporte en MP3.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript 5**
- **Zustand 5** pour le state management
- **Tailwind CSS 4** (via PostCSS, config inline dans `globals.css`)
- **Supabase** (`@supabase/supabase-js` + `@supabase/ssr`) pour l'auth et la base de données
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
├── proxy.ts               # Protection des routes (auth Supabase)
├── app/
│   ├── page.tsx           # Landing page publique
│   ├── layout.tsx         # Layout racine (Inter + JetBrains Mono)
│   ├── globals.css        # Variables CSS custom + theme Tailwind inline
│   ├── login/page.tsx     # Mire de connexion (login/signup)
│   ├── composer/page.tsx  # Compositeur audio (protégé)
│   └── profile/page.tsx   # Page profil + compositions sauvegardées (protégé)
├── components/
│   ├── SampleLibrary.tsx  # Sidebar : liste des samples par catégorie
│   ├── Waveform.tsx       # Timeline visuelle des samples placés
│   ├── WaveformToolbar.tsx # Contrôles play/pause/stop + snap + loop mode
│   ├── VinylDisk.tsx      # Vinyle animé (rotation pendant la lecture)
│   ├── PitchControl.tsx   # Contrôle de pitch par sample + master pitch
│   ├── ExportButton.tsx   # Export de la composition en MP3
│   ├── Transport.tsx      # (Contrôles de transport)
│   ├── AuthForm.tsx       # Formulaire login/signup
│   ├── UserMenu.tsx       # Menu avatar/déconnexion dans le header
│   ├── SaveButton.tsx     # Sauvegarde composition dans Supabase
│   └── CompositionCard.tsx # Carte composition sur la page profil
├── hooks/
│   ├── useAudioEngine.ts  # Lecture audio (Web Audio API), loop, pause/resume
│   ├── useSamples.ts      # Chargement des samples depuis /samples/samples.json
│   └── useAuth.ts         # Hook état authentification Supabase
├── lib/
│   ├── supabase/
│   │   ├── client.ts      # Client Supabase navigateur
│   │   └── server.ts      # Client Supabase serveur (cookies)
│   ├── audioBufferCache.ts
│   └── waveformPeaks.ts
├── store/
│   ├── composition.ts     # Store Zustand : composition, snap, BPM, pitch, save/load
│   └── waveformPeaks.ts
└── types/
    ├── index.ts           # Types métier : Sample, PlacedSample, Composition, SavedComposition
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

## Auth & Base de données

- **Supabase Auth** : email/password, session gérée via cookies (`@supabase/ssr`)
- **Protection des routes** : `src/proxy.ts` (ex-middleware Next.js 16) protège `/composer` et `/profile`
- **Tables Supabase** : `profiles` (auto-créé au signup), `compositions` (JSON des compositions)
- **RLS** : chaque utilisateur ne voit que ses propres données
- **Variables d'env** : `.env.local` avec `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Conventions

- Path alias `@/*` → `./src/*`
- Dark theme uniquement (variables CSS dans `:root` de globals.css)
- Couleurs d'accent : orange `#FF6B00` et violet `#7C3AED`
- Landing page = server component, reste en `"use client"`
- Samples audio servis depuis `public/samples/` (sous-dossiers par catégorie)
- Manifest des samples : `public/samples/samples.json`
- Pas de tests configurés
