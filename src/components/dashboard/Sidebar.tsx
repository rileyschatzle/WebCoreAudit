'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  Settings,
  Users,
  BarChart3,
  LogOut,
  ChevronLeft,
  Menu,
  X,
  Zap,
  Crown,
  ExternalLink,
  HelpCircle,
  Bell,
} from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
  external?: boolean;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

interface SidebarProps {
  sections: NavSection[];
  user?: {
    name?: string | null;
    email?: string | null;
    avatar?: string | null;
    tier?: string;
  };
  logo?: React.ReactNode;
  onSignOut?: () => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

const tierConfig: Record<string, { color: string; bg: string; icon?: React.ReactNode }> = {
  free: { color: 'text-gray-500', bg: 'bg-gray-100' },
  starter: { color: 'text-blue-600', bg: 'bg-blue-100' },
  pro: { color: 'text-purple-600', bg: 'bg-purple-100', icon: <Zap className="w-3 h-3" /> },
  agency: { color: 'text-amber-600', bg: 'bg-amber-100', icon: <Crown className="w-3 h-3" /> },
  admin: { color: 'text-red-600', bg: 'bg-red-100', icon: <Crown className="w-3 h-3" /> },
};

export function Sidebar({
  sections,
  user,
  logo,
  onSignOut,
  collapsed: controlledCollapsed,
  onCollapsedChange,
}: SidebarProps) {
  const pathname = usePathname();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const collapsed = controlledCollapsed ?? internalCollapsed;
  const setCollapsed = onCollapsedChange ?? setInternalCollapsed;

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close mobile menu on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const tier = tierConfig[user?.tier || 'free'] || tierConfig.free;

  const NavLink = ({ item, showLabel }: { item: NavItem; showLabel: boolean }) => {
    // Check if this is a "root" dashboard path (e.g., /admin, /dashboard)
    const isRootDashboard = item.href === '/admin' || item.href === '/dashboard';
    // For root dashboard paths, only exact match; for others, allow prefix matching
    const isActive = isRootDashboard
      ? pathname === item.href
      : pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/'));

    const content = (
      <div
        className={`
          group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
          ${isActive
            ? 'bg-gradient-to-r from-wc-blue to-wc-cyan text-white shadow-lg shadow-wc-cyan/20'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }
          ${!showLabel ? 'justify-center' : ''}
        `}
      >
        <span className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`}>
          {item.icon}
        </span>
        {showLabel && (
          <>
            <span className="flex-1 font-medium text-sm truncate">{item.label}</span>
            {item.badge && (
              <span className={`
                px-2 py-0.5 text-xs font-semibold rounded-full
                ${isActive ? 'bg-white/20 text-white' : 'bg-wc-cyan/10 text-wc-cyan'}
              `}>
                {item.badge}
              </span>
            )}
            {item.external && (
              <ExternalLink className="w-3.5 h-3.5 opacity-50" />
            )}
          </>
        )}
      </div>
    );

    if (item.external) {
      return (
        <a href={item.href} target="_blank" rel="noopener noreferrer">
          {content}
        </a>
      );
    }

    return <Link href={item.href}>{content}</Link>;
  };

  const SidebarContent = ({ showLabels }: { showLabels: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`p-4 ${!showLabels ? 'flex justify-center' : ''}`}>
        {logo || (
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-wc-blue to-wc-cyan flex items-center justify-center shadow-lg shadow-wc-cyan/20">
              <span className="text-white font-bold text-sm">WC</span>
            </div>
            {showLabels && (
              <div className="flex flex-col">
                <span className="font-bold text-gray-900 text-sm leading-tight">WebCore</span>
                <span className="text-[10px] text-gray-500 leading-tight">Audit</span>
              </div>
            )}
          </Link>
        )}
      </div>

      {/* User Card */}
      {user && showLabels && (
        <div className="mx-3 mb-4 p-3 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-wc-blue to-wc-cyan flex items-center justify-center text-white font-semibold text-sm shadow-md">
              {user.avatar ? (
                <img src={user.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                (user.name?.[0] || user.email?.[0] || 'U').toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">
                {user.name || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
          {user.tier && (
            <div className={`mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${tier.bg} ${tier.color}`}>
              {tier.icon}
              <span className="capitalize">{user.tier}</span>
            </div>
          )}
        </div>
      )}

      {/* Collapsed User Avatar */}
      {user && !showLabels && (
        <div className="flex justify-center mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-wc-blue to-wc-cyan flex items-center justify-center text-white font-semibold text-sm shadow-md">
            {user.avatar ? (
              <img src={user.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              (user.name?.[0] || user.email?.[0] || 'U').toUpperCase()
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-6 overflow-y-auto">
        {sections.map((section, idx) => (
          <div key={idx}>
            {section.title && showLabels && (
              <h3 className="px-3 mb-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                {section.title}
              </h3>
            )}
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink key={item.href} item={item} showLabel={showLabels} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100">
        {onSignOut && (
          <button
            onClick={onSignOut}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
              text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors
              ${!showLabels ? 'justify-center' : ''}
            `}
          >
            <LogOut className="w-5 h-5" />
            {showLabels && <span className="font-medium text-sm">Sign Out</span>}
          </button>
        )}

        {/* Collapse Toggle - Desktop Only */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`
            hidden lg:flex w-full items-center gap-3 px-3 py-2.5 rounded-xl mt-1
            text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors
            ${!showLabels ? 'justify-center' : ''}
          `}
        >
          <ChevronLeft className={`w-5 h-5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          {showLabels && <span className="font-medium text-sm">Collapse</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-40 lg:hidden p-2.5 rounded-xl bg-white shadow-lg border border-gray-200 text-gray-600 hover:text-gray-900 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 w-[280px] bg-white z-50 lg:hidden shadow-2xl"
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent showLabels={true} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside
        className={`
          hidden lg:flex flex-col fixed left-0 top-0 bottom-0 bg-white border-r border-gray-200 z-30
          transition-all duration-300 ease-in-out
          ${collapsed ? 'w-[72px]' : 'w-[260px]'}
        `}
      >
        <SidebarContent showLabels={!collapsed} />
      </aside>

      {/* Main Content Spacer */}
      <div className={`hidden lg:block transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-[260px]'} flex-shrink-0`} />
    </>
  );
}
