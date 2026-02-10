import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSupabaseAdminOrMock } from '@/lib/supabase/admin-client';

export async function GET(request: NextRequest) {
  try {
    // Check admin auth
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string })?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const offset = (page - 1) * limit;
    const filter = searchParams.get('filter') || 'all'; // 'all', 'admin', 'user'
    const sort = searchParams.get('sort') || 'date'; // 'date', 'score'
    const direction = searchParams.get('direction') || 'desc'; // 'asc', 'desc'

    // Determine sort column
    const sortColumn = sort === 'score' ? 'overall_score' : 'created_at';
    const ascending = direction === 'asc';

    // Build query with filter
    let query = getSupabaseAdminOrMock()
      .from('audits')
      .select('*', { count: 'exact' })
      .order(sortColumn, { ascending, nullsFirst: false });

    // Apply filter
    if (filter === 'admin') {
      query = query.eq('is_admin', true);
    } else if (filter === 'user') {
      query = query.or('is_admin.is.null,is_admin.eq.false');
    }

    const { data: audits, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching audits:', error.message, error.details, error.hint);
      return NextResponse.json({ error: 'Failed to fetch audits', details: error.message }, { status: 500 });
    }

    // Get stats for all audits
    const { data: allAudits } = await getSupabaseAdminOrMock()
      .from('audits')
      .select('overall_score, status, total_tokens, estimated_cost, is_admin');

    // Calculate stats
    const adminAudits = allAudits?.filter(a => a.is_admin === true) || [];
    const userAudits = allAudits?.filter(a => !a.is_admin) || [];
    const completed = allAudits?.filter(a => a.status === 'completed') || [];
    const failed = allAudits?.filter(a => a.status === 'failed') || [];
    const scores = completed.filter(a => a.overall_score !== null).map(a => a.overall_score as number);
    const avgScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;
    const totalTokens = allAudits?.reduce((sum, a) => sum + (a.total_tokens || 0), 0) || 0;
    const totalCost = allAudits?.reduce((sum, a) => sum + (Number(a.estimated_cost) || 0), 0) || 0;

    return NextResponse.json({
      audits: audits?.map(a => {
        // Calculate duration if both timestamps exist
        let durationSeconds: number | null = null;
        if (a.created_at && a.completed_at) {
          const start = new Date(a.created_at).getTime();
          const end = new Date(a.completed_at).getTime();
          durationSeconds = Math.round((end - start) / 1000);
        }

        return {
          id: a.id,
          url: a.url,
          score: a.overall_score,
          status: a.status,
          createdAt: a.created_at,
          completedAt: a.completed_at,
          durationSeconds,
          inputTokens: a.input_tokens,
          outputTokens: a.output_tokens,
          totalTokens: a.total_tokens,
          cost: a.estimated_cost,
          categoryScores: a.category_scores || {},
          brief: a.brief || {},
          summary: a.summary,
          errorMessage: a.error_message,
          isAdmin: a.is_admin === true,
          userId: a.user_id,
          userEmail: null, // User email lookup removed - would need separate query
          sourceIp: a.source_ip,
          userAgent: a.user_agent,
        };
      }) || [],
      total: count || 0,
      page,
      limit,
      stats: {
        total: allAudits?.length || 0,
        adminCount: adminAudits.length,
        userCount: userAudits.length,
        completed: completed.length,
        failed: failed.length,
        avgScore,
        totalTokens,
        totalCost,
      },
    });
  } catch (error) {
    console.error('Admin audits API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
