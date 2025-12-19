"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  CheckCircle,
  XCircle,
  ArrowLeft,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Info,
  Shield,
  Zap,
  MessageSquare,
  Layout,
  Briefcase,
  TrendingUp,
  FileText,
  Target,
  Share2,
  Award,
  Download,
  FileDown,
  ExternalLink,
  FileImage,
  Coins,
  Copy,
  Check,
  Square,
  CheckSquare,
  Mail,
} from "lucide-react";
import { FolderGrid } from "@/components/ui/folder-3d";
import { EmailCaptureModal } from "@/components/email-capture-modal";
import { useAuth } from "@/contexts/auth-context";

interface PassingItem {
  title: string;
  description: string;
  value?: string;
}

interface Issue {
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  impact: string;
}

interface CategoryScore {
  name: string;
  score: number;
  weight: number;
  issues: Issue[];
  passing: PassingItem[];
  recommendations: string[];
}

interface PageScore {
  url: string;
  path: string;
  title: string | null;
  overallScore: number;
  scores: {
    technical: number;
    content: number;
    ux: number;
  };
}

interface SiteSection {
  name: string;
  path: string;
  exists: boolean;
  description: string;
}

interface WebsiteTypeAnalysis {
  primaryType: string;
  confidence: number;
  characteristics: string[];
  subType?: string;
}

interface WebsiteBrief {
  businessName: string;
  businessDescription: string;
  targetAudience: string;
  industry: string;
  siteType: string;
  totalPages: number | null;
  websiteType?: WebsiteTypeAnalysis;
  siteStructure?: SiteSection[];
}

interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

interface CoreWebVitals {
  lcp: number | null;
  lcpRating: 'good' | 'needs-improvement' | 'poor' | null;
  fid: number | null;
  fidRating: 'good' | 'needs-improvement' | 'poor' | null;
  cls: number | null;
  clsRating: 'good' | 'needs-improvement' | 'poor' | null;
  inp: number | null;
  inpRating: 'good' | 'needs-improvement' | 'poor' | null;
  fcp: number | null;
  fcpRating: 'good' | 'needs-improvement' | 'poor' | null;
  ttfb: number | null;
  ttfbRating: 'good' | 'needs-improvement' | 'poor' | null;
}

interface LighthouseScores {
  performance: number | null;
  accessibility: number | null;
  bestPractices: number | null;
  seo: number | null;
}

interface PerformanceOpportunity {
  id: string;
  title: string;
  description: string;
  savings: string | null;
  score: number | null;
}

interface PageSpeedData {
  fetchTime: string;
  finalUrl: string;
  strategy: 'mobile' | 'desktop';
  coreWebVitals: CoreWebVitals;
  hasFieldData: boolean;
  lighthouseScores: LighthouseScores;
  metrics: {
    firstContentfulPaint: number | null;
    largestContentfulPaint: number | null;
    totalBlockingTime: number | null;
    cumulativeLayoutShift: number | null;
    speedIndex: number | null;
    timeToInteractive: number | null;
  };
  opportunities: PerformanceOpportunity[];
  passedAudits: number;
  totalAudits: number;
}

interface AuditResult {
  id: string;
  url: string;
  overallScore: number;
  summary: string;
  categories: CategoryScore[];
  scrapedAt: Date;
  analyzedAt: Date;
  clientLogo?: string | null;
  brief: WebsiteBrief;
  pageCount: number;
  pagesAnalyzed: PageScore[];
  bestPage: PageScore | null;
  worstPage: PageScore | null;
  tokenUsage?: TokenUsage;
  pageSpeed?: {
    mobile: PageSpeedData | null;
    desktop: PageSpeedData | null;
  };
}

type AuditStatus = "idle" | "scraping" | "analyzing" | "complete" | "error";

const steps = [
  { id: "scraping", label: "Scanning website structure" },
  { id: "analyzing", label: "Running AI analysis" },
  { id: "complete", label: "Generating report" },
];

const analysisPhases = [
  { label: "Discovering pages", icon: "globe" },
  { label: "Analyzing technical performance", icon: "gauge" },
  { label: "Evaluating brand messaging", icon: "message" },
  { label: "Checking security headers", icon: "shield" },
  { label: "Assessing user experience", icon: "layout" },
  { label: "Reviewing content strategy", icon: "file" },
  { label: "Measuring load performance", icon: "zap" },
  { label: "Analyzing conversion paths", icon: "target" },
  { label: "Checking social integration", icon: "share" },
  { label: "Evaluating trust signals", icon: "award" },
  { label: "Compiling findings", icon: "check" },
];

interface LoadingAnimationProps {
  url: string;
  currentStep: number;
  streamProgress?: StreamProgress | null;
  partialCategories?: CategoryScore[];
  runningScore?: number | null;
}

function LoadingAnimation({
  url,
  currentStep,
  streamProgress,
  partialCategories = [],
  runningScore,
}: LoadingAnimationProps) {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const startTimeRef = useRef(Date.now());

  // Calculate progress based on actual stream data
  const totalCategories = 10; // Total expected categories
  const baseProgress = streamProgress?.progress ??
    (partialCategories.length / totalCategories) * 100;

  // Add phase-based progress (scraping = 0-10%, analyzing = 10-95%, complete = 100%)
  const calculatedProgress = currentStep === 0
    ? Math.min(10, elapsedTime) // Scraping: 0-10% based on time
    : currentStep === 1
      ? 10 + (baseProgress * 0.85) // Analyzing: 10-95% based on categories
      : 95;

  useEffect(() => {
    // Only cycle through phases if we don't have stream progress
    const phaseInterval = setInterval(() => {
      if (!streamProgress) {
        setPhaseIndex((prev) => (prev + 1) % analysisPhases.length);
      }
    }, 8000);

    // Track elapsed time
    const timeInterval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    return () => {
      clearInterval(phaseInterval);
      clearInterval(timeInterval);
    };
  }, [streamProgress]);

  // Format remaining time estimate
  const formatTimeRemaining = () => {
    // Estimate based on categories completed
    if (partialCategories.length > 0) {
      const avgTimePerCategory = elapsedTime / partialCategories.length;
      const remaining = (totalCategories - partialCategories.length) * avgTimePerCategory;
      if (remaining <= 15) return "Almost done...";
      if (remaining <= 30) return "Less than 30 seconds";
      if (remaining <= 60) return "About a minute left";
      return `About ${Math.ceil(remaining / 60)} minutes left`;
    }
    // Fallback to phase-based estimate
    if (currentStep === 0) return "Scanning website...";
    if (currentStep === 1) return "About 1-2 minutes left";
    return "Finishing up...";
  };

  // Get current phase message from stream or fall back to cycling phases
  const currentMessage = streamProgress?.message || analysisPhases[phaseIndex].label;
  const currentPhase = analysisPhases[phaseIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
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
            <pattern id="gridLoading" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#5BC0EB" strokeWidth="0.5" opacity="0.3" />
            </pattern>
            <radialGradient id="gridFadeLoading" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <stop offset="0%" stopColor="white" stopOpacity="1" />
              <stop offset="60%" stopColor="white" stopOpacity="0.8" />
              <stop offset="85%" stopColor="white" stopOpacity="0.3" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
            <mask id="gridMaskLoading">
              <rect width="100%" height="100%" fill="url(#gridFadeLoading)" />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="url(#gridLoading)" mask="url(#gridMaskLoading)" />
        </svg>
      </div>

      {/* Subtle center glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-wc-cyan/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Loading content */}
      <div className="relative z-10 w-full max-w-2xl mx-auto px-6">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header with animated gradient */}
        <div className="relative bg-gradient-to-r from-wc-cyan via-wc-blue to-wc-cyan bg-[length:200%_100%] animate-[shimmer_3s_ease-in-out_infinite] p-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
              {/* Pulse ring */}
              <div className="absolute inset-0 rounded-2xl bg-white/30 animate-ping" style={{ animationDuration: '2s' }} />
            </div>
            <div className="text-white">
              <h2 className="text-xl font-semibold mb-1">
                Running Comprehensive Audit
              </h2>
              <p className="text-white/80 text-sm font-mono truncate max-w-md">
                {url}
              </p>
            </div>
          </div>
        </div>

        {/* Progress section */}
        <div className="p-6">
          {/* Main progress bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600 font-medium">Overall Progress</span>
              <span className="text-wc-blue font-semibold">{Math.round(calculatedProgress)}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-wc-cyan to-wc-blue rounded-full transition-all duration-500 ease-out relative"
                style={{ width: `${calculatedProgress}%` }}
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_ease-in-out_infinite]" />
              </div>
            </div>
          </div>

          {/* Running score preview */}
          {runningScore !== null && runningScore !== undefined && (
            <div className="mb-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Current Score</p>
              <p className="text-3xl font-bold text-wc-blue">{runningScore}</p>
            </div>
          )}

          {/* Current phase indicator */}
          <div className="bg-gradient-to-r from-wc-cyan-50 to-wc-blue-50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center text-wc-blue">
                {currentPhase.icon === "globe" && <Loader2 className="w-5 h-5 animate-spin" />}
                {currentPhase.icon === "gauge" && <Zap className="w-5 h-5" />}
                {currentPhase.icon === "message" && <MessageSquare className="w-5 h-5" />}
                {currentPhase.icon === "shield" && <Shield className="w-5 h-5" />}
                {currentPhase.icon === "layout" && <Layout className="w-5 h-5" />}
                {currentPhase.icon === "file" && <FileText className="w-5 h-5" />}
                {currentPhase.icon === "zap" && <Zap className="w-5 h-5" />}
                {currentPhase.icon === "target" && <Target className="w-5 h-5" />}
                {currentPhase.icon === "share" && <Share2 className="w-5 h-5" />}
                {currentPhase.icon === "award" && <Award className="w-5 h-5" />}
                {currentPhase.icon === "check" && <CheckCircle className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{currentMessage}</p>
                <p className="text-xs text-gray-500">
                  {streamProgress?.current && streamProgress?.total
                    ? `${streamProgress.current} of ${streamProgress.total} categories`
                    : "Processing..."}
                </p>
              </div>
            </div>
          </div>

          {/* Categories progress - show completed categories */}
          {partialCategories.length > 0 && (
            <div className="mb-6">
              <p className="text-xs text-gray-500 mb-2">Categories analyzed:</p>
              <div className="flex flex-wrap gap-1.5">
                {partialCategories.map((cat) => (
                  <span
                    key={cat.name}
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      cat.score >= 80
                        ? "bg-green-100 text-green-700"
                        : cat.score >= 60
                        ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {cat.name.split(" ")[0]} {cat.score}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Step indicators */}
          <div className="grid grid-cols-3 gap-3">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center gap-2 p-3 rounded-lg transition-all ${
                  index < currentStep
                    ? "bg-wc-green-50 border border-wc-green/20"
                    : index === currentStep
                    ? "bg-wc-blue-50 border border-wc-blue/20"
                    : "bg-gray-50 border border-gray-100"
                }`}
              >
                {index < currentStep ? (
                  <CheckCircle className="w-5 h-5 text-wc-green flex-shrink-0" />
                ) : index === currentStep ? (
                  <Loader2 className="w-5 h-5 text-wc-blue animate-spin flex-shrink-0" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                )}
                <span
                  className={`text-xs font-medium ${
                    index <= currentStep ? "text-gray-900" : "text-gray-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          {/* Time estimate */}
          <div className="text-center mt-6">
            <p className="text-sm font-medium text-gray-600">{formatTimeRemaining()}</p>
            <p className="text-xs text-gray-400 mt-1">
              {elapsedTime > 0 && `${Math.floor(elapsedTime / 60)}:${String(elapsedTime % 60).padStart(2, '0')} elapsed`}
            </p>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

const categoryIcons: Record<string, React.ReactNode> = {
  "Business Overview": <Briefcase className="w-5 h-5" />,
  "Technical Foundation": <Zap className="w-5 h-5" />,
  "Brand & Messaging": <MessageSquare className="w-5 h-5" />,
  "User Experience": <Layout className="w-5 h-5" />,
  "Traffic Readiness": <TrendingUp className="w-5 h-5" />,
  "Security": <Shield className="w-5 h-5" />,
  "Content Strategy": <FileText className="w-5 h-5" />,
  "Conversion & Engagement": <Target className="w-5 h-5" />,
  "Social & Multimedia": <Share2 className="w-5 h-5" />,
  "Trust & Credibility": <Award className="w-5 h-5" />,
};

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-500";
  if (score >= 60) return "text-amber-500";
  return "text-red-500";
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-red-500";
}

function getGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

function CategoryCard({ category, defaultExpanded = false }: { category: CategoryScore; defaultExpanded?: boolean }) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [showCritical, setShowCritical] = useState(true);
  const [showWarnings, setShowWarnings] = useState(true);
  const [showPassing, setShowPassing] = useState(false);

  const criticalIssues = category.issues.filter((i) => i.severity === "critical");
  const warningIssues = category.issues.filter(
    (i) => i.severity === "warning" || i.severity === "info"
  );
  const passingItems = category.passing || [];

  return (
    <div className="bg-white border border-gray-200 rounded-[12px] shadow-sm overflow-hidden">
      {/* Category Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-gray-100 rounded-lg text-gray-600">
            {categoryIcons[category.name] || <Info className="w-4 h-4" />}
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900 text-sm">{category.name}</h3>
            <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
              {criticalIssues.length > 0 && (
                <span className="flex items-center gap-1">
                  <XCircle className="w-3 h-3 text-red-500" />
                  {criticalIssues.length}
                </span>
              )}
              {warningIssues.length > 0 && (
                <span className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                  {warningIssues.length}
                </span>
              )}
              {passingItems.length > 0 && (
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  {passingItems.length}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className={`text-2xl font-bold ${getScoreColor(category.score)}`}>
              {category.score}
            </div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wide">
              {getGrade(category.score)}
            </div>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-100">
          {/* Toggle Buttons */}
          <div className="flex gap-1.5 p-3 bg-gray-50 border-b border-gray-100 flex-wrap">
            <button
              onClick={() => setShowCritical(!showCritical)}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all ${
                showCritical
                  ? "bg-red-100 text-red-700 border border-red-200"
                  : "bg-gray-100 text-gray-400 border border-gray-200"
              }`}
            >
              <XCircle className="w-3 h-3" />
              Critical ({criticalIssues.length})
            </button>
            <button
              onClick={() => setShowWarnings(!showWarnings)}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all ${
                showWarnings
                  ? "bg-amber-100 text-amber-700 border border-amber-200"
                  : "bg-gray-100 text-gray-400 border border-gray-200"
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              Warnings ({warningIssues.length})
            </button>
            <button
              onClick={() => setShowPassing(!showPassing)}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all ${
                showPassing
                  ? "bg-green-100 text-green-700 border border-green-200"
                  : "bg-gray-100 text-gray-400 border border-gray-200"
              }`}
            >
              <CheckCircle className="w-3 h-3" />
              Passing ({passingItems.length})
            </button>
          </div>

          {/* Items List */}
          <div className="p-3 space-y-2 max-h-[400px] overflow-y-auto">
            {/* Critical Issues */}
            {showCritical &&
              criticalIssues.map((issue, i) => (
                <div
                  key={`critical-${i}`}
                  className="p-3 bg-red-50 border border-red-100 rounded-lg"
                >
                  <div className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-red-900 text-sm">{issue.title}</h4>
                      <p className="text-xs text-red-700 mt-1">{issue.description}</p>
                      {issue.impact && (
                        <p className="text-[10px] text-red-600 mt-1">
                          <span className="font-medium">Impact:</span> {issue.impact}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

            {/* Warning Issues */}
            {showWarnings &&
              warningIssues.map((issue, i) => (
                <div
                  key={`warning-${i}`}
                  className="p-3 bg-amber-50 border border-amber-100 rounded-lg"
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-amber-900 text-sm">{issue.title}</h4>
                      <p className="text-xs text-amber-700 mt-1">{issue.description}</p>
                      {issue.impact && (
                        <p className="text-[10px] text-amber-600 mt-1">
                          <span className="font-medium">Impact:</span> {issue.impact}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

            {/* Passing Items */}
            {showPassing &&
              passingItems.map((item, i) => (
                <div
                  key={`passing-${i}`}
                  className="p-3 bg-green-50 border border-green-100 rounded-lg"
                >
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-medium text-green-900 text-sm">{item.title}</h4>
                        {item.value && (
                          <span className="text-[10px] font-mono bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                            {item.value}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-green-700 mt-1">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}

            {/* Empty states */}
            {!showCritical && !showWarnings && !showPassing && (
              <p className="text-center text-gray-400 py-4 text-sm">
                Toggle categories above to see items
              </p>
            )}
          </div>

          {/* Recommendations */}
          {category.recommendations.length > 0 && (
            <div className="p-3 bg-blue-50 border-t border-blue-100">
              <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-1 text-xs">
                <Info className="w-3 h-3" />
                Top Recommendations
              </h4>
              <ul className="space-y-1">
                {category.recommendations.slice(0, 3).map((rec, i) => (
                  <li key={i} className="text-xs text-blue-800 flex items-start gap-1">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Website type benchmark data - what a best-in-class site of each type should score
const WEBSITE_TYPE_BENCHMARKS: Record<string, { benchmark: number; description: string; priorities: string[] }> = {
  'E-commerce': { benchmark: 85, description: 'High-performing e-commerce sites prioritize fast load times, mobile optimization, and clear conversion paths.', priorities: ['Technical Foundation', 'User Experience', 'Conversion & Engagement', 'Security'] },
  'SaaS': { benchmark: 82, description: 'Top SaaS websites excel at clear value propositions, demo/trial CTAs, and trust-building content.', priorities: ['Brand & Messaging', 'Conversion & Engagement', 'Trust & Credibility', 'Content Strategy'] },
  'Agency': { benchmark: 80, description: 'Leading agency sites showcase portfolio work, case studies, and strong brand differentiation.', priorities: ['Brand & Messaging', 'Trust & Credibility', 'Social & Multimedia', 'Business Overview'] },
  'Portfolio': { benchmark: 75, description: 'Effective portfolio sites prioritize visual presentation, fast loading, and clear contact paths.', priorities: ['User Experience', 'Social & Multimedia', 'Brand & Messaging', 'Technical Foundation'] },
  'Blog': { benchmark: 78, description: 'Successful blogs focus on content quality, SEO optimization, and reader engagement.', priorities: ['Content Strategy', 'Traffic Readiness', 'User Experience', 'Social & Multimedia'] },
  'Corporate': { benchmark: 80, description: 'Strong corporate sites balance professionalism, trust signals, and clear business information.', priorities: ['Trust & Credibility', 'Business Overview', 'Brand & Messaging', 'Security'] },
  'Local Business': { benchmark: 75, description: 'Effective local business sites need strong local SEO, clear contact info, and trust signals.', priorities: ['Business Overview', 'Traffic Readiness', 'Trust & Credibility', 'User Experience'] },
  'Service Provider': { benchmark: 78, description: 'Top service sites clearly communicate offerings, build trust, and make it easy to get in touch.', priorities: ['Business Overview', 'Trust & Credibility', 'Conversion & Engagement', 'Brand & Messaging'] },
  'Nonprofit': { benchmark: 75, description: 'Effective nonprofit sites inspire action through clear mission statements and easy donation paths.', priorities: ['Brand & Messaging', 'Trust & Credibility', 'Conversion & Engagement', 'Content Strategy'] },
  'Educational': { benchmark: 78, description: 'Strong educational sites prioritize content organization, accessibility, and user experience.', priorities: ['Content Strategy', 'User Experience', 'Technical Foundation', 'Trust & Credibility'] },
  'default': { benchmark: 78, description: 'Best-in-class websites excel at technical performance, clear messaging, and user experience.', priorities: ['Technical Foundation', 'User Experience', 'Brand & Messaging', 'Trust & Credibility'] },
};

function ReportCard({ result, onExport }: { result: AuditResult; onExport: () => void }) {
  const websiteType = result.brief?.websiteType?.primaryType || result.brief?.siteType || 'Website';
  const benchmark = WEBSITE_TYPE_BENCHMARKS[websiteType] || WEBSITE_TYPE_BENCHMARKS['default'];
  const scoreDiff = result.overallScore - benchmark.benchmark;
  const isAboveBenchmark = scoreDiff >= 0;

  return (
    <div className="bg-white border border-gray-200 rounded-[16px] shadow-sm overflow-hidden mb-4">
      {/* Score Header Section */}
      <div className="p-6 bg-gradient-to-br from-slate-50 to-white">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-6">
            {/* Score Circle */}
            <div className="relative">
              <div className={`w-28 h-28 rounded-full flex items-center justify-center ${
                result.overallScore >= 80 ? 'bg-gradient-to-br from-green-100 to-green-50 ring-4 ring-green-200' :
                result.overallScore >= 60 ? 'bg-gradient-to-br from-amber-100 to-amber-50 ring-4 ring-amber-200' :
                'bg-gradient-to-br from-red-100 to-red-50 ring-4 ring-red-200'
              }`}>
                <div className="text-center">
                  <div className={`text-4xl font-bold ${getScoreColor(result.overallScore)}`}>
                    {result.overallScore}
                  </div>
                  <div className="text-xs text-gray-500 font-medium">out of 100</div>
                </div>
              </div>
              <div className={`absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-xs font-bold text-white ${getScoreBgColor(result.overallScore)}`}>
                {getGrade(result.overallScore)}
              </div>
            </div>

            {/* Score Context */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Overall Website Score</h3>
              <p className="text-sm text-gray-500 mb-3">{result.pageCount} page{result.pageCount !== 1 ? 's' : ''} analyzed</p>

              {/* Website Type Badge */}
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                  {websiteType}
                </span>
                {result.brief?.industry && result.brief.industry !== 'Unknown' && (
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                    {result.brief.industry}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 rounded-lg text-sm font-medium text-white transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>

        {/* Benchmark Comparison */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-1">
                Compared to Best-in-Class {websiteType} Sites
              </h4>
              <p className="text-xs text-gray-500">{benchmark.description}</p>
            </div>
            <div className={`text-right ${isAboveBenchmark ? 'text-green-600' : 'text-amber-600'}`}>
              <div className="text-2xl font-bold">
                {isAboveBenchmark ? '+' : ''}{scoreDiff}
              </div>
              <div className="text-xs font-medium">
                points {isAboveBenchmark ? 'above' : 'below'} benchmark
              </div>
            </div>
          </div>

          {/* Benchmark Progress Bar */}
          <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden mb-3">
            {/* Score bar */}
            <div
              className={`absolute h-full rounded-full ${
                result.overallScore >= 80 ? 'bg-green-500' :
                result.overallScore >= 60 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${result.overallScore}%` }}
            />
            {/* Benchmark marker */}
            <div
              className="absolute top-0 h-full w-0.5 bg-slate-800"
              style={{ left: `${benchmark.benchmark}%` }}
            >
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-medium text-slate-600 whitespace-nowrap">
                Benchmark: {benchmark.benchmark}
              </div>
            </div>
          </div>

          {/* Priority Categories for this type */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500">Key priorities for {websiteType.toLowerCase()} sites:</span>
            {benchmark.priorities.slice(0, 3).map((priority, i) => (
              <span key={i} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                {priority}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Category Scores Grid */}
      <div className="p-4 border-t border-gray-100">
        <div className="grid grid-cols-5 gap-3">
          {result.categories.map((category) => {
            const isPriority = benchmark.priorities.includes(category.name);
            return (
              <div
                key={category.name}
                className={`flex flex-col items-center p-3 rounded-xl transition-colors ${
                  isPriority ? 'bg-blue-50 ring-1 ring-blue-200' : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className={`p-2 rounded-lg shadow-sm mb-2 ${isPriority ? 'bg-blue-100 text-blue-600' : 'bg-white text-gray-600'}`}>
                  {categoryIcons[category.name] || <Info className="w-5 h-5 text-gray-400" />}
                </div>
                <p className="text-xs text-gray-600 text-center leading-tight mb-1 font-medium">
                  {category.name.split(' ').slice(0, 2).join(' ')}
                </p>
                <div className={`text-2xl font-bold ${getScoreColor(category.score)}`}>
                  {category.score}
                </div>
                {isPriority && (
                  <span className="text-[9px] text-blue-600 font-medium mt-1">PRIORITY</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <div className="px-6 pb-6 pt-2">
        <p className="text-sm text-gray-600 leading-relaxed">{result.summary}</p>
      </div>
    </div>
  );
}

// PageSpeed Insights Display Component
function PageSpeedCard({ pageSpeed }: { pageSpeed: { mobile: PageSpeedData | null; desktop: PageSpeedData | null } }) {
  const [activeTab, setActiveTab] = useState<'mobile' | 'desktop'>('mobile');
  const data = activeTab === 'mobile' ? pageSpeed.mobile : pageSpeed.desktop;

  if (!pageSpeed.mobile && !pageSpeed.desktop) {
    return null;
  }

  const getRatingColor = (rating: string | null) => {
    if (rating === 'good') return 'text-green-600 bg-green-100';
    if (rating === 'needs-improvement') return 'text-amber-600 bg-amber-100';
    if (rating === 'poor') return 'text-red-600 bg-red-100';
    return 'text-gray-500 bg-gray-100';
  };

  const getRatingBg = (rating: string | null) => {
    if (rating === 'good') return 'bg-green-500';
    if (rating === 'needs-improvement') return 'bg-amber-500';
    if (rating === 'poor') return 'bg-red-500';
    return 'bg-gray-300';
  };

  const getLighthouseColor = (score: number | null) => {
    if (score === null) return 'text-gray-400';
    if (score >= 90) return 'text-green-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  const getLighthouseBg = (score: number | null) => {
    if (score === null) return 'bg-gray-200';
    if (score >= 90) return 'bg-green-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const formatMetric = (value: number | null, unit: string = 's') => {
    if (value === null) return '—';
    if (unit === 's') return `${(value / 1000).toFixed(1)}s`;
    if (unit === 'ms') return `${Math.round(value)}ms`;
    return value.toFixed(2);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-[16px] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Core Web Vitals & Performance</h3>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Google PageSpeed</span>
        </div>
        {/* Tab Switcher */}
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setActiveTab('mobile')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'mobile'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Mobile
          </button>
          <button
            onClick={() => setActiveTab('desktop')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'desktop'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Desktop
          </button>
        </div>
      </div>

      {data ? (
        <div className="p-4 space-y-4">
          {/* Lighthouse Scores Row */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Performance', score: data.lighthouseScores.performance },
              { label: 'Accessibility', score: data.lighthouseScores.accessibility },
              { label: 'Best Practices', score: data.lighthouseScores.bestPractices },
              { label: 'SEO', score: data.lighthouseScores.seo },
            ].map((item) => (
              <div key={item.label} className="text-center p-3 bg-gray-50 rounded-xl">
                <div className="relative w-12 h-12 mx-auto mb-2">
                  <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-gray-200"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={getLighthouseBg(item.score)}
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      fill="none"
                      strokeDasharray={`${(item.score || 0)}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${getLighthouseColor(item.score)}`}>
                    {item.score ?? '—'}
                  </span>
                </div>
                <p className="text-xs text-gray-600 font-medium">{item.label}</p>
              </div>
            ))}
          </div>

          {/* Core Web Vitals */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h4 className="text-sm font-semibold text-gray-700">Core Web Vitals</h4>
              {data.hasFieldData ? (
                <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Real user data</span>
              ) : (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Lab data</span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: 'LCP',
                  fullName: 'Largest Contentful Paint',
                  value: data.coreWebVitals.lcp,
                  rating: data.coreWebVitals.lcpRating,
                  unit: 's',
                  good: '≤2.5s',
                },
                {
                  label: 'INP',
                  fullName: 'Interaction to Next Paint',
                  value: data.coreWebVitals.inp,
                  rating: data.coreWebVitals.inpRating,
                  unit: 'ms',
                  good: '≤200ms',
                },
                {
                  label: 'CLS',
                  fullName: 'Cumulative Layout Shift',
                  value: data.coreWebVitals.cls,
                  rating: data.coreWebVitals.clsRating,
                  unit: '',
                  good: '≤0.1',
                },
              ].map((metric) => (
                <div key={metric.label} className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-gray-700">{metric.label}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${getRatingColor(metric.rating)}`}>
                      {metric.rating?.replace('-', ' ') || 'N/A'}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {metric.value !== null
                      ? (metric.unit === 's' ? `${metric.value.toFixed(1)}s` :
                         metric.unit === 'ms' ? `${Math.round(metric.value)}ms` :
                         metric.value.toFixed(2))
                      : '—'}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{metric.fullName}</p>
                  <p className="text-xs text-green-600 mt-0.5">Good: {metric.good}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Metrics */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Performance Metrics</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                { label: 'First Contentful Paint', value: data.metrics.firstContentfulPaint, unit: 's' },
                { label: 'Largest Contentful Paint', value: data.metrics.largestContentfulPaint, unit: 's' },
                { label: 'Total Blocking Time', value: data.metrics.totalBlockingTime, unit: 'ms' },
                { label: 'Speed Index', value: data.metrics.speedIndex, unit: 's' },
                { label: 'Time to Interactive', value: data.metrics.timeToInteractive, unit: 's' },
                { label: 'Layout Shift', value: data.metrics.cumulativeLayoutShift, unit: '' },
              ].map((metric) => (
                <div key={metric.label} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-600">{metric.label}</span>
                  <span className="text-xs font-mono font-semibold text-gray-900">
                    {formatMetric(metric.value, metric.unit)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Opportunities */}
          {data.opportunities.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Top Opportunities</h4>
              <div className="space-y-2">
                {data.opportunities.slice(0, 5).map((opp) => (
                  <div key={opp.id} className="flex items-center justify-between p-2 bg-amber-50 border border-amber-100 rounded-lg">
                    <span className="text-xs text-gray-700 flex-1">{opp.title}</span>
                    {opp.savings && (
                      <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded ml-2">
                        Save {opp.savings}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audits Summary */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span className="text-xs text-gray-500">
              {data.passedAudits} of {data.totalAudits} audits passed
            </span>
            <a
              href={`https://pagespeed.web.dev/report?url=${encodeURIComponent(data.finalUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View full report <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-gray-400">
          <p className="text-sm">No {activeTab} data available</p>
        </div>
      )}
    </div>
  );
}

function TokenUsageDisplay({ tokenUsage }: { tokenUsage: TokenUsage }) {
  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-100 rounded-lg">
          <Coins className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-900">Token Usage</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
            <span className="text-xs text-amber-700">
              <span className="font-mono">{tokenUsage.inputTokens.toLocaleString()}</span> input
            </span>
            <span className="text-xs text-amber-700">
              <span className="font-mono">{tokenUsage.outputTokens.toLocaleString()}</span> output
            </span>
            <span className="text-xs text-amber-700">
              <span className="font-mono">{tokenUsage.totalTokens.toLocaleString()}</span> total
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-amber-900">${tokenUsage.estimatedCost.toFixed(4)}</p>
          <p className="text-xs text-amber-600">est. cost</p>
        </div>
      </div>
    </div>
  );
}

function WebsiteBriefCard({ brief, url, summary, logo }: { brief: WebsiteBrief; url: string; summary: string; logo?: string | null }) {
  const websiteType = brief.websiteType;
  const [showBrief, setShowBrief] = useState(false);
  const [copied, setCopied] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // Generate the business overview text
  const generateOverviewText = () => {
    const lines = [
      `BUSINESS OVERVIEW`,
      ``,
      `Company: ${brief.businessName}`,
      `Website: ${url}`,
      ``,
      `CURRENT POSITIONING`,
      ``,
      `Website Type: ${websiteType?.subType || websiteType?.primaryType || brief.siteType}`,
      `Industry: ${brief.industry}`,
      `Target Audience: ${brief.targetAudience}`,
      brief.totalPages ? `Site Size: ${brief.totalPages.toLocaleString()} pages` : '',
      ``,
      `BUSINESS DESCRIPTION`,
      ``,
      brief.businessDescription,
      ``,
    ];

    if (websiteType?.characteristics && websiteType.characteristics.length > 0) {
      lines.push(`KEY CHARACTERISTICS`);
      lines.push(``);
      websiteType.characteristics.forEach(char => {
        lines.push(`- ${char}`);
      });
      lines.push(``);
    }

    lines.push(`AUDIT SUMMARY`);
    lines.push(``);
    lines.push(summary);

    return lines.filter(line => line !== undefined).join('\n');
  };

  const overviewText = generateOverviewText();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(overviewText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([overviewText], { type: 'text/plain' });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `${brief.businessName.toLowerCase().replace(/\s+/g, '-')}-overview.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-[16px] shadow-sm overflow-hidden mb-4">
      {/* Executive Header Bar */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* Logo */}
            {logo && !logoError && (
              <div className="w-20 h-20 rounded-xl bg-white shadow-lg overflow-hidden flex items-center justify-center p-2 flex-shrink-0">
                <img
                  src={logo}
                  alt={brief.businessName || 'Company logo'}
                  className="max-w-full max-h-full object-contain"
                  onError={() => setLogoError(true)}
                />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Briefcase className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Business Profile</span>
              </div>
              <h2 className="text-2xl font-bold text-white">{brief.businessName}</h2>
            </div>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white text-xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Visit Site
          </a>
        </div>
      </div>

      <div className="p-6">
        {/* Key Business Info - Executive Style */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="space-y-1">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Industry</span>
            <p className="text-base font-semibold text-gray-900">{brief.industry}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Website Type</span>
            <p className="text-base font-semibold text-gray-900">
              {websiteType?.subType || websiteType?.primaryType || brief.siteType}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Target Market</span>
            <p className="text-base font-semibold text-gray-900 line-clamp-1">{brief.targetAudience}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Site Scale</span>
            <p className="text-base font-semibold text-gray-900">
              {brief.totalPages ? `${brief.totalPages.toLocaleString()} pages` : 'Not detected'}
            </p>
          </div>
        </div>

        {/* Business Description - Prominent */}
        <div className="mb-6">
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">What This Business Does</h3>
          <p className="text-gray-700 leading-relaxed">
            {brief.businessDescription}
          </p>
        </div>

        {/* Key Characteristics */}
        {websiteType?.characteristics && websiteType.characteristics.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Key Characteristics</h3>
            <div className="flex flex-wrap gap-2">
              {websiteType.characteristics.map((char, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium"
                >
                  {char}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Export Options */}
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowBrief(!showBrief)}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>{showBrief ? 'Hide' : 'View'} Full Brief</span>
              {showBrief ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  copied
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Brief Section */}
      {showBrief && (
        <div className="border-t border-gray-200 bg-slate-50 p-4">
          <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed max-h-[250px] overflow-y-auto bg-white p-4 rounded-lg border border-gray-200">
            {overviewText}
          </pre>
        </div>
      )}
    </div>
  );
}

function TopRecommendationsCard({ categories }: { categories: CategoryScore[] }) {
  // Gather all recommendations from all categories, prioritizing by category score (lower score = higher priority)
  const allRecommendations = categories
    .sort((a, b) => a.score - b.score)
    .flatMap(cat =>
      cat.recommendations.map(rec => ({
        recommendation: rec,
        category: cat.name,
        score: cat.score
      }))
    )
    .slice(0, 8); // Top 8 recommendations

  const [isExpanded, setIsExpanded] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(index)) {
      newChecked.delete(index);
    } else {
      newChecked.add(index);
    }
    setCheckedItems(newChecked);
  };

  if (allRecommendations.length === 0) return null;

  const completedCount = checkedItems.size;
  const totalCount = allRecommendations.length;
  const progressPercent = (completedCount / totalCount) * 100;

  return (
    <div className="bg-white border border-gray-200 rounded-[16px] shadow-sm overflow-hidden mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-gray-500" />
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 text-sm">Top Recommendations</h3>
              <p className="text-xs text-gray-500">Track your progress on key improvements</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-700">{completedCount}/{totalCount}</p>
              <p className="text-[10px] text-gray-400">completed</p>
            </div>
            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gray-600 transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>
      </button>
      {isExpanded && (
        <div className="border-t border-gray-100">
          {/* Table-style list */}
          <div className="divide-y divide-gray-100">
            {allRecommendations.map((item, index) => (
              <button
                key={index}
                onClick={() => toggleItem(index)}
                className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                  checkedItems.has(index) ? 'bg-gray-50' : ''
                }`}
              >
                <div className={`flex-shrink-0 mt-0.5 ${checkedItems.has(index) ? 'text-green-600' : 'text-gray-300'}`}>
                  {checkedItems.has(index) ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${checkedItems.has(index) ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                    {item.recommendation}
                  </p>
                </div>
                <span className="flex-shrink-0 text-[10px] text-gray-400 font-medium">
                  {item.category.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SiteStrengthsCard({ categories }: { categories: CategoryScore[] }) {
  // Gather all passing items from all categories, prioritizing by category score (higher score = higher priority)
  const allStrengths = categories
    .sort((a, b) => b.score - a.score)
    .flatMap(cat =>
      (cat.passing || []).map(item => ({
        title: item.title,
        description: item.description,
        value: item.value,
        category: cat.name,
        score: cat.score
      }))
    )
    .slice(0, 8); // Top 8 strengths

  const [isExpanded, setIsExpanded] = useState(false);

  if (allStrengths.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-[16px] shadow-sm overflow-hidden mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-gray-500" />
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 text-sm">What Your Site Does Best</h3>
              <p className="text-xs text-gray-500">See what&apos;s already working well</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-700">{allStrengths.length}</p>
              <p className="text-[10px] text-gray-400">strengths</p>
            </div>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>
      </button>
      {isExpanded && (
        <div className="border-t border-gray-100">
          {/* Table-style list */}
          <div className="divide-y divide-gray-100">
            {allStrengths.map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-3 px-4 py-3"
              >
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-gray-800">{item.title}</p>
                    {item.value && (
                      <span className="text-[10px] font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded flex-shrink-0">
                        {item.value}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                </div>
                <span className="flex-shrink-0 text-[10px] text-gray-400 font-medium">
                  {item.category.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PremiumFeaturesCard() {
  const premiumFeatures = [
    { name: 'Competitor Analysis', description: 'See how you stack up against competitors', icon: TrendingUp },
    { name: 'SEO Deep Dive', description: 'Keyword rankings, backlinks, and opportunities', icon: Target },
    { name: 'Accessibility Audit', description: 'WCAG compliance and accessibility fixes', icon: Shield },
    { name: 'Performance Metrics', description: 'Core Web Vitals and load time optimization', icon: Zap },
    { name: 'Content Strategy', description: 'AI-powered content recommendations', icon: FileText },
    { name: 'Monthly Monitoring', description: 'Track changes and improvements over time', icon: TrendingUp },
  ];

  return (
    <div className="bg-gradient-to-br from-wc-cyan-50 to-wc-blue-50 border border-wc-cyan-200 rounded-[16px] shadow-sm overflow-hidden mb-4">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-wc-cyan-100 rounded-lg">
              <Award className="w-6 h-6 text-wc-cyan-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">Want More Insights?</h3>
              <p className="text-sm text-gray-600">Get a comprehensive custom report</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          {premiumFeatures.map((feature, i) => (
            <div
              key={i}
              className="flex items-start gap-2.5 p-3 bg-white/70 rounded-xl border border-wc-cyan-100"
            >
              <feature.icon className="w-5 h-5 text-wc-blue-500 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800">{feature.name}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        <Link
          href="/custom-report"
          className="flex items-center justify-center gap-2 w-full py-3 bg-wc-blue-600 hover:bg-wc-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <span>Request Custom Report</span>
          <ExternalLink className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

// Social media platform detection and styling
const SOCIAL_PLATFORMS: Record<string, { name: string; color: string; bgColor: string }> = {
  facebook: { name: 'Facebook', color: '#1877F2', bgColor: 'bg-[#1877F2]/10' },
  twitter: { name: 'X (Twitter)', color: '#000000', bgColor: 'bg-gray-100' },
  'x.com': { name: 'X (Twitter)', color: '#000000', bgColor: 'bg-gray-100' },
  linkedin: { name: 'LinkedIn', color: '#0A66C2', bgColor: 'bg-[#0A66C2]/10' },
  instagram: { name: 'Instagram', color: '#E4405F', bgColor: 'bg-[#E4405F]/10' },
  youtube: { name: 'YouTube', color: '#FF0000', bgColor: 'bg-[#FF0000]/10' },
  tiktok: { name: 'TikTok', color: '#000000', bgColor: 'bg-gray-100' },
};

function getSocialPlatform(url: string): { name: string; color: string; bgColor: string } | null {
  const urlLower = url.toLowerCase();
  for (const [key, value] of Object.entries(SOCIAL_PLATFORMS)) {
    if (urlLower.includes(key)) {
      return value;
    }
  }
  return null;
}

function ContactInfoCard({ emails, socialLinks }: { emails: string[]; socialLinks: string[] }) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyEmail = async (email: string, index: number) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Deduplicate social links by platform
  const uniqueSocialLinks = socialLinks.reduce((acc: string[], link) => {
    const platform = getSocialPlatform(link);
    if (platform && !acc.some(existing => getSocialPlatform(existing)?.name === platform.name)) {
      acc.push(link);
    }
    return acc;
  }, []);

  const hasContent = emails.length > 0 || uniqueSocialLinks.length > 0;

  if (!hasContent) {
    return (
      <div className="bg-white border border-gray-200 rounded-[16px] shadow-sm overflow-hidden mb-4">
        <div className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-gray-100 rounded-lg">
              <Mail className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">Contact Information</h3>
              <p className="text-xs text-gray-500">No public contact information found on this website</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-[16px] shadow-sm overflow-hidden mb-4">
      <div className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-blue-100 rounded-lg">
            <Mail className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">Contact Information</h3>
            <p className="text-xs text-gray-500">
              {emails.length > 0 && `${emails.length} email${emails.length !== 1 ? 's' : ''}`}
              {emails.length > 0 && uniqueSocialLinks.length > 0 && ' · '}
              {uniqueSocialLinks.length > 0 && `${uniqueSocialLinks.length} social profile${uniqueSocialLinks.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        {/* Email Addresses */}
        {emails.length > 0 && (
          <div className="space-y-2 mb-4">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email</h4>
            {emails.map((email, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 group hover:bg-gray-100 transition-colors"
              >
                <a
                  href={`mailto:${email}`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                >
                  {email}
                </a>
                <button
                  onClick={() => copyEmail(email, index)}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                >
                  {copiedIndex === index ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-500" />
                      <span className="text-green-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Social Media Links */}
        {uniqueSocialLinks.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Social Media</h4>
            <div className="flex flex-wrap gap-2">
              {uniqueSocialLinks.map((link, index) => {
                const platform = getSocialPlatform(link);
                if (!platform) return null;
                return (
                  <a
                    key={index}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors ${platform.bgColor}`}
                  >
                    <span className="text-sm font-medium" style={{ color: platform.color }}>
                      {platform.name}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PagesAnalysis({ pages, bestPage }: {
  pages: PageScore[];
  bestPage: PageScore | null;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (pages.length === 0) return null;

  const sortedPages = [...pages].sort((a, b) => b.overallScore - a.overallScore);

  return (
    <div className="bg-white border border-gray-200 rounded-[12px] shadow-sm overflow-hidden mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600">
            <FileDown className="w-4 h-4" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900 text-sm">Page Analysis</h3>
            <p className="text-xs text-gray-500">{pages.length} pages crawled and scored</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {bestPage && (
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-gray-400">Best</p>
              <p className="text-sm font-medium text-green-600">{bestPage.path}</p>
            </div>
          )}
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-100 p-4">
          <div className="space-y-2">
            {sortedPages.map((page, i) => (
              <div
                key={page.url}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  i === 0 ? 'bg-green-50 border border-green-100' :
                  i === sortedPages.length - 1 ? 'bg-red-50 border border-red-100' :
                  'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`text-xl font-bold ${getScoreColor(page.overallScore)}`}>
                    {page.overallScore}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {page.path === '/' ? 'Homepage' : page.path}
                    </p>
                    {page.title && (
                      <p className="text-xs text-gray-500 truncate">{page.title}</p>
                    )}
                  </div>
                </div>
                <a
                  href={page.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                >
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ExportModal({ result, onClose }: { result: AuditResult; onClose: () => void }) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const downloadMarkdown = () => {
    // Generate markdown content
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    let markdown = `# Website Audit Report\n\n`;
    markdown += `**URL:** ${result.url}\n`;
    markdown += `**Date:** ${date}\n`;
    markdown += `**Overall Score:** ${result.overallScore}/100 (Grade: ${getGrade(result.overallScore)})\n\n`;
    markdown += `## Executive Summary\n\n${result.summary}\n\n`;
    markdown += `## Category Scores\n\n`;
    markdown += `| Category | Score | Grade |\n|----------|-------|-------|\n`;
    result.categories.forEach(cat => {
      markdown += `| ${cat.name} | ${cat.score} | ${getGrade(cat.score)} |\n`;
    });
    markdown += '\n';

    // Add issues
    result.categories.forEach(cat => {
      if (cat.issues.length > 0 || cat.passing.length > 0) {
        markdown += `## ${cat.name}\n\n`;
        if (cat.issues.filter(i => i.severity === 'critical').length > 0) {
          markdown += `### Critical Issues\n\n`;
          cat.issues.filter(i => i.severity === 'critical').forEach(issue => {
            markdown += `- **${issue.title}**: ${issue.description}\n`;
          });
          markdown += '\n';
        }
        if (cat.issues.filter(i => i.severity !== 'critical').length > 0) {
          markdown += `### Warnings\n\n`;
          cat.issues.filter(i => i.severity !== 'critical').forEach(issue => {
            markdown += `- **${issue.title}**: ${issue.description}\n`;
          });
          markdown += '\n';
        }
        if (cat.recommendations.length > 0) {
          markdown += `### Recommendations\n\n`;
          cat.recommendations.forEach((rec, i) => {
            markdown += `${i + 1}. ${rec}\n`;
          });
          markdown += '\n';
        }
      }
    });

    // Download
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-report-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onClose();
  };

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onClose();
  };

  const downloadPDF = async () => {
    setIsGeneratingPdf(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15; // Tightened from 20
      const contentWidth = pageWidth - (margin * 2);
      let yPos = margin;

      const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

      // Brand colors from WebCoreAudit
      const brandCyan = [91, 192, 235]; // #5BC0EB
      const brandBlue = [46, 134, 222]; // #2E86DE
      const brandDark = [30, 65, 117]; // #1E4175

      // Helper function to check page break (account for footer height of 18mm)
      const footerHeight = 18;
      const checkPageBreak = (requiredSpace: number) => {
        if (yPos + requiredSpace > pageHeight - margin - footerHeight) {
          doc.addPage();
          yPos = margin;
          return true;
        }
        return false;
      };

      // Header with brand gradient effect
      doc.setFillColor(brandDark[0], brandDark[1], brandDark[2]);
      doc.rect(0, 0, pageWidth, 50, 'F');

      // Add accent stripe
      doc.setFillColor(brandCyan[0], brandCyan[1], brandCyan[2]);
      doc.rect(0, 48, pageWidth, 3, 'F');

      // Load and add logo
      try {
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
          logoImg.onload = () => resolve();
          logoImg.onerror = () => reject();
          logoImg.src = '/logo.png';
        });
        const canvas = document.createElement('canvas');
        canvas.width = logoImg.width;
        canvas.height = logoImg.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(logoImg, 0, 0);
        const logoDataUrl = canvas.toDataURL('image/png');
        doc.addImage(logoDataUrl, 'PNG', margin, 8, 28, 28);
      } catch {
        // Logo failed to load, continue without it
      }

      // Title - positioned after logo
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('Website Audit Report', margin + 32, 20);

      // URL and date
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(brandCyan[0], brandCyan[1], brandCyan[2]);
      const urlText = result.url.length > 50 ? result.url.substring(0, 50) + '...' : result.url;
      doc.text(urlText, margin + 32, 28);
      doc.setTextColor(200, 220, 240);
      doc.text(date, margin + 32, 35);

      // Client logo on right (if available)
      let clientLogoWidth = 0;
      if (result.clientLogo) {
        try {
          const clientLogoImg = new Image();
          clientLogoImg.crossOrigin = 'anonymous';
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('timeout')), 5000);
            clientLogoImg.onload = () => {
              clearTimeout(timeout);
              resolve();
            };
            clientLogoImg.onerror = () => {
              clearTimeout(timeout);
              reject();
            };
            clientLogoImg.src = result.clientLogo!;
          });
          const canvas = document.createElement('canvas');
          canvas.width = clientLogoImg.width;
          canvas.height = clientLogoImg.height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(clientLogoImg, 0, 0);
          const clientLogoDataUrl = canvas.toDataURL('image/png');

          // Draw white background for client logo
          const logoSize = 24;
          const logoX = pageWidth - margin - 44;
          const logoY = 12;
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(logoX - 2, logoY - 2, logoSize + 4, logoSize + 4, 2, 2, 'F');
          doc.addImage(clientLogoDataUrl, 'PNG', logoX, logoY, logoSize, logoSize);
          clientLogoWidth = logoSize + 10;
        } catch {
          // Client logo failed to load, continue without it
        }
      }

      // Score circle on right
      const scoreX = pageWidth - margin - 12;
      const scoreY = 24;
      doc.setFillColor(255, 255, 255);
      doc.circle(scoreX, scoreY, 14, 'F');

      // Score ring
      const scoreColor = result.overallScore >= 80 ? [34, 197, 94] : result.overallScore >= 60 ? [245, 158, 11] : [239, 68, 68];
      doc.setDrawColor(scoreColor[0], scoreColor[1], scoreColor[2]);
      doc.setLineWidth(1.5);
      doc.circle(scoreX, scoreY, 14, 'S');

      // Score text
      doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(String(result.overallScore), scoreX, scoreY + 2, { align: 'center' });
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('/ 100', scoreX, scoreY + 8, { align: 'center' });

      yPos = 58;

      // Website Analysis Section with card-like styling
      const websiteType = result.brief.websiteType;
      const col1X = margin + 4;
      const col2X = margin + contentWidth / 3;
      const col3X = margin + (contentWidth * 2 / 3);

      // Calculate box height based on content
      const descLines = doc.splitTextToSize(result.brief.businessDescription, contentWidth - 8);
      const audienceLines = doc.splitTextToSize(result.brief.targetAudience, contentWidth - 8);
      const boxHeight = 52 + Math.min(descLines.length, 2) * 3.5 + Math.min(audienceLines.length, 2) * 3.5;

      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, yPos - 4, contentWidth, boxHeight, 3, 3, 'F');

      doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Website Analysis', col1X, yPos + 3);
      yPos += 12;

      // Three-column layout for metadata
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(7);
      doc.text('TYPE', col1X, yPos);
      doc.text('INDUSTRY', col2X, yPos);
      doc.text('SITE PAGES', col3X, yPos);
      yPos += 4;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(9);
      doc.text(websiteType?.subType || websiteType?.primaryType || result.brief.siteType, col1X, yPos);
      doc.text(result.brief.industry, col2X, yPos);
      doc.text(result.brief.totalPages ? `${result.brief.totalPages} pages` : 'Unknown', col3X, yPos);
      yPos += 8;

      // Target Audience row
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(7);
      doc.text('TARGET AUDIENCE', col1X, yPos);
      yPos += 4;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(9);
      doc.text(audienceLines.slice(0, 2), col1X, yPos);
      yPos += Math.min(audienceLines.length, 2) * 4 + 6;

      // Business description - now inside the box with proper formatting
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(7);
      doc.text('OVERVIEW', col1X, yPos);
      yPos += 4;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.setFontSize(8);
      doc.text(descLines.slice(0, 2), col1X, yPos);
      yPos += Math.min(descLines.length, 2) * 3.5 + 4;

      // Characteristics as tags (inside box)
      if (websiteType?.characteristics && websiteType.characteristics.length > 0) {
        doc.setFontSize(7);
        doc.setTextColor(brandBlue[0], brandBlue[1], brandBlue[2]);
        const charText = websiteType.characteristics.slice(0, 4).join('  •  ');
        doc.text(charText, col1X, yPos);
        yPos += 6;
      }

      yPos += 4; // Space after box

      // Site Structure Section (if available)
      if (result.brief.siteStructure && result.brief.siteStructure.length > 0) {
        checkPageBreak(25);

        doc.setFillColor(248, 250, 252);
        doc.roundedRect(margin, yPos - 2, contentWidth, 22, 2, 2, 'F');

        doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Site Architecture', margin + 4, yPos + 4);
        yPos += 10;

        const existingSections = result.brief.siteStructure.filter(s => s.exists);
        const missingSections = result.brief.siteStructure.filter(s => !s.exists);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');

        if (existingSections.length > 0) {
          doc.setTextColor(34, 197, 94);
          const foundText = doc.splitTextToSize(`✓ ${existingSections.map(s => s.name).join(', ')}`, contentWidth - 8);
          doc.text(foundText[0], margin + 4, yPos);
          yPos += 4;
        }

        if (missingSections.length > 0) {
          doc.setTextColor(239, 68, 68);
          const missingText = doc.splitTextToSize(`✗ ${missingSections.map(s => s.name).join(', ')}`, contentWidth - 8);
          doc.text(missingText[0], margin + 4, yPos);
        }
        yPos += 12;
      }

      // Executive Summary with accent border
      checkPageBreak(25);

      // Left accent bar
      doc.setFillColor(brandCyan[0], brandCyan[1], brandCyan[2]);
      doc.rect(margin, yPos, 2, 20, 'F');

      doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Executive Summary', margin + 6, yPos + 5);
      yPos += 10;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      const summaryLines = doc.splitTextToSize(result.summary, contentWidth - 6);
      doc.text(summaryLines.slice(0, 4), margin + 6, yPos); // Limit to 4 lines
      yPos += Math.min(summaryLines.length, 4) * 4 + 8;

      // Category Scores with enhanced styling
      checkPageBreak(50);
      doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Category Scores', margin, yPos);
      yPos += 8;

      // Score bars - more compact
      result.categories.forEach(cat => {
        checkPageBreak(12);

        // Category name
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(cat.name, margin, yPos);

        // Score value
        const catScoreColor = cat.score >= 80 ? [34, 197, 94] : cat.score >= 60 ? [245, 158, 11] : [239, 68, 68];
        doc.setTextColor(catScoreColor[0], catScoreColor[1], catScoreColor[2]);
        doc.setFont('helvetica', 'bold');
        doc.text(String(cat.score), pageWidth - margin - 3, yPos, { align: 'right' });

        yPos += 2.5;

        // Background bar
        doc.setFillColor(229, 231, 235);
        doc.roundedRect(margin, yPos, contentWidth, 2.5, 1, 1, 'F');

        // Score bar with brand-influenced colors
        doc.setFillColor(catScoreColor[0], catScoreColor[1], catScoreColor[2]);
        const barWidth = (cat.score / 100) * contentWidth;
        doc.roundedRect(margin, yPos, barWidth, 2.5, 1, 1, 'F');

        yPos += 7;
      });

      // Critical Issues Section - subtle design
      const criticalIssues = result.categories.flatMap(c =>
        c.issues.filter(i => i.severity === 'critical').map(i => ({ ...i, category: c.name }))
      );

      if (criticalIssues.length > 0) {
        checkPageBreak(25);
        yPos += 3;

        const issueBoxHeight = Math.min(criticalIssues.length, 4) * 9 + 10;

        // Lighter background - more subtle
        doc.setFillColor(254, 242, 242);
        doc.roundedRect(margin, yPos - 3, contentWidth, issueBoxHeight, 2, 2, 'F');

        // Thin left accent line (1px instead of 2)
        doc.setFillColor(248, 113, 113);
        doc.rect(margin, yPos - 3, 1, issueBoxHeight, 'F');

        doc.setTextColor(153, 27, 27);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(`Critical Issues (${criticalIssues.length})`, margin + 5, yPos + 2);
        yPos += 8;

        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        criticalIssues.slice(0, 4).forEach(issue => {
          doc.setTextColor(153, 27, 27);
          const issueTitle = doc.splitTextToSize(`• ${issue.title}`, contentWidth - 10);
          doc.text(issueTitle[0], margin + 5, yPos);
          yPos += 3;
          doc.setTextColor(107, 114, 128);
          const issueDesc = doc.splitTextToSize(issue.description, contentWidth - 14);
          doc.text(issueDesc[0], margin + 8, yPos);
          yPos += 5;
        });
        yPos += 4;
      }

      // Detailed Category Analysis - more compact with thinner accents
      result.categories.forEach(cat => {
        if (cat.issues.length === 0 && cat.passing.length === 0) return;

        checkPageBreak(30);

        // Category header with subtle accent
        doc.setFillColor(250, 251, 252);
        doc.roundedRect(margin, yPos - 2, contentWidth, 10, 2, 2, 'F');

        // Thin left accent based on score (1px)
        const catDetailColor = cat.score >= 80 ? [74, 222, 128] : cat.score >= 60 ? [251, 191, 36] : [248, 113, 113];
        doc.setFillColor(catDetailColor[0], catDetailColor[1], catDetailColor[2]);
        doc.rect(margin, yPos - 2, 1, 10, 'F');

        doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(cat.name, margin + 4, yPos + 4);

        // Muted score color
        const scoreTextColor = cat.score >= 80 ? [22, 163, 74] : cat.score >= 60 ? [202, 138, 4] : [220, 38, 38];
        doc.setTextColor(scoreTextColor[0], scoreTextColor[1], scoreTextColor[2]);
        doc.text(`${cat.score}/100`, pageWidth - margin - 3, yPos + 4, { align: 'right' });
        yPos += 12;

        // Issues - more compact
        const warnings = cat.issues.filter(i => i.severity !== 'critical');
        if (warnings.length > 0) {
          doc.setFontSize(7);
          doc.setTextColor(180, 83, 9);
          warnings.slice(0, 2).forEach(issue => {
            checkPageBreak(6);
            const issueText = doc.splitTextToSize(`• ${issue.title}: ${issue.description}`, contentWidth);
            doc.text(issueText[0], margin, yPos);
            yPos += 4;
          });
          yPos += 2;
        }

        // Recommendations - more compact
        if (cat.recommendations.length > 0) {
          doc.setFontSize(7);
          doc.setTextColor(brandBlue[0], brandBlue[1], brandBlue[2]);
          doc.setFont('helvetica', 'bold');
          doc.text('Recommendations:', margin, yPos);
          yPos += 3.5;
          doc.setFont('helvetica', 'normal');
          cat.recommendations.slice(0, 2).forEach((rec, i) => {
            checkPageBreak(6);
            const recText = doc.splitTextToSize(`${i + 1}. ${rec}`, contentWidth);
            doc.text(recText[0], margin, yPos);
            yPos += 4;
          });
        }
        yPos += 5;
      });

      // What Your Site Does Best Section
      const allStrengths = result.categories
        .sort((a, b) => b.score - a.score)
        .flatMap(cat =>
          (cat.passing || []).map(item => ({
            title: item.title,
            description: item.description,
            category: cat.name
          }))
        )
        .slice(0, 6);

      if (allStrengths.length > 0) {
        checkPageBreak(40);
        yPos += 3;

        // Section header with subtle green accent
        doc.setFillColor(240, 253, 244); // Very light green
        doc.roundedRect(margin, yPos - 2, contentWidth, 8, 2, 2, 'F');
        doc.setFillColor(74, 222, 128); // Green accent line
        doc.rect(margin, yPos - 2, 1, 8, 'F');

        doc.setTextColor(22, 101, 52); // Dark green
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('What Your Site Does Best', margin + 4, yPos + 3);
        yPos += 10;

        // Strengths list - simple table style
        doc.setFontSize(7);
        allStrengths.forEach((strength, index) => {
          checkPageBreak(8);

          // Alternate row background
          if (index % 2 === 0) {
            doc.setFillColor(249, 250, 251);
            doc.rect(margin, yPos - 2, contentWidth, 7, 'F');
          }

          doc.setFont('helvetica', 'bold');
          doc.setTextColor(22, 101, 52);
          doc.text('✓', margin + 2, yPos + 1);

          doc.setTextColor(30, 41, 59);
          const titleText = doc.splitTextToSize(strength.title, contentWidth * 0.5);
          doc.text(titleText[0], margin + 8, yPos + 1);

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 116, 139);
          doc.text(strength.category, pageWidth - margin - 3, yPos + 1, { align: 'right' });

          yPos += 7;
        });
        yPos += 4;
      }

      // Footer with brand styling and logo
      const totalPages = doc.getNumberOfPages();

      // Load logo for footer
      let footerLogoDataUrl: string | null = null;
      try {
        const footerLogoImg = new Image();
        footerLogoImg.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
          footerLogoImg.onload = () => resolve();
          footerLogoImg.onerror = () => reject();
          footerLogoImg.src = '/logo.png';
        });
        const footerCanvas = document.createElement('canvas');
        footerCanvas.width = footerLogoImg.width;
        footerCanvas.height = footerLogoImg.height;
        const footerCtx = footerCanvas.getContext('2d');
        footerCtx?.drawImage(footerLogoImg, 0, 0);
        footerLogoDataUrl = footerCanvas.toDataURL('image/png');
      } catch {
        // Logo failed to load, continue without it
      }

      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);

        // Footer line
        doc.setDrawColor(brandCyan[0], brandCyan[1], brandCyan[2]);
        doc.setLineWidth(0.3);
        doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);

        // Add logo to footer if available
        if (footerLogoDataUrl) {
          doc.addImage(footerLogoDataUrl, 'PNG', margin, pageHeight - 12, 8, 8);
          // Add clickable link over the logo area
          doc.link(margin, pageHeight - 12, 8, 8, { url: 'https://webcoreaudit.com' });
        }

        // Brand name with link
        doc.setFontSize(7);
        doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
        doc.setFont('helvetica', 'bold');
        const brandTextX = footerLogoDataUrl ? margin + 10 : margin;
        doc.textWithLink('webcoreaudit.com', brandTextX, pageHeight - 7, { url: 'https://webcoreaudit.com' });

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
      }

      // Save
      doc.save(`audit-report-${new Date().toISOString().split('T')[0]}.pdf`);
      onClose();
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-[16px] p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Report</h3>
        <div className="space-y-3">
          <button
            onClick={downloadPDF}
            disabled={isGeneratingPdf}
            className="w-full flex items-center gap-3 p-4 border-2 border-blue-200 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
          >
            {isGeneratingPdf ? (
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            ) : (
              <FileImage className="w-5 h-5 text-blue-600" />
            )}
            <div className="text-left">
              <p className="font-medium text-blue-900">PDF Report</p>
              <p className="text-xs text-blue-600">
                {isGeneratingPdf ? 'Generating...' : 'Professional formatted document'}
              </p>
            </div>
          </button>
          <button
            onClick={downloadMarkdown}
            className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FileText className="w-5 h-5 text-gray-600" />
            <div className="text-left">
              <p className="font-medium text-gray-900">Markdown</p>
              <p className="text-xs text-gray-500">Readable report format</p>
            </div>
          </button>
          <button
            onClick={downloadJSON}
            className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FileDown className="w-5 h-5 text-gray-600" />
            <div className="text-left">
              <p className="font-medium text-gray-900">JSON</p>
              <p className="text-xs text-gray-500">Raw data for developers</p>
            </div>
          </button>
        </div>
        <button
          onClick={onClose}
          className="w-full mt-4 py-2 text-sm text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// Streaming progress state
interface StreamProgress {
  phase: string;
  message: string;
  progress?: number;
  current?: number;
  total?: number;
}

function AuditContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const url = searchParams.get("url");
  const pagesParam = searchParams.get("pages");
  const categoriesParam = searchParams.get("categories");
  const isAdmin = searchParams.get("admin") === "true";

  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<AuditStatus>("idle");
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [emailCaptured, setEmailCaptured] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Progressive loading state
  const [streamProgress, setStreamProgress] = useState<StreamProgress | null>(null);
  const [partialCategories, setPartialCategories] = useState<CategoryScore[]>([]);
  const [partialBrief, setPartialBrief] = useState<WebsiteBrief | null>(null);
  const [partialScraped, setPartialScraped] = useState<{ url: string; finalUrl: string; title: string | null; loadTime: number; ssl: boolean; emails: string[]; socialLinks: string[] } | null>(null);
  const [partialPageSpeed, setPartialPageSpeed] = useState<{ mobile: PageSpeedData | null; desktop: PageSpeedData | null } | null>(null);
  const [runningScore, setRunningScore] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);

  // Determine if user can start audit (logged in OR email captured OR admin)
  // Admin bypasses auth loading check entirely
  const canStartAudit = isAdmin || (!authLoading && (user || emailCaptured));

  // Separate effect for elapsed time tracking
  useEffect(() => {
    if (status === "idle" || status === "complete" || status === "error") {
      return;
    }

    // Reset and start timer when audit is in progress
    const startTime = Date.now();
    setElapsedTime(0);

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [status]);

  // Show email capture modal immediately for non-logged-in users (skip for admin)
  // Show modal even while auth is loading - it will close if user turns out to be logged in
  useEffect(() => {
    // Skip for admin users
    if (isAdmin) return;
    // If auth is done loading and user is logged in, close modal if open
    if (!authLoading && user) {
      setShowEmailCapture(false);
      return;
    }
    // If email already captured, don't show modal
    if (emailCaptured) return;
    // Show modal if we have a URL to audit
    if (url) {
      setShowEmailCapture(true);
    }
  }, [authLoading, user, emailCaptured, url, isAdmin]);

  // Only start audit when user is authenticated OR has provided email
  useEffect(() => {
    if (!url) return;
    if (!canStartAudit) return;
    // Check if we already have an active connection
    if (eventSourceRef.current && eventSourceRef.current.readyState !== EventSource.CLOSED) {
      return;
    }

    // Build API URL with all parameters
    const apiParams = new URLSearchParams({ url });
    if (pagesParam) apiParams.set("pages", pagesParam);
    if (categoriesParam) apiParams.set("categories", categoriesParam);
    if (isAdmin) apiParams.set("admin", "true");

    // Use streaming API with EventSource
    const eventSource = new EventSource(`/api/audit-stream?${apiParams.toString()}`);
    eventSourceRef.current = eventSource;
    let receivedFirstEvent = false;

    setStatus("scraping");
    setCurrentStep(0);
    setCurrentCategory("Connecting to server...");

    // Timeout if we don't receive any events within 30 seconds
    const connectionTimeout = setTimeout(() => {
      if (!receivedFirstEvent) {
        setError("Connection timeout - the server took too long to respond. Please try again.");
        setStatus("error");
        eventSource.close();
      }
    }, 30000);

    // Overall audit timeout (3 minutes) - the server has a 2 minute limit, so give some buffer
    const auditTimeout = setTimeout(() => {
      setError("Audit timeout - the analysis took too long. Please try again with fewer pages.");
      setStatus("error");
      eventSource.close();
    }, 180000);

    eventSource.onopen = () => {
      setCurrentCategory("Connected, starting scan...");
    };

    eventSource.addEventListener("status", (event) => {
      receivedFirstEvent = true;
      clearTimeout(connectionTimeout);
      const data = JSON.parse(event.data) as StreamProgress;
      setStreamProgress(data);
      // Update current category from the message
      if (data.message) {
        setCurrentCategory(data.message);
      }

      if (data.phase === "scraping") {
        setStatus("scraping");
        setCurrentStep(0);
      } else if (data.phase === "analyzing" || data.phase === "brief") {
        setStatus("analyzing");
        setCurrentStep(1);
      } else if (data.phase === "summary") {
        setCurrentStep(2);
        setCurrentCategory("Generating executive summary...");
      }
    });

    eventSource.addEventListener("scraped", (event) => {
      const data = JSON.parse(event.data);
      setPartialScraped(data);
      setCurrentCategory("Fetching performance data...");
    });

    eventSource.addEventListener("pagespeed", (event) => {
      const data = JSON.parse(event.data);
      setPartialPageSpeed(data);
      setCurrentCategory("Analyzing business profile...");
    });

    eventSource.addEventListener("brief", (event) => {
      const data = JSON.parse(event.data) as WebsiteBrief;
      setPartialBrief(data);
      setCurrentCategory("Starting category analysis...");
    });

    eventSource.addEventListener("category", (event) => {
      const data = JSON.parse(event.data) as { category: CategoryScore; runningScore: number };
      setPartialCategories(prev => [...prev, data.category]);
      setRunningScore(data.runningScore);
    });

    eventSource.addEventListener("complete", (event) => {
      clearTimeout(auditTimeout);
      const data = JSON.parse(event.data) as AuditResult;
      setResult(data);
      setStatus("complete");
      setCurrentStep(2);
      setCurrentCategory(null);
      eventSource.close();
    });

    eventSource.addEventListener("error", (event) => {
      clearTimeout(auditTimeout);
      // Check if it's a custom error event with data
      if (event instanceof MessageEvent && event.data) {
        const data = JSON.parse(event.data);
        setError(data.message || "Unknown error");
      } else {
        setError("Connection to audit service failed");
      }
      setStatus("error");
      eventSource.close();
    });

    // Also handle connection errors - don't close aggressively, let the connection retry
    eventSource.onerror = () => {
      // EventSource will fire onerror for various reasons including reconnection attempts
      // Only the 'complete' or 'error' event handlers should close the connection
    };

    return () => {
      clearTimeout(connectionTimeout);
      clearTimeout(auditTimeout);
      // Close the EventSource and clear ref on unmount
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [url, pagesParam, categoriesParam, canStartAudit, isAdmin]);

  if (!url) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">
            No URL provided
          </h1>
          <Link
            href="/"
            className="text-accent-blue hover:underline flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Link>
              <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-gray-200">
                <img src="/logo.png" alt="WebCore Audit" className="w-6 h-6" />
                <span className="text-sm font-semibold text-gray-900">WebCore Audit</span>
              </div>
            </div>
            <div className="text-right">
              <p className="font-mono text-sm text-gray-900 max-w-md truncate">{url}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 py-6">
        {/* Waiting for email/auth - show simple waiting state */}
        {status === "idle" && !canStartAudit && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-wc-blue animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Please enter your email to start the audit</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {status === "error" && (
          <div className="max-w-xl mx-auto">
            <div className="bg-white border border-red-200 rounded-[16px] p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <XCircle className="w-8 h-8 text-red-500" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Audit failed
                  </h2>
                  <p className="text-sm text-gray-600">{error}</p>
                </div>
              </div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-accent-blue hover:underline text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Try again
              </Link>
            </div>
          </div>
        )}

        {/* Progressive Results Dashboard - show as data comes in */}
        {(status === "scraping" || status === "analyzing" || status === "complete") && (
          <div className="space-y-4">
            {/* Progress Banner - shows while still loading */}
            {status !== "complete" && (
              <div className="bg-gradient-to-r from-wc-blue/10 to-wc-cyan/10 border border-wc-blue/20 rounded-[16px] p-4">
                <div className="flex items-center gap-4">
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center">
                      {runningScore !== null ? (
                        <span className="text-xl font-bold text-wc-blue">{runningScore}</span>
                      ) : (
                        <Loader2 className="w-6 h-6 text-wc-blue animate-spin" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-gray-900 truncate">
                        {currentCategory || "Analyzing your website..."}
                      </p>
                      <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                        <span className="text-sm text-gray-500">
                          {partialCategories.length} / {categoriesParam ? categoriesParam.split(",").length : 10} categories
                        </span>
                        <span className="text-sm font-mono text-wc-blue bg-wc-blue/10 px-2 py-0.5 rounded">
                          {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-wc-cyan to-wc-blue transition-all duration-500"
                        style={{ width: `${streamProgress?.progress || (partialCategories.length / (categoriesParam ? categoriesParam.split(",").length : 10)) * 100}%` }}
                      />
                    </div>
                    {runningScore !== null && (
                      <p className="text-xs text-gray-500 mt-1">
                        Running score: <span className="font-medium text-gray-700">{runningScore}/100</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Website Brief - show when we have brief or result */}
            {(partialBrief || result?.brief) ? (
              <WebsiteBriefCard
                brief={result?.brief || partialBrief!}
                url={result?.url || partialScraped?.finalUrl || url || ""}
                summary={result?.summary || ""}
                logo={result?.clientLogo}
              />
            ) : (
              /* Placeholder while loading brief */
              <div className="bg-white border border-gray-200 rounded-[16px] p-6 shadow-sm animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                  <div className="flex-1 space-y-3">
                    <div className="h-6 bg-gray-200 rounded w-48" />
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="flex gap-2 mt-4">
                      <div className="h-6 bg-gray-200 rounded-full w-20" />
                      <div className="h-6 bg-gray-200 rounded-full w-24" />
                      <div className="h-6 bg-gray-200 rounded-full w-16" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Contact Information Card - show when contact info is available */}
            {partialScraped && (partialScraped.emails?.length > 0 || partialScraped.socialLinks?.length > 0) && (
              <ContactInfoCard emails={partialScraped.emails || []} socialLinks={partialScraped.socialLinks || []} />
            )}

            {/* Site Architecture - Folder View */}
            {(result?.brief?.siteStructure && result.brief.siteStructure.length > 0) && (
              <FolderGrid sections={result.brief.siteStructure} />
            )}

            {/* Report Card - only show when complete */}
            {status === "complete" && result && (
              <ReportCard result={result} onExport={() => setShowExport(true)} />
            )}

            {/* Running Score Card - show while analyzing */}
            {status !== "complete" && runningScore !== null && (
              <div className="bg-white border border-gray-200 rounded-[16px] p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Running Score</h3>
                    <p className="text-4xl font-bold text-gray-900">{runningScore}</p>
                    <p className="text-sm text-gray-500 mt-1">Based on {partialCategories.length} categories analyzed</p>
                  </div>
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
                    runningScore >= 80 ? "bg-green-100" : runningScore >= 60 ? "bg-yellow-100" : "bg-red-100"
                  }`}>
                    <span className={`text-2xl font-bold ${
                      runningScore >= 80 ? "text-green-600" : runningScore >= 60 ? "text-yellow-600" : "text-red-600"
                    }`}>
                      {runningScore >= 80 ? "A" : runningScore >= 60 ? "B" : runningScore >= 40 ? "C" : "D"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* PageSpeed Insights - show when available */}
            {(partialPageSpeed || result?.pageSpeed) && (
              <PageSpeedCard pageSpeed={result?.pageSpeed || partialPageSpeed!} />
            )}

            {/* Pages Analysis - only when complete */}
            {status === "complete" && result && (
              <PagesAnalysis
                pages={result.pagesAnalyzed}
                bestPage={result.bestPage}
              />
            )}

            {/* Category Details - Grid - show all categories immediately */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {(() => {
                // Define all possible categories with their display info
                const ALL_CATEGORY_INFO = [
                  { id: 'business', name: 'Business Overview', icon: Briefcase },
                  { id: 'technical', name: 'Technical Foundation', icon: Zap },
                  { id: 'brand', name: 'Brand & Messaging', icon: MessageSquare },
                  { id: 'ux', name: 'User Experience', icon: Layout },
                  { id: 'traffic', name: 'Traffic Readiness', icon: TrendingUp },
                  { id: 'security', name: 'Security', icon: Shield },
                  { id: 'content', name: 'Content Strategy', icon: FileText },
                  { id: 'conversion', name: 'Conversion & Engagement', icon: Target },
                  { id: 'social', name: 'Social & Multimedia', icon: Share2 },
                  { id: 'trust', name: 'Trust & Credibility', icon: Award },
                ];

                // Determine which categories to show based on params or all
                const selectedIds = categoriesParam
                  ? categoriesParam.split(",")
                  : ALL_CATEGORY_INFO.map(c => c.id);

                const categoriesToShow = ALL_CATEGORY_INFO.filter(c => selectedIds.includes(c.id));

                // Get completed categories from result or partial
                const completedCategories = result?.categories || partialCategories;

                return categoriesToShow.map((catInfo) => {
                  const completedCategory = completedCategories.find(c => c.name === catInfo.name);

                  if (completedCategory) {
                    // Show the actual category card
                    return (
                      <CategoryCard
                        key={catInfo.name}
                        category={completedCategory}
                      />
                    );
                  } else {
                    // Show skeleton with category name
                    const IconComponent = catInfo.icon;
                    return (
                      <div key={catInfo.name} className="bg-white border border-gray-200 rounded-[16px] p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <IconComponent className="w-5 h-5 text-gray-300" />
                            <span className="font-medium text-gray-400">{catInfo.name}</span>
                          </div>
                          <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
                          </div>
                        </div>
                        <div className="space-y-2 animate-pulse">
                          <div className="h-3 bg-gray-100 rounded w-full" />
                          <div className="h-3 bg-gray-100 rounded w-3/4" />
                          <div className="h-3 bg-gray-100 rounded w-1/2" />
                        </div>
                        <p className="text-xs text-gray-400 mt-4">Analyzing...</p>
                      </div>
                    );
                  }
                });
              })()}
            </div>

            {/* Top Recommendations - show when we have categories */}
            {(partialCategories.length > 0 || result?.categories) && (
              <TopRecommendationsCard categories={result?.categories || partialCategories} />
            )}

            {/* What Your Site Does Best - show when we have categories */}
            {(partialCategories.length > 0 || result?.categories) && (
              <SiteStrengthsCard categories={result?.categories || partialCategories} />
            )}

            {/* Premium Features Upsell */}
            <PremiumFeaturesCard />

            {/* Token Usage - only when complete */}
            {status === "complete" && result?.tokenUsage && (
              <TokenUsageDisplay tokenUsage={result.tokenUsage} />
            )}

            {/* Actions - only when complete */}
            {status === "complete" && result && (
              <div className="flex flex-col items-center gap-3 pt-6">
                <button
                  onClick={() => setShowExport(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-accent-blue hover:bg-accent-blue-hover text-white rounded-[12px] font-medium transition-all text-sm"
                >
                  <Download className="w-4 h-4" />
                  Export Report
                </button>
                <Link
                  href="/"
                  className="text-sm text-gray-500 hover:text-accent-blue transition-colors"
                >
                  Audit another site →
                </Link>
              </div>
            )}

            {/* Admin Footer */}
            <div className="mt-8 pt-4 border-t border-gray-100 text-center">
              <Link
                href="/admin"
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Admin Tools
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Export Modal */}
      {showExport && result && (
        <ExportModal result={result} onClose={() => setShowExport(false)} />
      )}

      {/* Email Capture Modal */}
      <EmailCaptureModal
        isOpen={showEmailCapture}
        onClose={() => {
          // If they close without providing email, redirect home
          setShowEmailCapture(false);
          router.push('/');
        }}
        onSuccess={() => {
          setEmailCaptured(true);
          setShowEmailCapture(false);
        }}
        auditUrl={url}
        source="audit"
      />
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 text-accent-blue animate-spin" />
    </div>
  );
}

export default function AuditPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <AuditContent />
    </Suspense>
  );
}
