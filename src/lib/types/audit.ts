export interface AuditRequest {
  id: string;
  url: string;
  email: string;
  status: 'pending' | 'processing' | 'complete' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

// ============================================
// Website Type Configuration
// ============================================

export interface WebsiteType {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  categoryWeights: Record<string, number>; // Category name -> weight multiplier
  focusAreas: string[];
  bestPractices: string[];
  isActive: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebsiteTypeInput {
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  categoryWeights: Record<string, number>;
  focusAreas: string[];
  bestPractices: string[];
  isActive?: boolean;
  isDefault?: boolean;
}

// Default category weights (base values)
export const DEFAULT_CATEGORY_WEIGHTS: Record<string, number> = {
  'Business Overview': 1.0,
  'Technical Foundation': 1.2,
  'Brand & Messaging': 1.0,
  'User Experience': 1.0,
  'Traffic Readiness': 1.0,
  'Security': 0.8,
  'Content Strategy': 0.8,
  'Conversion & Engagement': 1.0,
  'Social & Multimedia': 0.6,
  'Trust & Credibility': 1.0,
};

// ============================================
// Traffic Readiness Signals
// ============================================

export interface TrafficSignals {
  // Analytics & Tracking
  hasGoogleAnalytics: boolean;
  hasGTM: boolean;
  hasOtherAnalytics: string[]; // Plausible, Fathom, Mixpanel, etc.
  hasPixels: string[]; // Facebook, LinkedIn, etc.

  // SEO Infrastructure
  hasSitemap: boolean;
  sitemapPageCount: number | null;
  hasRobotsTxt: boolean;
  robotsAllowsCrawling: boolean;
  hasStructuredData: boolean;
  structuredDataTypes: string[]; // Organization, LocalBusiness, Product, etc.
  canonicalTag: boolean;

  // Content Volume
  blogExists: boolean;
  estimatedBlogPosts: number;
  hasResourcesSection: boolean;

  // Social Presence
  socialLinks: SocialLink[];

  // Technical SEO
  metaTitle: boolean;
  metaTitleLength: number;
  metaDescription: boolean;
  metaDescriptionLength: number;
  h1Count: number;
  internalLinkCount: number;
  externalLinkCount: number;
}

export interface SocialLink {
  platform: string;
  url: string;
}

// ============================================
// Design Quality Signals
// ============================================

export interface DesignQuality {
  // Footer & Freshness
  footerCopyrightYear: number | null;
  isCurrentYear: boolean;
  yearsOutdated: number;
  hasFooter: boolean;

  // URL Structure
  urlAnalysis: {
    isCleanUrl: boolean; // No query strings, readable
    hasProperHierarchy: boolean; // /category/subcategory pattern
    usesHyphens: boolean; // hyphens vs underscores
    isLowercase: boolean;
    hasFileExtension: boolean; // .html, .php etc (bad)
    urlLength: number;
    issues: string[];
  };

  // Color Analysis
  colorAnalysis: {
    primaryColors: string[]; // Hex codes of main colors
    backgroundColor: string | null;
    textColor: string | null;
    contrastRatio: number | null; // WCAG contrast ratio
    passesWCAG_AA: boolean;
    passesWCAG_AAA: boolean;
    colorCount: number; // Too many = inconsistent
    hasConsistentPalette: boolean;
    issues: string[];
  };

  // Animation Detection
  animationAnalysis: {
    hasAnimations: boolean;
    hasCSSAnimations: boolean;
    hasCSSTransitions: boolean;
    hasJSAnimations: boolean; // GSAP, AOS, Framer Motion, etc.
    animationLibraries: string[];
    threeDLibraries?: string[]; // Three.js, PixiJS, etc.
    animationCount: number;
    hasScrollAnimations: boolean;
    hasHoverEffects: boolean;
    hasCanvas?: boolean;
    hasWebGL?: boolean;
    hasSVGAnimations?: boolean;
    hasParallax?: boolean;
    hasPageTransitions?: boolean;
    has3D?: boolean;
    creativeScore?: number; // 0-100 creative quality score
    isHighCraft?: boolean; // true if creativeScore >= 50
  };

  // Layout Analysis
  layoutAnalysis: {
    hasConsistentSpacing: boolean;
    sectionCount: number;
    averageSectionPadding: number | null;
    hasVisualHierarchy: boolean;
    usesGridSystem: boolean;
    usesFlexbox: boolean;
    hasResponsiveDesign: boolean;
    layoutPatterns: string[]; // hero, features grid, testimonials, etc.
    issues: string[];
  };

  // Mobile Experience
  mobileAnalysis: {
    hasViewportMeta: boolean;
    viewportContent: string | null;
    hasMobileMenu: boolean; // hamburger/mobile nav detected
    hasMediaQueries: boolean;
    touchTargetIssues: number; // Count of elements with small touch targets
    fontSizeBase: number | null; // Base font size in px
    isReadableFontSize: boolean; // >= 16px
    hasHorizontalScroll: boolean;
    hasStickyHeader: boolean;
    mobileScore: number; // 0-100 overall mobile readiness
    issues: string[];
  };
}

// ============================================
// Extended Content Detection
// ============================================

export interface ExtendedContent {
  // Trust & Credibility
  hasTestimonials: boolean;
  testimonialCount: number;
  hasTeamPage: boolean;
  hasCaseStudies: boolean;
  hasPrivacyPolicy: boolean;
  hasTermsOfService: boolean;
  hasTrustBadges: boolean;
  trustBadgeTypes: string[];

  // Content Strategy
  hasBlog: boolean;
  blogPostCount: number;
  hasResourcesSection: boolean;
  resourceTypes: string[]; // guides, ebooks, whitepapers, etc.

  // Conversion & Engagement
  hasLeadCapture: boolean;
  leadCaptureTypes: string[]; // newsletter, contact form, demo request, etc.
  hasEmailSignup: boolean;
  hasPricingPage: boolean;
  pricingTransparency: 'visible' | 'hidden' | 'contact-sales' | 'none';
  ctaCount: number;
  ctaTypes: string[];

  // Social & Multimedia
  hasVideoContent: boolean;
  videoSources: string[]; // YouTube, Vimeo, Wistia, self-hosted
  videoCount: number;
  hasPodcast: boolean;
  socialProfiles: SocialLink[];

  // Business Overview
  hasAboutPage: boolean;
  hasContactPage: boolean;
  hasMissionStatement: boolean;
  competitorsMentioned: string[];
  targetAudienceClarity: boolean;
}

// ============================================
// Page-Level Analysis
// ============================================

export interface PageData {
  url: string;
  path: string;
  title: string | null;
  metaDescription: string | null;
  h1: string[];
  loadTime: number;
  wordCount: number;
  imageCount: number;
  hasForm: boolean;
  hasCTA: boolean;
}

export interface PageScore {
  url: string;
  path: string;
  title: string | null;
  overallScore: number;
  scores: {
    technical: number;
    content: number;
    ux: number;
  };
  issues: Issue[];
  passing: PassingItem[];
}

// ============================================
// Main Scraped Data
// ============================================

export interface ScrapedData {
  url: string;
  finalUrl: string;
  loadTime: number;
  statusCode: number;

  // Meta
  title: string | null;
  metaDescription: string | null;
  favicon: boolean;

  // Client branding
  faviconUrl: string | null;
  ogImageUrl: string | null;
  logoUrl: string | null; // Best available logo (prioritized)

  // Technical
  ssl: boolean;
  sslError: string | null;
  mobileViewport: boolean;
  contentLength: number;
  imageCount: number;
  totalImageSize: number;
  brokenLinks: string[];

  // Content
  h1: string[];
  h2: string[];
  bodyText: string;
  ctaButtons: string[];
  navLinks: string[];

  // Structure
  hasAnalytics: boolean;
  hasForms: boolean;
  socialLinks: string[];

  // Contact Information
  emails: string[];

  // Extended (for new categories)
  trafficSignals?: TrafficSignals;
  extendedContent?: ExtendedContent;
  designQuality?: DesignQuality;
  pages?: PageData[];

  // Screenshots for visual analysis
  screenshots?: {
    desktop?: string; // Base64 encoded PNG
    mobile?: string; // Base64 encoded PNG
  };
}

// ============================================
// Analysis Results
// ============================================

export interface CategoryScore {
  name: string;
  score: number;
  weight: number;
  issues: Issue[];
  passing: PassingItem[];
  recommendations: string[];
}

export interface Issue {
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  impact: string;
}

export interface PassingItem {
  title: string;
  description: string;
  value?: string;
}

export interface SiteSection {
  name: string;
  path: string;
  exists: boolean;
  description: string;
}

export interface WebsiteTypeAnalysis {
  primaryType: string; // e.g., "Agency", "E-commerce", "Portfolio"
  confidence: number; // 0-100
  characteristics: string[]; // e.g., ["Service-based", "B2B focused", "Lead generation"]
  subType?: string; // e.g., "Creative Agency", "Digital Marketing Agency"
}

export interface WebsiteBrief {
  businessName: string;
  businessDescription: string;
  targetAudience: string;
  industry: string;
  siteType: string; // e.g., "SaaS", "Agency", "E-commerce", "Portfolio", "Blog"
  totalPages: number | null; // from sitemap
  websiteType?: WebsiteTypeAnalysis;
  siteStructure?: SiteSection[];
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number; // USD
}

export interface AuditResult {
  id: string;
  url: string;
  overallScore: number;
  categories: CategoryScore[];
  summary: string;
  scrapedAt: Date;
  analyzedAt: Date;

  // Client branding
  clientLogo: string | null; // URL to client's logo/favicon

  // Website brief
  brief: WebsiteBrief;

  // Multi-page analysis
  pageCount: number;
  pagesAnalyzed: PageScore[];
  bestPage: PageScore | null;
  worstPage: PageScore | null;

  // Token usage tracking
  tokenUsage?: TokenUsage;

  // PageSpeed Insights data
  pageSpeed?: {
    mobile: PageSpeedData | null;
    desktop: PageSpeedData | null;
  };
}

// ============================================
// Category Names (for reference)
// ============================================

export const CATEGORY_NAMES = {
  // MVP Tier
  BUSINESS_OVERVIEW: 'Business Overview',
  TECHNICAL_FOUNDATION: 'Technical Foundation',
  BRAND_MESSAGING: 'Brand & Messaging',
  USER_EXPERIENCE: 'User Experience',
  TRAFFIC_READINESS: 'Traffic Readiness',
  SECURITY: 'Security',

  // Premium Tier
  CONTENT_STRATEGY: 'Content Strategy',
  CONVERSION_ENGAGEMENT: 'Conversion & Engagement',
  SOCIAL_MULTIMEDIA: 'Social & Multimedia',
  TRUST_CREDIBILITY: 'Trust & Credibility',
} as const;

export type CategoryName = typeof CATEGORY_NAMES[keyof typeof CATEGORY_NAMES];

// ============================================
// PageSpeed Insights Data
// ============================================

export interface CoreWebVitals {
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

export interface LighthouseScores {
  performance: number | null;
  accessibility: number | null;
  bestPractices: number | null;
  seo: number | null;
}

export interface PerformanceOpportunity {
  id: string;
  title: string;
  description: string;
  savings: string | null;
  score: number | null;
}

export interface PageSpeedData {
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
