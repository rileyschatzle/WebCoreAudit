import puppeteer from 'puppeteer';
import { TrafficSignals, SocialLink } from '@/lib/types/audit';

export async function scrapeTrafficSignals(url: string): Promise<TrafficSignals> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--ignore-certificate-errors']
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );

  const domain = new URL(url.startsWith('http') ? url : `https://${url}`).origin;

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Check for analytics tools
    const analyticsCheck = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script')).map(s => s.src + ' ' + s.innerHTML);
      const scriptText = scripts.join(' ').toLowerCase();
      const w = window as unknown as Record<string, unknown>;

      return {
        hasGoogleAnalytics: scriptText.includes('google-analytics') || scriptText.includes('gtag') || !!w.ga,
        hasGTM: scriptText.includes('googletagmanager') || !!w.dataLayer,
        hasPlausible: scriptText.includes('plausible'),
        hasFathom: scriptText.includes('usefathom'),
        hasMixpanel: scriptText.includes('mixpanel'),
        hasHotjar: scriptText.includes('hotjar'),
        hasSegment: scriptText.includes('segment'),
        hasAmplitude: scriptText.includes('amplitude'),
        hasFacebookPixel: scriptText.includes('fbevents') || scriptText.includes('facebook.net/en_US/fbevents'),
        hasLinkedInPixel: scriptText.includes('snap.licdn.com') || scriptText.includes('linkedin.com/px'),
        hasTwitterPixel: scriptText.includes('static.ads-twitter.com'),
        hasTikTokPixel: scriptText.includes('analytics.tiktok.com'),
      };
    });

    const otherAnalytics: string[] = [];
    if (analyticsCheck.hasPlausible) otherAnalytics.push('Plausible');
    if (analyticsCheck.hasFathom) otherAnalytics.push('Fathom');
    if (analyticsCheck.hasMixpanel) otherAnalytics.push('Mixpanel');
    if (analyticsCheck.hasHotjar) otherAnalytics.push('Hotjar');
    if (analyticsCheck.hasSegment) otherAnalytics.push('Segment');
    if (analyticsCheck.hasAmplitude) otherAnalytics.push('Amplitude');

    const pixels: string[] = [];
    if (analyticsCheck.hasFacebookPixel) pixels.push('Facebook');
    if (analyticsCheck.hasLinkedInPixel) pixels.push('LinkedIn');
    if (analyticsCheck.hasTwitterPixel) pixels.push('Twitter/X');
    if (analyticsCheck.hasTikTokPixel) pixels.push('TikTok');

    // Check sitemap
    let hasSitemap = false;
    let sitemapPageCount: number | null = null;
    try {
      const sitemapResponse = await page.goto(`${domain}/sitemap.xml`, { timeout: 10000 });
      if (sitemapResponse && sitemapResponse.ok()) {
        hasSitemap = true;
        const sitemapText = await page.content();
        const urlMatches = sitemapText.match(/<loc>/g);
        sitemapPageCount = urlMatches ? urlMatches.length : null;
      }
    } catch {
      // Sitemap doesn't exist
    }

    // Go back to main page for remaining checks
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Check robots.txt
    let hasRobotsTxt = false;
    let robotsAllowsCrawling = true;
    try {
      const robotsResponse = await page.goto(`${domain}/robots.txt`, { timeout: 10000 });
      if (robotsResponse && robotsResponse.ok()) {
        hasRobotsTxt = true;
        const robotsText = await page.content();
        robotsAllowsCrawling = !robotsText.toLowerCase().includes('disallow: /');
      }
    } catch {
      // Robots.txt doesn't exist
    }

    // Go back to main page
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Check structured data
    const structuredData = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      const types: string[] = [];
      scripts.forEach(script => {
        try {
          const data = JSON.parse(script.innerHTML);
          if (data['@type']) types.push(data['@type']);
          if (Array.isArray(data['@graph'])) {
            data['@graph'].forEach((item: Record<string, unknown>) => {
              if (item['@type']) types.push(item['@type'] as string);
            });
          }
        } catch {
          // Invalid JSON
        }
      });
      return Array.from(new Set(types)); // Remove duplicates
    });

    // Check for blog/resources
    const contentCheck = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      const hrefs = links.map(a => a.href.toLowerCase());
      const text = links.map(a => a.textContent?.toLowerCase() || '');

      const blogIndicators = ['/blog', '/posts', '/articles', '/news', '/insights', '/updates'];
      const resourceIndicators = ['/resources', '/guides', '/ebooks', '/whitepapers', '/case-studies', '/library'];

      return {
        blogExists: blogIndicators.some(ind => hrefs.some(h => h.includes(ind))) ||
          text.some(t => t === 'blog' || t === 'articles' || t === 'insights'),
        hasResourcesSection: resourceIndicators.some(ind => hrefs.some(h => h.includes(ind))) ||
          text.some(t => t.includes('resource') || t.includes('guide') || t.includes('download')),
      };
    });

    // Estimate blog posts if blog exists
    let estimatedBlogPosts = 0;
    if (contentCheck.blogExists) {
      try {
        const blogUrls = ['/blog', '/posts', '/articles', '/news', '/insights'];
        for (const blogPath of blogUrls) {
          try {
            await page.goto(`${domain}${blogPath}`, { waitUntil: 'networkidle2', timeout: 15000 });
            const postCount = await page.$$eval(
              'article, .post, .blog-post, [class*="post-"], [class*="article-"], .entry',
              els => els.length
            );
            if (postCount > 0) {
              estimatedBlogPosts = postCount;
              break;
            }
          } catch {
            continue;
          }
        }
      } catch {
        // Couldn't access blog
      }
    }

    // Go back to main page
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Get social links
    const socialLinks = await page.evaluate(() => {
      const socialPatterns = [
        { platform: 'Facebook', pattern: /facebook\.com/i },
        { platform: 'Twitter/X', pattern: /twitter\.com|x\.com/i },
        { platform: 'LinkedIn', pattern: /linkedin\.com/i },
        { platform: 'Instagram', pattern: /instagram\.com/i },
        { platform: 'YouTube', pattern: /youtube\.com/i },
        { platform: 'TikTok', pattern: /tiktok\.com/i },
        { platform: 'GitHub', pattern: /github\.com/i },
        { platform: 'Discord', pattern: /discord\.com|discord\.gg/i },
        { platform: 'Pinterest', pattern: /pinterest\.com/i },
      ];

      const links = Array.from(document.querySelectorAll('a[href]'));
      const found: { platform: string; url: string }[] = [];

      links.forEach(link => {
        const href = link.getAttribute('href') || '';
        socialPatterns.forEach(({ platform, pattern }) => {
          if (pattern.test(href) && !found.some(f => f.platform === platform)) {
            found.push({ platform, url: href });
          }
        });
      });

      return found;
    });

    // SEO elements
    const seoCheck = await page.evaluate(() => {
      const title = document.querySelector('title')?.textContent || '';
      const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
      const h1s = document.querySelectorAll('h1');
      const canonical = document.querySelector('link[rel="canonical"]');
      const internalLinks = document.querySelectorAll(`a[href^="/"], a[href^="${window.location.origin}"]`);
      const allLinks = document.querySelectorAll('a[href^="http"]');
      const externalLinks = Array.from(allLinks).filter(a =>
        !a.getAttribute('href')?.includes(window.location.hostname)
      );

      return {
        metaTitle: !!title,
        metaTitleLength: title.length,
        metaDescription: !!metaDesc,
        metaDescriptionLength: metaDesc.length,
        h1Count: h1s.length,
        canonicalTag: !!canonical,
        internalLinkCount: internalLinks.length,
        externalLinkCount: externalLinks.length,
      };
    });

    await browser.close();

    return {
      hasGoogleAnalytics: analyticsCheck.hasGoogleAnalytics,
      hasGTM: analyticsCheck.hasGTM,
      hasOtherAnalytics: otherAnalytics,
      hasPixels: pixels,
      hasSitemap,
      sitemapPageCount,
      hasRobotsTxt,
      robotsAllowsCrawling,
      hasStructuredData: structuredData.length > 0,
      structuredDataTypes: structuredData,
      canonicalTag: seoCheck.canonicalTag,
      blogExists: contentCheck.blogExists,
      estimatedBlogPosts,
      hasResourcesSection: contentCheck.hasResourcesSection,
      socialLinks: socialLinks as SocialLink[],
      metaTitle: seoCheck.metaTitle,
      metaTitleLength: seoCheck.metaTitleLength,
      metaDescription: seoCheck.metaDescription,
      metaDescriptionLength: seoCheck.metaDescriptionLength,
      h1Count: seoCheck.h1Count,
      internalLinkCount: seoCheck.internalLinkCount,
      externalLinkCount: seoCheck.externalLinkCount,
    };
  } catch (error) {
    await browser.close();
    throw error;
  }
}
