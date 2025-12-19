// Pricing configuration - single source of truth
export const PRICING_CONFIG = {
  free: {
    name: 'free',
    displayName: 'Free',
    description: 'Perfect for trying out WebCore Audit',
    price: { monthly: 0, yearly: 0 },
    auditsPerMonth: 1,
    pagesPerAudit: 1,
    rolloverCap: 0, // No rollover for free tier
    categories: ['business', 'technical', 'brand'] as string[],
    features: [
      '1 audit per month',
      '1 page per audit',
      '3 core categories',
      'Web report view',
    ],
    limitations: [
      'No PDF export',
      'No email reports',
      'No audit packs',
    ],
    hasPdfExport: false,
    hasEmailReports: false,
    hasPrioritySupport: false,
    hasApiAccess: false,
    hasWhiteLabel: false,
    canBuyPacks: false,
    isPopular: false,
  },
  starter: {
    name: 'starter',
    displayName: 'Starter',
    description: 'For freelancers and small teams',
    price: { monthly: 19, yearly: 190 },
    auditsPerMonth: 5,
    pagesPerAudit: 3,
    rolloverCap: 20, // 4x monthly
    categories: ['business', 'technical', 'brand', 'ux', 'content', 'security'] as string[],
    features: [
      '5 audits per month',
      '3 pages per audit',
      '6 categories',
      'PDF export',
      'Email reports',
      'Rollover up to 20 audits',
    ],
    limitations: [],
    hasPdfExport: true,
    hasEmailReports: true,
    hasPrioritySupport: false,
    hasApiAccess: false,
    hasWhiteLabel: false,
    canBuyPacks: true,
    isPopular: false,
  },
  pro: {
    name: 'pro',
    displayName: 'Pro',
    description: 'For growing businesses',
    price: { monthly: 49, yearly: 490 },
    auditsPerMonth: 25,
    pagesPerAudit: 10,
    rolloverCap: 100, // 4x monthly
    categories: 'all' as const,
    features: [
      '25 audits per month',
      '10 pages per audit',
      'All 10 categories',
      'PDF export',
      'Email reports',
      'Priority support',
      'Rollover up to 100 audits',
    ],
    limitations: [],
    hasPdfExport: true,
    hasEmailReports: true,
    hasPrioritySupport: true,
    hasApiAccess: false,
    hasWhiteLabel: false,
    canBuyPacks: true,
    isPopular: true,
  },
  agency: {
    name: 'agency',
    displayName: 'Agency',
    description: 'For agencies and enterprises',
    price: { monthly: 149, yearly: 1490 },
    auditsPerMonth: 100,
    pagesPerAudit: 25,
    rolloverCap: 400, // 4x monthly
    categories: 'all' as const,
    features: [
      '100 audits per month',
      '25 pages per audit',
      'All 10 categories',
      'PDF export',
      'Email reports',
      'Priority support',
      'Rollover up to 400 audits',
      'White-label reports (coming soon)',
    ],
    limitations: [],
    hasPdfExport: true,
    hasEmailReports: true,
    hasPrioritySupport: true,
    hasApiAccess: false, // Coming later
    hasWhiteLabel: false, // Coming soon
    canBuyPacks: true,
    isPopular: false,
  },
} as const;

export type TierName = keyof typeof PRICING_CONFIG;
export type PricingTier = typeof PRICING_CONFIG[TierName];

// Tier limits for enforcement
export const TIER_LIMITS: Record<TierName, { audits: number; pages: number; rolloverCap: number; categories: string[] | 'all' }> = {
  free: {
    audits: 1,
    pages: 1,
    rolloverCap: 0,
    categories: ['business', 'technical', 'brand']
  },
  starter: {
    audits: 5,
    pages: 3,
    rolloverCap: 20,
    categories: ['business', 'technical', 'brand', 'ux', 'content', 'security']
  },
  pro: {
    audits: 25,
    pages: 10,
    rolloverCap: 100,
    categories: 'all'
  },
  agency: {
    audits: 100,
    pages: 25,
    rolloverCap: 400,
    categories: 'all'
  },
};

// Audit pack pricing by tier (paid tiers only, never expire)
export const AUDIT_PACKS = {
  small: {
    audits: 5,
    prices: {
      starter: 20,  // $4.00/ea
      pro: 15,      // $3.00/ea
      agency: 10,   // $2.00/ea
    },
  },
  medium: {
    audits: 25,
    prices: {
      starter: 75,  // $3.00/ea
      pro: 50,      // $2.00/ea
      agency: 35,   // $1.40/ea
    },
  },
  large: {
    audits: 100,
    prices: {
      starter: 250, // $2.50/ea
      pro: 150,     // $1.50/ea
      agency: 100,  // $1.00/ea
    },
  },
} as const;

export type PackSize = keyof typeof AUDIT_PACKS;
export type PaidTierName = Exclude<TierName, 'free'>;

// All available categories
export const ALL_CATEGORIES = [
  'business',
  'technical',
  'brand',
  'ux',
  'traffic',
  'security',
  'content',
  'conversion',
  'social',
  'trust',
];

// Feature comparison for table
export const FEATURE_COMPARISON = [
  {
    category: 'Audits',
    features: [
      { name: 'Audits per month', free: '1', starter: '5', pro: '25', agency: '100' },
      { name: 'Pages per audit', free: '1', starter: '3', pro: '10', agency: '25' },
      { name: 'Categories', free: '3', starter: '6', pro: 'All 10', agency: 'All 10' },
      { name: 'Rollover cap', free: 'None', starter: '20', pro: '100', agency: '400' },
      { name: 'Buy extra audit packs', free: false, starter: true, pro: true, agency: true },
    ],
  },
  {
    category: 'Reports',
    features: [
      { name: 'Web report view', free: true, starter: true, pro: true, agency: true },
      { name: 'PDF export', free: false, starter: true, pro: true, agency: true },
      { name: 'Email reports', free: false, starter: true, pro: true, agency: true },
      { name: 'White-label reports', free: false, starter: false, pro: false, agency: 'Coming soon' },
    ],
  },
  {
    category: 'Support',
    features: [
      { name: 'Community support', free: true, starter: true, pro: true, agency: true },
      { name: 'Email support', free: false, starter: true, pro: true, agency: true },
      { name: 'Priority support', free: false, starter: false, pro: true, agency: true },
    ],
  },
  {
    category: 'Advanced',
    features: [
      { name: 'API access', free: false, starter: false, pro: false, agency: 'Coming soon' },
      { name: 'Team members', free: '1', starter: '1', pro: '3', agency: '10' },
      { name: 'Audit history', free: '7 days', starter: '30 days', pro: '1 year', agency: 'Unlimited' },
    ],
  },
];
