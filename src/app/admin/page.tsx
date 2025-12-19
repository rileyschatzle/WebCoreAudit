'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Activity,
  DollarSign,
  Zap,
  TrendingUp,
  FileText,
  Users,
  CreditCard,
  RefreshCw,
  Globe,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { AdminAuditInput } from '@/components/admin/AdminAuditInput';

interface AdminStats {
  totalAudits: number;
  completedAudits: number;
  failedAudits: number;
  totalTokens: number;
  totalCost: number;
  avgScore: number;
  emailSubscribers: number;
}

interface RecentAudit {
  id: string;
  url: string;
  score: number | null;
  status: string;
  createdAt: string;
  completedAt: string | null;
  tokens: number | null;
  cost: number | null;
  businessName: string | null;
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentAudits, setRecentAudits] = useState<RecentAudit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data = await res.json();
      setStats(data.stats);
      setRecentAudits(data.recentAudits || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchStats();
    }
  }, [session]);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Welcome back, {session?.user?.email}</p>
        </div>
        <button
          onClick={fetchStats}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Activity className="w-5 h-5" />}
          label="Total Audits"
          value={isLoading ? '...' : stats?.totalAudits.toString() || '0'}
          color="blue"
        />
        <StatCard
          icon={<Zap className="w-5 h-5" />}
          label="Total Tokens"
          value={isLoading ? '...' : formatNumber(stats?.totalTokens || 0)}
          color="amber"
        />
        <StatCard
          icon={<DollarSign className="w-5 h-5" />}
          label="Total Cost"
          value={isLoading ? '...' : `$${(stats?.totalCost || 0).toFixed(2)}`}
          color="green"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Avg Score"
          value={isLoading ? '...' : `${stats?.avgScore || 0}/100`}
          color="purple"
        />
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Link href="/admin/users" className="group">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-wc-cyan/50 hover:shadow-lg hover:shadow-wc-cyan/5 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
                <Users className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 group-hover:text-wc-blue transition-colors">
                  Manage Users
                </h3>
                <p className="text-sm text-gray-500">View and manage user accounts</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-wc-cyan group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </Link>

        <Link href="/admin/subscriptions" className="group">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-wc-cyan/50 hover:shadow-lg hover:shadow-wc-cyan/5 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-100 text-green-600">
                <CreditCard className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 group-hover:text-wc-blue transition-colors">
                  Subscriptions
                </h3>
                <p className="text-sm text-gray-500">Track MRR and subscribers</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-wc-cyan group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </Link>

        <Link href="/admin/audits" className="group">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-wc-cyan/50 hover:shadow-lg hover:shadow-wc-cyan/5 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-100 text-purple-600">
                <FileText className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 group-hover:text-wc-blue transition-colors">
                  All Audits
                </h3>
                <p className="text-sm text-gray-500">View audit history and stats</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-wc-cyan group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </Link>
      </div>

      {/* Run Admin Audit */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Run Admin Audit</h2>
        <AdminAuditInput isDark={false} onComplete={fetchStats} />
      </div>

      {/* Recent Audits */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Audits</h2>
          <Link
            href="/admin/audits"
            className="text-sm text-wc-cyan hover:text-wc-blue flex items-center gap-1"
          >
            View All <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-wc-blue border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : recentAudits.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No audits yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Site</th>
                  <th className="px-6 py-3">Score</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Tokens</th>
                  <th className="px-6 py-3">Cost</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentAudits.slice(0, 10).map((audit) => (
                  <tr key={audit.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900 truncate max-w-[200px]">
                            {audit.businessName || getDomain(audit.url)}
                          </p>
                          <p className="text-xs text-gray-400 truncate max-w-[200px]">
                            {audit.url}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {audit.score !== null ? (
                        <span className={`font-bold ${getScoreColor(audit.score)}`}>
                          {audit.score}
                        </span>
                      ) : (
                        <span className="text-gray-400">--</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={audit.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {audit.tokens ? audit.tokens.toLocaleString() : '--'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {audit.cost ? `$${Number(audit.cost).toFixed(4)}` : '--'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(audit.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
  color: 'blue' | 'amber' | 'green' | 'purple';
}) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
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

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { icon: React.ReactNode; bg: string; text: string }> = {
    completed: {
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      bg: 'bg-green-100',
      text: 'text-green-700',
    },
    failed: {
      icon: <AlertCircle className="w-3.5 h-3.5" />,
      bg: 'bg-red-100',
      text: 'text-red-700',
    },
    processing: {
      icon: <Clock className="w-3.5 h-3.5" />,
      bg: 'bg-amber-100',
      text: 'text-amber-700',
    },
  };

  const { icon, bg, text } = config[status] || config.processing;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
      {icon}
      <span className="capitalize">{status}</span>
    </span>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
  return num.toString();
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-600';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
