import puppeteer from 'puppeteer';
import { ScrapedData } from '@/lib/types/audit';

// Rotate user agents to avoid detection
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
];

export async function scrapeContent(url: string): Promise<Partial<ScrapedData>> {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--ignore-certificate-errors',
      '--disable-blink-features=AutomationControlled', // Hide automation
      '--disable-infobars',
      '--window-size=1920,1080',
      '--disable-extensions',
    ]
  });

  const page = await browser.newPage();

  // Randomize user agent
  const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  await page.setUserAgent(userAgent);

  // Set realistic viewport
  await page.setViewport({ width: 1920, height: 1080 });

  // Hide webdriver property (bot detection evasion)
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    // @ts-ignore
    window.chrome = { runtime: {} };
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
  });

  // Set extra headers to look more like a real browser
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
  });

  try {
    // Try with networkidle2 first, fall back to domcontentloaded if blocked
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    } catch (navError) {
      // Retry with less strict wait condition
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      // Give page a moment to load more content
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Get headings
    const h1 = await page.$$eval('h1', els =>
      els.map(el => el.textContent?.trim() || '').filter(t => t.length > 0)
    );

    const h2 = await page.$$eval('h2', els =>
      els.map(el => el.textContent?.trim() || '').filter(t => t.length > 0)
    );

    // Get visible body text (first 5000 chars)
    const bodyText = await page.evaluate(() => {
      const body = document.body;
      const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
      let text = '';
      let node;
      while ((node = walker.nextNode()) && text.length < 5000) {
        const parent = node.parentElement;
        if (parent && !['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG'].includes(parent.tagName)) {
          const style = window.getComputedStyle(parent);
          if (style.display !== 'none' && style.visibility !== 'hidden') {
            const content = node.textContent?.trim();
            if (content && content.length > 1) {
              text += content + ' ';
            }
          }
        }
      }
      return text.trim();
    });

    // Get CTA buttons
    const ctaButtons = await page.$$eval(
      'button, a.btn, a.button, [class*="cta"], [class*="btn"], [role="button"]',
      els => els
        .map(el => el.textContent?.trim() || '')
        .filter(t => t.length > 0 && t.length < 50)
    );

    // Get nav links
    const navLinks = await page.$$eval(
      'nav a, header a, [class*="nav"] a, [class*="menu"] a',
      els => els
        .map(el => el.textContent?.trim() || '')
        .filter(t => t.length > 0 && t.length < 30)
    );

    // Get social links
    const socialLinks = await page.$$eval('a[href]', anchors =>
      anchors
        .map(a => a.href)
        .filter(href =>
          /facebook|twitter|linkedin|instagram|youtube|tiktok|x\.com/i.test(href)
        )
    );

    // Extract email addresses
    // 1. Get emails from mailto links (most reliable)
    const mailtoEmails = await page.$$eval('a[href^="mailto:"]', (links) =>
      links.map(a => {
        const href = a.getAttribute('href') || '';
        return href.replace('mailto:', '').split('?')[0].toLowerCase().trim();
      }).filter(email => email.length > 0)
    );

    // 2. Extract emails from visible text using regex
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const textEmails = (bodyText.match(emailRegex) || []).map(e => e.toLowerCase());

    // 3. Also check footer specifically (common location for contact emails)
    const footerEmails = await page.$$eval('footer, [class*="footer"]', (footers) => {
      const regex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const emails: string[] = [];
      footers.forEach(footer => {
        const text = footer.textContent || '';
        const matches = text.match(regex);
        if (matches) emails.push(...matches);
      });
      return emails.map(e => e.toLowerCase());
    });

    // Combine and deduplicate, filter out false positives
    const allEmails = [...mailtoEmails, ...textEmails, ...footerEmails];
    const filteredEmails = Array.from(new Set(allEmails))
      .filter(email => {
        // Filter out common false positives
        const invalidPatterns = [
          /\.(png|jpg|jpeg|gif|svg|webp|ico)$/i, // Image files
          /@example\.(com|org|net)$/i, // Example domains
          /@(sentry|wixpress|wordpress|cloudflare)\.io?$/i, // Service domains
          /noreply@/i, // No-reply addresses
          /test@/i, // Test addresses
          /@.*\.(local|test|invalid)$/i, // Invalid TLDs
        ];
        return !invalidPatterns.some(pattern => pattern.test(email));
      })
      .slice(0, 10); // Limit to 10 emails

    await browser.close();

    return {
      h1,
      h2: h2.slice(0, 10), // Limit to first 10
      bodyText,
      ctaButtons: Array.from(new Set(ctaButtons)).slice(0, 10),
      navLinks: Array.from(new Set(navLinks)).slice(0, 15),
      socialLinks: Array.from(new Set(socialLinks)),
      emails: filteredEmails,
    };
  } catch (error) {
    await browser.close();
    throw error;
  }
}
