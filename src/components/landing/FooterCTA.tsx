"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

export function FooterCTA() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const validateUrl = (value: string) => {
    if (!value) return true;
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
    if (!url) {
      setError("Please enter a URL");
      return;
    }
    if (!validateUrl(url)) {
      setError("That doesn't look like a valid URL. Try including https://");
      return;
    }
    setError("");
    const urlToUse = url.startsWith("http") ? url : `https://${url}`;
    window.location.href = `/audit?url=${encodeURIComponent(urlToUse)}`;
  };

  return (
    <section className="pt-20 pb-14 px-6 relative overflow-hidden">
      {/* Brand blue gradient - medium to dark */}
      <div className="absolute inset-0 bg-gradient-to-b from-wc-blue-400 via-wc-blue-700 to-wc-dark" />

      <div className="relative z-10 max-w-[600px] mx-auto text-center">
        {/* Headline */}
        <h2 className="text-[28px] md:text-[32px] font-bold tracking-[-0.02em] text-white mb-2">
          Ready to see what&apos;s{" "}
          <span className="bg-gradient-to-r from-wc-cyan to-wc-green bg-clip-text text-transparent">
            under the hood
          </span>
          ?
        </h2>
        <p className="text-body text-white/60 mb-8">
          Get your free audit in minutes. No signup required.
        </p>

        {/* URL Input Form - exact copy from Hero */}
        <form onSubmit={handleSubmit} className="w-full max-w-[560px] mx-auto">
          <div className="relative group">
            {/* Gradient glow effect on hover/focus */}
            <div className="absolute -inset-1 bg-gradient-to-r from-wc-cyan/40 via-wc-blue/40 to-wc-green/40 rounded-2xl blur-lg opacity-0 group-hover:opacity-60 group-focus-within:opacity-100 transition-opacity duration-300" />
            <div
              className={`relative flex items-center gap-3 bg-white border-2 ${
                error ? "border-critical" : "border-gray-200 group-hover:border-wc-cyan/50 group-focus-within:border-wc-cyan"
              } rounded-2xl p-2 pl-5 shadow-xl shadow-black/20 transition-all duration-300`}
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
                className="flex items-center gap-2 bg-gradient-to-r from-wc-green to-wc-green-600 text-white px-6 py-3.5 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg hover:shadow-wc-green-600/35 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
              >
                Get Your Free Audit
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          {error && (
            <p className="mt-3 text-sm text-red-400 text-left">{error}</p>
          )}
        </form>
      </div>
    </section>
  );
}
