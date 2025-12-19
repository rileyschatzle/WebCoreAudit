import { NextResponse } from 'next/server';
import { getOrCreateEmailDatabase, addEmailToNotion } from '@/lib/notion/client';

// This route tests the Notion integration by creating the database
export async function GET() {
  try {
    // Create or get the database
    const databaseId = await getOrCreateEmailDatabase();

    return NextResponse.json({
      success: true,
      message: 'Notion database ready',
      databaseId,
    });
  } catch (error) {
    console.error('Notion setup error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to setup Notion database',
    }, { status: 500 });
  }
}

// Test adding an email
export async function POST(request: Request) {
  try {
    const { email, source = 'waitlist', auditUrl } = await request.json();

    const result = await addEmailToNotion(email, source, auditUrl);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Notion test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add email to Notion',
    }, { status: 500 });
  }
}
