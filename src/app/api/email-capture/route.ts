import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminOrMock } from '@/lib/supabase/admin-client';
import { addEmailToNotion } from '@/lib/notion/client';


export async function POST(request: NextRequest) {
  try {
    const { email, source = 'audit', auditUrl } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists in Supabase
    const { data: existing } = await getSupabaseAdminOrMock()
      .from('email_subscribers')
      .select('id')
      .eq('email', normalizedEmail)
      .single();

    if (existing) {
      // Update audit URL if provided
      if (auditUrl) {
        await getSupabaseAdminOrMock()
          .from('email_subscribers')
          .update({ audit_url: auditUrl })
          .eq('id', existing.id);
      }

      // Also sync to Notion (non-blocking)
      addEmailToNotion(normalizedEmail, source, auditUrl)
        .catch(err => console.error('Notion sync failed:', err));

      return NextResponse.json({
        exists: true,
        id: existing.id,
      });
    }

    // Insert new subscriber in Supabase
    const { data, error } = await getSupabaseAdminOrMock()
      .from('email_subscribers')
      .insert({
        email: normalizedEmail,
        source,
        audit_url: auditUrl,
        verified: false,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Email capture error:', error);
      throw error;
    }

    // Sync to Notion (non-blocking)
    addEmailToNotion(normalizedEmail, source, auditUrl)
      .catch(err => console.error('Notion sync failed:', err));

    return NextResponse.json({
      exists: false,
      id: data.id,
    });
  } catch (error) {
    console.error('Email capture API error:', error);
    return NextResponse.json(
      { error: 'Failed to save email. Please try again.' },
      { status: 500 }
    );
  }
}
