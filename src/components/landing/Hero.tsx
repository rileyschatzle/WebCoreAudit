"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight, FileStack, Zap, Check, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export function Hero() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const router = useRouter();
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [auditType, setAuditType] = useState<"quick" | "custom">("quick");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Prefetch audit and build pages for faster navigation
  useEffect(() => {
    router.prefetch('/audit');
    router.prefetch('/build');
  }, [router]);

  const validateUrl = (value: string) => {
    if (!value) return false;
    try {
      const urlToTest = value.startsWith("http") ? value : `https://${value}`;
      new URL(urlToTest);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (!url) {
      setError("Please enter a URL");
      return;
    }
    if (!validateUrl(url)) {
      setError("That doesn't look like a valid URL. Try including https://");
      return;
    }
    setError("");
    setIsLoading(true);

    const urlToUse = url.startsWith("http") ? url : `https://${url}`;

    if (auditType === "quick") {
      // Quick audit - 3 base categories, 1 page (homepage)
      router.push(
        `/audit?url=${encodeURIComponent(urlToUse)}&pages=1&categories=business,technical,brand`
      );
    } else {
      // Custom - go to build wizard with URL pre-filled
      router.push(`/build?url=${encodeURIComponent(urlToUse)}`);
    }
  };

  return (
    <section
      id="hero"
      className="relative min-h-[calc(100vh-72px)] h-[calc(100vh-72px)] w-full flex items-center justify-center px-6 overflow-hidden mt-[72px]"
    >
      {/* Enhanced deep blue gradient background */}
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
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#5BC0EB" strokeWidth="0.5" opacity="0.3" />
            </pattern>
            <radialGradient id="gridFade" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <stop offset="0%" stopColor="white" stopOpacity="1" />
              <stop offset="60%" stopColor="white" stopOpacity="0.8" />
              <stop offset="85%" stopColor="white" stopOpacity="0.3" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
            <mask id="gridMask">
              <rect width="100%" height="100%" fill="url(#gridFade)" />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" mask="url(#gridMask)" />
        </svg>
      </div>

      {/* Subtle center glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-wc-cyan/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Content wrapper - flex column to stack card and trust indicators */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Glass table container */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          className="relative max-w-[720px] w-full"
        >
          {/* Gradient border glow */}
          <div className="absolute -inset-[1px] bg-gradient-to-br from-wc-cyan/30 via-transparent to-wc-blue/20 rounded-3xl blur-sm" />
          <div className="absolute -inset-[1px] bg-gradient-to-br from-wc-cyan/20 via-white/50 to-wc-green/15 rounded-3xl" />

        <div className="relative bg-white/80 backdrop-blur-2xl rounded-3xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.06)] p-10 md:p-12">
          {/* Glass reflection effect */}
          <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/50 to-transparent" />
          </div>

          <div className="relative z-10 text-center">
        {/* Logo Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex justify-center mb-6"
        >
          <Image
            src="/logo.png"
            alt="WebCore Audit"
            width={80}
            height={80}
            className="w-20 h-20 drop-shadow-lg"
          />
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-[38px] md:text-[56px] font-bold tracking-[-0.035em] leading-[1.05] mb-5"
        >
          <span className="block text-gray-900">See what&apos;s</span>
          <span className="block relative">
            <span className="bg-gradient-to-r from-wc-cyan via-wc-blue to-wc-cyan bg-[length:200%_auto] animate-gradient-x bg-clip-text text-transparent">
              really going on
            </span>
          </span>
          <span className="block text-gray-900">with your website.</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-body-lg text-gray-600 mb-8 max-w-[560px] mx-auto"
        >
          Get a comprehensive audit covering performance, brand clarity,
          user experience, and security. Results in minutes.
        </motion.p>

        {/* Audit Type Selector */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex items-center justify-center gap-3 mb-6"
        >
          <button
            type="button"
            onClick={() => setAuditType("quick")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
              auditType === "quick"
                ? "bg-gradient-to-r from-wc-cyan to-wc-blue text-white shadow-lg shadow-wc-blue/25"
                : "bg-white text-gray-600 border border-gray-200 hover:border-wc-cyan/50 hover:text-wc-blue"
            }`}
          >
            <Zap className="w-4 h-4" />
            Quick Audit
          </button>
          <button
            type="button"
            onClick={() => setAuditType("custom")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
              auditType === "custom"
                ? "bg-gradient-to-r from-wc-cyan to-wc-blue text-white shadow-lg shadow-wc-blue/25"
                : "bg-white text-gray-600 border border-gray-200 hover:border-wc-cyan/50 hover:text-wc-blue"
            }`}
          >
            <FileStack className="w-4 h-4" />
            Custom Report
          </button>
        </motion.div>

        {/* Audit Type Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.55 }}
          className="text-sm text-gray-500 mb-6"
        >
          {auditType === "quick" ? (
            <>
              <span className="font-medium text-gray-700">Quick Audit:</span>{" "}
              3 core categories • Homepage analysis • Instant results
            </>
          ) : (
            <>
              <span className="font-medium text-gray-700">Custom Report:</span>{" "}
              Choose categories • Add specific pages • Pick your format
            </>
          )}
        </motion.p>

        {/* URL Input Form */}
        <motion.form
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          onSubmit={handleSubmit}
          className="w-full max-w-[560px] mx-auto"
        >
          <div className="relative group">
            {/* Gradient glow effect on hover/focus */}
            <div className={`absolute -inset-1 bg-gradient-to-r from-wc-cyan/40 via-wc-blue/40 to-wc-green/40 rounded-2xl blur-lg opacity-0 group-hover:opacity-60 group-focus-within:opacity-100 transition-opacity duration-300`} />
            <div
              className={`relative flex items-center gap-3 bg-white border-2 ${
                error ? "border-critical" : "border-gray-200 group-hover:border-wc-cyan/50 group-focus-within:border-wc-cyan"
              } rounded-2xl p-2 pl-5 shadow-xl shadow-gray-200/60 transition-all duration-300`}
            >
              {/* URL icon */}
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-wc-cyan/10 to-wc-blue/10 flex-shrink-0">
                <svg className="w-4 h-4 text-wc-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (error) setError("");
                }}
                placeholder="https://yourwebsite.com"
                className="flex-1 bg-transparent border-none text-base font-mono text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0 focus-visible:shadow-none py-1"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 bg-gradient-to-r from-wc-green to-wc-green-600 text-white px-6 py-3.5 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg hover:shadow-wc-green-600/35 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    {auditType === "quick" ? "Get Quick Audit" : "Customize Report"}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
          {error && (
            <p className="mt-3 text-sm text-critical text-left">{error}</p>
          )}
        </motion.form>

          </div>
        </div>
        </motion.div>

        {/* Trust indicators - below the glass table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
        >
          <span className="flex items-center gap-2 text-white/80 text-sm">
            <Check className="w-4 h-4 text-wc-green" />
            AI-powered insights
          </span>
          <span className="flex items-center gap-2 text-white/80 text-sm">
            <Check className="w-4 h-4 text-wc-green" />
            Free to use
          </span>
          <span className="flex items-center gap-2 text-white/80 text-sm">
            <Check className="w-4 h-4 text-wc-green" />
            Results in minutes
          </span>
        </motion.div>
      </div>
    </section>
  );
}
