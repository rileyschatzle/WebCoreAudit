'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  RefreshCw,
  ExternalLink,
  TrendingUp,
  Users,
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  Crown,
} from 'lucide-react';

interface Subscription {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  tier: string;
  subscription_status: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  current_period_end: string | null;
  created_at: string;
}

interface SubscriptionStats {
  total: number;
  active: number;
  canceled: number;
  pastDue: number;
  mrr: number;
  byTier: {
    starter: number;
    pro: number;
    agency: number;
  };
}

export default function AdminSubscriptionsPage() {
  const { data: session } = useSession();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/subscriptions');
      if (!res.ok) throw new Error('Failed to fetch subscriptions');
      const data = await res.json();
      setSubscriptions(data.subscriptions || []);
      setStats(data.stats || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchSubscriptions();
    }
  }, [session]);

  const tierColors: Record<string, string> = {
    starter: 'text-blue-600',
    pro: 'text-purple-600',
    agency: 'text-amber-600',
  };

  const statusIcons: Record<string, React.ReactNode> = {
    active: <CheckCircle2 className="w-4 h-4 text-green-500" />,
    canceled: <XCircle className="w-4 h-4 text-gray-400" />,
    past_due: <Clock className="w-4 h-4 text-red-500" />,
    trialing: <Clock className="w-4 h-4 text-blue-500" />,
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
          <p className="text-gray-500">Manage active subscriptions</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://dashboard.stripe.com/test/subscriptions"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Stripe Dashboard
          </a>
          <button
            onClick={fetchSubscriptions}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-wc-blue text-white rounded-xl hover:bg-wc-blue-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<Users className="w-5 h-5" />}
            label="Active Subscriptions"
            value={stats.active.toString()}
            color="green"
          />
          <StatCard
            icon={<DollarSign className="w-5 h-5" />}
            label="Monthly Recurring Revenue"
            value={`$${stats.mrr.toFixed(2)}`}
            color="blue"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Total Subscribers"
            value={stats.total.toString()}
            color="purple"
          />
          <StatCard
            icon={<Crown className="w-5 h-5" />}
            label="Agency Plans"
            value={stats.byTier.agency.toString()}
            color="amber"
          />
        </div>
      )}

      {/* Tier Breakdown */}
      {stats && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Subscribers by Plan</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-xl bg-blue-50">
              <p className="text-3xl font-bold text-blue-600">{stats.byTier.starter}</p>
              <p className="text-gray-600">Starter</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-purple-50">
              <p className="text-3xl font-bold text-purple-600">{stats.byTier.pro}</p>
              <p className="text-gray-600">Pro</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-amber-50">
              <p className="text-3xl font-bold text-amber-600">{stats.byTier.agency}</p>
              <p className="text-gray-600">Agency</p>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Subscriptions Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Plan</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Next Billing</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="w-8 h-8 border-4 border-wc-blue border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No active subscriptions
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {sub.full_name || 'No name'}
                        </p>
                        <p className="text-sm text-gray-500">{sub.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-semibold capitalize ${tierColors[sub.tier] || 'text-gray-600'}`}>
                        {sub.tier}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {statusIcons[sub.subscription_status] || statusIcons.active}
                        <span className="text-sm text-gray-700 capitalize">
                          {sub.subscription_status?.replace('_', ' ') || 'Active'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-500">
                        {sub.current_period_end
                          ? new Date(sub.current_period_end).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : '--'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <a
                        href={`https://dashboard.stripe.com/test/subscriptions/${sub.stripe_subscription_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
                      >
                        View <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'green' | 'blue' | 'purple' | 'amber';
}) {
  const colors = {
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    amber: 'bg-amber-100 text-amber-600',
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-xl ${colors[color]}`}>{icon}</div>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
