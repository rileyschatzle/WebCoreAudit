import { scrapeTechnical } from './technical';
import { scrapeContent } from './content';
import { scrapeTrafficSignals } from './traffic';
import { scrapeExtendedContent } from './extended';
import { scrapeMultiplePages } from './pages';
import { scrapeDesignQuality } from './design';
import { ScrapedData } from '@/lib/types/audit';

interface ScrapeOptions {
  maxPages?: number;
  additionalUrls?: string[];
}

export async function scrapeWebsite(url: string, options: ScrapeOptions = {}): Promise<ScrapedData> {
  const { maxPages = 1, additionalUrls = [] } = options;
  // Normalize URL
  let normalizedUrl = url.trim();
  if (!normalizedUrl.startsWith('http')) {
    normalizedUrl = 'https://' + normalizedUrl;
  }

  // Validate URL
  try {
    new URL(normalizedUrl);
  } catch {
    throw new Error('Invalid URL format');
  }

  console.log(`[Scraper] Starting comprehensive scrape for: ${normalizedUrl}`);

  // Run all scrapers in parallel for efficiency
  const [technical, content, trafficSignals, extendedContent, designQuality, pages] = await Promise.all([
    scrapeTechnical(normalizedUrl).catch(err => {
      console.error('[Scraper] Technical scrape failed:', err);
      throw new Error(`Technical scrape failed: ${err.message}`);
    }),
    scrapeContent(normalizedUrl).catch(err => {
      console.error('[Scraper] Content scrape failed:', err);
      throw new Error(`Content scrape failed: ${err.message}`);
    }),
    scrapeTrafficSignals(normalizedUrl).catch(err => {
      console.error('[Scraper] Traffic signals scrape failed:', err);
      return null; // Non-critical, continue without
    }),
    scrapeExtendedContent(normalizedUrl).catch(err => {
      console.error('[Scraper] Extended content scrape failed:', err);
      return null; // Non-critical, continue without
    }),
    scrapeDesignQuality(normalizedUrl).catch(err => {
      console.error('[Scraper] Design quality scrape failed:', err);
      return null; // Non-critical, continue without
    }),
    scrapeMultiplePages(normalizedUrl, maxPages, additionalUrls).catch(err => {
      console.error('[Scraper] Multi-page scrape failed:', err);
      return []; // Non-critical, continue without
    }),
  ]);

  console.log(`[Scraper] Scrape complete for: ${normalizedUrl}`);
  console.log(`[Scraper] Pages analyzed: ${pages.length}`);

  // Merge results with defaults for any missing fields
  const result: ScrapedData = {
    url: normalizedUrl,
    finalUrl: technical.finalUrl || normalizedUrl,
    loadTime: technical.loadTime || 0,
    statusCode: technical.statusCode || 0,
    title: technical.title || null,
    metaDescription: technical.metaDescription || null,
    favicon: technical.favicon || false,
    faviconUrl: technical.faviconUrl || null,
    ogImageUrl: technical.ogImageUrl || null,
    logoUrl: technical.logoUrl || null,
    ssl: technical.ssl || false,
    sslError: technical.sslError || null,
    mobileViewport: technical.mobileViewport || false,
    contentLength: technical.contentLength || 0,
    imageCount: technical.imageCount || 0,
    totalImageSize: technical.totalImageSize || 0,
    brokenLinks: technical.brokenLinks || [],
    h1: content.h1 || [],
    h2: content.h2 || [],
    bodyText: content.bodyText || '',
    ctaButtons: content.ctaButtons || [],
    navLinks: content.navLinks || [],
    hasAnalytics: technical.hasAnalytics || false,
    hasForms: technical.hasForms || false,
    socialLinks: content.socialLinks || [],
    emails: content.emails || [],
    // Extended data for new categories
    trafficSignals: trafficSignals || undefined,
    extendedContent: extendedContent || undefined,
    designQuality: designQuality || undefined,
    pages: pages.length > 0 ? pages : undefined,
    // Screenshots for visual analysis
    screenshots: technical.screenshots || undefined,
  };

  return result;
}

export { scrapeTechnical } from './technical';
export { scrapeContent } from './content';
export { scrapeTrafficSignals } from './traffic';
export { scrapeExtendedContent } from './extended';
export { scrapeDesignQuality } from './design';
export { scrapeMultiplePages, calculatePageScore } from './pages';
