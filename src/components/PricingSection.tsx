"use client";

import Link from "next/link";
import { useState, useRef, useCallback } from "react";
import { Check, X } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";

interface Feature {
  label: string;
  included: boolean;
}

interface Plan {
  key: string;
  name: string;
  subtitle: string;
  highlight: boolean;
  free: boolean;
  monthly: number;
  annualTotal: number;
  equivMonthly: string;
  annualSavings: number;
  features: Feature[];
  ctaHref: string;
}

function PlanCard({ plan }: { plan: Plan }) {
  const { t } = useTranslation();
  const [isAnnual, setIsAnnual] = useState(true);

  const savingsPct = !plan.free
    ? Math.round((plan.annualSavings / (plan.monthly * 12)) * 100)
    : 0;

  const priceDisplay = plan.free
    ? "0€"
    : isAnnual
    ? `${plan.equivMonthly}€`
    : `${plan.monthly}€`;

  const priceNote = plan.free
    ? t.pricing.forever
    : isAnnual
    ? t.pricing.billed_annually(plan.annualTotal)
    : t.pricing.monthly_total((plan.monthly * 12).toFixed(2));

  const ctaLabel = plan.free
    ? t.pricing.cta_free
    : isAnnual
    ? t.pricing.cta_pro_annual(plan.annualTotal)
    : t.pricing.cta_pro_monthly(plan.monthly);

  return (
    <div
      className={`flex flex-col h-full rounded-[var(--radius)] border bg-surface p-6 ${
        plan.highlight ? "border-accent-orange/50" : "border-border"
      }`}
    >
      {/* Plan name */}
      <div className="mb-4">
        <h3
          className={`text-sm font-bold uppercase tracking-widest mb-1 ${
            plan.highlight ? "text-accent-orange" : "text-text-muted"
          }`}
        >
          {plan.name}
        </h3>
        <p className="text-xs text-text-muted">{plan.subtitle}</p>
      </div>

      {/* Billing selector (paid plans only) */}
      {!plan.free && (
        <div className="relative flex gap-2 mb-5 pt-4">
          <span className="absolute top-0 right-0 whitespace-nowrap text-[10px] font-bold bg-accent-orange text-white px-2 py-0.5 rounded-full">
            {t.pricing.save_pct(savingsPct)}
          </span>
          <button
            onClick={() => setIsAnnual(false)}
            className={`flex-1 text-xs px-3 py-2 rounded-[var(--radius-sm)] border transition-colors ${
              !isAnnual
                ? "border-accent-orange text-accent-orange bg-accent-orange/10"
                : "border-border text-text-muted hover:border-text-muted"
            }`}
          >
            {t.pricing.monthly}
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={`flex-1 text-xs px-3 py-2 rounded-[var(--radius-sm)] border transition-colors ${
              isAnnual
                ? "border-accent-orange text-accent-orange bg-accent-orange/10"
                : "border-border text-text-muted hover:border-text-muted"
            }`}
          >
            {t.pricing.annual}
          </button>
        </div>
      )}

      {/* Price */}
      <div className={plan.free ? "mb-6" : "mb-4"}>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-text">{priceDisplay}</span>
          {!plan.free && (
            <span className="text-text-muted text-sm">{t.pricing.per_month}</span>
          )}
        </div>
        <p className="text-xs text-text-muted mt-1">{priceNote}</p>
      </div>

      <hr
        className={`mb-6 ${
          plan.highlight ? "border-accent-orange/20" : "border-border"
        }`}
      />

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
        {ctaLabel}
      </Link>
    </div>
  );
}

export function PricingSection() {
  const { t } = useTranslation();

  const carouselRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([null, null]);
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
    const offset =
      card.offsetLeft - (container.clientWidth - card.offsetWidth) / 2;
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
    { label: t.pricing.features.wav_export, included: true },
    { label: t.pricing.features.upload_samples, included: true },
  ];

  const plans: Plan[] = [
    {
      key: "free",
      name: "Free",
      subtitle: t.pricing.free_subtitle,
      highlight: false,
      free: true,
      monthly: 0,
      annualTotal: 0,
      equivMonthly: "0",
      annualSavings: 0,
      features: FREE_FEATURES,
      ctaHref: "/composer",
    },
    {
      key: "pro",
      name: "Pro",
      subtitle: t.pricing.pro_subtitle,
      highlight: true,
      free: false,
      monthly: 4.99,
      annualTotal: 39.99,
      equivMonthly: (39.99 / 12).toFixed(2),
      annualSavings: Math.round(4.99 * 12 - 39.99),
      features: PRO_FEATURES,
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
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
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
        <div className="grid grid-cols-2 gap-6 max-w-3xl mx-auto">
          {plans.map((plan) => (
            <PlanCard key={plan.key} plan={plan} />
          ))}
        </div>
      </div>
    </section>
  );
}
