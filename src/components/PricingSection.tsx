"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, X } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";

const MONTHLY_PRICE = 4.99;
const ANNUAL_PRICE = 39.99;
const ANNUAL_MONTHLY_EQUIV = (ANNUAL_PRICE / 12).toFixed(2);
const SAVINGS = ((MONTHLY_PRICE * 12) - ANNUAL_PRICE).toFixed(0);
const SAVINGS_PCT = Math.round(((MONTHLY_PRICE * 12) - ANNUAL_PRICE) / (MONTHLY_PRICE * 12) * 100);

export function PricingSection() {
  const [annual, setAnnual] = useState(true);
  const { t } = useTranslation();

  const FREE_FEATURES = [
    { label: t.pricing.features.full_composer, included: true },
    { label: t.pricing.features.library_50, included: true },
    { label: t.pricing.features.compositions_5, included: true },
    { label: t.pricing.features.unlimited_exports, included: false },
    { label: t.pricing.features.wav_export, included: false },
    { label: t.pricing.features.upload_samples, included: false },
  ];

  const PRO_FEATURES = [
    { label: t.pricing.features.full_composer, included: true },
    { label: t.pricing.features.library_1000, included: true },
    { label: t.pricing.features.unlimited_compositions, included: true },
    { label: t.pricing.features.unlimited_exports, included: true },
    { label: t.pricing.features.wav_export, included: true },
    { label: t.pricing.features.upload_samples, included: true },
  ];

  return (
    <section className="px-6 py-20 md:py-28 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="text-center mb-12">
        <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3">
          {t.pricing.tag}
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-text mb-4">
          {t.pricing.title}
        </h2>
        <p className="text-text-muted text-sm max-w-md mx-auto">
          {t.pricing.subtitle}
        </p>

        {/* Toggle mensuel / annuel */}
        <div className="relative flex items-center justify-center gap-3 mt-8">
          <span className={`text-sm font-medium ${!annual ? "text-text" : "text-text-muted"}`}>
            {t.pricing.monthly}
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
              {t.pricing.annual}
            </span>
            <span className="text-xs font-bold text-accent-orange">
              {t.pricing.save_pct(SAVINGS_PCT)}
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
              <span className="text-text-muted text-sm">{t.pricing.per_month}</span>
            </div>
            <p className="text-xs text-text-muted mt-1">{t.pricing.forever}</p>
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
            {t.pricing.cta_free}
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
                  <span className="text-text-muted text-sm">{t.pricing.per_month}</span>
                </div>
                <p className="text-xs text-text-muted mt-1">
                  {t.pricing.billed_annually(ANNUAL_PRICE)}
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-text">{MONTHLY_PRICE}€</span>
                  <span className="text-text-muted text-sm">{t.pricing.per_month}</span>
                </div>
                <p className="text-xs text-text-muted mt-1">
                  {t.pricing.or_annual(ANNUAL_PRICE, Number(SAVINGS))}
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
            {annual ? t.pricing.cta_pro_annual(ANNUAL_PRICE) : t.pricing.cta_pro_monthly(MONTHLY_PRICE)}
          </Link>
        </div>

      </div>
    </section>
  );
}
