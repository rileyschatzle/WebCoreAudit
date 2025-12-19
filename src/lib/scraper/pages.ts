import puppeteer, { Browser } from 'puppeteer';
import { PageData } from '@/lib/types/audit';

const PRIORITY_PATHS = [
  '/about',
  '/about-us',
  '/pricing',
  '/contact',
  '/contact-us',
  '/services',
  '/products',
  '/features',
  '/blog',
  '/team',
  '/careers',
  '/faq',
];

const DEFAULT_MAX_PAGES = 1;

export async function scrapeMultiplePages(
  url: string,
  maxPages: number = DEFAULT_MAX_PAGES,
  additionalUrls: string[] = []
): Promise<PageData[]> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--ignore-certificate-errors']
  });

  try {
    const baseUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
    const domain = baseUrl.origin;

    // First, scrape the main URL
    const homePage = await scrapeSinglePage(browser, url, '/');
    const pages: PageData[] = [homePage];

    // If additional URLs are provided, scrape those specific URLs first
    if (additionalUrls.length > 0) {
      console.log(`[Pages] Scraping ${additionalUrls.length} additional URLs provided by user`);

      for (const additionalUrl of additionalUrls) {
        if (pages.length >= maxPages) break;
        try {
          // Normalize the URL - could be a full URL or a path
          let fullUrl: string;
          let path: string;

          if (additionalUrl.startsWith('http://') || additionalUrl.startsWith('https://')) {
            fullUrl = additionalUrl;
            path = new URL(additionalUrl).pathname;
          } else if (additionalUrl.startsWith('/')) {
            fullUrl = `${domain}${additionalUrl}`;
            path = additionalUrl;
          } else {
            // Assume it's a path without leading slash
            fullUrl = `${domain}/${additionalUrl}`;
            path = `/${additionalUrl}`;
          }

          const pageData = await scrapeSinglePage(browser, fullUrl, path);
          pages.push(pageData);
        } catch (error) {
          console.error(`[Pages] Failed to scrape additional URL ${additionalUrl}:`, error);
          // Continue with other pages
        }
      }
    }

    // Auto-discover additional pages if we haven't reached maxPages yet
    if (pages.length < maxPages) {
      console.log(`[Pages] Auto-discovering pages (have ${pages.length}, want ${maxPages})`);

      // Get navigation links from the home page
      const page = await browser.newPage();
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        const discoveredLinks = await page.evaluate((baseDomain: string) => {
          const links: string[] = [];
          const seen = new Set<string>();

          // Get all internal links
          document.querySelectorAll('a[href]').forEach((anchor) => {
            const href = anchor.getAttribute('href');
            if (!href) return;

            try {
              let fullUrl: URL;
              if (href.startsWith('http')) {
                fullUrl = new URL(href);
              } else if (href.startsWith('/')) {
                fullUrl = new URL(href, baseDomain);
              } else {
                return; // Skip relative paths without leading slash
              }

              // Only same domain
              if (fullUrl.origin !== baseDomain) return;

              // Skip anchors, common non-page links
              const path = fullUrl.pathname;
              if (path === '/' || path === '') return;
              if (path.includes('#')) return;
              if (path.match(/\.(jpg|jpeg|png|gif|svg|pdf|css|js|ico)$/i)) return;
              if (path.includes('wp-admin') || path.includes('wp-login')) return;

              const cleanPath = path.replace(/\/$/, ''); // Remove trailing slash
              if (!seen.has(cleanPath)) {
                seen.add(cleanPath);
                links.push(cleanPath);
              }
            } catch {
              // Invalid URL, skip
            }
          });

          return links;
        }, domain);

        await page.close();

        // Sort by priority and scrape additional pages
        const sortedLinks = sortByPriority(discoveredLinks);
        const scrapedPaths = new Set(pages.map(p => p.path.replace(/\/$/, '')));

        for (const path of sortedLinks) {
          if (pages.length >= maxPages) break;
          if (scrapedPaths.has(path)) continue;

          try {
            const fullUrl = `${domain}${path}`;
            console.log(`[Pages] Auto-scraping: ${path}`);
            const pageData = await scrapeSinglePage(browser, fullUrl, path);
            pages.push(pageData);
            scrapedPaths.add(path);
          } catch (error) {
            console.error(`[Pages] Failed to auto-scrape ${path}:`, error);
          }
        }
      } catch (error) {
        console.error('[Pages] Failed to discover pages:', error);
        await page.close();
      }
    }

    await browser.close();
    return pages;

  } catch (error) {
    await browser.close();
    throw error;
  }
}

function sortByPriority(links: string[]): string[] {
  const prioritized: string[] = [];
  const remaining: string[] = [];

  // First, add priority paths if they exist in discovered links
  for (const priorityPath of PRIORITY_PATHS) {
    const match = links.find(link =>
      link.toLowerCase() === priorityPath ||
      link.toLowerCase().startsWith(priorityPath + '/') ||
      link.toLowerCase().includes(priorityPath)
    );
    if (match && !prioritized.includes(match)) {
      prioritized.push(match);
    }
  }

  // Add remaining links
  for (const link of links) {
    if (!prioritized.includes(link)) {
      remaining.push(link);
    }
  }

  return [...prioritized, ...remaining];
}

async function scrapeSinglePage(browser: Browser, url: string, path: string): Promise<PageData> {
  const page = await browser.newPage();
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );

  const startTime = Date.now();

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    const loadTime = Date.now() - startTime;

    const pageData = await page.evaluate(() => {
      const title = document.title || null;
      const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') || null;
      const h1s = Array.from(document.querySelectorAll('h1')).map(h => h.textContent?.trim() || '').filter(Boolean);

      // Count words in body
      const bodyText = document.body.innerText || '';
      const wordCount = bodyText.split(/\s+/).filter(w => w.length > 0).length;

      // Count images
      const images = document.querySelectorAll('img');

      // Check for forms
      const forms = document.querySelectorAll('form');

      // Check for CTAs
      const ctaSelectors = 'button, a.btn, a.button, [class*="cta"], [class*="btn-primary"], [role="button"]';
      const ctas = document.querySelectorAll(ctaSelectors);

      return {
        title,
        metaDescription: metaDesc,
        h1: h1s,
        wordCount,
        imageCount: images.length,
        hasForm: forms.length > 0,
        hasCTA: ctas.length > 0,
      };
    });

    await page.close();

    return {
      url,
      path,
      title: pageData.title,
      metaDescription: pageData.metaDescription,
      h1: pageData.h1,
      loadTime,
      wordCount: pageData.wordCount,
      imageCount: pageData.imageCount,
      hasForm: pageData.hasForm,
      hasCTA: pageData.hasCTA,
    };

  } catch (error) {
    await page.close();
    throw error;
  }
}

// Calculate a page score - load time is heavily weighted since it's critical for UX
export function calculatePageScore(page: PageData): number {
  let score = 100; // Start at 100 and deduct for issues

  // Load time is the biggest factor (up to -50 points)
  // This aligns with Technical Foundation analysis
  if (page.loadTime >= 10000) {
    score -= 50; // 10+ seconds is catastrophic
  } else if (page.loadTime >= 7000) {
    score -= 40;
  } else if (page.loadTime >= 5000) {
    score -= 30;
  } else if (page.loadTime >= 3000) {
    score -= 20;
  } else if (page.loadTime >= 2000) {
    score -= 10;
  }
  // Under 2 seconds = no penalty

  // Missing title (-15)
  if (!page.title) {
    score -= 15;
  } else if (page.title.length < 30 || page.title.length > 60) {
    score -= 5; // Suboptimal length
  }

  // Missing meta description (-10)
  if (!page.metaDescription) {
    score -= 10;
  } else if (page.metaDescription.length < 120 || page.metaDescription.length > 160) {
    score -= 3; // Suboptimal length
  }

  // H1 issues (-10)
  if (page.h1.length === 0) {
    score -= 10;
  } else if (page.h1.length > 1) {
    score -= 5; // Multiple H1s is not ideal
  }

  // Thin content (-10)
  if (page.wordCount < 100) {
    score -= 10;
  } else if (page.wordCount < 300) {
    score -= 5;
  }

  // No CTA (-5)
  if (!page.hasCTA) {
    score -= 5;
  }

  return Math.min(100, Math.max(0, score));
}
