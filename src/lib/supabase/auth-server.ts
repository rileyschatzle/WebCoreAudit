import { createClient } from './server'
import type { UserProfile } from './types'

// ============================================
// GET SERVER-SIDE USER
// ============================================
export async function getServerUser() {
  const supabase = createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

// ============================================
// GET SERVER-SIDE USER WITH PROFILE
// ============================================
export async function getServerUserWithProfile() {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return null
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return {
    ...user,
    profile: profile as UserProfile | null,
  }
}

// ============================================
// CHECK IF USER IS AUTHENTICATED
// ============================================
export async function isAuthenticated() {
  const user = await getServerUser()
  return !!user
}

// ============================================
// GET USER TIER/LIMITS
// ============================================
export async function getUserLimits() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // Anonymous user - free tier limits
    return {
      tier: 'free' as const,
      auditsPerMonth: 1,
      auditsUsed: 0,
      pagesPerAudit: 1,
    }
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tier, audits_used_this_month, audits_limit')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return {
      tier: 'free' as const,
      auditsPerMonth: 1,
      auditsUsed: 0,
      pagesPerAudit: 1,
    }
  }

  return {
    tier: profile.tier,
    auditsPerMonth: profile.audits_limit,
    auditsUsed: profile.audits_used_this_month,
    pagesPerAudit: profile.tier === 'agency' ? 50 : profile.tier === 'pro' ? 10 : profile.tier === 'starter' ? 3 : 1,
  }
}

// ============================================
// INCREMENT AUDIT USAGE
// ============================================
export async function incrementAuditUsage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return false
  }

  const { error } = await supabase
    .from('user_profiles')
    .update({
      audits_used_this_month: supabase.rpc('increment_audit_count'),
      last_audit_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  return !error
}

// ============================================
// SAVE AUDIT TO USER
// ============================================
export async function saveAuditToUser(auditId: string) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return false
  }

  const { error } = await supabase
    .from('audits')
    .update({ user_id: user.id })
    .eq('id', auditId)

  return !error
}
