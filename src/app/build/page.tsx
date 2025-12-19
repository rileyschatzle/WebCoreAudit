"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Globe,
  FileStack,
  LayoutGrid,
  FileDown,
  Briefcase,
  Zap,
  MessageSquare,
  Layout,
  TrendingUp,
  Shield,
  FileText,
  Target,
  Share2,
  Award,
} from "lucide-react";

// Category definitions
const CATEGORIES = [
  {
    id: "business",
    name: "Business Overview",
    description: "Target market clarity, value proposition, business model",
    icon: Briefcase,
    tier: "mvp",
  },
  {
    id: "technical",
    name: "Technical Foundation",
    description: "Site speed, mobile responsiveness, SEO basics",
    icon: Zap,
    tier: "mvp",
  },
  {
    id: "brand",
    name: "Brand & Messaging",
    description: "Value proposition, visual consistency, tone",
    icon: MessageSquare,
    tier: "mvp",
  },
  {
    id: "ux",
    name: "User Experience",
    description: "Navigation, visual hierarchy, CTAs, accessibility",
    icon: Layout,
    tier: "standard",
  },
  {
    id: "traffic",
    name: "Traffic Readiness",
    description: "Analytics setup, SEO infrastructure, sitemap",
    icon: TrendingUp,
    tier: "standard",
  },
  {
    id: "security",
    name: "Security",
    description: "SSL/HTTPS, form security, security headers",
    icon: Shield,
    tier: "standard",
  },
  {
    id: "content",
    name: "Content Strategy",
    description: "Blog presence, publishing cadence, SEO content",
    icon: FileText,
    tier: "premium",
  },
  {
    id: "conversion",
    name: "Conversion & Engagement",
    description: "Lead capture, email signup, pricing transparency",
    icon: Target,
    tier: "premium",
  },
  {
    id: "social",
    name: "Social & Multimedia",
    description: "Social links, video content, media optimization",
    icon: Share2,
    tier: "premium",
  },
  {
    id: "trust",
    name: "Trust & Credibility",
    description: "Testimonials, case studies, team page, policies",
    icon: Award,
    tier: "premium",
  },
];

// Removed multi-page options - now we audit one page at a time
// Users can paste additional URLs if they want to audit more pages

type Step = "url" | "pages" | "categories" | "format";

interface WizardState {
  url: string;
  additionalUrls: string[];
  categories: string[];
  format: "markdown" | "json" | "both";
}

export default function BuildPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState<Step>("url");
  const [error, setError] = useState("");

  const [state, setState] = useState<WizardState>({
    url: "",
    additionalUrls: [],
    categories: ["business", "technical", "brand"], // MVP defaults
    format: "markdown",
  });
  const [additionalUrlsText, setAdditionalUrlsText] = useState("");

  // Check for URL param from Hero redirect and auto-advance
  useEffect(() => {
    const urlParam = searchParams.get("url");
    if (urlParam) {
      setState((prev) => ({ ...prev, url: urlParam }));
      setCurrentStep("pages");
    }
  }, [searchParams]);

  const steps: { id: Step; label: string; icon: React.ReactNode }[] = [
    { id: "url", label: "Website", icon: <Globe className="w-4 h-4" /> },
    { id: "pages", label: "Pages", icon: <FileStack className="w-4 h-4" /> },
    { id: "categories", label: "Categories", icon: <LayoutGrid className="w-4 h-4" /> },
    { id: "format", label: "Format", icon: <FileDown className="w-4 h-4" /> },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

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

  const handleNext = () => {
    setError("");

    if (currentStep === "url") {
      if (!state.url) {
        setError("Please enter a URL");
        return;
      }
      if (!validateUrl(state.url)) {
        setError("Please enter a valid URL");
        return;
      }
      setCurrentStep("pages");
    } else if (currentStep === "pages") {
      setCurrentStep("categories");
    } else if (currentStep === "categories") {
      if (state.categories.length === 0) {
        setError("Please select at least one category");
        return;
      }
      setCurrentStep("format");
    } else if (currentStep === "format") {
      // Submit
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep === "pages") setCurrentStep("url");
    else if (currentStep === "categories") setCurrentStep("pages");
    else if (currentStep === "format") setCurrentStep("categories");
  };

  const handleSubmit = () => {
    const urlToUse = state.url.startsWith("http") ? state.url : `https://${state.url}`;
    // Calculate total pages: 1 main URL + any additional URLs
    const totalPages = 1 + state.additionalUrls.length;
    const params = new URLSearchParams({
      url: urlToUse,
      pages: String(totalPages),
      categories: state.categories.join(","),
      format: state.format,
    });
    // If there are additional URLs, pass them as a comma-separated list
    if (state.additionalUrls.length > 0) {
      params.set("additionalUrls", state.additionalUrls.join(","));
    }
    router.push(`/audit?${params.toString()}`);
  };

  const toggleCategory = (id: string) => {
    setState((prev) => ({
      ...prev,
      categories: prev.categories.includes(id)
        ? prev.categories.filter((c) => c !== id)
        : [...prev.categories, id],
    }));
  };

  const mvpCategories = CATEGORIES.filter((c) => c.tier === "mvp");
  const standardCategories = CATEGORIES.filter((c) => c.tier === "standard");
  const premiumCategories = CATEGORIES.filter((c) => c.tier === "premium");

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </Link>
          <span className="text-sm font-medium text-gray-400">Build Your Report</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-12">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => {
                  if (index < currentStepIndex) {
                    setCurrentStep(step.id);
                  }
                }}
                disabled={index > currentStepIndex}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                  step.id === currentStep
                    ? "bg-accent-blue text-white"
                    : index < currentStepIndex
                    ? "bg-green-100 text-green-700 cursor-pointer hover:bg-green-200"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                {index < currentStepIndex ? <Check className="w-4 h-4" /> : step.icon}
                <span className="text-sm font-medium hidden sm:inline">{step.label}</span>
              </button>
              {index < steps.length - 1 && (
                <div className={`w-8 h-0.5 mx-1 ${index < currentStepIndex ? "bg-green-300" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          {/* URL Step */}
          {currentStep === "url" && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">What website do you want to audit?</h2>
                <p className="text-gray-500">Enter the URL of the website you want to analyze</p>
              </div>

              <div className="max-w-md mx-auto">
                <input
                  type="text"
                  value={state.url}
                  onChange={(e) => setState((prev) => ({ ...prev, url: e.target.value }))}
                  placeholder="https://example.com"
                  className={`w-full px-4 py-3 rounded-xl border ${
                    error ? "border-red-300" : "border-gray-200"
                  } focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue text-center font-mono`}
                />
                {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
              </div>
            </div>
          )}

          {/* Pages Step */}
          {currentStep === "pages" && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Page Selection</h2>
                <p className="text-gray-500">We audit one page at a time for the most accurate results</p>
              </div>

              {/* Primary URL display */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm text-green-700 font-medium">Primary page to audit</div>
                    <div className="font-mono text-gray-900">{state.url}</div>
                  </div>
                </div>
              </div>

              {/* Additional URLs section */}
              <div className="space-y-3">
                <div className="text-center">
                  <span className="text-sm text-gray-500">Want to audit additional pages? Paste their URLs below (one per line)</span>
                </div>
                <textarea
                  value={additionalUrlsText}
                  onChange={(e) => {
                    const text = e.target.value;
                    setAdditionalUrlsText(text);
                    // Parse URLs from text (one per line)
                    const urls = text
                      .split("\n")
                      .map(line => line.trim())
                      .filter(line => line.length > 0 && (line.startsWith("http://") || line.startsWith("https://") || line.startsWith("/")));
                    setState(prev => ({ ...prev, additionalUrls: urls }));
                  }}
                  placeholder={"https://example.com/about\nhttps://example.com/pricing\nhttps://example.com/contact"}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue font-mono text-sm"
                />
                {state.additionalUrls.length > 0 && (
                  <div className="text-sm text-gray-500 text-center">
                    {state.additionalUrls.length} additional page{state.additionalUrls.length !== 1 ? "s" : ""} will be audited
                  </div>
                )}
              </div>

              {/* Info box */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
                <strong>Tip:</strong> Check your sitemap at <span className="font-mono">/sitemap.xml</span> to find all available pages on your site.
              </div>
            </div>
          )}

          {/* Categories Step */}
          {currentStep === "categories" && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">What should we analyze?</h2>
                <p className="text-gray-500">Select the categories you want in your report</p>
              </div>

              {error && <p className="text-red-500 text-sm text-center">{error}</p>}

              {/* MVP Tier */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    Base
                  </span>
                  <span className="text-sm text-gray-500">Included in every report</span>
                </div>
                <div className="space-y-2">
                  {mvpCategories.map((category) => {
                    const Icon = category.icon;
                    const isSelected = state.categories.includes(category.id);
                    return (
                      <button
                        key={category.id}
                        onClick={() => toggleCategory(category.id)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                          isSelected
                            ? "border-green-500 bg-green-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${isSelected ? "bg-green-100" : "bg-gray-100"}`}>
                          <Icon className={`w-5 h-5 ${isSelected ? "text-green-600" : "text-gray-500"}`} />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{category.name}</div>
                          <div className="text-sm text-gray-500">{category.description}</div>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? "border-green-500 bg-green-500" : "border-gray-300"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Standard Tier */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    Standard
                  </span>
                  <span className="text-sm text-gray-500">Recommended additions</span>
                </div>
                <div className="space-y-2">
                  {standardCategories.map((category) => {
                    const Icon = category.icon;
                    const isSelected = state.categories.includes(category.id);
                    return (
                      <button
                        key={category.id}
                        onClick={() => toggleCategory(category.id)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                          isSelected
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${isSelected ? "bg-blue-100" : "bg-gray-100"}`}>
                          <Icon className={`w-5 h-5 ${isSelected ? "text-blue-600" : "text-gray-500"}`} />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{category.name}</div>
                          <div className="text-sm text-gray-500">{category.description}</div>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? "border-blue-500 bg-blue-500" : "border-gray-300"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Premium Tier */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                    Premium
                  </span>
                  <span className="text-sm text-gray-500">Deep analysis</span>
                </div>
                <div className="space-y-2">
                  {premiumCategories.map((category) => {
                    const Icon = category.icon;
                    const isSelected = state.categories.includes(category.id);
                    return (
                      <button
                        key={category.id}
                        onClick={() => toggleCategory(category.id)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                          isSelected
                            ? "border-purple-500 bg-purple-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${isSelected ? "bg-purple-100" : "bg-gray-100"}`}>
                          <Icon className={`w-5 h-5 ${isSelected ? "text-purple-600" : "text-gray-500"}`} />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{category.name}</div>
                          <div className="text-sm text-gray-500">{category.description}</div>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? "border-purple-500 bg-purple-500" : "border-gray-300"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="text-center text-sm text-gray-500">
                {state.categories.length} categories selected
              </div>
            </div>
          )}

          {/* Format Step */}
          {currentStep === "format" && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">How do you want your report?</h2>
                <p className="text-gray-500">Choose your preferred format</p>
              </div>

              <div className="grid grid-cols-1 gap-3 max-w-md mx-auto">
                {[
                  { id: "markdown", label: "Markdown", description: "Easy to read and share" },
                  { id: "json", label: "JSON", description: "For developers and integrations" },
                  { id: "both", label: "Both", description: "Get both formats" },
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setState((prev) => ({ ...prev, format: option.id as WizardState["format"] }))}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      state.format === option.id
                        ? "border-accent-blue bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="font-semibold text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-500">{option.description}</div>
                  </button>
                ))}
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-xl p-6 mt-8">
                <h3 className="font-semibold text-gray-900 mb-4">Report Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Website</span>
                    <span className="font-mono text-gray-900">{state.url}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Pages to analyze</span>
                    <span className="text-gray-900">{1 + state.additionalUrls.length} page{(1 + state.additionalUrls.length) !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Categories</span>
                    <span className="text-gray-900">{state.categories.length} selected</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Format</span>
                    <span className="text-gray-900 capitalize">{state.format}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={handleBack}
            disabled={currentStep === "url"}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              currentStep === "url"
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-3 bg-accent-blue hover:bg-accent-blue-hover text-white rounded-xl font-medium transition-all"
          >
            {currentStep === "format" ? "Generate Report" : "Continue"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </main>
    </div>
  );
}
