import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET single website type
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string })?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const { data: websiteType, error } = await supabaseAdmin
      .from('WebsiteType')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !websiteType) {
      return NextResponse.json({ error: 'Website type not found' }, { status: 404 });
    }

    // Get audit count
    const { count } = await supabaseAdmin
      .from('audits')
      .select('*', { count: 'exact', head: true })
      .eq('website_type_id', id);

    return NextResponse.json({
      websiteType: {
        ...websiteType,
        auditCount: count || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching website type:', error);
    return NextResponse.json({ error: 'Failed to fetch website type' }, { status: 500 });
  }
}

// PUT update website type
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string })?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, icon, categoryWeights, focusAreas, bestPractices, isActive, isDefault } = body;

    // Check if website type exists
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('WebsiteType')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Website type not found' }, { status: 404 });
    }

    // If name changed, update slug and check for conflicts
    let slug = existing.slug;
    if (name && name !== existing.name) {
      slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const { data: slugConflict } = await supabaseAdmin
        .from('WebsiteType')
        .select('id')
        .eq('slug', slug)
        .neq('id', id)
        .single();

      if (slugConflict) {
        return NextResponse.json({ error: 'A website type with this name already exists' }, { status: 400 });
      }
    }

    // If this is being set as default, unset any existing default
    if (isDefault && !existing.isDefault) {
      await supabaseAdmin
        .from('WebsiteType')
        .update({ isDefault: false })
        .eq('isDefault', true)
        .neq('id', id);
    }

    const { data: websiteType, error } = await supabaseAdmin
      .from('WebsiteType')
      .update({
        name: name || existing.name,
        slug,
        description: description !== undefined ? description : existing.description,
        icon: icon !== undefined ? icon : existing.icon,
        categoryWeights: categoryWeights !== undefined ? categoryWeights : existing.categoryWeights,
        focusAreas: focusAreas !== undefined ? focusAreas : existing.focusAreas,
        bestPractices: bestPractices !== undefined ? bestPractices : existing.bestPractices,
        isActive: isActive !== undefined ? isActive : existing.isActive,
        isDefault: isDefault !== undefined ? isDefault : existing.isDefault,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating website type:', error);
      return NextResponse.json({ error: 'Failed to update website type' }, { status: 500 });
    }

    return NextResponse.json({ websiteType });
  } catch (error) {
    console.error('Error updating website type:', error);
    return NextResponse.json({ error: 'Failed to update website type' }, { status: 500 });
  }
}

// DELETE website type
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string })?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if website type exists and has audits
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('WebsiteType')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Website type not found' }, { status: 404 });
    }

    // Check audit count
    const { count } = await supabaseAdmin
      .from('audits')
      .select('*', { count: 'exact', head: true })
      .eq('website_type_id', id);

    // Don't allow deletion if audits are linked
    if (count && count > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${count} audits are using this website type. Deactivate it instead.` },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('WebsiteType')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting website type:', error);
      return NextResponse.json({ error: 'Failed to delete website type' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting website type:', error);
    return NextResponse.json({ error: 'Failed to delete website type' }, { status: 500 });
  }
}
