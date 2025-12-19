import { NextResponse } from 'next/server';
import { scrapeWebsite } from '@/lib/scraper';
import { analyzeWebsite } from '@/lib/analysis';
import { logAudit, logFailedAudit } from '@/lib/services/audit-logger';

export const maxDuration = 120; // Allow up to 120 seconds for the audit

// Map category IDs to full names
const CATEGORY_MAP: Record<string, string> = {
  business: 'Business Overview',
  technical: 'Technical Foundation',
  brand: 'Brand & Messaging',
  ux: 'User Experience',
  traffic: 'Traffic Readiness',
  security: 'Security',
  content: 'Content Strategy',
  conversion: 'Conversion & Engagement',
  social: 'Social & Multimedia',
  trust: 'Trust & Credibility',
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const pagesParam = searchParams.get('pages');
  const categoriesParam = searchParams.get('categories');
  const formatParam = searchParams.get('format') || 'markdown';
  const additionalUrlsParam = searchParams.get('additionalUrls');

  if (!url) {
    return NextResponse.json(
      { error: 'URL required. Use ?url=example.com' },
      { status: 400 }
    );
  }

  // Parse options
  const maxPages = pagesParam ? parseInt(pagesParam) : 1;
  const additionalUrls = additionalUrlsParam
    ? additionalUrlsParam.split(',').filter(u => u.trim().length > 0)
    : [];
  const selectedCategories = categoriesParam
    ? categoriesParam.split(',').map(id => CATEGORY_MAP[id]).filter(Boolean)
    : Object.values(CATEGORY_MAP); // Default to all categories

  console.log('[API] Audit options:', { maxPages, additionalUrls: additionalUrls.length, selectedCategories, format: formatParam });

  try {
    console.log('[API] Starting audit for:', url);

    // Step 1: Scrape the website
    console.log('[API] Scraping website...');
    const scraped = await scrapeWebsite(url, { maxPages, additionalUrls });
    console.log('[API] Scrape complete:', {
      title: scraped.title,
      loadTime: scraped.loadTime,
      ssl: scraped.ssl,
      h1Count: scraped.h1?.length,
      pagesScraped: scraped.pages?.length || 1,
    });

    // Step 2: Analyze with Claude (only selected categories)
    console.log('[API] Analyzing with Claude...');
    const result = await analyzeWebsite(scraped, selectedCategories);
    console.log('[API] Analysis complete:', {
      overallScore: result.overallScore,
      categories: result.categories.map(c => ({ name: c.name, score: c.score })),
      tokenUsage: result.tokenUsage,
    });

    // Log the audit asynchronously (non-blocking)
    logAudit(result, request).catch(err => {
      console.error('[API] Audit logging failed:', err);
    });

    return NextResponse.json({
      success: true,
      result,
      options: {
        maxPages,
        selectedCategories,
        format: formatParam,
      },
      scraped: {
        url: scraped.url,
        finalUrl: scraped.finalUrl,
        title: scraped.title,
        loadTime: scraped.loadTime,
        ssl: scraped.ssl,
        mobileViewport: scraped.mobileViewport,
        h1: scraped.h1,
        ctaButtons: scraped.ctaButtons,
      },
    });
  } catch (error) {
    console.error('[API] Audit error:', error);

    // Log failed audit (non-blocking)
    logFailedAudit(
      url,
      error instanceof Error ? error.message : 'Unknown error',
      request
    ).catch(err => {
      console.error('[API] Failed audit logging failed:', err);
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
