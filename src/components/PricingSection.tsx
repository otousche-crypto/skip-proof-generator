"use client";

import Link from "next/link";
import { useState, useRef, useCallback } from "react";
import { Check, X } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";

const MONTHLY_PRO = 4.99;
const ANNUAL_PRO = 39.99;
const EQUIV_PRO = (ANNUAL_PRO / 12).toFixed(2);
const SAVINGS_PRO = Math.round(MONTHLY_PRO * 12 - ANNUAL_PRO);

const MONTHLY_STUDIO = 9.99;
const ANNUAL_STUDIO = 79.99;
const EQUIV_STUDIO = (ANNUAL_STUDIO / 12).toFixed(2);
const SAVINGS_STUDIO = Math.round(MONTHLY_STUDIO * 12 - ANNUAL_STUDIO);

const SAVINGS_PCT = Math.round(((MONTHLY_PRO * 12 - ANNUAL_PRO) / (MONTHLY_PRO * 12)) * 100);

type Feature = { label: string; included: boolean };

interface Plan {
  key: string;
  name: string;
  subtitle: string;
  highlight: boolean;
  priceDisplay: string;
  perMonth: boolean;
  priceNote: string;
  features: Feature[];
  ctaLabel: string;
  ctaHref: string;
}

function PlanCard({ plan }: { plan: Plan }) {
  const { t } = useTranslation();
  return (
    <div
      className={`flex flex-col h-full rounded-[var(--radius)] border bg-surface p-6 ${
        plan.highlight ? "border-accent-orange/50" : "border-border"
      }`}
    >
      <div className="mb-6">
        <h3
          className={`text-sm font-bold uppercase tracking-widest mb-1 ${
            plan.highlight ? "text-accent-orange" : "text-text-muted"
          }`}
        >
          {plan.name}
        </h3>
        <p className="text-xs text-text-muted mb-4">{plan.subtitle}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-text">{plan.priceDisplay}</span>
          {plan.perMonth && (
            <span className="text-text-muted text-sm">{t.pricing.per_month}</span>
          )}
        </div>
        <p className="text-xs text-text-muted mt-1">{plan.priceNote}</p>
      </div>

      <hr className={`mb-6 ${plan.highlight ? "border-accent-orange/20" : "border-border"}`} />

      <ul className="space-y-3 flex-1 mb-8">
        {plan.features.map((f) => (
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
        href={plan.ctaHref}
        className={`block text-center px-6 py-2.5 rounded-[var(--radius-sm)] text-sm font-bold transition-all ${
          plan.highlight
            ? "text-black bg-white hover:opacity-90"
            : "text-text border border-border hover:bg-surface-alt"
        }`}
      >
        {plan.ctaLabel}
      </Link>
    </div>
  );
}

export function PricingSection() {
  const [annual, setAnnual] = useState(true);
  const { t } = useTranslation();

  const carouselRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([null, null, null]);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = useCallback(() => {
    const container = carouselRef.current;
    if (!container) return;
    const containerCenter = container.scrollLeft + container.clientWidth / 2;
    let closest = 0;
    let minDist = Infinity;
    cardRefs.current.forEach((card, i) => {
      if (!card) return;
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const dist = Math.abs(cardCenter - containerCenter);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    });
    setActiveIndex(closest);
  }, []);

  const scrollToCard = (index: number) => {
    const container = carouselRef.current;
    const card = cardRefs.current[index];
    if (!container || !card) return;
    const offset = card.offsetLeft - (container.clientWidth - card.offsetWidth) / 2;
    container.scrollTo({ left: offset, behavior: "smooth" });
  };

  const FREE_FEATURES: Feature[] = [
    { label: t.pricing.features.full_composer, included: true },
    { label: t.pricing.features.library_50, included: true },
    { label: t.pricing.features.compositions_5, included: true },
    { label: t.pricing.features.unlimited_exports, included: false },
    { label: t.pricing.features.wav_export, included: false },
    { label: t.pricing.features.upload_samples, included: false },
  ];

  const PRO_FEATURES: Feature[] = [
    { label: t.pricing.features.full_composer, included: true },
    { label: t.pricing.features.library_1000, included: true },
    { label: t.pricing.features.unlimited_compositions, included: true },
    { label: t.pricing.features.unlimited_exports, included: true },
    { label: t.pricing.features.wav_export, included: false },
    { label: t.pricing.features.upload_samples, included: false },
  ];

  const STUDIO_FEATURES: Feature[] = [
    { label: t.pricing.features.full_composer, included: true },
    { label: t.pricing.features.library_1000, included: true },
    { label: t.pricing.features.unlimited_compositions, included: true },
    { label: t.pricing.features.unlimited_exports, included: true },
    { label: t.pricing.features.wav_export, included: true },
    { label: t.pricing.features.upload_samples, included: true },
  ];

  const plans: Plan[] = [
    {
      key: "free",
      name: "Free",
      subtitle: t.pricing.free_subtitle,
      highlight: false,
      priceDisplay: "0€",
      perMonth: false,
      priceNote: t.pricing.forever,
      features: FREE_FEATURES,
      ctaLabel: t.pricing.cta_free,
      ctaHref: "/composer",
    },
    {
      key: "pro",
      name: "Pro",
      subtitle: t.pricing.pro_subtitle,
      highlight: true,
      priceDisplay: annual ? `${EQUIV_PRO}€` : `${MONTHLY_PRO}€`,
      perMonth: true,
      priceNote: annual
        ? t.pricing.billed_annually(ANNUAL_PRO)
        : t.pricing.or_annual(ANNUAL_PRO, SAVINGS_PRO),
      features: PRO_FEATURES,
      ctaLabel: annual
        ? t.pricing.cta_pro_annual(ANNUAL_PRO)
        : t.pricing.cta_pro_monthly(MONTHLY_PRO),
      ctaHref: "/login",
    },
    {
      key: "studio",
      name: "Studio",
      subtitle: t.pricing.studio_subtitle,
      highlight: false,
      priceDisplay: annual ? `${EQUIV_STUDIO}€` : `${MONTHLY_STUDIO}€`,
      perMonth: true,
      priceNote: annual
        ? t.pricing.billed_annually(ANNUAL_STUDIO)
        : t.pricing.or_annual(ANNUAL_STUDIO, SAVINGS_STUDIO),
      features: STUDIO_FEATURES,
      ctaLabel: annual
        ? t.pricing.cta_pro_annual(ANNUAL_STUDIO)
        : t.pricing.cta_pro_monthly(MONTHLY_STUDIO),
      ctaHref: "/login",
    },
  ];

  return (
    <section className="py-20 md:py-28 w-full overflow-hidden">
      <div className="px-6 max-w-6xl mx-auto">
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

          {/* Toggle */}
          <div className="relative flex items-center justify-center gap-3 mt-8">
            <span className={`text-sm font-medium ${!annual ? "text-text" : "text-text-muted"}`}>
              {t.pricing.monthly}
            </span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                annual ? "bg-accent-orange" : "bg-surface-alt"
              }`}
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
      </div>

      {/* Mobile: carousel */}
      <div className="md:hidden">
        <div
          ref={carouselRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-2 px-[7.5vw]"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {plans.map((plan, i) => (
            <div
              key={plan.key}
              ref={(el) => { cardRefs.current[i] = el; }}
              className="snap-center shrink-0 w-[85vw]"
            >
              <PlanCard plan={plan} />
            </div>
          ))}
        </div>

        {/* Dots */}
        <div className="flex items-center justify-center gap-2 mt-5">
          {plans.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToCard(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === activeIndex
                  ? "w-6 bg-accent-orange"
                  : "w-2 bg-surface-alt hover:bg-border"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Desktop: grid */}
      <div className="hidden md:block px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <PlanCard key={plan.key} plan={plan} />
          ))}
        </div>
      </div>
    </section>
  );
}
