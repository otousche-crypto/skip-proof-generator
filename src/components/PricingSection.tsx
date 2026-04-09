"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, X } from "lucide-react";

const FREE_FEATURES = [
  { label: "Compositeur visuel complet", included: true },
  { label: "Bibliothèque +50 samples", included: true },
  { label: "5 Compositions", included: true },
  { label: "Exports illimités", included: true },
  { label: "Export WAV haute qualité", included: false },
  { label: "Upload de tes propres samples", included: false },
];

const PRO_FEATURES = [
  { label: "Compositeur visuel complet", included: true },
  { label: "Bibliothèque +1000 samples", included: true },
  { label: "Compositions illimitées", included: true },
  { label: "Exports illimités", included: true },
  { label: "Export WAV haute qualité", included: true },
  { label: "Upload de tes propres samples", included: true },
];

const MONTHLY_PRICE = 4.99;
const ANNUAL_PRICE = 39.99;
const ANNUAL_MONTHLY_EQUIV = (ANNUAL_PRICE / 12).toFixed(2);
const SAVINGS = ((MONTHLY_PRICE * 12) - ANNUAL_PRICE).toFixed(0);
const SAVINGS_PCT = Math.round(((MONTHLY_PRICE * 12) - ANNUAL_PRICE) / (MONTHLY_PRICE * 12) * 100);

export function PricingSection() {
  const [annual, setAnnual] = useState(true);

  return (
    <section className="px-6 py-20 md:py-28 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="text-center mb-12">
        <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3">
          Pricing
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-text mb-4">
          Simple et transparent
        </h2>
        <p className="text-text-muted text-sm max-w-md mx-auto">
          Commence gratuitement. Passe au Pro quand tu veux débloquer toute la librairie.
        </p>

        {/* Toggle mensuel / annuel */}
        <div className="relative flex items-center justify-center gap-3 mt-8">
          <span className={`text-sm font-medium ${!annual ? "text-text" : "text-text-muted"}`}>
            Mensuel
          </span>
          <button
            onClick={() => setAnnual(!annual)}
            className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${annual ? "bg-accent-orange" : "bg-surface-alt"}`}
          >
            <span
              className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200"
              style={{ left: annual ? "calc(100% - 20px)" : "4px" }}
            />
          </button>
          <div className="flex flex-col items-start">
            <span className={`text-sm font-medium ${annual ? "text-text" : "text-text-muted"}`}>
              Annuel
            </span>
            <span className="text-xs font-bold text-accent-orange">
              Save {SAVINGS_PCT}%
            </span>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">

        {/* Free */}
        <div className="flex flex-col rounded-[var(--radius)] border border-border bg-surface p-6">
          <div className="mb-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted mb-4">
              Free
            </h3>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-text">0€</span>
              <span className="text-text-muted text-sm">/ mois</span>
            </div>
            <p className="text-xs text-text-muted mt-1">Pour toujours</p>
          </div>

          <hr className="border-border mb-6" />

          <ul className="space-y-3 flex-1 mb-8">
            {FREE_FEATURES.map((f) => (
              <li key={f.label} className="flex items-center gap-3 text-sm">
                {f.included ? (
                  <Check className="w-4 h-4 shrink-0 text-green-500" />
                ) : (
                  <X className="w-4 h-4 shrink-0 text-text-muted/40" />
                )}
                <span className={f.included ? "text-text" : "text-text-muted/50"}>
                  {f.label}
                </span>
              </li>
            ))}
          </ul>

          <Link
            href="/composer"
            className="block text-center px-6 py-2.5 rounded-[var(--radius-sm)] text-sm font-bold text-text border border-border hover:bg-surface-alt transition-colors"
          >
            Commencer gratuitement
          </Link>
        </div>

        {/* Pro */}
        <div className="flex flex-col rounded-[var(--radius)] border border-accent-orange/50 bg-surface p-6 relative">

          <div className="mb-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-accent-orange mb-4">
              Pro
            </h3>
            {annual ? (
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-text">{ANNUAL_MONTHLY_EQUIV}€</span>
                  <span className="text-text-muted text-sm">/ mois</span>
                </div>
                <p className="text-xs text-text-muted mt-1">
                  Facturé {ANNUAL_PRICE}€/an
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-text">{MONTHLY_PRICE}€</span>
                  <span className="text-text-muted text-sm">/ mois</span>
                </div>
                <p className="text-xs text-text-muted mt-1">
                  Ou {ANNUAL_PRICE}€/an — économise {SAVINGS}€
                </p>
              </div>
            )}
          </div>

          <hr className="border-accent-orange/20 mb-6" />

          <ul className="space-y-3 flex-1 mb-8">
            {PRO_FEATURES.map((f) => (
              <li key={f.label} className="flex items-center gap-3 text-sm">
                <Check className="w-4 h-4 shrink-0 text-green-500" />
                <span className="text-text">{f.label}</span>
              </li>
            ))}
          </ul>

          <Link
            href="/login"
            className="block text-center px-6 py-2.5 rounded-[var(--radius-sm)] text-sm font-bold text-black bg-white hover:opacity-90 transition-opacity"
          >
            {annual ? `Démarrer à ${ANNUAL_PRICE}€/an` : `Démarrer à ${MONTHLY_PRICE}€/mois`}
          </Link>
        </div>

      </div>
    </section>
  );
}
