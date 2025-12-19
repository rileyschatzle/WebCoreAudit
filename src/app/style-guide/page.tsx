"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { useState } from "react";

const easePresets = {
  smooth: [0.4, 0, 0.2, 1] as const,
  enter: [0, 0, 0.2, 1] as const,
  exit: [0.4, 0, 1, 1] as const,
  bounce: [0.34, 1.56, 0.64, 1] as const,
  spring: { type: "spring" as const, stiffness: 300, damping: 20 },
};

const colorPalettes = {
  cyan: {
    name: "Sky Cyan",
    description: "Vibrant badge accent from logo",
    colors: [
      { shade: "50", hex: "#E8F7FC" },
      { shade: "100", hex: "#C5EDF8" },
      { shade: "200", hex: "#91DCF3" },
      { shade: "300", hex: "#5BC0EB", isMain: true },
      { shade: "400", hex: "#4AA8D8" },
      { shade: "500", hex: "#3B96C9" },
      { shade: "600", hex: "#2D7AAA" },
      { shade: "700", hex: "#1F5E8B" },
    ],
  },
  blue: {
    name: "Ocean Blue",
    description: "Bright globe ocean color",
    colors: [
      { shade: "50", hex: "#E6F1FB" },
      { shade: "100", hex: "#C2DEF5" },
      { shade: "200", hex: "#7FBCEB" },
      { shade: "300", hex: "#4A9EE0" },
      { shade: "400", hex: "#2E86DE", isMain: true },
      { shade: "500", hex: "#2574C4" },
      { shade: "600", hex: "#1E5AA8" },
      { shade: "700", hex: "#1A4B8C" },
      { shade: "800", hex: "#143A6E" },
      { shade: "900", hex: "#0E2A50" },
    ],
  },
  green: {
    name: "Lime Green",
    description: "Vibrant land color - yellow to green",
    colors: [
      { shade: "50", hex: "#F4FCE3" },
      { shade: "100", hex: "#E5F7B8" },
      { shade: "200", hex: "#C8F06D" },
      { shade: "300", hex: "#B8E233" },
      { shade: "400", hex: "#7ED321", isMain: true },
      { shade: "500", hex: "#5FB818" },
      { shade: "600", hex: "#4CAF50" },
      { shade: "700", hex: "#3D8B40" },
      { shade: "800", hex: "#2E6830" },
      { shade: "900", hex: "#1F4520" },
    ],
  },
  dark: {
    name: "Deep Navy",
    description: "Rich dark accents and backgrounds",
    colors: [
      { shade: "50", hex: "#E8EEF5" },
      { shade: "100", hex: "#C5D3E5" },
      { shade: "200", hex: "#8FA8C9" },
      { shade: "300", hex: "#5A7DAD" },
      { shade: "400", hex: "#2E5891" },
      { shade: "500", hex: "#1E4175", isMain: true },
      { shade: "600", hex: "#183561" },
      { shade: "700", hex: "#12294D" },
      { shade: "800", hex: "#0C1C39" },
      { shade: "900", hex: "#060E25" },
    ],
  },
};

const typographyScale = [
  { name: "Hero", class: "text-hero", sample: "56px / 1.1" },
  { name: "Section", class: "text-section", sample: "36px / 1.2" },
  { name: "Card Title", class: "text-card-title", sample: "24px / 1.3" },
  { name: "Subsection", class: "text-subsection", sample: "18px / 1.4" },
  { name: "Body Large", class: "text-body-lg", sample: "18px / 1.6" },
  { name: "Body", class: "text-body", sample: "15px / 1.6" },
  { name: "Body Small", class: "text-body-sm", sample: "14px / 1.5" },
  { name: "Caption", class: "text-caption", sample: "12px / 1.4" },
];

const spacingScale = [
  { name: "xs", value: "4px" },
  { name: "sm", value: "8px" },
  { name: "md", value: "16px" },
  { name: "lg", value: "24px" },
  { name: "xl", value: "32px" },
  { name: "2xl", value: "48px" },
  { name: "3xl", value: "64px" },
  { name: "4xl", value: "80px" },
  { name: "5xl", value: "120px" },
];

function ColorSwatch({ hex, shade, isMain }: { hex: string; shade: string; isMain?: boolean }) {
  const [copied, setCopied] = useState(false);

  const copyHex = () => {
    navigator.clipboard.writeText(hex);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <motion.button
      onClick={copyHex}
      className={`group relative flex flex-col items-center ${isMain ? "scale-110 z-10" : ""}`}
      whileHover={{ scale: isMain ? 1.15 : 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div
        className={`w-14 h-14 rounded-lg shadow-md border border-black/10 ${isMain ? "ring-2 ring-offset-2 ring-wc-cyan" : ""}`}
        style={{ backgroundColor: hex }}
      />
      <span className="text-xs text-gray-500 mt-1">{shade}</span>
      <span className="text-[10px] text-gray-400 font-mono">{hex}</span>
      {copied && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-6 bg-wc-dark text-white text-xs px-2 py-1 rounded"
        >
          Copied!
        </motion.div>
      )}
    </motion.button>
  );
}

function AnimationDemo({ name, ease }: { name: string; ease: readonly [number, number, number, number] }) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-medium text-gray-700">{name}</span>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="text-xs text-wc-cyan-600 hover:text-wc-cyan-700"
        >
          {isPlaying ? "Reset" : "Play"}
        </button>
      </div>
      <div className="h-12 bg-gray-50 rounded-lg relative overflow-hidden">
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-8 h-8 bg-gradient-to-br from-wc-cyan to-wc-blue rounded-lg shadow-md"
          animate={{ x: isPlaying ? "calc(100% + 8rem)" : 0 }}
          transition={{ duration: 0.8, ease }}
        />
      </div>
      <code className="text-[10px] text-gray-400 mt-2 block font-mono">
        {`[${ease.join(", ")}]`}
      </code>
    </div>
  );
}

export default function StyleGuidePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Logo" width={32} height={32} />
            <span className="font-condensed font-bold text-gray-900">Style Guide</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: easePresets.smooth }}
          className="text-center mb-16"
        >
          <Image src="/logo.png" alt="Logo" width={80} height={80} className="mx-auto mb-6" />
          <h1 className="text-hero text-gray-900 mb-4">WebCore Audit</h1>
          <p className="text-body-lg text-gray-600 max-w-2xl mx-auto">
            Design system combining glassmorphism, early internet nostalgia,
            and modern animation for a premium yet approachable experience.
          </p>
        </motion.div>

        {/* Color Palettes */}
        <section className="mb-20">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-section text-gray-900 mb-8"
          >
            Color Palette
          </motion.h2>
          <p className="text-body text-gray-600 mb-8">
            Colors extracted from the logo: cyans and blues from the badge and ocean,
            greens from the land masses, and dark accents for depth.
          </p>

          <div className="space-y-12">
            {Object.entries(colorPalettes).map(([key, palette]) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ ease: easePresets.smooth }}
                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
              >
                <div className="mb-4">
                  <h3 className="text-card-title text-gray-900">{palette.name}</h3>
                  <p className="text-body-sm text-gray-500">{palette.description}</p>
                </div>
                <div className="flex flex-wrap gap-4 justify-start">
                  {palette.colors.map((color) => (
                    <ColorSwatch key={color.shade} {...color} />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Typography */}
        <section className="mb-20">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-section text-gray-900 mb-8"
          >
            Typography
          </motion.h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Font Families */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-card-title text-gray-900 mb-4">Font Families</h3>
              <div className="space-y-4">
                <div>
                  <span className="text-caption text-gray-500 uppercase tracking-wider">Primary</span>
                  <p className="text-2xl font-sans">Inter</p>
                </div>
                <div>
                  <span className="text-caption text-gray-500 uppercase tracking-wider">Condensed</span>
                  <p className="text-2xl font-condensed font-bold tracking-tight">Inter Tight</p>
                </div>
                <div>
                  <span className="text-caption text-gray-500 uppercase tracking-wider">Monospace</span>
                  <p className="text-xl font-mono">JetBrains Mono</p>
                </div>
              </div>
            </div>

            {/* Type Scale */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-card-title text-gray-900 mb-4">Type Scale</h3>
              <div className="space-y-3">
                {typographyScale.map((type) => (
                  <div key={type.name} className="flex items-baseline justify-between border-b border-gray-100 pb-2">
                    <span className={`${type.class} text-gray-900`}>{type.name}</span>
                    <span className="text-caption text-gray-400 font-mono">{type.sample}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Glassmorphism */}
        <section className="mb-20">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-section text-gray-900 mb-8"
          >
            Glassmorphism
          </motion.h2>

          <div className="relative rounded-3xl overflow-hidden p-8 min-h-[400px]" style={{
            background: "linear-gradient(135deg, #5BC0EB 0%, #2E86DE 50%, #1E4175 100%)"
          }}>
            {/* Decorative blobs */}
            <div className="absolute top-10 left-10 w-32 h-32 bg-wc-green/40 rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-40 h-40 bg-wc-cyan/30 rounded-full blur-3xl" />

            <div className="relative z-10 grid md:grid-cols-3 gap-6">
              {/* Glass Panel */}
              <motion.div
                whileHover={{ y: -4 }}
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-lg"
              >
                <h4 className="text-white font-semibold mb-2">Glass Panel</h4>
                <p className="text-white/70 text-sm">
                  Subtle transparency with heavy blur for floating elements.
                </p>
                <code className="text-[10px] text-white/50 mt-3 block font-mono">
                  bg-white/10 backdrop-blur-xl
                </code>
              </motion.div>

              {/* Glass Card */}
              <motion.div
                whileHover={{ y: -4 }}
                className="bg-white/20 backdrop-blur-2xl border border-white/30 rounded-2xl p-6 shadow-xl"
              >
                <h4 className="text-white font-semibold mb-2">Glass Card</h4>
                <p className="text-white/80 text-sm">
                  More opaque for important content that needs emphasis.
                </p>
                <code className="text-[10px] text-white/50 mt-3 block font-mono">
                  bg-white/20 backdrop-blur-2xl
                </code>
              </motion.div>

              {/* Frosted */}
              <motion.div
                whileHover={{ y: -4 }}
                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6"
              >
                <h4 className="text-white font-semibold mb-2">Frosted</h4>
                <p className="text-white/60 text-sm">
                  Minimal opacity for subtle depth layers.
                </p>
                <code className="text-[10px] text-white/50 mt-3 block font-mono">
                  bg-white/5 backdrop-blur-md
                </code>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Early Internet Nostalgia */}
        <section className="mb-20">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-section text-gray-900 mb-4"
          >
            Early Internet Nostalgia
          </motion.h2>
          <p className="text-body text-gray-600 mb-8">
            Chrome buttons, beveled edges, and tactile interactions reminiscent of Web 1.0
            and early macOS interfaces.
          </p>

          <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-8 border border-gray-300">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Chrome Buttons */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">Chrome Buttons</h4>
                <div className="flex flex-wrap gap-4">
                  <Button variant="chrome" size="lg">
                    Primary Action
                  </Button>
                  <Button variant="chrome">
                    Secondary
                  </Button>
                  <Button variant="chrome" size="sm">
                    Small
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Metallic gradient with inner shadows and beveled edges.
                </p>
              </div>

              {/* Beveled Cards */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">Beveled Elements</h4>
                <div className="space-y-3">
                  <div className="bg-gradient-to-b from-white to-gray-100 border border-gray-300 rounded-lg p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),inset_0_-1px_2px_rgba(0,0,0,0.1)]">
                    <span className="text-sm text-gray-700">Raised Panel</span>
                  </div>
                  <div className="bg-gradient-to-b from-gray-200 to-gray-100 border border-gray-400 rounded-lg p-4 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
                    <span className="text-sm text-gray-600">Inset Panel</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="md:col-span-2">
                <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">Nostalgic Progress</h4>
                <div className="bg-gradient-to-b from-gray-300 to-gray-200 rounded-full p-1 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]">
                  <motion.div
                    className="h-4 bg-gradient-to-b from-wc-cyan-300 to-wc-cyan-500 rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]"
                    initial={{ width: "0%" }}
                    whileInView={{ width: "75%" }}
                    transition={{ duration: 1.5, ease: easePresets.smooth }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Animation Eases */}
        <section className="mb-20">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-section text-gray-900 mb-4"
          >
            Animation Eases
          </motion.h2>
          <p className="text-body text-gray-600 mb-8">
            Framer Motion easing presets for smooth, natural animations.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <AnimationDemo name="Smooth" ease={easePresets.smooth} />
            <AnimationDemo name="Enter" ease={easePresets.enter} />
            <AnimationDemo name="Exit" ease={easePresets.exit} />
            <AnimationDemo name="Bounce" ease={easePresets.bounce} />
          </div>
        </section>

        {/* Spacing */}
        <section className="mb-20">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-section text-gray-900 mb-8"
          >
            Spacing Scale
          </motion.h2>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="space-y-4">
              {spacingScale.map((space) => (
                <div key={space.name} className="flex items-center gap-4">
                  <span className="w-12 text-sm font-medium text-gray-700">{space.name}</span>
                  <div
                    className="h-6 bg-gradient-to-r from-wc-cyan to-wc-blue rounded"
                    style={{ width: space.value }}
                  />
                  <span className="text-sm text-gray-400 font-mono">{space.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Shadows */}
        <section className="mb-20">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-section text-gray-900 mb-8"
          >
            Shadows & Depth
          </motion.h2>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { name: "Subtle", class: "shadow-subtle" },
              { name: "Elevated", class: "shadow-elevated" },
              { name: "Modal", class: "shadow-modal" },
              { name: "Glow", class: "shadow-glow" },
            ].map((shadow) => (
              <motion.div
                key={shadow.name}
                whileHover={{ y: -2 }}
                className={`bg-white rounded-xl p-6 border border-gray-100 ${shadow.class}`}
              >
                <span className="text-sm font-medium text-gray-700">{shadow.name}</span>
                <code className="text-xs text-gray-400 block mt-1 font-mono">{shadow.class}</code>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <div className="text-center pt-8 border-t border-gray-200">
          <Link href="/components" className="text-wc-cyan-600 hover:text-wc-cyan-700 font-medium">
            View Components Library &rarr;
          </Link>
        </div>
      </main>
    </div>
  );
}
