'use server';

import { stripe, STRIPE_PRICES, STRIPE_PACK_PRICES } from './index';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TierName, PackSize, PaidTierName, AUDIT_PACKS } from './config';

export async function createCheckoutSession(
  tier: Exclude<TierName, 'free'>,
  billingPeriod: 'monthly' | 'yearly'
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/pricing&tier=${tier}`);
  }

  // Get or create Stripe customer
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('stripe_customer_id, email, full_name')
    .eq('id', user.id)
    .single();

  let customerId = profile?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email || undefined,
      name: profile?.full_name || undefined,
      metadata: { userId: user.id },
    });
    customerId = customer.id;

    await supabase
      .from('user_profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id);
  }

  const priceId = STRIPE_PRICES[tier][billingPeriod];

  if (!priceId) {
    throw new Error(`Price ID not configured for ${tier} ${billingPeriod}`);
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/pricing?canceled=true`,
    metadata: {
      userId: user.id,
      tier,
      billingPeriod,
    },
    subscription_data: {
      metadata: {
        userId: user.id,
        tier,
      },
    },
    allow_promotion_codes: true,
  });

  if (session.url) {
    redirect(session.url);
  }

  throw new Error('Failed to create checkout session');
}

export async function createPackCheckoutSession(packSize: PackSize) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/billing');
  }

  // Get user profile to determine tier
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('stripe_customer_id, email, full_name, tier')
    .eq('id', user.id)
    .single();

  const tier = (profile?.tier || 'free') as TierName;

  // Free users cannot purchase packs
  if (tier === 'free') {
    redirect('/pricing');
  }

  let customerId = profile?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email || undefined,
      name: profile?.full_name || undefined,
      metadata: { userId: user.id },
    });
    customerId = customer.id;

    await supabase
      .from('user_profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id);
  }

  const priceId = STRIPE_PACK_PRICES[packSize][tier as PaidTierName];
  const packInfo = AUDIT_PACKS[packSize];

  if (!priceId) {
    throw new Error(`Pack price ID not configured for ${packSize} ${tier}`);
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/billing?pack_success=true&audits=${packInfo.audits}`,
    cancel_url: `${baseUrl}/billing?pack_canceled=true`,
    metadata: {
      userId: user.id,
      type: 'audit_pack',
      packSize,
      audits: packInfo.audits.toString(),
      tier,
    },
  });

  if (session.url) {
    redirect(session.url);
  }

  throw new Error('Failed to create pack checkout session');
}

export async function createPortalSession() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    redirect('/pricing');
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${baseUrl}/billing`,
  });

  redirect(session.url);
}

export async function getSubscriptionStatus(userId: string) {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tier, subscription_status, audits_used_this_month, audits_limit, purchased_audits, stripe_subscription_id')
    .eq('id', userId)
    .single();

  return profile;
}
