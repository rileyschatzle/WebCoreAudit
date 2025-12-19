'use client';

import { AdminProviders } from './providers';
import { AdminLayout as AdminLayoutComponent } from '@/components/admin/AdminLayout';
import { usePathname } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Don't wrap login page with admin layout
  if (pathname === '/admin/login') {
    return <AdminProviders>{children}</AdminProviders>;
  }

  return (
    <AdminProviders>
      <AdminLayoutComponent>{children}</AdminLayoutComponent>
    </AdminProviders>
  );
}
