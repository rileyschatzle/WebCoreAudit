'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import { UserAuditInput } from '@/components/dashboard/UserAuditInput';
import {
  BarChart3,
  Clock,
  Sparkles,
  FileText,
  ArrowRight,
  Zap,
  Plus,
} from 'lucide-react';

interface RecentAudit {
  id: string;
  url: string;
  overall_score: number;
  created_at: string;
  status: string;
}

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const [recentAudits, setRecentAudits] = useState<RecentAudit[]>([]);
  const [auditsLoading, setAuditsLoading] = useState(true);

  useEffect(() => {
    async function fetchAudits() {
      if (!user) return;

      const supabase = createClient();
      const { data } = await supabase
        .from('audits')
        .select('id, url, overall_score, created_at, status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentAudits((data as RecentAudit[]) || []);
      setAuditsLoading(false);
    }

    if (user) {
      fetchAudits();
    }
  }, [user]);

  const auditsUsed = profile?.audits_used_this_month || 0;
  const auditsLimit = profile?.audits_limit || 1;
  const auditsRemaining = Math.max(0, auditsLimit - auditsUsed);
  const purchasedAudits = profile?.purchased_audits || 0;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
        </h1>
        <p className="text-gray-500 mt-1">
          Here&apos;s an overview of your website audits
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<BarChart3 className="w-5 h-5" />}
          label="Audits This Month"
          value={auditsUsed.toString()}
          color="blue"
        />
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="Audits Remaining"
          value={auditsLimit === -1 ? '∞' : auditsRemaining.toString()}
          color="green"
        />
        <StatCard
          icon={<Zap className="w-5 h-5" />}
          label="Bonus Audits"
          value={purchasedAudits.toString()}
          color="amber"
        />
        <StatCard
          icon={<Sparkles className="w-5 h-5" />}
          label="Current Plan"
          value={profile?.tier || 'Free'}
          color="purple"
          capitalize
          action={
            profile?.tier === 'free' ? (
              <Link href="/pricing" className="text-xs text-purple-600 hover:underline">
                Upgrade
              </Link>
            ) : undefined
          }
        />
      </div>

      {/* Run Audit Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Run a New Audit</h2>
          <Link
            href="/build"
            className="flex items-center gap-1 text-sm text-wc-cyan hover:text-wc-blue"
          >
            <Plus className="w-4 h-4" />
            Advanced Options
          </Link>
        </div>
        <UserAuditInput />
      </div>

      {/* Recent Audits */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Audits</h2>
          <Link
            href="/my-audits"
            className="text-sm text-wc-cyan hover:text-wc-blue flex items-center gap-1"
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {auditsLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-wc-blue border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : recentAudits.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 mb-4">No audits yet</p>
            <Link
              href="/build"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-wc-blue to-wc-cyan text-white rounded-xl font-medium hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              Run Your First Audit
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentAudits.map((audit) => (
              <Link
                key={audit.id}
                href={`/audit?id=${audit.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-lg ${
                      audit.overall_score >= 80
                        ? 'bg-gradient-to-br from-green-400 to-green-600'
                        : audit.overall_score >= 60
                        ? 'bg-gradient-to-br from-amber-400 to-amber-600'
                        : 'bg-gradient-to-br from-red-400 to-red-600'
                    }`}
                  >
                    {audit.overall_score}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 truncate max-w-xs group-hover:text-wc-blue transition-colors">
                      {getDomain(audit.url)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(audit.created_at)}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-wc-cyan group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
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
  capitalize,
  action,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'blue' | 'green' | 'amber' | 'purple';
  capitalize?: boolean;
  action?: React.ReactNode;
}) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    amber: 'bg-amber-100 text-amber-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-xl ${colors[color]}`}>{icon}</div>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <div className="flex items-center justify-between">
        <p className={`text-2xl font-bold text-gray-900 ${capitalize ? 'capitalize' : ''}`}>
          {value}
        </p>
        {action}
      </div>
    </div>
  );
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
