'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Zap, Shield, Check, FileStack, Plus, X, Loader2 } from 'lucide-react';

interface AdminAuditInputProps {
  isDark?: boolean;
  onComplete?: () => void;
}

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

export function AdminAuditInput({ isDark = true, onComplete }: AdminAuditInputProps) {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [additionalUrls, setAdditionalUrls] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(QUICK_CATEGORIES);
  const [isLoading, setIsLoading] = useState(false);

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

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const selectAll = () => {
    setSelectedCategories(ALL_CATEGORIES.map(c => c.id));
  };

  const selectNone = () => {
    setSelectedCategories([]);
  };

  const selectQuick = () => {
    setSelectedCategories(QUICK_CATEGORIES);
  };

  const selectFull = () => {
    setSelectedCategories(ALL_CATEGORIES.map(c => c.id));
  };

  const addUrl = () => {
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
    if (isLoading) return;

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

    // Show loading immediately
    setIsLoading(true);
    setError('');

    const urlToUse = url.startsWith('http') ? url : `https://${url}`;

    // Filter valid additional URLs
    const validAdditionalUrls = additionalUrls
      .filter(u => u.trim() && validateUrl(u))
      .map(u => u.startsWith('http') ? u : `https://${u}`);

    const totalPages = 1 + validAdditionalUrls.length;

    let auditUrl = `/audit?url=${encodeURIComponent(urlToUse)}&pages=${totalPages}&categories=${selectedCategories.join(',')}&admin=true`;

    if (validAdditionalUrls.length > 0) {
      auditUrl += `&additionalUrls=${encodeURIComponent(validAdditionalUrls.join(','))}`;
    }

    router.push(auditUrl);
  };

  const allSelected = selectedCategories.length === ALL_CATEGORIES.length;
  const quickSelected = selectedCategories.length === QUICK_CATEGORIES.length &&
    QUICK_CATEGORIES.every(id => selectedCategories.includes(id));

  return (
    <div className="w-full">
      {/* Admin Badge */}
      <div className="flex items-center gap-2 mb-4">
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
          isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'
        }`}>
          <Shield className="w-3.5 h-3.5" />
          Admin Audit
        </div>
        <span className={`text-xs ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
          Bypasses email capture, stored separately
        </span>
      </div>

      {/* Preset Buttons */}
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          onClick={selectQuick}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            quickSelected && !allSelected
              ? 'bg-gradient-to-r from-wc-cyan to-wc-blue text-white'
              : isDark
              ? 'bg-white/10 text-white/70 hover:bg-white/20'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          Quick (3)
        </button>
        <button
          type="button"
          onClick={selectFull}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            allSelected
              ? 'bg-gradient-to-r from-wc-cyan to-wc-blue text-white'
              : isDark
              ? 'bg-white/10 text-white/70 hover:bg-white/20'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <FileStack className="w-3.5 h-3.5" />
          Full (10)
        </button>
        <div className={`h-4 w-px ${isDark ? 'bg-white/20' : 'bg-gray-300'}`} />
        <button
          type="button"
          onClick={selectAll}
          className={`px-2 py-1 rounded text-xs transition-all ${
            isDark ? 'text-white/50 hover:text-white/80' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={selectNone}
          className={`px-2 py-1 rounded text-xs transition-all ${
            isDark ? 'text-white/50 hover:text-white/80' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          None
        </button>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
        {ALL_CATEGORIES.map((category) => {
          const isSelected = selectedCategories.includes(category.id);
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => toggleCategory(category.id)}
              className={`relative flex flex-col items-start p-2.5 rounded-lg text-left transition-all ${
                isSelected
                  ? isDark
                    ? 'bg-wc-cyan/20 border border-wc-cyan/50'
                    : 'bg-cyan-50 border border-cyan-300'
                  : isDark
                  ? 'bg-white/5 border border-white/10 hover:bg-white/10'
                  : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className={`text-xs font-medium ${
                  isSelected
                    ? isDark ? 'text-wc-cyan-400' : 'text-cyan-700'
                    : isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {category.name}
                </span>
                <div className={`w-4 h-4 rounded flex items-center justify-center ${
                  isSelected
                    ? 'bg-wc-cyan text-white'
                    : isDark ? 'bg-white/10' : 'bg-gray-200'
                }`}>
                  {isSelected && <Check className="w-3 h-3" />}
                </div>
              </div>
              <span className={`text-[10px] ${
                isDark ? 'text-white/40' : 'text-gray-500'
              }`}>
                {category.description}
              </span>
            </button>
          );
        })}
      </div>

      {/* URL Input Form */}
      <form onSubmit={handleSubmit} className="w-full">
        {/* Main URL */}
        <div className="relative">
          <div
            className={`flex items-center gap-3 border-2 rounded-xl p-2 pl-4 transition-all duration-200 ${
              error
                ? 'border-red-500'
                : isDark
                ? 'bg-white/5 border-white/20 focus-within:border-wc-cyan'
                : 'bg-white border-gray-200 focus-within:border-wc-cyan'
            }`}
          >
            {/* URL icon */}
            <div className={`flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0 ${
              isDark ? 'bg-white/10' : 'bg-gray-100'
            }`}>
              <svg
                className={`w-4 h-4 ${isDark ? 'text-white/60' : 'text-gray-500'}`}
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
              placeholder="https://example.com"
              className={`flex-1 bg-transparent border-none text-sm font-mono placeholder:text-gray-400 focus:outline-none focus:ring-0 py-2 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
            />
            {/* Add URL button */}
            <button
              type="button"
              onClick={addUrl}
              className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
                isDark
                  ? 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
              }`}
              title="Add additional URL"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              type="submit"
              disabled={selectedCategories.length === 0 || isLoading}
              className="flex items-center gap-2 bg-gradient-to-r from-wc-green to-wc-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 min-w-[120px] justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  Run Audit
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Additional URLs */}
        {additionalUrls.length > 0 && (
          <div className="mt-2 space-y-2">
            {additionalUrls.map((additionalUrl, index) => (
              <div
                key={index}
                className={`flex items-center gap-2 border rounded-lg p-2 pl-4 ${
                  isDark
                    ? 'bg-white/5 border-white/10'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <span className={`text-xs ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                  +{index + 1}
                </span>
                <input
                  type="text"
                  value={additionalUrl}
                  onChange={(e) => updateAdditionalUrl(index, e.target.value)}
                  placeholder="/about or https://example.com/pricing"
                  className={`flex-1 bg-transparent border-none text-sm font-mono placeholder:text-gray-400 focus:outline-none focus:ring-0 py-1 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => removeUrl(index)}
                  className={`flex items-center justify-center w-6 h-6 rounded transition-all ${
                    isDark
                      ? 'text-white/40 hover:text-red-400 hover:bg-red-500/20'
                      : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                  }`}
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
      <p className={`mt-3 text-xs ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
        {selectedCategories.length} categor{selectedCategories.length === 1 ? 'y' : 'ies'} selected
        {additionalUrls.length > 0 && `, ${1 + additionalUrls.filter(u => u.trim()).length} URLs`}
      </p>
    </div>
  );
}
