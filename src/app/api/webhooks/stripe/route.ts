// @ts-nocheck
/* eslint-disable */
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe, getTierFromPriceId, getPackFromPriceId } from '@/lib/stripe';
import { TIER_LIMITS } from '@/lib/stripe/config';
import { applyMonthlyRollover, addPurchasedAudits, clearPurchasedAudits } from '@/lib/stripe/usage';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Use service role for webhook operations
const getServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = getServiceClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(supabase, event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(supabase, event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionCanceled(supabase, event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaid(supabase, event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoiceFailed(supabase, event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Log the event for audit trail
    try {
      await supabase.from('subscription_events').insert({
        stripe_event_id: event.id,
        event_type: event.type,
        metadata: event.data.object as unknown as Record<string, unknown>,
      });
    } catch (err) {
      // Table might not exist yet, log but don't fail
      console.warn('Failed to log subscription event:', err);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }
}

async function handleCheckoutCompleted(
  supabase: ReturnType<typeof getServiceClient>,
  session: Stripe.Checkout.Session
) {
  const userId = session.metadata?.userId;

  if (!userId) {
    console.error('No userId in checkout session metadata');
    return;
  }

  // Check if this is an audit pack purchase
  if (session.metadata?.type === 'audit_pack') {
    const audits = parseInt(session.metadata.audits || '0', 10);
    if (audits > 0) {
      await addPurchasedAudits(userId, audits);
      console.log(`User ${userId} purchased ${audits} audit credits`);
    }
    return;
  }

  // Regular subscription checkout
  const tier = session.metadata?.tier || 'starter';
  const tierLimits = TIER_LIMITS[tier as keyof typeof TIER_LIMITS] || TIER_LIMITS.free;

  await supabase.from('user_profiles').update({
    tier,
    stripe_subscription_id: session.subscription as string,
    subscription_status: 'active',
    audits_limit: tierLimits.audits,
    audits_used_this_month: 0,
    updated_at: new Date().toISOString(),
  }).eq('id', userId);

  console.log(`User ${userId} upgraded to ${tier}`);
}

async function handleSubscriptionUpdate(
  supabase: ReturnType<typeof getServiceClient>,
  subscription: Stripe.Subscription
) {
  const userId = subscription.metadata?.userId;

  if (!userId) {
    // Try to find user by customer ID
    const customerId = subscription.customer as string;
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (!profile) {
      console.error('Could not find user for subscription update');
      return;
    }

    const priceId = subscription.items.data[0]?.price.id;
    const tier = getTierFromPriceId(priceId);
    const tierLimits = TIER_LIMITS[tier as keyof typeof TIER_LIMITS] || TIER_LIMITS.free;

    await supabase.from('user_profiles').update({
      tier,
      subscription_status: subscription.status,
      stripe_subscription_id: subscription.id,
      audits_limit: tierLimits.audits,
      updated_at: new Date().toISOString(),
    }).eq('id', profile.id);

    return;
  }

  const priceId = subscription.items.data[0]?.price.id;
  const tier = getTierFromPriceId(priceId);
  const tierLimits = TIER_LIMITS[tier as keyof typeof TIER_LIMITS] || TIER_LIMITS.free;

  await supabase.from('user_profiles').update({
    tier,
    subscription_status: subscription.status,
    stripe_subscription_id: subscription.id,
    audits_limit: tierLimits.audits,
    updated_at: new Date().toISOString(),
  }).eq('id', userId);

  console.log(`Subscription updated for user ${userId}: ${tier}, status: ${subscription.status}`);
}

async function handleSubscriptionCanceled(
  supabase: ReturnType<typeof getServiceClient>,
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string;

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!profile) {
    console.error('Could not find user for subscription cancellation');
    return;
  }

  // Clear purchased audits on cancellation
  await clearPurchasedAudits(profile.id);

  await supabase.from('user_profiles').update({
    tier: 'free',
    subscription_status: 'canceled',
    audits_limit: TIER_LIMITS.free.audits,
    updated_at: new Date().toISOString(),
  }).eq('id', profile.id);

  console.log(`Subscription canceled for user ${profile.id}, purchased audits cleared`);
}

async function handleInvoicePaid(
  supabase: ReturnType<typeof getServiceClient>,
  invoice: Stripe.Invoice
) {
  const customerId = invoice.customer as string;

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!profile) {
    console.error('Could not find user for invoice');
    return;
  }

  // Check if this is a one-time pack purchase (no subscription)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!(invoice as any).subscription) {
    // This might be an audit pack purchase - check line items
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lineItems = (invoice as any).lines?.data || [];
    for (const item of lineItems) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const packInfo = getPackFromPriceId((item as any).price?.id || '');
      if (packInfo) {
        await addPurchasedAudits(profile.id, packInfo.audits);
        console.log(`User ${profile.id} purchased ${packInfo.audits} audit credits via invoice`);
      }
    }
  }

  // Save invoice record
  await supabase.from('invoices').upsert({
    user_id: profile.id,
    stripe_invoice_id: invoice.id,
    amount: invoice.amount_paid,
    currency: invoice.currency,
    status: 'paid',
    invoice_url: invoice.hosted_invoice_url,
    invoice_pdf: invoice.invoice_pdf,
    period_start: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null,
    period_end: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
  }, { onConflict: 'stripe_invoice_id' }).catch(err => {
    console.warn('Failed to save invoice:', err);
  });

  // Apply rollover logic on successful subscription payment (new billing period)
  if (invoice.subscription) {
    await applyMonthlyRollover(profile.id);
    await supabase.from('user_profiles').update({
      subscription_status: 'active',
      updated_at: new Date().toISOString(),
    }).eq('id', profile.id);
    console.log(`Invoice paid for user ${profile.id}, rollover applied`);
  }
}

async function handleInvoiceFailed(
  supabase: ReturnType<typeof getServiceClient>,
  invoice: Stripe.Invoice
) {
  const customerId = invoice.customer as string;

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!profile) {
    console.error('Could not find user for failed invoice');
    return;
  }

  await supabase.from('user_profiles').update({
    subscription_status: 'past_due',
    updated_at: new Date().toISOString(),
  }).eq('id', profile.id);

  // Save invoice record
  await supabase.from('invoices').upsert({
    user_id: profile.id,
    stripe_invoice_id: invoice.id,
    amount: invoice.amount_due,
    currency: invoice.currency,
    status: 'open',
    invoice_url: invoice.hosted_invoice_url,
    invoice_pdf: invoice.invoice_pdf,
    period_start: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null,
    period_end: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
  }, { onConflict: 'stripe_invoice_id' }).catch(err => {
    console.warn('Failed to save invoice:', err);
  });

  console.log(`Invoice failed for user ${profile.id}`);
}
