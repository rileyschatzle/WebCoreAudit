import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
});

// Subscription Price IDs from Stripe Dashboard
export const STRIPE_PRICES = {
  starter: {
    monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || '',
    yearly: process.env.STRIPE_PRICE_STARTER_YEARLY || '',
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || '',
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY || '',
  },
  agency: {
    monthly: process.env.STRIPE_PRICE_AGENCY_MONTHLY || '',
    yearly: process.env.STRIPE_PRICE_AGENCY_YEARLY || '',
  },
} as const;

// Audit Pack Price IDs (one-time purchases)
// Format: STRIPE_PACK_{SIZE}_{TIER} e.g., STRIPE_PACK_SMALL_STARTER
export const STRIPE_PACK_PRICES = {
  small: {
    starter: process.env.STRIPE_PACK_SMALL_STARTER || '',
    pro: process.env.STRIPE_PACK_SMALL_PRO || '',
    agency: process.env.STRIPE_PACK_SMALL_AGENCY || '',
  },
  medium: {
    starter: process.env.STRIPE_PACK_MEDIUM_STARTER || '',
    pro: process.env.STRIPE_PACK_MEDIUM_PRO || '',
    agency: process.env.STRIPE_PACK_MEDIUM_AGENCY || '',
  },
  large: {
    starter: process.env.STRIPE_PACK_LARGE_STARTER || '',
    pro: process.env.STRIPE_PACK_LARGE_PRO || '',
    agency: process.env.STRIPE_PACK_LARGE_AGENCY || '',
  },
} as const;

// Map subscription price IDs back to tier names
export function getTierFromPriceId(priceId: string): string {
  const priceToTier: Record<string, string> = {};

  if (STRIPE_PRICES.starter.monthly) priceToTier[STRIPE_PRICES.starter.monthly] = 'starter';
  if (STRIPE_PRICES.starter.yearly) priceToTier[STRIPE_PRICES.starter.yearly] = 'starter';
  if (STRIPE_PRICES.pro.monthly) priceToTier[STRIPE_PRICES.pro.monthly] = 'pro';
  if (STRIPE_PRICES.pro.yearly) priceToTier[STRIPE_PRICES.pro.yearly] = 'pro';
  if (STRIPE_PRICES.agency.monthly) priceToTier[STRIPE_PRICES.agency.monthly] = 'agency';
  if (STRIPE_PRICES.agency.yearly) priceToTier[STRIPE_PRICES.agency.yearly] = 'agency';

  return priceToTier[priceId] || 'free';
}

// Map pack price IDs to pack info
export function getPackFromPriceId(priceId: string): { size: string; audits: number } | null {
  const packSizes: Record<string, number> = {
    small: 5,
    medium: 25,
    large: 100,
  };

  for (const [size, tiers] of Object.entries(STRIPE_PACK_PRICES)) {
    for (const [, packPriceId] of Object.entries(tiers)) {
      if (packPriceId === priceId) {
        return { size, audits: packSizes[size] };
      }
    }
  }

  return null;
}
