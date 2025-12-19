'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { OAuthButtons } from '@/components/auth/oauth-buttons'
import { captureEmail, signUpWithEmail } from '@/lib/supabase/auth'

interface EmailCaptureModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (email: string) => void
  auditUrl?: string
  source?: 'audit' | 'newsletter' | 'waitlist'
}

type Step = 'email' | 'create-account' | 'success'

export function EmailCaptureModal({
  isOpen,
  onClose,
  onSuccess,
  auditUrl,
  source = 'audit',
}: EmailCaptureModalProps) {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await captureEmail(email, source, auditUrl)
      setStep('create-account')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save email')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      setLoading(false)
      return
    }

    try {
      await signUpWithEmail(email, password, { full_name: fullName })
      setStep('success')
      onSuccess(email)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  const handleSkipAccount = () => {
    onSuccess(email)
    onClose()
  }

  const handleClose = () => {
    setStep('email')
    setEmail('')
    setPassword('')
    setFullName('')
    setError(null)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-md bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl"
          >
            {step === 'email' && (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-white mb-2">
                    Start your free audit
                  </h2>
                  <p className="text-gray-400 text-sm">
                    Enter your email to begin your website audit
                  </p>
                </div>

                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 h-11"
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-red-400 text-center">{error}</p>
                  )}

                  <Button type="submit" className="w-full h-11" disabled={loading}>
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Continue'
                    )}
                  </Button>
                </form>

                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-[#111] text-gray-500">or continue with</span>
                  </div>
                </div>

                <OAuthButtons mode="signup" redirectTo={`/audit?url=${encodeURIComponent(auditUrl || '')}`} />
              </>
            )}

            {step === 'create-account' && (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-white mb-2">
                    Save your results
                  </h2>
                  <p className="text-gray-400 text-sm">
                    Create an account to save audits and track improvements
                  </p>
                </div>

                <form onSubmit={handleCreateAccount} className="space-y-4">
                  <div>
                    <Input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your name (optional)"
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 h-11"
                    />
                  </div>

                  <div>
                    <Input
                      type="email"
                      value={email}
                      disabled
                      className="bg-white/5 border-white/10 text-gray-400 h-11"
                    />
                  </div>

                  <div>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a password (8+ characters)"
                      required
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 h-11"
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-red-400 text-center">{error}</p>
                  )}

                  <Button type="submit" className="w-full h-11" disabled={loading}>
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Create account'
                    )}
                  </Button>
                </form>

                <button
                  onClick={handleSkipAccount}
                  className="w-full mt-3 text-sm text-gray-400 hover:text-gray-300 transition-colors"
                >
                  Skip for now
                </button>
              </>
            )}

            {step === 'success' && (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Account created!</h2>
                <p className="text-gray-400 text-sm mb-4">
                  Check your email to verify your account
                </p>
                <Button onClick={handleClose} className="w-full h-11">
                  View my audit
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
