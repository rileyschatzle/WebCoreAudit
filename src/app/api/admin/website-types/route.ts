import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET all website types
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string })?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const includeInactive = searchParams.get('includeInactive') === 'true';

    let query = supabaseAdmin
      .from('WebsiteType')
      .select('*')
      .order('isDefault', { ascending: false })
      .order('name', { ascending: true });

    if (!includeInactive) {
      query = query.eq('isActive', true);
    }

    const { data: websiteTypes, error } = await query;

    if (error) {
      console.error('Error fetching website types:', error);
      return NextResponse.json({ error: 'Failed to fetch website types' }, { status: 500 });
    }

    // Get audit counts for each website type
    const { data: auditCounts } = await supabaseAdmin
      .from('audits')
      .select('website_type_id')
      .not('website_type_id', 'is', null);

    const countMap: Record<string, number> = {};
    auditCounts?.forEach((a) => {
      countMap[a.website_type_id] = (countMap[a.website_type_id] || 0) + 1;
    });

    return NextResponse.json({
      websiteTypes: websiteTypes?.map((wt) => ({
        ...wt,
        auditCount: countMap[wt.id] || 0,
      })) || [],
    });
  } catch (error) {
    console.error('Error fetching website types:', error);
    return NextResponse.json({ error: 'Failed to fetch website types' }, { status: 500 });
  }
}

// POST create new website type
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string })?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, icon, categoryWeights, focusAreas, bestPractices, isActive, isDefault } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    // Check if slug already exists
    const { data: existing } = await supabaseAdmin
      .from('WebsiteType')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'A website type with this name already exists' }, { status: 400 });
    }

    // If this is being set as default, unset any existing default
    if (isDefault) {
      await supabaseAdmin
        .from('WebsiteType')
        .update({ isDefault: false })
        .eq('isDefault', true);
    }

    const { data: websiteType, error } = await supabaseAdmin
      .from('WebsiteType')
      .insert({
        name,
        slug,
        description: description || null,
        icon: icon || null,
        categoryWeights: categoryWeights || {},
        focusAreas: focusAreas || [],
        bestPractices: bestPractices || [],
        isActive: isActive !== false,
        isDefault: isDefault || false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating website type:', error);
      return NextResponse.json({ error: 'Failed to create website type' }, { status: 500 });
    }

    return NextResponse.json({ websiteType }, { status: 201 });
  } catch (error) {
    console.error('Error creating website type:', error);
    return NextResponse.json({ error: 'Failed to create website type' }, { status: 500 });
  }
}
