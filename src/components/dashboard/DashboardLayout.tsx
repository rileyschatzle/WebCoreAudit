'use client';

import { ReactNode } from 'react';
import { Sidebar, NavSection } from './Sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
  sections: NavSection[];
  user?: {
    name?: string | null;
    email?: string | null;
    avatar?: string | null;
    tier?: string;
  };
  onSignOut?: () => void;
  header?: ReactNode;
  logo?: ReactNode;
}

export function DashboardLayout({
  children,
  sections,
  user,
  onSignOut,
  header,
  logo,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        sections={sections}
        user={user}
        onSignOut={onSignOut}
        logo={logo}
      />

      <main className="flex-1 min-h-screen">
        {header && (
          <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200">
            {header}
          </header>
        )}
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
