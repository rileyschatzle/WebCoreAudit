import Link from 'next/link'
import { SignupForm } from '@/components/auth/signup-form'

export const metadata = {
  title: 'Sign Up | WebCore Audit',
  description: 'Create your WebCore Audit account',
}

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <header className="p-6">
        <Link href="/" className="text-xl font-bold text-white">
          WebCore<span className="text-blue-500">Audit</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <SignupForm />
      </main>
    </div>
  )
}
