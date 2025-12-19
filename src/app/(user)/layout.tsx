'use client';

import { UserLayout } from '@/components/dashboard';

export default function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <UserLayout>{children}</UserLayout>;
}
