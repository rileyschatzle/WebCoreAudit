'use client';

import { ReactNode } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  FileText,
  Settings,
  BarChart3,
  ExternalLink,
  Shield,
  Globe,
  Search,
} from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard';
import type { NavSection } from '@/components/dashboard';

const adminNavSections: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { href: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
      { href: '/admin/audits', label: 'Audits', icon: <FileText className="w-5 h-5" /> },
    ],
  },
  {
    title: 'Management',
    items: [
      { href: '/admin/users', label: 'Users', icon: <Users className="w-5 h-5" /> },
      { href: '/admin/subscriptions', label: 'Subscriptions', icon: <CreditCard className="w-5 h-5" /> },
      { href: '/admin/website-types', label: 'Website Types', icon: <Globe className="w-5 h-5" /> },
      { href: '/admin/contact-scraper', label: 'Contact Scraper', icon: <Search className="w-5 h-5" /> },
    ],
  },
  {
    title: 'External',
    items: [
      { href: 'https://dashboard.stripe.com/test', label: 'Stripe Dashboard', icon: <CreditCard className="w-5 h-5" />, external: true },
      { href: 'https://supabase.com/dashboard', label: 'Supabase', icon: <BarChart3 className="w-5 h-5" />, external: true },
      { href: '/', label: 'View Site', icon: <ExternalLink className="w-5 h-5" />, external: true },
    ],
  },
];

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-wc-blue border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session || (session.user as { role?: string })?.role !== 'admin') {
    return null;
  }

  const AdminLogo = (
    <Link href="/admin" className="flex items-center gap-2.5">
      <Image
        src="/logo.png"
        alt="WebCore Audit"
        width={36}
        height={36}
        className="rounded-xl"
      />
      <div className="flex flex-col">
        <span className="font-bold text-gray-900 text-sm leading-tight">Admin</span>
        <span className="text-[10px] text-gray-500 leading-tight">WebCore Audit</span>
      </div>
    </Link>
  );

  return (
    <DashboardLayout
      sections={adminNavSections}
      user={{
        name: 'Administrator',
        email: session.user?.email,
        tier: 'admin',
      }}
      onSignOut={() => signOut({ callbackUrl: '/admin/login' })}
      logo={AdminLogo}
    >
      {children}
    </DashboardLayout>
  );
}
