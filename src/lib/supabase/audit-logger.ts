import { createClient } from '@supabase/supabase-js'

// Use service role for server-side operations (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Using untyped client - database schema is managed in Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export interface AuditLogData {
  url: string
  overall_score?: number
  category_scores?: Record<string, number>
  summary?: string
  brief?: {
    business_name?: string
    business_description?: string
    target_audience?: string
    industry?: string
    site_type?: string
    total_pages?: number
  }
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error_message?: string
  input_tokens?: number
  output_tokens?: number
  total_tokens?: number
  estimated_cost?: number
  source_ip?: string
  user_agent?: string
  user_id?: string
  is_admin?: boolean
}

/**
 * Create a new audit record (call at start of audit)
 */
export async function createAuditRecord(data: {
  url: string
  source_ip?: string
  user_agent?: string
  user_id?: string
  is_admin?: boolean
}): Promise<string | null> {
  try {
    const { data: audit, error } = await supabase
      .from('audits')
      .insert({
        url: data.url,
        status: 'processing',
        source_ip: data.source_ip,
        user_agent: data.user_agent,
        user_id: data.user_id,
        is_admin: data.is_admin || false,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Failed to create audit record:', error)
      return null
    }

    return audit.id
  } catch (err) {
    console.error('Error creating audit record:', err)
    return null
  }
}

/**
 * Update audit with results (call on completion)
 */
export async function completeAuditRecord(
  auditId: string,
  data: {
    overall_score: number
    category_scores: Record<string, number>
    summary?: string
    brief?: AuditLogData['brief']
    input_tokens?: number
    output_tokens?: number
    total_tokens?: number
    estimated_cost?: number
  }
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('audits')
      .update({
        overall_score: data.overall_score,
        category_scores: data.category_scores,
        summary: data.summary,
        brief: data.brief,
        status: 'completed',
        completed_at: new Date().toISOString(),
        input_tokens: data.input_tokens,
        output_tokens: data.output_tokens,
        total_tokens: data.total_tokens,
        estimated_cost: data.estimated_cost,
      })
      .eq('id', auditId)

    if (error) {
      console.error('Failed to complete audit record:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('Error completing audit record:', err)
    return false
  }
}

/**
 * Mark audit as failed
 */
export async function failAuditRecord(
  auditId: string,
  errorMessage: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('audits')
      .update({
        status: 'failed',
        error_message: errorMessage,
        completed_at: new Date().toISOString(),
      })
      .eq('id', auditId)

    if (error) {
      console.error('Failed to mark audit as failed:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('Error marking audit as failed:', err)
    return false
  }
}

/**
 * Log a complete audit in one call (for simpler use cases)
 */
export async function logAudit(data: AuditLogData): Promise<string | null> {
  try {
    const { data: audit, error } = await supabase
      .from('audits')
      .insert({
        url: data.url,
        overall_score: data.overall_score,
        category_scores: data.category_scores || {},
        summary: data.summary,
        brief: data.brief || {},
        status: data.status,
        completed_at: data.status === 'completed' || data.status === 'failed'
          ? new Date().toISOString()
          : null,
        error_message: data.error_message,
        input_tokens: data.input_tokens,
        output_tokens: data.output_tokens,
        total_tokens: data.total_tokens,
        estimated_cost: data.estimated_cost,
        source_ip: data.source_ip,
        user_agent: data.user_agent,
        user_id: data.user_id,
        is_admin: data.is_admin || false,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Failed to log audit:', error)
      return null
    }

    return audit.id
  } catch (err) {
    console.error('Error logging audit:', err)
    return null
  }
}

/**
 * Increment user's audit usage count
 */
export async function incrementUserAuditUsage(userId: string): Promise<boolean> {
  try {
    // First get current usage
    const { data: profile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('audits_used_this_month')
      .eq('id', userId)
      .single()

    if (fetchError) {
      console.error('Failed to fetch user profile:', fetchError)
      return false
    }

    const currentUsage = profile?.audits_used_this_month || 0

    // Update with incremented value
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        audits_used_this_month: currentUsage + 1,
        last_audit_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Failed to increment audit usage:', updateError)
      return false
    }

    return true
  } catch (err) {
    console.error('Error incrementing audit usage:', err)
    return false
  }
}

/**
 * Get audit stats for admin dashboard
 */
export async function getAuditStats(): Promise<{
  totalAudits: number
  totalTokens: number
  totalCost: number
  avgScore: number
} | null> {
  try {
    const { data, error } = await supabase
      .from('audits')
      .select('overall_score, total_tokens, estimated_cost')
      .eq('status', 'completed')

    if (error) {
      console.error('Failed to get audit stats:', error)
      return null
    }

    const totalAudits = data.length
    const totalTokens = data.reduce((sum, a) => sum + (a.total_tokens || 0), 0)
    const totalCost = data.reduce((sum, a) => sum + (Number(a.estimated_cost) || 0), 0)
    const avgScore = totalAudits > 0
      ? Math.round(data.reduce((sum, a) => sum + (a.overall_score || 0), 0) / totalAudits)
      : 0

    return { totalAudits, totalTokens, totalCost, avgScore }
  } catch (err) {
    console.error('Error getting audit stats:', err)
    return null
  }
}
