import { createClient } from './client'
import type { OAuthProvider, UserProfile } from './types'

// ============================================
// SIGN UP
// ============================================
export async function signUpWithEmail(email: string, password: string, metadata?: { full_name?: string }) {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

// ============================================
// SIGN IN
// ============================================
export async function signInWithEmail(email: string, password: string) {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

// ============================================
// OAUTH SIGN IN
// ============================================
export async function signInWithOAuth(provider: OAuthProvider, redirectTo?: string) {
  const supabase = createClient()

  // Build callback URL with optional next parameter
  const callbackUrl = new URL(`${window.location.origin}/auth/callback`)
  if (redirectTo) {
    callbackUrl.searchParams.set('next', redirectTo)
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: callbackUrl.toString(),
      queryParams: provider === 'google' ? {
        access_type: 'offline',
        prompt: 'consent',
      } : undefined,
    },
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

// ============================================
// SIGN OUT
// ============================================
export async function signOut() {
  const supabase = createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    throw new Error(error.message)
  }
}

// ============================================
// GET CURRENT USER
// ============================================
export async function getCurrentUser() {
  const supabase = createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

// ============================================
// GET USER WITH PROFILE
// ============================================
export async function getUserWithProfile() {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return null
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('Error fetching profile:', profileError)
  }

  return {
    ...user,
    profile: profile as UserProfile | null,
  }
}

// ============================================
// UPDATE PROFILE
// ============================================
export async function updateProfile(updates: Partial<UserProfile>) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as UserProfile
}

// ============================================
// PASSWORD RESET
// ============================================
export async function resetPassword(email: string) {
  const supabase = createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  })

  if (error) {
    throw new Error(error.message)
  }
}

export async function updatePassword(newPassword: string) {
  const supabase = createClient()

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    throw new Error(error.message)
  }
}

// ============================================
// AUTH STATE LISTENER
// ============================================
export function onAuthStateChange(callback: (user: ReturnType<typeof getCurrentUser>) => void) {
  const supabase = createClient()

  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      callback(Promise.resolve(session.user))
    } else {
      callback(Promise.resolve(null))
    }
  })
}

// ============================================
// EMAIL CAPTURE (Pre-auth)
// ============================================
export async function captureEmail(email: string, source: 'audit' | 'newsletter' | 'waitlist', auditUrl?: string) {
  // Use API route which handles both Supabase and Notion syncing
  const response = await fetch('/api/email-capture', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, source, auditUrl }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to capture email')
  }

  return response.json()
}

// ============================================
// CONVERT EMAIL TO USER
// ============================================
export async function convertEmailToUser(email: string, password: string, fullName?: string) {
  // This creates a new account and will trigger the DB trigger
  // that links existing email_subscribers records
  return signUpWithEmail(email, password, { full_name: fullName })
}
