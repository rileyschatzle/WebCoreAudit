'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Mail,
  CheckCircle2,
  Sparkles,
  Zap,
  Shield,
  BarChart3,
  ArrowRight,
  Loader2,
} from 'lucide-react';

export default function ComingSoonPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'coming-soon' }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to subscribe');
      }

      setStatus('success');
      setEmail('');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />

      {/* Animated gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -top-40 -left-40 w-96 h-96 bg-wc-cyan/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -bottom-40 -right-40 w-96 h-96 bg-wc-blue/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-wc-cyan/10 to-wc-blue/10 rounded-full blur-3xl"
        />
      </div>

      {/* Grid pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#5BC0EB" strokeWidth="0.5" />
            </pattern>
            <radialGradient id="gridFade" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="white" stopOpacity="1" />
              <stop offset="70%" stopColor="white" stopOpacity="0.3" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
            <mask id="gridMask">
              <rect width="100%" height="100%" fill="url(#gridFade)" />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" mask="url(#gridMask)" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12">
        {/* Glass Card Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-12 shadow-2xl"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8 flex justify-center"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-wc-cyan to-wc-blue blur-xl opacity-50 rounded-full scale-150" />
              <Image
                src="/icon.png"
                alt="WebCore Audit"
                width={80}
                height={80}
                className="relative rounded-2xl shadow-2xl"
              />
            </div>
          </motion.div>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-wc-cyan/10 border border-wc-cyan/20 text-wc-cyan mb-6"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Coming Soon</span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6"
          >
            <span className="bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
              WebCore Audit
            </span>
            <br />
            <span className="bg-gradient-to-r from-wc-cyan to-wc-blue bg-clip-text text-transparent">
              is Launching Soon
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg sm:text-xl text-slate-400 mb-10 max-w-lg mx-auto"
          >
            AI-powered website audits that tell you exactly what&apos;s working,
            what&apos;s not, and how to fix it. Get a comprehensive analysis in minutes.
          </motion.p>

          {/* Email Form */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {status === 'success' ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-green-500/10 border border-green-500/20"
              >
                <CheckCircle2 className="w-6 h-6 text-green-400" />
                <p className="text-green-400 font-medium">
                  You&apos;re on the list! We&apos;ll notify you when we launch.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="relative max-w-md mx-auto">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (status === 'error') setStatus('idle');
                      }}
                      placeholder="Enter your email"
                      className={`w-full pl-12 pr-4 py-4 rounded-xl bg-white/5 border ${
                        status === 'error' ? 'border-red-500/50' : 'border-white/10'
                      } text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-wc-cyan/50 focus:border-wc-cyan transition-all`}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="px-6 py-4 rounded-xl bg-gradient-to-r from-wc-cyan to-wc-blue text-white font-semibold hover:shadow-lg hover:shadow-wc-cyan/25 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {status === 'loading' ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Notify Me
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
                {status === 'error' && errorMessage && (
                  <p className="mt-2 text-sm text-red-400 text-left">{errorMessage}</p>
                )}
              </form>
            )}
          </motion.div>
        </motion.div>

        {/* Features Preview - Outside glass card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8 max-w-2xl mx-auto"
        >
          <FeatureCard
            icon={<BarChart3 className="w-5 h-5" />}
            title="10 Categories"
            description="Comprehensive analysis"
          />
          <FeatureCard
            icon={<Zap className="w-5 h-5" />}
            title="AI-Powered"
            description="Instant insights"
          />
          <FeatureCard
            icon={<Shield className="w-5 h-5" />}
            title="Actionable"
            description="Clear next steps"
          />
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="absolute bottom-6 text-center"
        >
          <p className="text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} WebCore Audit. All rights reserved.
          </p>
          <a
            href="/admin/login"
            className="text-slate-600 text-xs hover:text-wc-cyan transition-colors mt-2 inline-block"
          >
            Admin
          </a>
        </motion.div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3 justify-center sm:justify-start">
      <div className="p-2.5 rounded-xl bg-gradient-to-br from-wc-cyan/30 to-wc-blue/30 text-wc-cyan">
        {icon}
      </div>
      <div className="text-left">
        <p className="font-semibold text-white text-sm">{title}</p>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
    </div>
  );
}
