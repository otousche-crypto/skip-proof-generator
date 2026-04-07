import Link from "next/link";
import { NavAuth } from "@/components/NavAuth";
import { HeroSection } from "@/components/HeroSection";

/* ── SVG helpers (same math as VinylDisk.tsx) ── */

const TOTAL_MS = 1800;
const CENTER = 300;
const RADIUS = 260;
const INNER_RADIUS = 60;
const MID_RADIUS = (RADIUS + INNER_RADIUS) / 2;
const WAVE_MAX_AMP = (RADIUS - INNER_RADIUS) / 2 - 8;

function polar(r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CENTER + r * Math.cos(rad), y: CENTER + r * Math.sin(rad) };
}

function msToAngle(ms: number) {
  return ((TOTAL_MS - ms) / TOTAL_MS) * 360;
}

function arcPath(startAngle: number, endAngle: number, outerR: number, innerR: number) {
  const os = polar(outerR, startAngle);
  const oe = polar(outerR, endAngle);
  const is_ = polar(innerR, endAngle);
  const ie = polar(innerR, startAngle);
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${os.x} ${os.y}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${oe.x} ${oe.y}`,
    `L ${is_.x} ${is_.y}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${ie.x} ${ie.y}`,
    "Z",
  ].join(" ");
}

/** Generate fake waveform radial lines inside an arc */
function fakeWaveform(startAngle: number, endAngle: number, seed: number): string {
  const span = endAngle - startAngle;
  const steps = Math.max(8, Math.floor(span / 2));
  const lines: string[] = [];
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const angle = startAngle + t * span;
    // Pseudo-random amplitude based on seed and index
    const amp = (Math.sin(seed * 7 + i * 3.7) * 0.5 + 0.5) * WAVE_MAX_AMP * 0.7 + WAVE_MAX_AMP * 0.15;
    const rInner = MID_RADIUS - amp;
    const rOuter = MID_RADIUS + amp;
    const pI = polar(rInner, angle);
    const pO = polar(rOuter, angle);
    lines.push(`M ${pI.x} ${pI.y} L ${pO.x} ${pO.y}`);
  }
  return lines.join(" ");
}

/* ── Beat grid (BPM 133.33, same as default 2bars mode) ── */

const BPM = 133.33;
const beatIntervalMs = 60000 / BPM; // ~450ms
const halfBeatMs = beatIntervalMs / 2; // ~225ms
const numHalfBeats = Math.round(TOTAL_MS / halfBeatMs); // 8

const beatLines = Array.from({ length: numHalfBeats }, (_, i) => {
  const ms = i * halfBeatMs;
  const angle = msToAngle(ms);
  const isBeat = i % 2 === 0;
  const outerR = isBeat ? RADIUS + 8 : RADIUS - 2;
  const innerR = isBeat ? INNER_RADIUS - 6 : INNER_RADIUS + 2;
  return { inner: polar(innerR, angle), outer: polar(outerR, angle), isBeat };
});

const grooveRadii = [100, 140, 180, 220];

/* ── Pre-computed arcs for the animation ── */

// Block 1 (orange): 0ms → 450ms (one full beat)
const b1StartAngle = msToAngle(450); // 270°
const b1EndAngle = msToAngle(0);     // 360°
const b1Arc = arcPath(b1StartAngle, b1EndAngle, RADIUS, INNER_RADIUS);
const b1Wave = fakeWaveform(b1StartAngle, b1EndAngle, 1);

// Block 2 (purple): 450ms → 750ms (initial, right after block 1)
const b2EndAngle = msToAngle(450);   // 270° (same as b1StartAngle — adjacent)
const b2StartAngle = msToAngle(750); // 210°
const b2Arc = arcPath(b2StartAngle, b2EndAngle, RADIUS, INNER_RADIUS);
const b2Wave = fakeWaveform(b2StartAngle, b2EndAngle, 2);

// Block 2 extension: 750ms → 900ms (snaps to beat at 900ms)
const b2ExtEndAngle = b2StartAngle;        // 210° (joins the initial block)
const b2ExtStartAngle = msToAngle(900);    // 180°
const b2ExtArc = arcPath(b2ExtStartAngle, b2ExtEndAngle, RADIUS, INNER_RADIUS);
const b2ExtWave = fakeWaveform(b2ExtStartAngle, b2ExtEndAngle, 3);

// Resize handle position: at the "duration end" edge of block 2 (the startAngle side = 210°)
const b2ResizeHandle = polar(MID_RADIUS, b2StartAngle);

/* ── Sample data for section 3 ── */

const categories = [
  {
    name: "Classic FX",
    color: "#E85D04",
    count: 9,
    samples: [
      { name: "AAAAA", ms: 905 }, { name: "aaaAAAA", ms: 887 },
      { name: "Aou!", ms: 938 }, { name: "Baw!", ms: 574 },
      { name: "Hey!", ms: 464 }, { name: "How!", ms: 567 },
      { name: "Laser", ms: 669 }, { name: "Sexy", ms: 638 },
      { name: "Wooaw", ms: 676 },
    ],
  },
  {
    name: "Sentences",
    color: "#7B2FBE",
    count: 12,
    samples: [
      { name: "Ah Yeah", ms: 898 }, { name: "And They Go Like", ms: 910 },
      { name: "Fresh Rythm Yo", ms: 1669 }, { name: "F Dat B", ms: 921 },
      { name: "Get Blasted", ms: 906 }, { name: "Here We Go", ms: 684 },
      { name: "Hey You", ms: 927 }, { name: "Makin In It", ms: 937 },
      { name: "OH NOOOO", ms: 1820 }, { name: "Rock The Beat", ms: 833 },
      { name: "Say What?", ms: 605 }, { name: "What Is It", ms: 476 },
    ],
  },
  {
    name: "Words",
    color: "#0077B6",
    count: 10,
    samples: [
      { name: "Blasted", ms: 604 }, { name: "DAAAAA", ms: 659 },
      { name: "Ha!", ms: 275 }, { name: "HUN!", ms: 289 },
      { name: "Ooowwww", ms: 700 }, { name: "Pigmé", ms: 914 },
      { name: "Pullup", ms: 468 }, { name: "Pum", ms: 311 },
      { name: "Up", ms: 370 }, { name: "What", ms: 250 },
    ],
  },
];

/* ── Page ── */

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-dvh bg-background">
      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center px-6 py-4">
        <span className="text-xl font-bold text-white">
          Sklip
        </span>
        <div className="absolute right-6">
          <NavAuth />
        </div>
      </nav>

      {/* ── Section 1 : Hero ── */}
      <HeroSection imageUrl="/hero-bg.webp" />

      {/* ── Section 2 : Présentation de l'outil ── */}
      <section className="px-6 py-20 md:py-28 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Text */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3">
              Comment ça marche
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-text mb-8">
              Compose visuellement sur un vinyle
            </h2>
            <div className="space-y-6">
              {[
                {
                  color: "#E85D04",
                  title: "Glisse des samples",
                  desc: "Ajoute des samples depuis la librairie et positionne-les sur le vinyle.",
                },
                {
                  color: "#7C3AED",
                  title: "Redimensionne",
                  desc: "Ajuste la durée et le pitch de chaque sample en tirant les poignées.",
                },
                {
                  color: "#FF6B00",
                  title: "Exporte en MP3",
                  desc: "Exporte ta boucle de 1818ms, prête à graver sur vinyle.",
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-4">
                  <div
                    className="w-3 h-3 rounded-full mt-1.5 shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <div>
                    <h3 className="font-semibold text-text mb-1">{item.title}</h3>
                    <p className="text-sm text-text-muted">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/composer"
              className="inline-block mt-8 px-6 py-2.5 rounded-[var(--radius-sm)] text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ backgroundImage: "linear-gradient(135deg, #FF6B00, #7C3AED)" }}
            >
              Commencer
            </Link>
          </div>

          {/* Animated Vinyl SVG */}
          <div className="flex justify-center">
            <div className="w-full max-w-[420px]" style={{ transform: "rotate(22deg)" }}>
              <svg viewBox="0 0 600 600" className="w-full h-auto">
                <defs>
                  <clipPath id="clip-b1"><path d={b1Arc} /></clipPath>
                  <clipPath id="clip-b2"><path d={b2Arc} /></clipPath>
                  <clipPath id="clip-b2ext"><path d={b2ExtArc} /></clipPath>
                </defs>

                {/* Disc background */}
                <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="#1a1a1a" />

                {/* Groove rings */}
                {grooveRadii.map((r) => (
                  <circle key={r} cx={CENTER} cy={CENTER} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
                ))}

                {/* ── Block 1 (orange, 0→450ms) ── */}
                <g style={{ animation: "vinyl-pop1 9s ease-in-out infinite" }}>
                  <path d={b1Arc} fill="#E85D04" stroke="#0a0a0a" strokeWidth={1} />
                  <path d={b1Wave} fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth={3} strokeLinecap="round" clipPath="url(#clip-b1)" />
                </g>

                {/* ── Block 2 (purple, 450→750ms) ── */}
                <g style={{ animation: "vinyl-pop2 9s ease-in-out infinite" }}>
                  <path d={b2Arc} fill="#7B2FBE" stroke="#0a0a0a" strokeWidth={1} />
                  <path d={b2Wave} fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth={3} strokeLinecap="round" clipPath="url(#clip-b2)" />
                </g>

                {/* ── Block 2 extension (750→900ms, snaps to beat) ── */}
                <g style={{ animation: "vinyl-block2-extend 9s ease-in-out infinite" }}>
                  <path d={b2ExtArc} fill="#7B2FBE" stroke="#0a0a0a" strokeWidth={1} />
                  <path d={b2ExtWave} fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth={3} strokeLinecap="round" clipPath="url(#clip-b2ext)" />
                </g>

                {/* ── Resize handle + cursor ── */}
                <g style={{
                  transformOrigin: `${CENTER}px ${CENTER}px`,
                  animation: "vinyl-drag-rotate 9s ease-in-out infinite",
                }}>
                  <g style={{ animation: "vinyl-resize-handle 9s ease-in-out infinite" }}>
                    <circle cx={b2ResizeHandle.x} cy={b2ResizeHandle.y} r={12} fill="#7B2FBE" stroke="#ffffff" strokeWidth={1.5} />
                    <text x={b2ResizeHandle.x} y={b2ResizeHandle.y + 1} textAnchor="middle" dominantBaseline="central" fill="white" fontSize={12} fontWeight="bold">
                      +/−
                    </text>
                  </g>
                  <g style={{ animation: "vinyl-cursor-fade 9s ease-in-out infinite" }}>
                    <g transform={`translate(${b2ResizeHandle.x + 12}, ${b2ResizeHandle.y + 8})`}>
                      <path
                        d="M 0 0 L 0 18 L 5 14 L 9 22 L 12 20 L 8 13 L 14 12 Z"
                        fill="white"
                        stroke="#0a0a0a"
                        strokeWidth={1.2}
                        strokeLinejoin="round"
                      />
                    </g>
                  </g>
                </g>

                {/* Beat grid */}
                {beatLines.map((line, i) => (
                  <line key={i} x1={line.inner.x} y1={line.inner.y} x2={line.outer.x} y2={line.outer.y} stroke={line.isBeat ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.15)"} strokeWidth={line.isBeat ? 2 : 1} />
                ))}

                {/* Center hole */}
                <circle cx={CENTER} cy={CENTER} r={INNER_RADIUS} fill="#0a0a0a" />
                <circle cx={CENTER} cy={CENTER} r={INNER_RADIUS - 4} fill="none" stroke="#2a2a2a" strokeWidth={2} />

                {/* Needle */}
                <line x1={CENTER} y1={30} x2={CENTER} y2={CENTER - RADIUS + 6} stroke="#FF6B00" strokeWidth={2.5} strokeLinecap="round" opacity={0.8} />
                <circle cx={CENTER} cy={30} r={5} fill="#FF6B00" opacity={0.8} />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 3 : Librairie de samples ── */}
      <section className="px-6 py-20 md:py-28 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Animated library mockup */}
          <div className="flex justify-center">
            <div className="w-full max-w-xs bg-surface rounded-[var(--radius)] border border-border overflow-hidden shadow-2xl">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
                  Samples
                </p>
              </div>

              <div className="divide-y divide-border">
                {/* Classic FX — closed */}
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-text-muted text-xs">▶</span>
                    <span className="text-sm font-medium text-text">Classic FX</span>
                  </div>
                  <span className="text-xs font-mono text-text-muted">9</span>
                </div>

                {/* Sentences — animated open */}
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-text-muted text-xs inline-block"
                        style={{ animation: "lib-arrow-rotate 9s ease-in-out infinite" }}
                      >
                        ▶
                      </span>
                      <span className="text-sm font-medium text-text">Sentences</span>
                    </div>
                    <span className="text-xs font-mono text-text-muted">12</span>
                  </div>
                  <div
                    className="overflow-hidden"
                    style={{
                      maxHeight: 0,
                      opacity: 0,
                      animation: "lib-category-open 9s ease-in-out infinite",
                    }}
                  >
                    <div
                      className="mt-2 space-y-0.5"
                      style={{ animation: "lib-scroll 9s ease-in-out infinite" }}
                    >
                      {categories[1].samples.map((s) => (
                        <div
                          key={s.name}
                          className="flex items-center gap-2.5 px-2 py-1.5 rounded-[var(--radius-sm)]"
                        >
                          <div
                            className="w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center"
                            style={{ borderColor: "#7B2FBE" }}
                          >
                            <svg width="8" height="10" viewBox="0 0 8 10" fill="#7B2FBE">
                              <polygon points="0,0 8,5 0,10" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-text truncate">{s.name}</p>
                            <p className="text-[10px] font-mono text-text-muted">{s.ms}ms</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Words — closed */}
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-text-muted text-xs">▶</span>
                    <span className="text-sm font-medium text-text">Words</span>
                  </div>
                  <span className="text-xs font-mono text-text-muted">10</span>
                </div>
              </div>

              <div className="px-4 py-2 border-t border-border">
                <p className="text-[10px] font-mono text-text-muted text-center">
                  0ms / 1818ms
                </p>
              </div>
            </div>
          </div>

          {/* Text */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3">
              Librairie de samples
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-text mb-6">
              +99 samples pour le scratch
            </h2>
            <p className="text-text-muted mb-6">
              Une librairie complète de samples vocaux pensés pour le scratch : ad-libs, phrases, mots et effets classiques.
            </p>
            <div className="space-y-6 mb-8">
              {[
                {
                  color: "#E85D04",
                  title: "Haute qualité",
                  desc: "Des samples audio enregistrés et masterisés en studio pour un rendu pro.",
                },
                {
                  color: "#7C3AED",
                  title: "Originaux",
                  desc: "Chaque sample est unique, créé spécifiquement pour le scratch sur vinyle.",
                },
                {
                  color: "#0077B6",
                  title: "Libres de droits",
                  desc: "Utilise-les sans restriction, gratuitement, dans toutes tes compositions.",
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-4">
                  <div
                    className="w-3 h-3 rounded-full mt-1.5 shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <div>
                    <h3 className="font-semibold text-text mb-1">{item.title}</h3>
                    <p className="text-sm text-text-muted">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/composer"
              className="inline-block px-6 py-2.5 rounded-[var(--radius-sm)] text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ backgroundImage: "linear-gradient(135deg, #FF6B00, #7C3AED)" }}
            >
              Commencer
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="px-6 py-8 text-center text-text-muted text-xs">
        Sklip — Boucles skip-proof pour vinyle
      </footer>
    </div>
  );
}
