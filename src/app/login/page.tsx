import { Suspense } from 'react'
import Link from 'next/link'
import { LoginForm } from '@/components/auth/login-form'

export const metadata = {
  title: 'Login | WebCore Audit',
  description: 'Sign in to your WebCore Audit account',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <header className="p-6">
        <Link href="/" className="text-xl font-bold text-white">
          WebCore<span className="text-blue-500">Audit</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Suspense fallback={
          <div className="w-full max-w-md h-96 bg-white/5 rounded-2xl animate-pulse" />
        }>
          <LoginForm />
        </Suspense>
      </main>
    </div>
  )
}
