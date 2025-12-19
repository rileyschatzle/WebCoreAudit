'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Zap, FileStack, Check, Plus, X, Lock, Crown } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { PRICING_TIERS } from '@/lib/supabase/types';
import Link from 'next/link';

const ALL_CATEGORIES = [
  { id: 'business', name: 'Business Overview', description: 'Company profile & goals' },
  { id: 'technical', name: 'Technical Foundation', description: 'Performance & code quality' },
  { id: 'brand', name: 'Brand & Messaging', description: 'Voice & positioning' },
  { id: 'ux', name: 'User Experience', description: 'Navigation & usability' },
  { id: 'traffic', name: 'Traffic Readiness', description: 'SEO & discoverability' },
  { id: 'security', name: 'Security', description: 'SSL & vulnerabilities' },
  { id: 'content', name: 'Content Strategy', description: 'Quality & relevance' },
  { id: 'conversion', name: 'Conversion & Engagement', description: 'CTAs & lead capture' },
  { id: 'social', name: 'Social & Multimedia', description: 'Media & social presence' },
  { id: 'trust', name: 'Trust & Credibility', description: 'Reviews & proof' },
];

const QUICK_CATEGORIES = ['business', 'technical', 'brand'];

export function UserAuditInput() {
  const router = useRouter();
  const { profile } = useAuth();
  const [url, setUrl] = useState('');
  const [additionalUrls, setAdditionalUrls] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(QUICK_CATEGORIES);

  // Get tier limits
  const tier = profile?.tier || 'free';
  const tierConfig = PRICING_TIERS[tier as keyof typeof PRICING_TIERS];
  const allowedCategories = tierConfig.categories === 'all'
    ? ALL_CATEGORIES.map(c => c.id)
    : tierConfig.categories;
  const maxPages = tierConfig.pages_per_audit;
  const auditsUsed = profile?.audits_used_this_month || 0;
  const auditsLimit = profile?.audits_limit || 1;
  const hasAuditsRemaining = auditsLimit === -1 || auditsUsed < auditsLimit;

  const validateUrl = (value: string) => {
    if (!value) return false;
    try {
      const urlToTest = value.startsWith('http') ? value : `https://${value}`;
      new URL(urlToTest);
      return true;
    } catch {
      return false;
    }
  };

  const isCategoryAllowed = (categoryId: string) => {
    return (allowedCategories as readonly string[]).includes(categoryId);
  };

  const toggleCategory = (categoryId: string) => {
    if (!isCategoryAllowed(categoryId)) return;
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const selectQuick = () => {
    setSelectedCategories(QUICK_CATEGORIES.filter(id => isCategoryAllowed(id)));
  };

  const selectFull = () => {
    setSelectedCategories(ALL_CATEGORIES.map(c => c.id).filter(id => isCategoryAllowed(id)));
  };

  const addUrl = () => {
    if (1 + additionalUrls.length >= maxPages) return;
    setAdditionalUrls(prev => [...prev, '']);
  };

  const removeUrl = (index: number) => {
    setAdditionalUrls(prev => prev.filter((_, i) => i !== index));
  };

  const updateAdditionalUrl = (index: number, value: string) => {
    setAdditionalUrls(prev => prev.map((u, i) => i === index ? value : u));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasAuditsRemaining) {
      setError('You\'ve used all your audits this month. Upgrade for more.');
      return;
    }

    if (!url) {
      setError('Please enter a URL');
      return;
    }
    if (!validateUrl(url)) {
      setError("That doesn't look like a valid URL. Try including https://");
      return;
    }
    if (selectedCategories.length === 0) {
      setError('Please select at least one category');
      return;
    }
    setError('');
    const urlToUse = url.startsWith('http') ? url : `https://${url}`;

    // Filter valid additional URLs (limited by tier)
    const validAdditionalUrls = additionalUrls
      .slice(0, maxPages - 1)
      .filter(u => u.trim() && validateUrl(u))
      .map(u => u.startsWith('http') ? u : `https://${u}`);

    const totalPages = 1 + validAdditionalUrls.length;

    let auditUrl = `/audit?url=${encodeURIComponent(urlToUse)}&pages=${totalPages}&categories=${selectedCategories.join(',')}`;

    if (validAdditionalUrls.length > 0) {
      auditUrl += `&additionalUrls=${encodeURIComponent(validAdditionalUrls.join(','))}`;
    }

    router.push(auditUrl);
  };

  const allAllowedSelected = selectedCategories.length === allowedCategories.length;
  const quickSelected = QUICK_CATEGORIES.every(id => selectedCategories.includes(id)) &&
    selectedCategories.length === QUICK_CATEGORIES.filter(id => isCategoryAllowed(id)).length;

  const canAddMoreUrls = 1 + additionalUrls.length < maxPages;

  return (
    <div className="w-full">
      {/* Tier Badge & Usage */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
            tier === 'free' ? 'bg-gray-100 text-gray-600' :
            tier === 'starter' ? 'bg-blue-100 text-blue-700' :
            tier === 'pro' ? 'bg-purple-100 text-purple-700' :
            'bg-amber-100 text-amber-700'
          }`}>
            <Crown className="w-3.5 h-3.5" />
            {tierConfig.name} Plan
          </div>
          <span className="text-xs text-gray-500">
            {auditsLimit === -1
              ? 'Unlimited audits'
              : `${auditsLimit - auditsUsed} audit${auditsLimit - auditsUsed !== 1 ? 's' : ''} remaining`}
          </span>
        </div>
        {tier !== 'agency' && (
          <Link
            href="/pricing"
            className="text-xs text-wc-blue hover:underline flex items-center gap-1"
          >
            Upgrade for more
          </Link>
        )}
      </div>

      {/* Out of audits warning */}
      {!hasAuditsRemaining && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800 font-medium">You&apos;ve used all your audits this month</p>
          <p className="text-xs text-amber-600 mt-1">
            Upgrade your plan to run more audits, or wait until next month.
          </p>
          <Link
            href="/pricing"
            className="inline-block mt-2 text-xs font-medium text-amber-700 hover:text-amber-900 underline"
          >
            View pricing plans →
          </Link>
        </div>
      )}

      {/* Preset Buttons */}
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          onClick={selectQuick}
          disabled={!hasAuditsRemaining}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            quickSelected && !allAllowedSelected
              ? 'bg-gradient-to-r from-wc-cyan to-wc-blue text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Zap className="w-3.5 h-3.5" />
          Quick (3)
        </button>
        <button
          type="button"
          onClick={selectFull}
          disabled={!hasAuditsRemaining}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            allAllowedSelected
              ? 'bg-gradient-to-r from-wc-cyan to-wc-blue text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <FileStack className="w-3.5 h-3.5" />
          Full ({allowedCategories.length})
        </button>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
        {ALL_CATEGORIES.map((category) => {
          const isSelected = selectedCategories.includes(category.id);
          const isAllowed = isCategoryAllowed(category.id);
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => toggleCategory(category.id)}
              disabled={!isAllowed || !hasAuditsRemaining}
              className={`relative flex flex-col items-start p-2.5 rounded-lg text-left transition-all ${
                !isAllowed
                  ? 'bg-gray-50 border border-gray-100 opacity-60 cursor-not-allowed'
                  : isSelected
                  ? 'bg-cyan-50 border border-cyan-300'
                  : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
              } disabled:cursor-not-allowed`}
            >
              {!isAllowed && (
                <div className="absolute top-1 right-1">
                  <Lock className="w-3 h-3 text-gray-400" />
                </div>
              )}
              <div className="flex items-center justify-between w-full mb-1">
                <span className={`text-xs font-medium ${
                  !isAllowed ? 'text-gray-400' :
                  isSelected ? 'text-cyan-700' : 'text-gray-900'
                }`}>
                  {category.name}
                </span>
                {isAllowed && (
                  <div className={`w-4 h-4 rounded flex items-center justify-center ${
                    isSelected ? 'bg-wc-cyan text-white' : 'bg-gray-200'
                  }`}>
                    {isSelected && <Check className="w-3 h-3" />}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-gray-500">
                {category.description}
              </span>
            </button>
          );
        })}
      </div>

      {/* Locked categories hint */}
      {allowedCategories.length < ALL_CATEGORIES.length && (
        <p className="text-xs text-gray-500 mb-4">
          <Lock className="w-3 h-3 inline mr-1" />
          {ALL_CATEGORIES.length - allowedCategories.length} categories locked.{' '}
          <Link href="/pricing" className="text-wc-blue hover:underline">
            Upgrade to unlock all
          </Link>
        </p>
      )}

      {/* URL Input Form */}
      <form onSubmit={handleSubmit} className="w-full">
        {/* Main URL */}
        <div className="relative">
          <div
            className={`flex items-center gap-3 border-2 rounded-xl p-2 pl-4 transition-all duration-200 ${
              error
                ? 'border-red-500'
                : 'bg-white border-gray-200 focus-within:border-wc-cyan'
            }`}
          >
            {/* URL icon */}
            <div className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0 bg-gray-100">
              <svg
                className="w-4 h-4 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) setError('');
              }}
              placeholder="https://yourwebsite.com"
              disabled={!hasAuditsRemaining}
              className="flex-1 bg-transparent border-none text-sm font-mono placeholder:text-gray-400 focus:outline-none focus:ring-0 py-2 text-gray-900 disabled:opacity-50"
            />
            {/* Add URL button */}
            {maxPages > 1 && (
              <button
                type="button"
                onClick={addUrl}
                disabled={!canAddMoreUrls || !hasAuditsRemaining}
                className="flex items-center justify-center w-8 h-8 rounded-lg transition-all bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title={canAddMoreUrls ? 'Add additional URL' : `Max ${maxPages} pages on your plan`}
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              disabled={selectedCategories.length === 0 || !hasAuditsRemaining}
              className="flex items-center gap-2 bg-gradient-to-r from-wc-green to-wc-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              Run Audit
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Additional URLs */}
        {additionalUrls.length > 0 && (
          <div className="mt-2 space-y-2">
            {additionalUrls.map((additionalUrl, index) => (
              <div
                key={index}
                className="flex items-center gap-2 border rounded-lg p-2 pl-4 bg-gray-50 border-gray-200"
              >
                <span className="text-xs text-gray-400">
                  +{index + 1}
                </span>
                <input
                  type="text"
                  value={additionalUrl}
                  onChange={(e) => updateAdditionalUrl(index, e.target.value)}
                  placeholder="/about or https://example.com/pricing"
                  className="flex-1 bg-transparent border-none text-sm font-mono placeholder:text-gray-400 focus:outline-none focus:ring-0 py-1 text-gray-900"
                />
                <button
                  type="button"
                  onClick={() => removeUrl(index)}
                  className="flex items-center justify-center w-6 h-6 rounded transition-all text-gray-400 hover:text-red-500 hover:bg-red-50"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {error && (
          <p className="mt-2 text-sm text-red-500">{error}</p>
        )}
      </form>

      {/* Summary */}
      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-gray-500">
          {selectedCategories.length} categor{selectedCategories.length === 1 ? 'y' : 'ies'} selected
          {additionalUrls.length > 0 && `, ${1 + additionalUrls.filter(u => u.trim()).length} URLs`}
        </p>
        {maxPages > 1 && (
          <p className="text-xs text-gray-400">
            {1 + additionalUrls.length}/{maxPages} pages
          </p>
        )}
      </div>
    </div>
  );
}
