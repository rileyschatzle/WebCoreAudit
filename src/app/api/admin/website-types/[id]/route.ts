import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSupabaseAdminOrMock } from '@/lib/supabase/admin-client';

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
    const supabase = getSupabaseAdminOrMock();

    const { data: websiteType, error } = await supabase
      .from('website_types')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!websiteType) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(websiteType);
  } catch (error) {
    console.error('Failed to fetch website type:', error);
    return NextResponse.json({ error: 'Failed to fetch website type' }, { status: 500 });
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
    const supabase = getSupabaseAdminOrMock();

    const { error } = await supabase
      .from('website_types')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete website type:', error);
    return NextResponse.json({ error: 'Failed to delete website type' }, { status: 500 });
  }
}
