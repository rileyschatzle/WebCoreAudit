import Link from "next/link";
import Image from "next/image";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-8 px-6 relative overflow-hidden">
      {/* Dark background - continues from FooterCTA */}
      <div className="absolute inset-0 bg-wc-dark-900" />
      <div className="absolute inset-0 bg-gradient-to-b from-wc-dark-900 via-wc-dark-950/90 to-black/95" />

      <div className="relative z-10 max-w-[1200px] mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="WebCore Audit Logo"
              width={28}
              height={28}
              className="w-7 h-7"
            />
            <span className="text-base font-condensed tracking-tight">
              <span className="font-bold text-white">WebCore</span> <span className="font-medium text-white/70">Audit</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
            <Link
              href="/"
              className="text-body-sm text-white/60 hover:text-white transition-colors duration-150"
            >
              Home
            </Link>
            <Link
              href="/style-guide"
              className="text-body-sm text-white/60 hover:text-white transition-colors duration-150"
            >
              Style Guide
            </Link>
            <Link
              href="/components"
              className="text-body-sm text-white/60 hover:text-white transition-colors duration-150"
            >
              Components
            </Link>
            <Link
              href="/privacy"
              className="text-body-sm text-white/60 hover:text-white transition-colors duration-150"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-body-sm text-white/60 hover:text-white transition-colors duration-150"
            >
              Terms
            </Link>
            <Link
              href="/admin"
              className="text-body-sm text-white/30 hover:text-white/60 transition-colors duration-150"
            >
              Admin
            </Link>
          </nav>

          {/* Copyright */}
          <p className="text-body-sm text-white/40">
            &copy; {currentYear} WebCore Audit. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
