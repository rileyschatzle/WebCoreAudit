'use client';

import { useState } from 'react';
import {
  Search,
  Briefcase,
  ShoppingCart,
  Building,
  User,
  Globe,
  Newspaper,
  GraduationCap,
  Heart,
  Layers,
  Cloud,
  Rocket,
  Users,
  Store,
  MapPin,
  UtensilsCrossed,
  Home,
  Scale,
  DollarSign,
  Calendar,
  Music,
  Landmark,
  BookOpen,
  Star,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { WEBSITE_TYPES, type WebsiteTypeConfig } from '@/lib/config/website-types';
import { DEFAULT_CATEGORY_WEIGHTS } from '@/lib/types/audit';

// Icon mapping
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Briefcase,
  ShoppingCart,
  Building,
  Building2: Building,
  User,
  Globe,
  Newspaper,
  GraduationCap,
  Heart,
  Layers,
  Cloud,
  Rocket,
  Users,
  Store,
  MapPin,
  UtensilsCrossed,
  Home,
  Scale,
  DollarSign,
  Calendar,
  Music,
  Landmark,
  BookOpen,
};

const getIconComponent = (iconName: string) => {
  return ICON_MAP[iconName] || Globe;
};

// Group types by category
const TYPE_CATEGORIES = [
  { name: 'Creative & Personal', types: ['portfolio', 'personal-brand'] },
  { name: 'Business & Services', types: ['saas', 'agency', 'startup', 'consulting'] },
  { name: 'E-commerce & Retail', types: ['e-commerce', 'marketplace'] },
  { name: 'Content & Media', types: ['blog-media', 'membership'] },
  { name: 'Local & Service Businesses', types: ['local-business', 'restaurant', 'real-estate', 'healthcare', 'legal', 'financial'] },
  { name: 'Education & Non-Profit', types: ['education', 'non-profit'] },
  { name: 'Events & Entertainment', types: ['event', 'entertainment'] },
  { name: 'Specialized', types: ['landing-page', 'government', 'documentation'] },
];

function WeightBar({ weight, category }: { weight: number; category: string }) {
  const defaultWeight = DEFAULT_CATEGORY_WEIGHTS[category] || 1;
  const diff = weight - defaultWeight;
  const percentage = Math.min(100, (weight / 2) * 100);

  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${
            diff > 0.2 ? 'bg-green-500' : diff < -0.2 ? 'bg-orange-400' : 'bg-blue-400'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={`text-xs font-medium w-8 ${
        diff > 0.2 ? 'text-green-600' : diff < -0.2 ? 'text-orange-500' : 'text-gray-500'
      }`}>
        {weight.toFixed(1)}
      </span>
    </div>
  );
}

function WebsiteTypeCard({ type, isExpanded, onToggle }: {
  type: WebsiteTypeConfig;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const IconComponent = getIconComponent(type.icon);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <button
        onClick={onToggle}
        className="w-full px-4 py-4 flex items-center gap-4 text-left"
      >
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-wc-blue/10 to-wc-cyan/10 flex items-center justify-center text-wc-blue shrink-0">
          <IconComponent className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">{type.name}</h3>
            {type.id === 'saas' && (
              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-600 text-[10px] font-medium rounded">
                DEFAULT
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 truncate">{type.description}</p>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-4 space-y-4">
          {/* Category Weights */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Category Weights
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(type.categoryWeights).map(([category, weight]) => (
                <div key={category} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-600 truncate flex-1">{category}</span>
                  <WeightBar weight={weight} category={category} />
                </div>
              ))}
            </div>
          </div>

          {/* Focus Areas */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Focus Areas
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {type.focusAreas.map((area) => (
                <span
                  key={area}
                  className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-md"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>

          {/* Best Practices */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Best Practices
            </h4>
            <ul className="space-y-1">
              {type.bestPractices.map((practice) => (
                <li key={practice} className="text-xs text-gray-600 flex items-start gap-2">
                  <Star className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                  {practice}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WebsiteTypesPage() {
  const [search, setSearch] = useState('');
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const toggleExpanded = (id: string) => {
    setExpandedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedTypes(new Set(WEBSITE_TYPES.map((t) => t.id)));
  };

  const collapseAll = () => {
    setExpandedTypes(new Set());
  };

  // Filter types
  const filteredTypes = WEBSITE_TYPES.filter((type) => {
    const matchesSearch = search === '' ||
      type.name.toLowerCase().includes(search.toLowerCase()) ||
      type.description.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = selectedCategory === null ||
      TYPE_CATEGORIES.find((c) => c.name === selectedCategory)?.types.includes(type.id);

    return matchesSearch && matchesCategory;
  });

  // Group filtered types by category
  const groupedTypes = TYPE_CATEGORIES.map((category) => ({
    ...category,
    types: category.types
      .map((id) => filteredTypes.find((t) => t.id === id))
      .filter(Boolean) as WebsiteTypeConfig[],
  })).filter((category) => category.types.length > 0);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Website Types</h1>
        <p className="text-gray-500 mt-1">
          {WEBSITE_TYPES.length} website types with tailored audit criteria weights
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search website types..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-wc-cyan/50 focus:border-wc-cyan"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-wc-cyan/50 focus:border-wc-cyan bg-white"
          >
            <option value="">All Categories</option>
            {TYPE_CATEGORIES.map((category) => (
              <option key={category.name} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>

          {/* Expand/Collapse */}
          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Collapse All
            </button>
          </div>
        </div>
      </div>

      {/* Website Types by Category */}
      <div className="space-y-8">
        {groupedTypes.map((category) => (
          <div key={category.name}>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
              {category.name}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {category.types.map((type) => (
                <WebsiteTypeCard
                  key={type.id}
                  type={type}
                  isExpanded={expandedTypes.has(type.id)}
                  onToggle={() => toggleExpanded(type.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredTypes.length === 0 && (
        <div className="text-center py-12">
          <Globe className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No website types match your search</p>
        </div>
      )}

      {/* Legend */}
      <div className="mt-8 p-4 bg-gray-50 rounded-xl">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Weight Legend</h3>
        <div className="flex flex-wrap gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span>Higher than default (more important)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-400" />
            <span>Near default weight</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-orange-400" />
            <span>Lower than default (less important)</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Default weights range from 0.6 to 1.2. Higher weights increase the category&apos;s impact on the overall score.
        </p>
      </div>
    </div>
  );
}
