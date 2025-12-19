'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  CreditCard,
  FileText,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Zap,
  Download,
  Package,
  Crown,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import { createPortalSession, createPackCheckoutSession } from '@/lib/stripe/actions';
import { PRICING_CONFIG, AUDIT_PACKS, TierName, PackSize, PaidTierName } from '@/lib/stripe/config';

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  invoice_url: string | null;
  invoice_pdf: string | null;
  period_start: string | null;
  period_end: string | null;
  created_at: string;
}

function BillingContent() {
  const { user, profile, refreshProfile } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [purchasingPack, setPurchasingPack] = useState<PackSize | null>(null);
  const searchParams = useSearchParams();

  const success = searchParams.get('success') === 'true';
  const packSuccess = searchParams.get('pack_success') === 'true';
  const packAudits = searchParams.get('audits');

  useEffect(() => {
    async function fetchInvoices() {
      if (!user) return;
      const supabase = createClient();
      const { data } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(12);
      setInvoices((data as Invoice[]) || []);
      setInvoicesLoading(false);
    }
    if (user) {
      fetchInvoices();
    } else {
      setInvoicesLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (packSuccess && refreshProfile) {
      refreshProfile();
    }
  }, [packSuccess, refreshProfile]);

  const handlePurchasePack = async (packSize: PackSize) => {
    setPurchasingPack(packSize);
    try {
      await createPackCheckoutSession(packSize);
    } catch (error) {
      console.error('Pack purchase error:', error);
      setPurchasingPack(null);
    }
  };

  const currentTier = (profile?.tier || 'free') as TierName;
  const tierConfig = PRICING_CONFIG[currentTier];

  const tierColors: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    free: { bg: 'bg-gray-100', text: 'text-gray-600', icon: <Zap className="w-5 h-5" /> },
    starter: { bg: 'bg-blue-100', text: 'text-blue-600', icon: <Zap className="w-5 h-5" /> },
    pro: { bg: 'bg-purple-100', text: 'text-purple-600', icon: <Zap className="w-5 h-5" /> },
    agency: { bg: 'bg-amber-100', text: 'text-amber-600', icon: <Crown className="w-5 h-5" /> },
  };

  const tier = tierColors[currentTier] || tierColors.free;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Success Messages */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <div>
            <p className="font-medium text-green-800">Subscription activated!</p>
            <p className="text-sm text-green-600">Thank you for subscribing. Enjoy your new features!</p>
          </div>
        </div>
      )}

      {packSuccess && packAudits && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
          <Package className="w-5 h-5 text-green-600" />
          <div>
            <p className="font-medium text-green-800">{packAudits} bonus audits added!</p>
            <p className="text-sm text-green-600">Your audit pack has been applied to your account.</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <p className="text-gray-500 mt-1">Manage your subscription and billing</p>
      </div>

      {/* Current Plan */}
      <div className="bg-white rounded-2xl border border-gray-200 mb-6">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Current Plan</h2>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${tier.bg} ${tier.text}`}>
                {tier.icon}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-lg capitalize">{currentTier}</p>
                <p className="text-sm text-gray-500">
                  {profile?.audits_used_this_month || 0} / {profile?.audits_limit === -1 ? 'Unlimited' : profile?.audits_limit || 1} audits used this month
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {currentTier !== 'free' && (
                <button
                  onClick={() => createPortalSession()}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <CreditCard className="w-4 h-4" />
                  Manage
                </button>
              )}
              <Link
                href="/pricing"
                className="px-4 py-2 bg-gradient-to-r from-wc-blue to-wc-cyan text-white rounded-xl font-medium hover:shadow-lg transition-all"
              >
                {currentTier === 'free' ? 'Upgrade' : 'Change Plan'}
              </Link>
            </div>
          </div>

          {/* Bonus Audits */}
          {(profile?.purchased_audits || 0) > 0 && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-3">
              <Package className="w-5 h-5 text-amber-600" />
              <p className="text-sm text-amber-700">
                <span className="font-semibold">{profile?.purchased_audits}</span> bonus audits available
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Audit Packs */}
      <div className="bg-white rounded-2xl border border-gray-200 mb-6">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Buy Audit Packs</h2>
          <p className="text-sm text-gray-500">One-time purchase, no expiration</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(Object.entries(AUDIT_PACKS) as [PackSize, typeof AUDIT_PACKS[PackSize]][]).map(([size, pack]) => {
              const tierKey = (currentTier === 'free' ? 'starter' : currentTier) as Exclude<TierName, 'free'>;
              const price = pack.prices[tierKey] || pack.prices.starter;
              return (
                <div
                  key={size}
                  className={`relative p-5 rounded-xl border-2 transition-all ${
                    size === 'medium' ? 'border-wc-cyan bg-wc-cyan/5' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {size === 'medium' && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-wc-cyan text-white text-xs font-semibold rounded-full">
                      Popular
                    </span>
                  )}
                  <p className="text-3xl font-bold text-gray-900">{pack.audits}</p>
                  <p className="text-gray-500 mb-3">audits</p>
                  <p className="text-xl font-semibold text-gray-900 mb-4">${price}</p>
                  <button
                    onClick={() => handlePurchasePack(size)}
                    disabled={purchasingPack !== null || currentTier === 'free'}
                    className={`w-full py-2.5 rounded-xl font-medium transition-all ${
                      size === 'medium'
                        ? 'bg-gradient-to-r from-wc-blue to-wc-cyan text-white hover:shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } disabled:opacity-50`}
                  >
                    {purchasingPack === size ? 'Processing...' : currentTier === 'free' ? 'Upgrade First' : 'Buy Now'}
                  </button>
                </div>
              );
            })}
          </div>
          {currentTier === 'free' && (
            <p className="text-sm text-gray-500 mt-3 text-center">
              Audit packs are available for paid subscribers only.{' '}
              <Link href="/pricing" className="text-wc-cyan hover:underline">Upgrade now</Link>
            </p>
          )}
        </div>
      </div>

      {/* Invoices */}
      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Billing History</h2>
        </div>
        {invoicesLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-wc-blue border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No invoices yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    ${(invoice.amount / 100).toFixed(2)} {invoice.currency.toUpperCase()}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(invoice.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    invoice.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {invoice.status}
                  </span>
                  {invoice.invoice_pdf && (
                    <a
                      href={invoice.invoice_pdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-5xl mx-auto flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-wc-blue border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <BillingContent />
    </Suspense>
  );
}
