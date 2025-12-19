'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import {
  FileText,
  Plus,
  Search,
  ArrowRight,
  Globe,
  Calendar,
  RefreshCw,
} from 'lucide-react';

interface Audit {
  id: string;
  url: string;
  overall_score: number;
  created_at: string;
  status: string;
  summary?: string;
}

export default function MyAuditsPage() {
  const { user } = useAuth();
  const [audits, setAudits] = useState<Audit[]>([]);
  const [filteredAudits, setFilteredAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchAudits = async () => {
    if (!user) return;
    setLoading(true);

    const supabase = createClient();
    const { data } = await supabase
      .from('audits')
      .select('id, url, overall_score, created_at, status, summary')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    setAudits((data as Audit[]) || []);
    setFilteredAudits((data as Audit[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchAudits();
    }
  }, [user]);

  useEffect(() => {
    if (search) {
      const filtered = audits.filter((audit) =>
        audit.url.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredAudits(filtered);
    } else {
      setFilteredAudits(audits);
    }
  }, [search, audits]);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Audits</h1>
          <p className="text-gray-500">
            {audits.length} audit{audits.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAudits}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            href="/build"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-wc-blue to-wc-cyan text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            New Audit
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search audits by URL..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-wc-cyan/50 focus:border-wc-cyan"
          />
        </div>
      </div>

      {/* Audits List */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-wc-blue border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filteredAudits.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            {search ? (
              <>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">No matches found</h2>
                <p className="text-gray-500">Try a different search term</p>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">No audits yet</h2>
                <p className="text-gray-500 mb-6">Run your first audit to see it here</p>
                <Link
                  href="/build"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-wc-blue to-wc-cyan text-white rounded-xl font-medium hover:shadow-lg transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Run Your First Audit
                </Link>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <div className="col-span-1">Score</div>
              <div className="col-span-4">Website</div>
              <div className="col-span-5">Summary</div>
              <div className="col-span-2">Date</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-100">
              {filteredAudits.map((audit) => (
                <Link
                  key={audit.id}
                  href={`/audit?id=${audit.id}`}
                  className="flex md:grid md:grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors items-center group"
                >
                  {/* Score */}
                  <div className="col-span-1">
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
                  </div>

                  {/* Website */}
                  <div className="col-span-4 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <p className="font-medium text-gray-900 truncate group-hover:text-wc-blue transition-colors">
                        {getDomain(audit.url)}
                      </p>
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-0.5 md:hidden">
                      {formatDate(audit.created_at)}
                    </p>
                  </div>

                  {/* Summary - Hidden on mobile */}
                  <div className="col-span-5 hidden md:block">
                    <p className="text-sm text-gray-500 truncate">
                      {audit.summary || 'No summary available'}
                    </p>
                  </div>

                  {/* Date - Hidden on mobile */}
                  <div className="col-span-2 hidden md:flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(audit.created_at)}
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-wc-cyan group-hover:translate-x-1 transition-all" />
                  </div>

                  {/* Mobile Arrow */}
                  <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-wc-cyan md:hidden" />
                </Link>
              ))}
            </div>
          </>
        )}
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
