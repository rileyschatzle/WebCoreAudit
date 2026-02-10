import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminOrMock } from '@/lib/supabase/admin-client';
import { addEmailToNotion } from '@/lib/notion/client';


export async function POST(request: NextRequest) {
  try {
    const { email, source = 'waitlist' } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check if already subscribed
    const { data: existing } = await getSupabaseAdminOrMock()
      .from('email_subscribers')
      .select('id, unsubscribed_at')
      .eq('email', normalizedEmail)
      .single();

    if (existing && !existing.unsubscribed_at) {
      // Already subscribed and not unsubscribed
      return NextResponse.json(
        { message: 'You are already on the waitlist!' },
        { status: 200 }
      );
    }

    if (existing && existing.unsubscribed_at) {
      // Was unsubscribed, re-subscribe
      await getSupabaseAdminOrMock()
        .from('email_subscribers')
        .update({
          unsubscribed_at: null,
          source,
        })
        .eq('id', existing.id);

      return NextResponse.json({
        message: 'Welcome back! You have been re-added to the waitlist.',
      });
    }

    // New subscriber
    const { error } = await getSupabaseAdminOrMock()
      .from('email_subscribers')
      .insert({
        email: normalizedEmail,
        source,
        verified: false,
      });

    if (error) {
      console.error('Waitlist subscription error:', error);
      if (error.code === '23505') {
        // Unique constraint violation - already exists
        return NextResponse.json(
          { message: 'You are already on the waitlist!' },
          { status: 200 }
        );
      }
      throw error;
    }

    // Sync to Notion (non-blocking)
    addEmailToNotion(normalizedEmail, source as 'audit' | 'waitlist' | 'newsletter')
      .catch(err => console.error('Notion sync failed:', err));

    return NextResponse.json({
      message: 'Successfully joined the waitlist!',
    });
  } catch (error) {
    console.error('Waitlist API error:', error);
    return NextResponse.json(
      { error: 'Failed to join waitlist. Please try again.' },
      { status: 500 }
    );
  }
}
