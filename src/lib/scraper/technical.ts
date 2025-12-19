import puppeteer from 'puppeteer';
import { ScrapedData } from '@/lib/types/audit';

export async function scrapeTechnical(url: string): Promise<Partial<ScrapedData>> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--ignore-certificate-errors']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );

  const startTime = Date.now();
  let sslError: string | null = null;

  // Listen for certificate errors
  page.on('requestfailed', request => {
    const failure = request.failure();
    if (failure?.errorText?.includes('CERT') || failure?.errorText?.includes('SSL')) {
      sslError = failure.errorText;
    }
  });

  try {
    const response = await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    const loadTime = Date.now() - startTime;
    const finalUrl = page.url();
    const statusCode = response?.status() || 0;
    const ssl = finalUrl.startsWith('https');

    // Check for SSL certificate issues via Security API
    const securityState = await page.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (window as unknown as { isSecureContext: boolean }).isSecureContext;
    }).catch(() => null);

    // If we're on HTTPS but context isn't secure, there's a cert issue
    if (ssl && securityState === false) {
      sslError = sslError || 'SSL certificate is invalid or expired';
    }

    // Extract meta info
    const title = await page.title();

    const metaDescription = await page.$eval(
      'meta[name="description"]',
      el => el.getAttribute('content')
    ).catch(() => null);

    // Check mobile viewport
    const mobileViewport = await page.$eval(
      'meta[name="viewport"]',
      el => el.getAttribute('content')?.includes('width=device-width') || false
    ).catch(() => false);

    // Check favicon and extract URL
    const favicon = await page.$('link[rel*="icon"]') !== null;

    // Extract favicon URL (prioritize apple-touch-icon, then icon, then shortcut icon)
    const faviconUrl = await page.evaluate(() => {
      const appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
      const icon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      const shortcutIcon = document.querySelector('link[rel="shortcut icon"]') as HTMLLinkElement;
      return appleTouchIcon?.href || icon?.href || shortcutIcon?.href || null;
    });

    // Extract Open Graph image
    const ogImageUrl = await page.$eval(
      'meta[property="og:image"]',
      el => el.getAttribute('content')
    ).catch(() => null);

    // Try to get Twitter image as fallback
    const twitterImageUrl = await page.$eval(
      'meta[name="twitter:image"]',
      el => el.getAttribute('content')
    ).catch(() => null);

    // Try to get logo from Schema.org structured data
    const schemaLogo = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
      for (const script of scripts) {
        try {
          const data = JSON.parse(script.textContent || '');
          // Check for logo in Organization or LocalBusiness schema
          if (data.logo) {
            return typeof data.logo === 'string' ? data.logo : data.logo.url;
          }
          if (data['@graph']) {
            for (const item of data['@graph']) {
              if (item.logo) {
                return typeof item.logo === 'string' ? item.logo : item.logo.url;
              }
            }
          }
        } catch {
          // Ignore parse errors
        }
      }
      return null;
    });

    // Determine best logo URL (priority: og:image > twitter:image > schema logo > favicon)
    const logoUrl = ogImageUrl || twitterImageUrl || schemaLogo || faviconUrl;

    // Count images
    const images = await page.$$eval('img', imgs =>
      imgs.map(img => ({
        src: img.src,
        width: img.naturalWidth,
        height: img.naturalHeight
      }))
    );

    // Estimate total image size (rough calculation based on dimensions)
    const totalImageSize = images.reduce((acc, img) => {
      // Rough estimate: width * height * 3 bytes (RGB) * 0.1 (compression)
      return acc + (img.width * img.height * 0.3);
    }, 0);

    // Check for analytics
    const hasAnalytics = await page.evaluate(() => {
      const w = window as unknown as Record<string, unknown>;
      return !!(
        w.ga ||
        w.gtag ||
        w.dataLayer ||
        document.querySelector('script[src*="googletagmanager"]') ||
        document.querySelector('script[src*="google-analytics"]')
      );
    });

    // Check for forms
    const hasForms = await page.$('form') !== null;

    // Get content length
    const content = await page.content();
    const contentLength = content.length;

    // Broken links would require additional requests - skip for speed
    const brokenLinks: string[] = [];

    // Capture screenshots for visual analysis
    const screenshots: { desktop?: string; mobile?: string } = {};
    try {
      // Desktop screenshot (current viewport is 1280x800)
      const desktopScreenshot = await page.screenshot({
        encoding: 'base64',
        type: 'jpeg',
        quality: 70,
        fullPage: false, // Just above-the-fold for speed
      });
      screenshots.desktop = desktopScreenshot as string;

      // Mobile screenshot
      await page.setViewport({ width: 375, height: 812, isMobile: true });
      await page.evaluate(() => window.scrollTo(0, 0));
      await new Promise(r => setTimeout(r, 500)); // Brief wait for responsive styles
      const mobileScreenshot = await page.screenshot({
        encoding: 'base64',
        type: 'jpeg',
        quality: 70,
        fullPage: false,
      });
      screenshots.mobile = mobileScreenshot as string;
    } catch (screenshotError) {
      console.error('[Technical] Screenshot capture failed:', screenshotError);
      // Continue without screenshots
    }

    await browser.close();

    return {
      url,
      finalUrl,
      loadTime,
      statusCode,
      ssl,
      sslError,
      title,
      metaDescription,
      mobileViewport,
      favicon,
      faviconUrl,
      ogImageUrl,
      logoUrl,
      imageCount: images.length,
      totalImageSize: Math.round(totalImageSize),
      contentLength,
      hasAnalytics,
      hasForms,
      brokenLinks,
      screenshots,
    };
  } catch (error) {
    await browser.close();
    throw error;
  }
}
