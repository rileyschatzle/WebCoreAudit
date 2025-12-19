import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { scrapeContent } from '@/lib/scraper/content';

export const maxDuration = 300; // 5 minutes max for large batches

interface ScrapeResult {
  url: string;
  status: 'success' | 'error';
  emails: string[];
  socialLinks: string[];
  error?: string;
}

// GET endpoint for SSE streaming
export async function GET(request: NextRequest) {
  // Check admin auth
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string })?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const urlsParam = searchParams.get('urls');

  if (!urlsParam) {
    return NextResponse.json({ error: 'No URLs provided' }, { status: 400 });
  }

  const urls = JSON.parse(decodeURIComponent(urlsParam)) as string[];

  if (urls.length === 0) {
    return NextResponse.json({ error: 'No valid URLs provided' }, { status: 400 });
  }

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const send = async (event: string, data: unknown) => {
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    await writer.write(encoder.encode(message));
  };

  // Process URLs in the background
  (async () => {
    try {
      const results: ScrapeResult[] = [];

      await send('start', { total: urls.length });

      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];

        await send('progress', {
          current: i + 1,
          total: urls.length,
          url
        });

        try {
          // Normalize URL
          let normalizedUrl = url.trim();
          if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
            normalizedUrl = 'https://' + normalizedUrl;
          }

          // Scrape the content (with timeout)
          const scrapePromise = scrapeContent(normalizedUrl);
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 30000)
          );

          const scraped = await Promise.race([scrapePromise, timeoutPromise]);

          const result: ScrapeResult = {
            url: normalizedUrl,
            status: 'success',
            emails: scraped.emails || [],
            socialLinks: scraped.socialLinks || [],
          };

          results.push(result);
          await send('result', result);

        } catch (error) {
          const result: ScrapeResult = {
            url,
            status: 'error',
            emails: [],
            socialLinks: [],
            error: error instanceof Error ? error.message : 'Unknown error',
          };

          results.push(result);
          await send('result', result);
        }

        // Small delay to prevent overwhelming
        if (i < urls.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      await send('complete', {
        total: urls.length,
        successful: results.filter(r => r.status === 'success').length,
        failed: results.filter(r => r.status === 'error').length,
      });

    } catch (error) {
      await send('error', {
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// POST endpoint for single batch (non-streaming, for small lists)
export async function POST(request: NextRequest) {
  // Check admin auth
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string })?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { urls } = await request.json() as { urls: string[] };

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: 'No valid URLs provided' }, { status: 400 });
    }

    const results: ScrapeResult[] = [];

    for (const url of urls) {
      try {
        let normalizedUrl = url.trim();
        if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
          normalizedUrl = 'https://' + normalizedUrl;
        }

        const scraped = await scrapeContent(normalizedUrl);

        results.push({
          url: normalizedUrl,
          status: 'success',
          emails: scraped.emails || [],
          socialLinks: scraped.socialLinks || [],
        });

      } catch (error) {
        results.push({
          url,
          status: 'error',
          emails: [],
          socialLinks: [],
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({ results });

  } catch (error) {
    console.error('Contact scraper error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
