/**
 * Google PageSpeed Insights API Service
 * Fetches Core Web Vitals, Lighthouse scores, and performance data
 */

export interface CoreWebVitals {
  // Largest Contentful Paint (seconds)
  lcp: number | null;
  lcpRating: 'good' | 'needs-improvement' | 'poor' | null;
  // First Input Delay (milliseconds) - being replaced by INP
  fid: number | null;
  fidRating: 'good' | 'needs-improvement' | 'poor' | null;
  // Cumulative Layout Shift (unitless)
  cls: number | null;
  clsRating: 'good' | 'needs-improvement' | 'poor' | null;
  // Interaction to Next Paint (milliseconds) - replacing FID
  inp: number | null;
  inpRating: 'good' | 'needs-improvement' | 'poor' | null;
  // First Contentful Paint (seconds)
  fcp: number | null;
  fcpRating: 'good' | 'needs-improvement' | 'poor' | null;
  // Time to First Byte (milliseconds)
  ttfb: number | null;
  ttfbRating: 'good' | 'needs-improvement' | 'poor' | null;
}

export interface LighthouseScores {
  performance: number | null;
  accessibility: number | null;
  bestPractices: number | null;
  seo: number | null;
}

export interface LighthouseAudit {
  id: string;
  title: string;
  description: string;
  score: number | null;
  displayValue?: string;
  scoreDisplayMode: string;
}

export interface PerformanceOpportunity {
  id: string;
  title: string;
  description: string;
  savings: string | null; // e.g., "2.1 s" or "150 KiB"
  score: number | null;
}

export interface PageSpeedResult {
  // Analysis metadata
  fetchTime: string;
  finalUrl: string;
  strategy: 'mobile' | 'desktop';

  // Core Web Vitals (from Chrome UX Report - real user data)
  coreWebVitals: CoreWebVitals;
  hasFieldData: boolean; // Whether real user data exists

  // Lighthouse scores (lab data)
  lighthouseScores: LighthouseScores;

  // Key performance metrics from Lighthouse
  metrics: {
    firstContentfulPaint: number | null; // ms
    largestContentfulPaint: number | null; // ms
    totalBlockingTime: number | null; // ms
    cumulativeLayoutShift: number | null;
    speedIndex: number | null; // ms
    timeToInteractive: number | null; // ms
  };

  // Top opportunities for improvement
  opportunities: PerformanceOpportunity[];

  // Passed audits count
  passedAudits: number;
  totalAudits: number;
}

export interface PageSpeedError {
  error: true;
  message: string;
  code?: string;
}

const PAGESPEED_API_URL = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

function getRating(percentile: number, good: number, poor: number): 'good' | 'needs-improvement' | 'poor' {
  if (percentile <= good) return 'good';
  if (percentile <= poor) return 'needs-improvement';
  return 'poor';
}

function extractCoreWebVitals(cruxData: Record<string, unknown> | undefined): CoreWebVitals {
  if (!cruxData || !cruxData.metrics) {
    return {
      lcp: null, lcpRating: null,
      fid: null, fidRating: null,
      cls: null, clsRating: null,
      inp: null, inpRating: null,
      fcp: null, fcpRating: null,
      ttfb: null, ttfbRating: null,
    };
  }

  const metrics = cruxData.metrics as Record<string, { percentile?: number; category?: string }>;

  return {
    // LCP - good: ≤2.5s, poor: >4s
    lcp: metrics.LARGEST_CONTENTFUL_PAINT_MS?.percentile
      ? metrics.LARGEST_CONTENTFUL_PAINT_MS.percentile / 1000
      : null,
    lcpRating: metrics.LARGEST_CONTENTFUL_PAINT_MS?.category?.toLowerCase() as CoreWebVitals['lcpRating'] || null,

    // FID - good: ≤100ms, poor: >300ms
    fid: metrics.FIRST_INPUT_DELAY_MS?.percentile || null,
    fidRating: metrics.FIRST_INPUT_DELAY_MS?.category?.toLowerCase() as CoreWebVitals['fidRating'] || null,

    // CLS - good: ≤0.1, poor: >0.25
    cls: metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile
      ? metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE.percentile / 100
      : null,
    clsRating: metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE?.category?.toLowerCase() as CoreWebVitals['clsRating'] || null,

    // INP - good: ≤200ms, poor: >500ms
    inp: metrics.INTERACTION_TO_NEXT_PAINT?.percentile || null,
    inpRating: metrics.INTERACTION_TO_NEXT_PAINT?.category?.toLowerCase() as CoreWebVitals['inpRating'] || null,

    // FCP - good: ≤1.8s, poor: >3s
    fcp: metrics.FIRST_CONTENTFUL_PAINT_MS?.percentile
      ? metrics.FIRST_CONTENTFUL_PAINT_MS.percentile / 1000
      : null,
    fcpRating: metrics.FIRST_CONTENTFUL_PAINT_MS?.category?.toLowerCase() as CoreWebVitals['fcpRating'] || null,

    // TTFB - good: ≤800ms, poor: >1800ms
    ttfb: metrics.EXPERIMENTAL_TIME_TO_FIRST_BYTE?.percentile || null,
    ttfbRating: metrics.EXPERIMENTAL_TIME_TO_FIRST_BYTE?.category?.toLowerCase() as CoreWebVitals['ttfbRating'] || null,
  };
}

function extractLighthouseScores(categories: Record<string, { score?: number }> | undefined): LighthouseScores {
  if (!categories) {
    return {
      performance: null,
      accessibility: null,
      bestPractices: null,
      seo: null,
    };
  }

  return {
    performance: categories.performance?.score != null ? Math.round(categories.performance.score * 100) : null,
    accessibility: categories.accessibility?.score != null ? Math.round(categories.accessibility.score * 100) : null,
    bestPractices: categories['best-practices']?.score != null ? Math.round(categories['best-practices'].score * 100) : null,
    seo: categories.seo?.score != null ? Math.round(categories.seo.score * 100) : null,
  };
}

function extractOpportunities(audits: Record<string, unknown> | undefined): PerformanceOpportunity[] {
  if (!audits) return [];

  const opportunityIds = [
    'render-blocking-resources',
    'unused-css-rules',
    'unused-javascript',
    'modern-image-formats',
    'uses-optimized-images',
    'uses-responsive-images',
    'offscreen-images',
    'unminified-css',
    'unminified-javascript',
    'efficient-animated-content',
    'duplicated-javascript',
    'legacy-javascript',
    'uses-text-compression',
    'uses-rel-preconnect',
    'server-response-time',
    'redirects',
    'uses-rel-preload',
    'font-display',
    'third-party-summary',
  ];

  const opportunities: PerformanceOpportunity[] = [];

  for (const id of opportunityIds) {
    const audit = audits[id] as {
      title?: string;
      description?: string;
      score?: number;
      displayValue?: string;
      details?: { overallSavingsMs?: number; overallSavingsBytes?: number };
    } | undefined;

    if (audit && audit.score !== undefined && audit.score < 1) {
      let savings: string | null = null;

      if (audit.details?.overallSavingsMs) {
        const seconds = audit.details.overallSavingsMs / 1000;
        savings = seconds >= 1 ? `${seconds.toFixed(1)} s` : `${Math.round(audit.details.overallSavingsMs)} ms`;
      } else if (audit.details?.overallSavingsBytes) {
        const kb = audit.details.overallSavingsBytes / 1024;
        savings = kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`;
      } else if (audit.displayValue) {
        savings = audit.displayValue;
      }

      opportunities.push({
        id,
        title: audit.title || id,
        description: audit.description || '',
        savings,
        score: audit.score,
      });
    }
  }

  // Sort by score (lowest first = biggest opportunity)
  return opportunities.sort((a, b) => (a.score || 0) - (b.score || 0)).slice(0, 10);
}

export async function fetchPageSpeedInsights(
  url: string,
  strategy: 'mobile' | 'desktop' = 'mobile'
): Promise<PageSpeedResult | PageSpeedError> {
  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;

  if (!apiKey) {
    return {
      error: true,
      message: 'PageSpeed API key not configured',
      code: 'NO_API_KEY',
    };
  }

  const params = new URLSearchParams({
    url,
    key: apiKey,
    strategy,
    category: 'performance',
  });

  // Add all categories
  ['accessibility', 'best-practices', 'seo'].forEach(cat => {
    params.append('category', cat);
  });

  try {
    // Add timeout to prevent hanging on slow responses
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(`${PAGESPEED_API_URL}?${params.toString()}`, {
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        error: true,
        message: errorData.error?.message || `PageSpeed API error: ${response.status}`,
        code: errorData.error?.code || `HTTP_${response.status}`,
      };
    }

    const data = await response.json();

    // Extract CrUX data (real user data)
    const cruxData = data.loadingExperience;
    const hasFieldData = cruxData?.metrics && Object.keys(cruxData.metrics).length > 0;

    // Extract Lighthouse data
    const lighthouse = data.lighthouseResult;
    const audits = lighthouse?.audits;
    const categories = lighthouse?.categories;

    // Count passed/total audits
    let passedAudits = 0;
    let totalAudits = 0;
    if (audits) {
      for (const audit of Object.values(audits) as Array<{ score?: number | null; scoreDisplayMode?: string }>) {
        if (audit.scoreDisplayMode === 'binary' || audit.scoreDisplayMode === 'numeric') {
          totalAudits++;
          if (audit.score === 1) passedAudits++;
        }
      }
    }

    return {
      fetchTime: data.analysisUTCTimestamp || new Date().toISOString(),
      finalUrl: data.id || url,
      strategy,

      coreWebVitals: extractCoreWebVitals(cruxData),
      hasFieldData,

      lighthouseScores: extractLighthouseScores(categories),

      metrics: {
        firstContentfulPaint: audits?.['first-contentful-paint']?.numericValue || null,
        largestContentfulPaint: audits?.['largest-contentful-paint']?.numericValue || null,
        totalBlockingTime: audits?.['total-blocking-time']?.numericValue || null,
        cumulativeLayoutShift: audits?.['cumulative-layout-shift']?.numericValue || null,
        speedIndex: audits?.['speed-index']?.numericValue || null,
        timeToInteractive: audits?.['interactive']?.numericValue || null,
      },

      opportunities: extractOpportunities(audits),

      passedAudits,
      totalAudits,
    };
  } catch (error) {
    // Check for abort/timeout error
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        error: true,
        message: 'PageSpeed API request timed out after 30 seconds',
        code: 'TIMEOUT',
      };
    }
    return {
      error: true,
      message: error instanceof Error ? error.message : 'Failed to fetch PageSpeed data',
      code: 'FETCH_ERROR',
    };
  }
}

// Fetch both mobile and desktop in parallel
export async function fetchPageSpeedBoth(url: string): Promise<{
  mobile: PageSpeedResult | PageSpeedError;
  desktop: PageSpeedResult | PageSpeedError;
}> {
  const [mobile, desktop] = await Promise.all([
    fetchPageSpeedInsights(url, 'mobile'),
    fetchPageSpeedInsights(url, 'desktop'),
  ]);

  return { mobile, desktop };
}
