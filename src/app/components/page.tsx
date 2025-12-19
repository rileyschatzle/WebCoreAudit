"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowLeft,
  Search,
  Mail,
  Check,
  X,
  AlertTriangle,
  Info,
  Loader2,
  ChevronRight,
  Globe,
  Shield,
  Gauge,
} from "lucide-react";
import { useState } from "react";

const easeSmooth = [0.4, 0, 0.2, 1] as const;

function ComponentSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: easeSmooth }}
      viewport={{ once: true }}
      className="mb-16"
    >
      <div className="mb-6">
        <h2 className="text-card-title text-gray-900 mb-2">{title}</h2>
        <p className="text-body text-gray-500">{description}</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
        {children}
      </div>
    </motion.section>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="mt-4 bg-gray-900 text-gray-100 rounded-lg p-4 text-sm font-mono overflow-x-auto">
      <code>{code}</code>
    </pre>
  );
}

export default function ComponentsPage() {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Logo" width={32} height={32} />
            <span className="font-condensed font-bold text-gray-900">
              Components
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: easeSmooth }}
          className="text-center mb-16"
        >
          <h1 className="text-hero text-gray-900 mb-4">Component Library</h1>
          <p className="text-body-lg text-gray-600 max-w-2xl mx-auto">
            All UI components used throughout WebCore Audit, built with React,
            Tailwind CSS, and Framer Motion.
          </p>
          <div className="flex justify-center gap-4 mt-6">
            <Link href="/style-guide">
              <Button variant="chrome">View Style Guide</Button>
            </Link>
          </div>
        </motion.div>

        {/* Buttons */}
        <ComponentSection
          title="Buttons"
          description="Primary actions, secondary options, and nostalgic chrome effects."
        >
          <div className="space-y-8">
            {/* Variants */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">
                Variants
              </h4>
              <div className="flex flex-wrap gap-4">
                <Button>Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="link">Link</Button>
                <Button variant="chrome">Chrome</Button>
              </div>
            </div>

            {/* Sizes */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">
                Sizes
              </h4>
              <div className="flex flex-wrap items-center gap-4">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* States */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">
                States
              </h4>
              <div className="flex flex-wrap gap-4">
                <Button disabled>Disabled</Button>
                <Button variant="chrome" disabled>
                  Disabled Chrome
                </Button>
                <Button>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading
                </Button>
              </div>
            </div>

            {/* With Icons */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">
                With Icons
              </h4>
              <div className="flex flex-wrap gap-4">
                <Button>
                  <Mail className="w-4 h-4" />
                  Email Report
                </Button>
                <Button variant="chrome">
                  Get Started
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </ComponentSection>

        {/* Inputs */}
        <ComponentSection
          title="Inputs"
          description="Form inputs with various states and decorations."
        >
          <div className="space-y-8 max-w-md">
            {/* Basic */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">
                Basic Input
              </h4>
              <Input placeholder="Enter your email" />
            </div>

            {/* With Icon */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">
                With Icon
              </h4>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input className="pl-10" placeholder="Search..." />
              </div>
            </div>

            {/* URL Input (Hero Style) */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">
                URL Input (Hero)
              </h4>
              <div className="flex gap-2 p-2 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-2 flex-1 px-3">
                  <Globe className="w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    placeholder="https://yourwebsite.com"
                    className="flex-1 bg-transparent text-sm font-mono outline-none"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                  />
                </div>
                <Button variant="chrome" size="sm">
                  Analyze
                </Button>
              </div>
            </div>

            {/* States */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">
                States
              </h4>
              <div className="space-y-3">
                <Input placeholder="Default" />
                <Input
                  placeholder="Error state"
                  className="border-red-500 focus-visible:ring-red-500"
                />
                <Input placeholder="Disabled" disabled />
              </div>
            </div>
          </div>
        </ComponentSection>

        {/* Cards */}
        <ComponentSection
          title="Cards"
          description="Container components for grouping related content."
        >
          <div className="grid md:grid-cols-3 gap-6">
            {/* Basic Card */}
            <motion.div
              whileHover={{ y: -2 }}
              className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 bg-wc-cyan-100 rounded-lg flex items-center justify-center mb-4">
                <Gauge className="w-5 h-5 text-wc-cyan-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Basic Card</h3>
              <p className="text-sm text-gray-500">
                Simple card with subtle shadow and hover effect.
              </p>
            </motion.div>

            {/* Glass Card */}
            <motion.div
              whileHover={{ y: -2 }}
              className="bg-gradient-to-br from-wc-cyan-50 to-wc-blue-50 border border-wc-cyan-200/50 rounded-xl p-6 backdrop-blur-sm"
            >
              <div className="w-10 h-10 bg-white/80 rounded-lg flex items-center justify-center mb-4 shadow-sm">
                <Shield className="w-5 h-5 text-wc-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Glass Card</h3>
              <p className="text-sm text-gray-600">
                Glassmorphism effect with gradient background.
              </p>
            </motion.div>

            {/* Interactive Card */}
            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm cursor-pointer group"
            >
              <div className="w-10 h-10 bg-wc-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-wc-green-200 transition-colors">
                <Globe className="w-5 h-5 text-wc-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-wc-green-700 transition-colors">
                Interactive Card
              </h3>
              <p className="text-sm text-gray-500">
                Click me! Animated with Framer Motion.
              </p>
            </motion.div>
          </div>

          {/* Score Card */}
          <div className="mt-8">
            <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">
              Score Cards
            </h4>
            <div className="grid md:grid-cols-4 gap-4">
              {[
                { label: "Performance", score: 92, color: "text-green-500" },
                { label: "Security", score: 78, color: "text-amber-500" },
                { label: "SEO", score: 85, color: "text-green-500" },
                { label: "Accessibility", score: 54, color: "text-red-500" },
              ].map((item) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  className="bg-white border border-gray-200 rounded-xl p-4 text-center"
                >
                  <div className={`text-3xl font-bold ${item.color} mb-1`}>
                    {item.score}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider">
                    {item.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </ComponentSection>

        {/* Alerts */}
        <ComponentSection
          title="Alerts & Badges"
          description="Feedback and status indicators."
        >
          <div className="space-y-4 max-w-xl">
            {/* Success */}
            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <Check className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-800">Success</h4>
                <p className="text-sm text-green-700">
                  Your audit has been completed successfully.
                </p>
              </div>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800">Warning</h4>
                <p className="text-sm text-amber-700">
                  Some issues were found that need attention.
                </p>
              </div>
            </div>

            {/* Error */}
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <X className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800">Error</h4>
                <p className="text-sm text-red-700">
                  Failed to complete the audit. Please try again.
                </p>
              </div>
            </div>

            {/* Info */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800">Info</h4>
                <p className="text-sm text-blue-700">
                  Your report will be emailed within 5 minutes.
                </p>
              </div>
            </div>

            {/* Badges */}
            <div className="pt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">
                Badges
              </h4>
              <div className="flex flex-wrap gap-2">
                <span className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                  Default
                </span>
                <span className="px-2.5 py-1 text-xs font-medium bg-wc-cyan-100 text-wc-cyan-700 rounded-full">
                  Cyan
                </span>
                <span className="px-2.5 py-1 text-xs font-medium bg-wc-green-100 text-wc-green-700 rounded-full">
                  Success
                </span>
                <span className="px-2.5 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                  Warning
                </span>
                <span className="px-2.5 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                  Critical
                </span>
              </div>
            </div>
          </div>
        </ComponentSection>

        {/* Accordion */}
        <ComponentSection
          title="Accordion"
          description="Expandable content sections for FAQs and detailed information."
        >
          <Accordion type="single" collapsible className="w-full max-w-xl">
            <AccordionItem
              value="item-1"
              className="border border-gray-200 rounded-lg px-4 mb-2"
            >
              <AccordionTrigger className="hover:no-underline">
                What is WebCore Audit?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                WebCore Audit is a comprehensive website analysis tool that
                checks your site across multiple dimensions including
                performance, security, SEO, and user experience.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem
              value="item-2"
              className="border border-gray-200 rounded-lg px-4 mb-2"
            >
              <AccordionTrigger className="hover:no-underline">
                How long does an audit take?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                Most audits complete within 2-5 minutes depending on the size
                and complexity of your website.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem
              value="item-3"
              className="border border-gray-200 rounded-lg px-4"
            >
              <AccordionTrigger className="hover:no-underline">
                Is my data secure?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                Yes, we only analyze publicly available information and do not
                store sensitive data beyond what&apos;s necessary to generate your
                report.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </ComponentSection>

        {/* Progress Indicators */}
        <ComponentSection
          title="Progress Indicators"
          description="Loading states and progress visualization."
        >
          <div className="space-y-8 max-w-xl">
            {/* Linear Progress */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">
                Linear Progress
              </h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Performance</span>
                    <span className="text-gray-900 font-medium">92%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-wc-cyan to-wc-green rounded-full"
                      initial={{ width: 0 }}
                      whileInView={{ width: "92%" }}
                      transition={{ duration: 1, ease: easeSmooth }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Security</span>
                    <span className="text-gray-900 font-medium">67%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                      initial={{ width: 0 }}
                      whileInView={{ width: "67%" }}
                      transition={{ duration: 1, ease: easeSmooth, delay: 0.1 }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Spinner */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">
                Spinners
              </h4>
              <div className="flex gap-6 items-center">
                <Loader2 className="w-6 h-6 animate-spin text-wc-cyan" />
                <Loader2 className="w-8 h-8 animate-spin text-wc-blue" />
                <div className="w-10 h-10 border-4 border-gray-200 border-t-wc-cyan rounded-full animate-spin" />
              </div>
            </div>

            {/* Skeleton */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">
                Skeleton Loader
              </h4>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6" />
              </div>
            </div>
          </div>
        </ComponentSection>

        {/* Nostalgic Elements */}
        <ComponentSection
          title="Nostalgic Elements"
          description="Early internet inspired UI with modern touches."
        >
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl p-6 border border-gray-300">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Window */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">
                  Classic Window
                </h4>
                <div className="bg-gray-300 rounded-t-lg border border-gray-400">
                  <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-b from-gray-200 to-gray-300 rounded-t-lg border-b border-gray-400">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400 border border-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400 border border-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-400 border border-green-500" />
                    </div>
                    <span className="text-xs text-gray-600 flex-1 text-center">
                      WebCore Audit
                    </span>
                  </div>
                  <div className="p-4 bg-white">
                    <p className="text-sm text-gray-600">Window content area</p>
                  </div>
                </div>
              </div>

              {/* Toolbar */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">
                  Toolbar Buttons
                </h4>
                <div className="flex gap-1 p-2 bg-gradient-to-b from-gray-200 to-gray-300 rounded-lg border border-gray-400">
                  {["Back", "Forward", "Refresh", "Home"].map((label) => (
                    <button
                      key={label}
                      className="px-3 py-1.5 text-xs bg-gradient-to-b from-gray-100 to-gray-200 rounded border border-gray-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] hover:from-gray-50 hover:to-gray-150 active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Bar */}
              <div className="md:col-span-2">
                <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">
                  Status Bar
                </h4>
                <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-b from-gray-200 to-gray-300 rounded-lg border border-gray-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]">
                  <span className="text-xs text-gray-600">Ready</span>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-500">
                      analyzing...
                    </span>
                    <div className="w-24 h-3 bg-gray-300 rounded border border-gray-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)] overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-wc-cyan-400 to-wc-cyan-500"
                        animate={{ width: ["0%", "100%", "0%"] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ComponentSection>

        {/* Footer */}
        <div className="text-center pt-8 border-t border-gray-200">
          <Link
            href="/style-guide"
            className="text-wc-cyan-600 hover:text-wc-cyan-700 font-medium"
          >
            &larr; View Style Guide
          </Link>
        </div>
      </main>
    </div>
  );
}
