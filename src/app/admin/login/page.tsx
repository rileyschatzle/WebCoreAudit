export const dynamic = "force-dynamic";
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError('Invalid credentials');
      setIsLoading(false);
    } else {
      // Get callback URL or default to /admin
      const callbackUrl = searchParams.get('callbackUrl') || '/admin';
      // Use replace to avoid back button issues
      router.replace(callbackUrl);
      router.refresh();
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">
      {/* Hero background */}
      <div className="absolute inset-0 bg-gradient-to-br from-wc-dark via-wc-blue-700 to-wc-dark-800" />
      <div className="absolute inset-0 bg-gradient-to-t from-wc-blue-900/80 via-transparent to-wc-cyan/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-wc-dark-900/50 via-transparent to-wc-dark-900/50" />

      {/* Grid pattern with edge fade */}
      <div className="absolute inset-0 pointer-events-none">
        <svg
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#5BC0EB" strokeWidth="0.5" opacity="0.3" />
            </pattern>
            <radialGradient id="gridFade" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <stop offset="0%" stopColor="white" stopOpacity="1" />
              <stop offset="60%" stopColor="white" stopOpacity="0.8" />
              <stop offset="85%" stopColor="white" stopOpacity="0.3" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
            <mask id="gridMask">
              <rect width="100%" height="100%" fill="url(#gridFade)" />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" mask="url(#gridMask)" />
        </svg>
      </div>

      {/* Subtle center glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-wc-cyan/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Login card */}
      <div className="relative z-10 max-w-md w-full">
        <div className="relative">
          {/* Gradient border glow */}
          <div className="absolute -inset-[1px] bg-gradient-to-br from-wc-cyan/30 via-transparent to-wc-blue/20 rounded-2xl blur-sm" />
          <div className="absolute -inset-[1px] bg-gradient-to-br from-wc-cyan/20 via-white/50 to-wc-green/15 rounded-2xl" />

          <div className="relative bg-white/80 backdrop-blur-2xl rounded-2xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.06)] p-8">
            <h1 className="text-2xl font-bold text-center mb-6 text-gray-900">Admin Login</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-white border-gray-300 text-gray-900 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </div>
        </div>

        {/* Back to home link */}
        <Link
          href="/"
          className="block text-center mt-4 text-white/70 hover:text-white text-sm transition-colors"
        >
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
