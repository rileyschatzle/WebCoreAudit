import {
  Gauge,
  Palette,
  MousePointer2,
  Shield,
  Target,
  TrendingUp,
} from "lucide-react";

const categories = [
  {
    icon: Gauge,
    title: "Technical Foundation",
    description:
      "Site speed, mobile responsiveness, SSL, SEO basics, Core Web Vitals, and infrastructure health.",
    color: "wc-cyan",
  },
  {
    icon: Palette,
    title: "Brand & Messaging",
    description:
      "Value proposition clarity, visual consistency, copy quality, competitive differentiation.",
    color: "wc-blue",
  },
  {
    icon: MousePointer2,
    title: "User Experience",
    description:
      "Navigation, accessibility, visual hierarchy, CTAs, and conversion paths.",
    color: "wc-green",
  },
  {
    icon: Shield,
    title: "Security",
    description:
      "Vulnerabilities, headers, encryption, backup systems, and risk factors.",
    color: "wc-dark",
  },
  {
    icon: Target,
    title: "Business Alignment",
    description:
      "Does your site actually serve your target market and business goals?",
    color: "wc-cyan",
  },
  {
    icon: TrendingUp,
    title: "Traffic & Performance",
    description: "Where visitors come from, how they behave, what's working.",
    color: "wc-blue",
  },
];

const colorClasses: Record<string, { bg: string; icon: string; border: string }> = {
  "wc-cyan": { bg: "bg-wc-cyan-50", icon: "text-wc-cyan", border: "border-wc-cyan-300" },
  "wc-blue": { bg: "bg-wc-blue-50", icon: "text-wc-blue", border: "border-wc-blue-300" },
  "wc-green": { bg: "bg-wc-green-50", icon: "text-wc-green", border: "border-wc-green-300" },
  "wc-dark": { bg: "bg-wc-dark-50", icon: "text-wc-dark", border: "border-wc-dark-200" },
};

export function WhatWeCheck() {
  return (
    <section id="what-we-check" className="py-5xl px-6 relative scroll-mt-20 overflow-hidden">
      {/* Deep blue gradient background - matching hero */}
      <div className="absolute inset-0 bg-gradient-to-br from-wc-dark via-wc-blue-700 to-wc-dark-800" />
      <div className="absolute inset-0 bg-gradient-to-t from-wc-blue-900/80 via-transparent to-wc-cyan/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-wc-dark-900/50 via-transparent to-wc-dark-900/50" />

      {/* Grid pattern with edge fade */}
      <div className="absolute inset-0 pointer-events-none">
        <svg
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <pattern id="gridWhatWeCheck" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#5BC0EB" strokeWidth="0.5" opacity="0.3" />
            </pattern>
            <radialGradient id="gridFadeWhatWeCheck" cx="50%" cy="50%" r="70%" fx="50%" fy="50%">
              <stop offset="0%" stopColor="white" stopOpacity="1" />
              <stop offset="50%" stopColor="white" stopOpacity="0.6" />
              <stop offset="80%" stopColor="white" stopOpacity="0.2" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
            <mask id="gridMaskWhatWeCheck">
              <rect width="100%" height="100%" fill="url(#gridFadeWhatWeCheck)" />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="url(#gridWhatWeCheck)" mask="url(#gridMaskWhatWeCheck)" />
        </svg>
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto">
        {/* Section Tag */}
        <div className="flex justify-center mb-4">
          <span className="inline-block px-4 py-1.5 text-sm font-semibold tracking-wide uppercase text-wc-green bg-wc-green/10 rounded-full border border-wc-green/20">
            Our Analysis
          </span>
        </div>
        {/* Section Title */}
        <h2 className="text-section font-semibold text-white text-center mb-4">
          What We Analyze
        </h2>
        <p className="text-body-lg text-white/70 text-center mb-12 max-w-2xl mx-auto">
          Comprehensive analysis across six key dimensions of your online presence.
        </p>

        {/* Feature Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => {
            const colors = colorClasses[category.color];
            return (
              <div
                key={category.title}
                className="bg-white rounded-2xl p-8 shadow-lg"
              >
                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center mb-5`}>
                  <category.icon className={`w-7 h-7 ${colors.icon}`} />
                </div>

                {/* Title */}
                <h3 className="text-card-title text-gray-900 mb-3">
                  {category.title}
                </h3>

                {/* Description */}
                <p className="text-body text-gray-600">
                  {category.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
