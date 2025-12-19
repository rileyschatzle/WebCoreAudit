import { Globe, Search, FileCheck } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Globe,
    title: "Enter Your URL",
    description: "Paste your website address. We'll take it from there.",
    badgeClass: "text-wc-cyan",
    iconBoxClass: "bg-gradient-to-br from-wc-cyan-100 to-wc-cyan-50 border-wc-cyan/20",
    iconClass: "text-wc-cyan",
    glowClass: "bg-wc-cyan/20",
  },
  {
    number: "02",
    icon: Search,
    title: "We Analyze Everything",
    description:
      "Our tool checks 100+ factors across 6 categories - technical performance, brand messaging, UX, security, and more.",
    badgeClass: "text-wc-blue",
    iconBoxClass: "bg-gradient-to-br from-wc-blue-100 to-wc-blue-50 border-wc-blue/20",
    iconClass: "text-wc-blue",
    glowClass: "bg-wc-blue/20",
  },
  {
    number: "03",
    icon: FileCheck,
    title: "Get Your Report",
    description:
      "A detailed PDF hits your inbox in under 5 minutes with scores, issues, and exactly what to fix.",
    badgeClass: "text-wc-green",
    iconBoxClass: "bg-gradient-to-br from-wc-green-100 to-wc-green-50 border-wc-green/20",
    iconClass: "text-wc-green",
    glowClass: "bg-wc-green/20",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-5xl px-6 scroll-mt-20 relative overflow-hidden">
      {/* Subtle background to blend with hero */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50/30 to-white pointer-events-none" />

      <div className="relative z-10 max-w-[1200px] mx-auto">
        {/* Section Tag */}
        <div className="flex justify-center mb-4">
          <span className="inline-block px-4 py-1.5 text-sm font-semibold tracking-wide uppercase text-wc-cyan bg-wc-cyan/10 rounded-full border border-wc-cyan/20">
            The Process
          </span>
        </div>
        {/* Section Title */}
        <h2 className="text-section font-semibold text-gray-900 text-center mb-4">
          How It Works
        </h2>
        <p className="text-body-lg text-gray-500 text-center mb-16 max-w-xl mx-auto">
          Three simple steps to understand your website&apos;s performance
        </p>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 lg:gap-16 relative">
          {/* Connecting line - hidden on mobile */}
          <div className="hidden md:block absolute top-[70px] left-[22%] right-[22%] h-px">
            <div className="w-full h-full bg-gradient-to-r from-wc-cyan via-wc-blue to-wc-green opacity-30" />
          </div>

          {steps.map((step) => (
            <div
              key={step.number}
              className="relative flex flex-col items-center text-center"
            >
              {/* Step badge */}
              <div className={`text-xs font-bold tracking-widest uppercase ${step.badgeClass} mb-4`}>
                Step {step.number}
              </div>

              {/* Icon container */}
              <div className="relative w-[100px] h-[100px] mb-6">
                {/* Icon box */}
                <div className={`relative w-full h-full rounded-3xl ${step.iconBoxClass} border shadow-sm flex items-center justify-center`}>
                  <step.icon className={`w-10 h-10 ${step.iconClass}`} strokeWidth={1.5} />
                </div>
              </div>

              {/* Title */}
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>

              {/* Description */}
              <p className="text-body text-gray-500 max-w-[300px] leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
