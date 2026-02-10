import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSupabaseAdminOrMock } from '@/lib/supabase/admin-client';
import { PRICING_CONFIG } from '@/lib/stripe/config';


export async function GET() {
  try {
    // Check admin auth
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string })?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all users with active subscriptions
    const { data: subscriptions, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .not('stripe_subscription_id', 'is', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
    }

    // Calculate stats
    const active = subscriptions?.filter(s => s.subscription_status === 'active') || [];
    const canceled = subscriptions?.filter(s => s.subscription_status === 'canceled') || [];
    const pastDue = subscriptions?.filter(s => s.subscription_status === 'past_due') || [];

    const byTier = {
      starter: subscriptions?.filter(s => s.tier === 'starter' && s.subscription_status === 'active').length || 0,
      pro: subscriptions?.filter(s => s.tier === 'pro' && s.subscription_status === 'active').length || 0,
      agency: subscriptions?.filter(s => s.tier === 'agency' && s.subscription_status === 'active').length || 0,
    };

    // Calculate MRR (Monthly Recurring Revenue)
    const mrr = active.reduce((total, sub) => {
      const tier = sub.tier as keyof typeof PRICING_CONFIG;
      const price = PRICING_CONFIG[tier]?.price?.monthly || 0;
      return total + price;
    }, 0);

    return NextResponse.json({
      subscriptions: subscriptions?.map(s => ({
        id: s.id,
        user_id: s.id,
        email: s.email,
        full_name: s.full_name,
        tier: s.tier,
        subscription_status: s.subscription_status,
        stripe_subscription_id: s.stripe_subscription_id,
        stripe_customer_id: s.stripe_customer_id,
        current_period_end: s.current_period_end,
        created_at: s.created_at,
      })) || [],
      stats: {
        total: subscriptions?.length || 0,
        active: active.length,
        canceled: canceled.length,
        pastDue: pastDue.length,
        mrr,
        byTier,
      },
    });
  } catch (error) {
    console.error('Admin subscriptions API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
