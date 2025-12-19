"use client";

import Link from "next/link";
import Image from "next/image";
import { UserMenu } from "@/components/auth/user-menu";

export function Header() {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-[72px] px-6 flex items-center justify-between bg-white border-b border-gray-100 shadow-sm"
    >
      <Link href="/" className="flex items-center gap-2.5">
        <Image
          src="/logo.png"
          alt="WebCore Audit Logo"
          width={44}
          height={44}
          className="w-11 h-11"
        />
        <span className="text-2xl font-condensed tracking-tight"><span className="font-extrabold bg-gradient-to-r from-wc-blue to-wc-dark bg-clip-text text-transparent">WebCore</span> <span className="font-medium text-gray-900">Audit</span></span>
      </Link>

      <nav className="hidden md:flex items-center gap-8">
        <a href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-wc-blue transition-colors">
          How It Works
        </a>
        <a href="#what-we-check" className="text-sm font-medium text-gray-600 hover:text-wc-blue transition-colors">
          What We Check
        </a>
        <Link href="/pricing" className="text-sm font-medium text-gray-600 hover:text-wc-blue transition-colors">
          Pricing
        </Link>
        <a href="#faq" className="text-sm font-medium text-gray-600 hover:text-wc-blue transition-colors">
          FAQ
        </a>
      </nav>

      <UserMenu />
    </header>
  );
}
