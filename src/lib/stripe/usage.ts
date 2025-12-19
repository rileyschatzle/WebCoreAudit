import { createClient } from '@supabase/supabase-js';
import { TIER_LIMITS, ALL_CATEGORIES, TierName } from './config';

// Use service role for server-side operations
const getServiceClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Supabase URL or service role key not configured');
  }

  return createClient(url, serviceKey);
};

export interface UsageCheckResult {
  allowed: boolean;
  reason?: string;
  auditsRemaining: number;
  auditsLimit: number;
  purchasedAudits: number;
  tier: TierName;
  pagesLimit: number;
  allowedCategories: string[];
  canBuyPacks: boolean;
}

export async function checkUserUsage(userId: string): Promise<UsageCheckResult> {
  const supabase = getServiceClient();

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('tier, audits_used_this_month, audits_limit, purchased_audits, subscription_status')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    return {
      allowed: false,
      reason: 'User profile not found',
      auditsRemaining: 0,
      auditsLimit: 0,
      purchasedAudits: 0,
      tier: 'free',
      pagesLimit: 1,
      allowedCategories: TIER_LIMITS.free.categories as string[],
      canBuyPacks: false,
    };
  }

  const tier = (profile.tier || 'free') as TierName;
  const tierLimits = TIER_LIMITS[tier];
  const purchasedAudits = profile.purchased_audits || 0;

  // Check subscription status
  if (profile.subscription_status === 'past_due') {
    return {
      allowed: false,
      reason: 'Your payment is past due. Please update your payment method to continue.',
      auditsRemaining: 0,
      auditsLimit: profile.audits_limit,
      purchasedAudits,
      tier,
      pagesLimit: tierLimits.pages,
      allowedCategories: tierLimits.categories === 'all' ? ALL_CATEGORIES : tierLimits.categories,
      canBuyPacks: false,
    };
  }

  if (profile.subscription_status === 'canceled') {
    // Canceled users fall back to free tier, lose purchased audits
    const freeLimits = TIER_LIMITS.free;
    return {
      allowed: profile.audits_used_this_month < freeLimits.audits,
      reason: profile.audits_used_this_month >= freeLimits.audits
        ? 'Your subscription was canceled. Upgrade to continue auditing.'
        : undefined,
      auditsRemaining: Math.max(0, freeLimits.audits - profile.audits_used_this_month),
      auditsLimit: freeLimits.audits,
      purchasedAudits: 0, // Purchased audits lost on cancellation
      tier: 'free',
      pagesLimit: freeLimits.pages,
      allowedCategories: freeLimits.categories as string[],
      canBuyPacks: false,
    };
  }

  // Calculate available audits: monthly balance + purchased packs
  const monthlyRemaining = Math.max(0, profile.audits_limit - profile.audits_used_this_month);
  const totalRemaining = monthlyRemaining + purchasedAudits;

  if (totalRemaining <= 0) {
    const canBuy = tier !== 'free';
    return {
      allowed: false,
      reason: canBuy
        ? 'You\'ve used all your audits. Purchase an audit pack to continue.'
        : 'You\'ve reached your monthly audit limit. Upgrade your plan for more audits.',
      auditsRemaining: 0,
      auditsLimit: profile.audits_limit,
      purchasedAudits,
      tier,
      pagesLimit: tierLimits.pages,
      allowedCategories: tierLimits.categories === 'all' ? ALL_CATEGORIES : tierLimits.categories,
      canBuyPacks: canBuy,
    };
  }

  return {
    allowed: true,
    auditsRemaining: monthlyRemaining,
    auditsLimit: profile.audits_limit,
    purchasedAudits,
    tier,
    pagesLimit: tierLimits.pages,
    allowedCategories: tierLimits.categories === 'all' ? ALL_CATEGORIES : tierLimits.categories,
    canBuyPacks: tier !== 'free',
  };
}

export async function incrementUsage(userId: string): Promise<void> {
  const supabase = getServiceClient();

  // Get current profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('audits_used_this_month, audits_limit, purchased_audits')
    .eq('id', userId)
    .single();

  if (!profile) return;

  const monthlyRemaining = profile.audits_limit - (profile.audits_used_this_month || 0);

  if (monthlyRemaining > 0) {
    // Use monthly balance first
    await supabase
      .from('user_profiles')
      .update({
        audits_used_this_month: (profile.audits_used_this_month || 0) + 1,
        last_audit_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
  } else if (profile.purchased_audits > 0) {
    // Dip into purchased packs
    await supabase
      .from('user_profiles')
      .update({
        purchased_audits: profile.purchased_audits - 1,
        last_audit_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
  }
}

export async function addPurchasedAudits(userId: string, audits: number): Promise<void> {
  const supabase = getServiceClient();

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('purchased_audits')
    .eq('id', userId)
    .single();

  const currentPurchased = profile?.purchased_audits || 0;

  await supabase
    .from('user_profiles')
    .update({
      purchased_audits: currentPurchased + audits,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
}

export async function applyMonthlyRollover(userId: string): Promise<void> {
  const supabase = getServiceClient();

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tier, audits_used_this_month, audits_limit')
    .eq('id', userId)
    .single();

  if (!profile) return;

  const tier = (profile.tier || 'free') as TierName;
  const tierLimits = TIER_LIMITS[tier];

  // Free tier has no rollover
  if (tier === 'free') {
    await supabase
      .from('user_profiles')
      .update({
        audits_used_this_month: 0,
        audits_limit: tierLimits.audits,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
    return;
  }

  // Calculate unused audits from this month
  const unusedAudits = Math.max(0, profile.audits_limit - (profile.audits_used_this_month || 0));

  // New balance = base monthly + rollover, capped at 4x
  const newLimit = Math.min(
    tierLimits.audits + unusedAudits,
    tierLimits.rolloverCap
  );

  await supabase
    .from('user_profiles')
    .update({
      audits_used_this_month: 0,
      audits_limit: newLimit,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
}

export async function resetMonthlyUsage(userId: string): Promise<void> {
  // Use the rollover logic instead of simple reset
  await applyMonthlyRollover(userId);
}

export async function clearPurchasedAudits(userId: string): Promise<void> {
  const supabase = getServiceClient();

  await supabase
    .from('user_profiles')
    .update({
      purchased_audits: 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
}

export function getTierLimits(tier: string): {
  auditsPerMonth: number;
  pagesPerAudit: number;
  rolloverCap: number;
  categories: string[];
} {
  const tierKey = (tier || 'free') as TierName;
  const limits = TIER_LIMITS[tierKey] || TIER_LIMITS.free;

  return {
    auditsPerMonth: limits.audits,
    pagesPerAudit: limits.pages,
    rolloverCap: limits.rolloverCap,
    categories: limits.categories === 'all' ? ALL_CATEGORIES : limits.categories,
  };
}
