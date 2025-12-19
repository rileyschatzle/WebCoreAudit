import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  // Check admin auth
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string })?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get audit stats
    const { data: audits, error: auditsError } = await supabase
      .from('audits')
      .select('id, url, overall_score, total_tokens, estimated_cost, status, created_at, completed_at, brief')
      .order('created_at', { ascending: false })

    if (auditsError) {
      console.error('Failed to fetch audits:', auditsError)
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
    }

    const completedAudits = audits?.filter(a => a.status === 'completed') || []
    const totalAudits = audits?.length || 0
    const totalTokens = completedAudits.reduce((sum, a) => sum + (a.total_tokens || 0), 0)
    const totalCost = completedAudits.reduce((sum, a) => sum + (Number(a.estimated_cost) || 0), 0)
    const avgScore = completedAudits.length > 0
      ? Math.round(completedAudits.reduce((sum, a) => sum + (a.overall_score || 0), 0) / completedAudits.length)
      : 0

    // Get recent audits (last 10)
    const recentAudits = (audits || []).slice(0, 10).map(a => ({
      id: a.id,
      url: a.url,
      score: a.overall_score,
      status: a.status,
      createdAt: a.created_at,
      completedAt: a.completed_at,
      tokens: a.total_tokens,
      cost: a.estimated_cost,
      businessName: (a.brief as { business_name?: string })?.business_name || null,
    }))

    // Get email subscriber count
    const { count: emailCount } = await supabase
      .from('email_subscribers')
      .select('*', { count: 'exact', head: true })

    // Get audits by day (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const auditsByDay = (audits || [])
      .filter(a => new Date(a.created_at) >= sevenDaysAgo)
      .reduce((acc, a) => {
        const day = new Date(a.created_at).toLocaleDateString('en-US', { weekday: 'short' })
        acc[day] = (acc[day] || 0) + 1
        return acc
      }, {} as Record<string, number>)

    return NextResponse.json({
      stats: {
        totalAudits,
        completedAudits: completedAudits.length,
        failedAudits: audits?.filter(a => a.status === 'failed').length || 0,
        totalTokens,
        totalCost: Math.round(totalCost * 10000) / 10000,
        avgScore,
        emailSubscribers: emailCount || 0,
      },
      recentAudits,
      auditsByDay,
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
