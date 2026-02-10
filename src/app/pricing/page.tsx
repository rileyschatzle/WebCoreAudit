'use client';
export const dynamic = "force-dynamic";

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, X, Zap, Star, Building2, Sparkles, ArrowRight } from 'lucide-react';
import { Header, Footer } from '@/components/landing';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { PRICING_CONFIG, FEATURE_COMPARISON, TierName } from '@/lib/stripe/config';
import { createCheckoutSession } from '@/lib/stripe/actions';

const tierIcons: Record<TierName, typeof Zap> = {
  free: Zap,
  starter: Sparkles,
  pro: Star,
  agency: Building2,
};

const tierColors: Record<TierName, { bg: string; text: string; border: string }> = {
  free: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' },
  starter: { bg: 'bg-wc-cyan/10', text: 'text-wc-cyan', border: 'border-wc-cyan/20' },
  pro: { bg: 'bg-wc-blue/10', text: 'text-wc-blue', border: 'border-wc-blue' },
  agency: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200' },
};

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [loadingTier, setLoadingTier] = useState<TierName | null>(null);
  const { user, profile, loading } = useAuth();
  const searchParams = useSearchParams();

  const canceled = searchParams.get('canceled') === 'true';

  const handleUpgrade = async (tierKey: TierName) => {
    if (tierKey === 'free') {
      if (!user) {
        window.location.href = '/login?redirect=/dashboard';
      }
      return;
    }

    if (!user) {
      window.location.href = `/login?redirect=/pricing&tier=${tierKey}`;
      return;
    }

    setLoadingTier(tierKey);
    try {
      await createCheckoutSession(tierKey as Exclude<TierName, 'free'>, billingPeriod);
    } catch (error) {
      console.error('Checkout error:', error);
      setLoadingTier(null);
    }
  };

  const currentTier = (profile?.tier || 'free') as TierName;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          {/* Canceled Banner */}
          {canceled && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-center"
            >
              Checkout was canceled. Feel free to try again when you&apos;re ready.
            </motion.div>
          )}

          {/* Header */}
          <div className="text-center mb-12">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-block px-4 py-1.5 text-sm font-semibold uppercase tracking-wide text-wc-cyan bg-wc-cyan/10 rounded-full border border-wc-cyan/20 mb-4"
            >
              Pricing
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
            >
              Simple, transparent pricing
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-600 max-w-2xl mx-auto"
            >
              Start free, upgrade when you need more. All plans include our core audit features.
            </motion.p>
          </div>

          {/* Billing Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center mb-12"
          >
            <div className="bg-gray-100 p-1.5 rounded-full inline-flex items-center">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  billingPeriod === 'monthly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  billingPeriod === 'yearly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Yearly
                <span className="bg-wc-green/10 text-wc-green text-xs font-bold px-2 py-0.5 rounded-full">
                  2 months free
                </span>
              </button>
            </div>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-20">
            {(Object.entries(PRICING_CONFIG) as [TierName, typeof PRICING_CONFIG.free][]).map(
              ([tierKey, tier], index) => {
                const Icon = tierIcons[tierKey];
                const colors = tierColors[tierKey];
                const isCurrentPlan = currentTier === tierKey;
                const isDowngrade =
                  Object.keys(PRICING_CONFIG).indexOf(currentTier) >
                  Object.keys(PRICING_CONFIG).indexOf(tierKey);
                const price = billingPeriod === 'monthly'
                  ? tier.price.monthly
                  : Math.round(tier.price.yearly / 12);
                const isLoading = loadingTier === tierKey;

                return (
                  <motion.div
                    key={tierKey}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className={`relative bg-white rounded-2xl border-2 p-6 flex flex-col ${
                      tier.isPopular
                        ? 'border-wc-blue shadow-xl shadow-wc-blue/10 scale-[1.02]'
                        : `${colors.border} hover:border-gray-300`
                    } transition-all duration-200`}
                  >
                    {tier.isPopular && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                        <span className="bg-gradient-to-r from-wc-blue to-wc-cyan text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                          Most Popular
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colors.bg}`}>
                        <Icon className={`w-5 h-5 ${colors.text}`} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{tier.displayName}</h3>
                        <p className="text-xs text-gray-500">{tier.description}</p>
                      </div>
                    </div>

                    <div className="mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-gray-900">
                          ${price}
                        </span>
                        <span className="text-gray-500">/mo</span>
                      </div>
                      {billingPeriod === 'yearly' && tierKey !== 'free' && (
                        <p className="text-sm text-wc-green font-medium mt-1">
                          ${tier.price.yearly}/year (save ${tier.price.monthly * 12 - tier.price.yearly})
                        </p>
                      )}
                    </div>

                    <ul className="space-y-3 mb-6 flex-1">
                      {tier.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                          <Check className="w-4 h-4 text-wc-green mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                      {tier.limitations?.map((limitation, i) => (
                        <li key={`limit-${i}`} className="flex items-start gap-2.5 text-sm text-gray-400">
                          <X className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>{limitation}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      onClick={() => handleUpgrade(tierKey)}
                      disabled={isCurrentPlan || isLoading || (tierKey === 'free' && !!user)}
                      className={`w-full ${
                        tier.isPopular
                          ? 'bg-gradient-to-r from-wc-blue to-wc-cyan hover:opacity-90'
                          : tierKey === 'free'
                          ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          : ''
                      }`}
                      variant={tier.isPopular ? 'default' : 'outline'}
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Redirecting...
                        </span>
                      ) : isCurrentPlan ? (
                        'Current Plan'
                      ) : isDowngrade ? (
                        'Downgrade'
                      ) : tierKey === 'free' ? (
                        'Get Started Free'
                      ) : (
                        <span className="flex items-center gap-2">
                          Upgrade <ArrowRight className="w-4 h-4" />
                        </span>
                      )}
                    </Button>
                  </motion.div>
                );
              }
            )}
          </div>

          {/* Feature Comparison Table */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Compare all features</h2>
              <p className="text-gray-600">See exactly what you get with each plan</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">Features</th>
                      <th className="text-center py-4 px-4 font-semibold text-gray-900">Free</th>
                      <th className="text-center py-4 px-4 font-semibold text-gray-900">Starter</th>
                      <th className="text-center py-4 px-4 font-semibold text-wc-blue bg-wc-blue/5">Pro</th>
                      <th className="text-center py-4 px-4 font-semibold text-gray-900">Agency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {FEATURE_COMPARISON.map((section, sectionIndex) => (
                      <>
                        <tr key={`section-${sectionIndex}`} className="bg-gray-50/50">
                          <td colSpan={5} className="py-3 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wide">
                            {section.category}
                          </td>
                        </tr>
                        {section.features.map((feature, featureIndex) => (
                          <tr key={`feature-${sectionIndex}-${featureIndex}`} className="border-b border-gray-100 last:border-b-0">
                            <td className="py-3.5 px-6 text-sm text-gray-600">{feature.name}</td>
                            <td className="py-3.5 px-4 text-center">
                              <FeatureValue value={feature.free} />
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <FeatureValue value={feature.starter} />
                            </td>
                            <td className="py-3.5 px-4 text-center bg-wc-blue/5">
                              <FeatureValue value={feature.pro} highlight />
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <FeatureValue value={feature.agency} />
                            </td>
                          </tr>
                        ))}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>

          {/* FAQ / CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-20 text-center"
          >
            <div className="bg-gradient-to-br from-wc-blue/5 via-wc-cyan/5 to-transparent rounded-3xl p-12 border border-wc-cyan/10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Questions? We&apos;re here to help.
              </h2>
              <p className="text-gray-600 mb-6 max-w-xl mx-auto">
                Not sure which plan is right for you? Start with Free and upgrade anytime.
                All paid plans come with a 14-day money-back guarantee.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/#faq">
                  <Button variant="outline">View FAQ</Button>
                </Link>
                <Link href="mailto:support@webcoreaudit.com">
                  <Button variant="outline">Contact Support</Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function FeatureValue({ value, highlight }: { value: boolean | string; highlight?: boolean }) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className={`w-5 h-5 mx-auto ${highlight ? 'text-wc-blue' : 'text-wc-green'}`} />
    ) : (
      <X className="w-5 h-5 mx-auto text-gray-300" />
    );
  }

  return (
    <span className={`text-sm font-medium ${highlight ? 'text-wc-blue' : 'text-gray-900'}`}>
      {value}
    </span>
  );
}
