'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  FileText,
  RefreshCw,
  Globe,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  DollarSign,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Users,
  Shield,
  Timer,
  AlertCircle,
  ExternalLink,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
} from 'lucide-react';

interface CategoryScores {
  [key: string]: number;
}

interface AuditBrief {
  business_name?: string;
  business_description?: string;
  target_audience?: string;
  industry?: string;
  site_type?: string;
  total_pages?: number;
}

interface Audit {
  id: string;
  url: string;
  score: number | null;
  status: string;
  createdAt: string;
  completedAt: string | null;
  durationSeconds: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  cost: number | null;
  categoryScores: CategoryScores;
  brief: AuditBrief;
  summary: string | null;
  errorMessage: string | null;
  isAdmin: boolean;
  userId: string | null;
  userEmail: string | null;
  sourceIp: string | null;
  userAgent: string | null;
}

interface AuditStats {
  total: number;
  adminCount: number;
  userCount: number;
  completed: number;
  failed: number;
  avgScore: number;
  totalTokens: number;
  totalCost: number;
}

type FilterType = 'all' | 'admin' | 'user';
type SortField = 'date' | 'score';
type SortDirection = 'asc' | 'desc';

export default function AdminAuditsPage() {
  const { data: session } = useSession();
  const [audits, setAudits] = useState<Audit[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);
  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const fetchAudits = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/audits?page=${page}&limit=${limit}&filter=${filter}&sort=${sortField}&direction=${sortDirection}`);
      if (!res.ok) throw new Error('Failed to fetch audits');
      const data = await res.json();
      setAudits(data.audits || []);
      setStats(data.stats || null);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchAudits();
    }
  }, [session, page, filter, sortField, sortDirection]);

  // Reset page when filter or sort changes
  useEffect(() => {
    setPage(1);
  }, [filter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />;
    return sortDirection === 'asc'
      ? <ArrowUp className="w-3.5 h-3.5 text-wc-blue" />
      : <ArrowDown className="w-3.5 h-3.5 text-wc-blue" />;
  };

  const totalPages = Math.ceil(total / limit);

  const formatDuration = (seconds: number | null) => {
    if (seconds === null) return '--';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit History</h1>
          <p className="text-gray-500">{total} audits found</p>
        </div>
        <button
          onClick={fetchAudits}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-wc-blue text-white rounded-xl hover:bg-wc-blue-600 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <StatCard
            icon={<FileText className="w-4 h-4" />}
            label="Total"
            value={stats.total.toString()}
            color="blue"
          />
          <StatCard
            icon={<Shield className="w-4 h-4" />}
            label="Admin"
            value={stats.adminCount.toString()}
            color="purple"
          />
          <StatCard
            icon={<Users className="w-4 h-4" />}
            label="User"
            value={stats.userCount.toString()}
            color="cyan"
          />
          <StatCard
            icon={<TrendingUp className="w-4 h-4" />}
            label="Avg Score"
            value={`${stats.avgScore}`}
            color="green"
          />
          <StatCard
            icon={<Zap className="w-4 h-4" />}
            label="Tokens"
            value={formatNumber(stats.totalTokens)}
            color="amber"
          />
          <StatCard
            icon={<DollarSign className="w-4 h-4" />}
            label="Cost"
            value={`$${stats.totalCost.toFixed(2)}`}
            color="red"
          />
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-4">
        <TabButton
          active={filter === 'all'}
          onClick={() => setFilter('all')}
          icon={<FileText className="w-4 h-4" />}
          label="All Audits"
          count={stats?.total}
        />
        <TabButton
          active={filter === 'admin'}
          onClick={() => setFilter('admin')}
          icon={<Shield className="w-4 h-4" />}
          label="Admin Audits"
          count={stats?.adminCount}
        />
        <TabButton
          active={filter === 'user'}
          onClick={() => setFilter('user')}
          icon={<Users className="w-4 h-4" />}
          label="User Audits"
          count={stats?.userCount}
        />
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Audits List */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-wc-blue border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : audits.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No audits found
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {/* Table Header */}
            <div className="px-6 py-3 flex items-center gap-4 bg-gray-50 border-b border-gray-200">
              <div className="w-4" /> {/* Expand icon spacer */}
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Website</span>
              </div>
              {filter === 'user' && (
                <div className="w-36 hidden lg:block">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">User</span>
                </div>
              )}
              <button
                onClick={() => handleSort('score')}
                className="w-16 text-center flex items-center justify-center gap-1 hover:text-wc-blue transition-colors"
              >
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Score</span>
                <SortIcon field="score" />
              </button>
              <div className="w-28">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</span>
              </div>
              <div className="w-16 text-right hidden md:block">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tokens</span>
              </div>
              <div className="w-16 text-right hidden md:block">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cost</span>
              </div>
              <div className="w-20 text-right hidden md:block">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</span>
              </div>
              <button
                onClick={() => handleSort('date')}
                className="w-32 text-right flex items-center justify-end gap-1 hover:text-wc-blue transition-colors"
              >
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</span>
                <SortIcon field="date" />
              </button>
              <div className="w-10" /> {/* Download button spacer */}
            </div>
            {audits.map((audit) => (
              <AuditRow
                key={audit.id}
                audit={audit}
                expanded={expandedId === audit.id}
                onToggle={() => setExpandedId(expandedId === audit.id ? null : audit.id)}
                formatDuration={formatDuration}
                showUserColumn={filter === 'user'}
              />
            ))}
            {/* Page Totals Row */}
            <div className="px-6 py-3 flex items-center gap-4 bg-gray-100 border-t border-gray-200">
              <div className="w-4" />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-gray-700">Page Total ({audits.length} audits)</span>
              </div>
              {filter === 'user' && <div className="w-36 hidden lg:block" />}
              <div className="w-16 text-center" />
              <div className="w-28" />
              <div className="w-16 text-right hidden md:block">
                <span className="text-sm font-semibold text-gray-700">
                  {formatNumber(audits.reduce((sum, a) => sum + (a.totalTokens || 0), 0))}
                </span>
              </div>
              <div className="w-16 text-right hidden md:block">
                <span className="text-sm font-semibold text-gray-700">
                  ${audits.reduce((sum, a) => sum + (Number(a.cost) || 0), 0).toFixed(2)}
                </span>
              </div>
              <div className="w-20 hidden md:block" />
              <div className="w-32" />
              <div className="w-10" />
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 flex items-center justify-between border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-700">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AuditRow({
  audit,
  expanded,
  onToggle,
  formatDuration,
  showUserColumn,
}: {
  audit: Audit;
  expanded: boolean;
  onToggle: () => void;
  formatDuration: (seconds: number | null) => string;
  showUserColumn: boolean;
}) {
  const categoryEntries = Object.entries(audit.categoryScores);

  return (
    <div className={`${expanded ? 'bg-gray-50' : 'hover:bg-gray-50'} transition-colors`}>
      {/* Main Row */}
      <div
        className="px-6 py-4 flex items-center gap-4 cursor-pointer"
        onClick={onToggle}
      >
        {/* Expand Icon */}
        <button className="text-gray-400 hover:text-gray-600">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {/* Site Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <p className="font-medium text-gray-900 truncate">
              {audit.brief?.business_name || getDomain(audit.url)}
            </p>
            {audit.isAdmin && (
              <span className="px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded text-[10px] font-medium">
                ADMIN
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 truncate">{audit.url}</p>
        </div>

        {/* User - only show for user audits filter */}
        {showUserColumn && (
          <div className="w-36 hidden lg:block">
            {audit.userEmail ? (
              <p className="text-sm text-gray-600 truncate">{audit.userEmail}</p>
            ) : (
              <span className="text-xs text-gray-400">Anonymous</span>
            )}
          </div>
        )}

        {/* Score */}
        <div className="w-16 text-center">
          {audit.score !== null ? (
            <span className={`text-xl font-bold ${getScoreColor(audit.score)}`}>
              {audit.score}
            </span>
          ) : (
            <span className="text-gray-400">--</span>
          )}
        </div>

        {/* Status */}
        <div className="w-28">
          <StatusBadge status={audit.status} />
        </div>

        {/* Tokens */}
        <div className="w-16 text-right hidden md:block">
          <span className="text-sm text-gray-500">
            {audit.totalTokens ? formatNumber(audit.totalTokens) : '--'}
          </span>
        </div>

        {/* Cost */}
        <div className="w-16 text-right hidden md:block">
          <span className="text-sm text-gray-500">
            {audit.cost ? `$${Number(audit.cost).toFixed(2)}` : '--'}
          </span>
        </div>

        {/* Duration */}
        <div className="w-20 text-right hidden md:block">
          <div className="flex items-center justify-end gap-1 text-sm text-gray-500">
            <Timer className="w-3.5 h-3.5" />
            <span>{formatDuration(audit.durationSeconds)}</span>
          </div>
        </div>

        {/* Date */}
        <div className="w-32 text-right">
          <p className="text-sm text-gray-500">{formatDate(audit.createdAt)}</p>
        </div>

        {/* Download Button */}
        <div className="w-10 flex justify-center">
          {audit.status === 'completed' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                downloadAudit(audit);
              }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-wc-blue hover:bg-wc-blue/10 transition-colors"
              title="Download audit"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-6 pb-6 pt-2 border-t border-gray-100 bg-white">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Category Scores */}
            <div className="lg:col-span-2">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Category Scores
              </h4>
              {categoryEntries.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {categoryEntries.map(([name, score]) => (
                    <div
                      key={name}
                      className="p-3 bg-gray-50 rounded-lg text-center"
                    >
                      <p className="text-xs text-gray-500 truncate mb-1">{name}</p>
                      <p className={`text-lg font-bold ${getScoreColor(score)}`}>{score}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No category scores available</p>
              )}

              {/* Summary */}
              {audit.summary && (
                <div className="mt-4">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Summary
                  </h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{audit.summary}</p>
                </div>
              )}

              {/* Error Message */}
              {audit.errorMessage && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1">
                        Error
                      </h4>
                      <p className="text-sm text-red-700">{audit.errorMessage}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Details */}
            <div className="space-y-4">
              {/* Business Info */}
              {(audit.brief?.industry || audit.brief?.site_type) && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Business Info
                  </h4>
                  <div className="space-y-1 text-sm">
                    {audit.brief?.industry && (
                      <p><span className="text-gray-500">Industry:</span> <span className="text-gray-900">{audit.brief.industry}</span></p>
                    )}
                    {audit.brief?.site_type && (
                      <p><span className="text-gray-500">Type:</span> <span className="text-gray-900">{audit.brief.site_type}</span></p>
                    )}
                    {audit.brief?.total_pages && (
                      <p><span className="text-gray-500">Pages:</span> <span className="text-gray-900">{audit.brief.total_pages.toLocaleString()}</span></p>
                    )}
                  </div>
                </div>
              )}

              {/* Token Usage */}
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Token Usage
                </h4>
                <div className="space-y-1 text-sm">
                  <p><span className="text-gray-500">Input:</span> <span className="text-gray-900">{audit.inputTokens?.toLocaleString() || '--'}</span></p>
                  <p><span className="text-gray-500">Output:</span> <span className="text-gray-900">{audit.outputTokens?.toLocaleString() || '--'}</span></p>
                  <p><span className="text-gray-500">Total:</span> <span className="text-gray-900 font-medium">{audit.totalTokens?.toLocaleString() || '--'}</span></p>
                  <p><span className="text-gray-500">Cost:</span> <span className="text-gray-900 font-medium">{audit.cost ? `$${Number(audit.cost).toFixed(4)}` : '--'}</span></p>
                </div>
              </div>

              {/* Timing */}
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Timing
                </h4>
                <div className="space-y-1 text-sm">
                  <p><span className="text-gray-500">Started:</span> <span className="text-gray-900">{formatDateTime(audit.createdAt)}</span></p>
                  {audit.completedAt && (
                    <p><span className="text-gray-500">Completed:</span> <span className="text-gray-900">{formatDateTime(audit.completedAt)}</span></p>
                  )}
                  <p><span className="text-gray-500">Duration:</span> <span className="text-gray-900 font-medium">{formatDuration(audit.durationSeconds)}</span></p>
                </div>
              </div>

              {/* User Info */}
              {(audit.userEmail || audit.sourceIp) && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    User Info
                  </h4>
                  <div className="space-y-1 text-sm">
                    {audit.userEmail && (
                      <p><span className="text-gray-500">Email:</span> <span className="text-gray-900">{audit.userEmail}</span></p>
                    )}
                    {audit.sourceIp && (
                      <p><span className="text-gray-500">IP:</span> <span className="text-gray-900 font-mono text-xs">{audit.sourceIp}</span></p>
                    )}
                  </div>
                </div>
              )}

              {/* View Link */}
              <a
                href={audit.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-wc-blue hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Visit Website
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all
        ${active
          ? 'bg-wc-blue text-white shadow-lg shadow-wc-blue/20'
          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
        }
      `}
    >
      {icon}
      <span>{label}</span>
      {count !== undefined && (
        <span className={`
          px-1.5 py-0.5 rounded-full text-xs font-semibold
          ${active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}
        `}>
          {count}
        </span>
      )}
    </button>
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
  color: 'green' | 'blue' | 'purple' | 'amber' | 'cyan' | 'red';
}) {
  const colors = {
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    amber: 'bg-amber-100 text-amber-600',
    cyan: 'bg-cyan-100 text-cyan-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-lg ${colors[color]}`}>{icon}</div>
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
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
      icon: <XCircle className="w-3.5 h-3.5" />,
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

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function downloadAudit(audit: Audit) {
  // Create a formatted audit report
  const businessName = audit.brief?.business_name || getDomain(audit.url);
  const date = new Date(audit.createdAt).toISOString().split('T')[0];

  const report = {
    auditReport: {
      businessName,
      url: audit.url,
      auditDate: audit.createdAt,
      completedAt: audit.completedAt,
      overallScore: audit.score,
      status: audit.status,
    },
    businessInfo: {
      name: audit.brief?.business_name,
      description: audit.brief?.business_description,
      industry: audit.brief?.industry,
      siteType: audit.brief?.site_type,
      targetAudience: audit.brief?.target_audience,
      totalPages: audit.brief?.total_pages,
    },
    categoryScores: audit.categoryScores,
    summary: audit.summary,
    metrics: {
      durationSeconds: audit.durationSeconds,
      inputTokens: audit.inputTokens,
      outputTokens: audit.outputTokens,
      totalTokens: audit.totalTokens,
      estimatedCost: audit.cost,
    },
  };

  // Create and download JSON file
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  // Sanitize filename - remove special characters
  const safeName = businessName.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-');
  a.download = `${safeName}-audit-${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
