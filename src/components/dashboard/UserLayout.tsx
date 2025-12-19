'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  Settings,
  Plus,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { DashboardLayout } from './DashboardLayout';
import type { NavSection } from './Sidebar';

const userNavSections: NavSection[] = [
  {
    title: 'Menu',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
      { href: '/my-audits', label: 'My Audits', icon: <FileText className="w-5 h-5" /> },
      { href: '/billing', label: 'Billing', icon: <CreditCard className="w-5 h-5" /> },
      { href: '/settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
    ],
  },
  {
    title: 'Quick Actions',
    items: [
      { href: '/build', label: 'New Audit', icon: <Plus className="w-5 h-5" /> },
    ],
  },
  {
    title: 'Help',
    items: [
      { href: '/pricing', label: 'Pricing', icon: <CreditCard className="w-5 h-5" /> },
      { href: '/#faq', label: 'FAQ', icon: <HelpCircle className="w-5 h-5" /> },
    ],
  },
];

interface UserLayoutProps {
  children: ReactNode;
}

export function UserLayout({ children }: UserLayoutProps) {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-wc-blue border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout
      sections={userNavSections}
      user={{
        name: profile?.full_name || user.user_metadata?.full_name,
        email: user.email,
        avatar: profile?.avatar_url || user.user_metadata?.avatar_url,
        tier: profile?.tier || 'free',
      }}
      onSignOut={signOut}
    >
      {children}
    </DashboardLayout>
  );
}
