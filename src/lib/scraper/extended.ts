import puppeteer from 'puppeteer';
import { ExtendedContent, SocialLink } from '@/lib/types/audit';

export async function scrapeExtendedContent(url: string): Promise<ExtendedContent> {
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

    // Main page analysis
    const mainPageData = await page.evaluate(() => {
      const bodyText = document.body.innerText.toLowerCase();
      const links = Array.from(document.querySelectorAll('a')).map(a => ({
        href: a.href.toLowerCase(),
        text: a.textContent?.toLowerCase() || ''
      }));

      // Trust & Credibility
      const testimonialSelectors = [
        '[class*="testimonial"]', '[class*="review"]', '[class*="quote"]',
        '[class*="customer-story"]', '[class*="success-story"]', 'blockquote'
      ];
      const testimonials = document.querySelectorAll(testimonialSelectors.join(', '));

      const hasTeamLink = links.some(l =>
        l.href.includes('/team') || l.href.includes('/about') ||
        l.text.includes('team') || l.text.includes('about us')
      );

      const hasCaseStudiesLink = links.some(l =>
        l.href.includes('/case-stud') || l.href.includes('/success-stor') ||
        l.text.includes('case stud') || l.text.includes('success stor')
      );

      const hasPrivacyLink = links.some(l =>
        l.href.includes('/privacy') || l.text.includes('privacy')
      );

      const hasTermsLink = links.some(l =>
        l.href.includes('/terms') || l.text.includes('terms of service') || l.text.includes('terms & conditions')
      );

      // Trust badges
      const trustBadgePatterns = [
        'ssl', 'secure', 'verified', 'certified', 'trusted', 'badge',
        'bbb', 'norton', 'mcafee', 'truste', 'gdpr', 'hipaa', 'soc2', 'iso'
      ];
      const trustBadgeImages = Array.from(document.querySelectorAll('img')).filter(img => {
        const alt = (img.alt || '').toLowerCase();
        const src = (img.src || '').toLowerCase();
        return trustBadgePatterns.some(p => alt.includes(p) || src.includes(p));
      });

      // Content Strategy
      const hasBlogLink = links.some(l =>
        l.href.includes('/blog') || l.href.includes('/articles') ||
        l.href.includes('/news') || l.href.includes('/insights') ||
        l.text === 'blog' || l.text === 'articles'
      );

      const hasResourcesLink = links.some(l =>
        l.href.includes('/resources') || l.href.includes('/guides') ||
        l.href.includes('/ebooks') || l.href.includes('/whitepapers') ||
        l.text.includes('resource') || l.text.includes('guide') || l.text.includes('download')
      );

      // Conversion & Engagement
      const forms = document.querySelectorAll('form');
      const leadCaptureTypes: string[] = [];

      forms.forEach(form => {
        const formText = form.textContent?.toLowerCase() || '';
        const formHtml = form.innerHTML.toLowerCase();

        if (formHtml.includes('newsletter') || formText.includes('subscribe') || formText.includes('sign up')) {
          if (!leadCaptureTypes.includes('newsletter')) leadCaptureTypes.push('newsletter');
        }
        if (formText.includes('contact') || formText.includes('get in touch')) {
          if (!leadCaptureTypes.includes('contact')) leadCaptureTypes.push('contact');
        }
        if (formText.includes('demo') || formText.includes('schedule') || formText.includes('book')) {
          if (!leadCaptureTypes.includes('demo request')) leadCaptureTypes.push('demo request');
        }
        if (formText.includes('quote') || formText.includes('pricing')) {
          if (!leadCaptureTypes.includes('quote request')) leadCaptureTypes.push('quote request');
        }
        if (formHtml.includes('type="email"') && leadCaptureTypes.length === 0) {
          leadCaptureTypes.push('email signup');
        }
      });

      const hasPricingLink = links.some(l =>
        l.href.includes('/pricing') || l.text.includes('pricing') || l.text.includes('plans')
      );

      const ctaElements = document.querySelectorAll(
        'button, a.btn, a.button, [class*="cta"], [class*="btn-primary"], [role="button"]'
      );
      const ctaTypes = Array.from(ctaElements)
        .map(el => el.textContent?.trim() || '')
        .filter(t => t.length > 0 && t.length < 50);

      // Social & Multimedia
      const videos = document.querySelectorAll('video, iframe[src*="youtube"], iframe[src*="vimeo"], iframe[src*="wistia"], [class*="video"]');
      const videoSources: string[] = [];
      videos.forEach(v => {
        if (v.tagName === 'VIDEO') videoSources.push('self-hosted');
        const src = v.getAttribute('src') || '';
        if (src.includes('youtube')) videoSources.push('YouTube');
        if (src.includes('vimeo')) videoSources.push('Vimeo');
        if (src.includes('wistia')) videoSources.push('Wistia');
      });

      const hasPodcastLink = links.some(l =>
        l.href.includes('podcast') || l.href.includes('spotify') ||
        l.href.includes('apple.com/podcast') || l.text.includes('podcast')
      );

      // Social profiles
      const socialPatterns = [
        { platform: 'Facebook', pattern: /facebook\.com/i },
        { platform: 'Twitter/X', pattern: /twitter\.com|x\.com/i },
        { platform: 'LinkedIn', pattern: /linkedin\.com/i },
        { platform: 'Instagram', pattern: /instagram\.com/i },
        { platform: 'YouTube', pattern: /youtube\.com/i },
        { platform: 'TikTok', pattern: /tiktok\.com/i },
      ];
      const socialProfiles: { platform: string; url: string }[] = [];
      links.forEach(link => {
        socialPatterns.forEach(({ platform, pattern }) => {
          if (pattern.test(link.href) && !socialProfiles.some(s => s.platform === platform)) {
            socialProfiles.push({ platform, url: link.href });
          }
        });
      });

      // Business Overview
      const hasAboutLink = links.some(l =>
        l.href.includes('/about') || l.text === 'about' || l.text === 'about us'
      );

      const hasContactLink = links.some(l =>
        l.href.includes('/contact') || l.text.includes('contact')
      );

      const missionKeywords = ['mission', 'vision', 'values', 'our story', 'who we are', 'what we do'];
      const hasMissionStatement = missionKeywords.some(k => bodyText.includes(k));

      // Target audience clarity (looks for specific audience mentions)
      const audienceKeywords = [
        'for businesses', 'for teams', 'for developers', 'for marketers',
        'for startups', 'for enterprise', 'for small business', 'for agencies',
        'designed for', 'built for', 'made for', 'perfect for'
      ];
      const targetAudienceClarity = audienceKeywords.some(k => bodyText.includes(k));

      return {
        // Trust & Credibility
        testimonialCount: testimonials.length,
        hasTeamPage: hasTeamLink,
        hasCaseStudies: hasCaseStudiesLink,
        hasPrivacyPolicy: hasPrivacyLink,
        hasTermsOfService: hasTermsLink,
        trustBadgeCount: trustBadgeImages.length,

        // Content Strategy
        hasBlog: hasBlogLink,
        hasResourcesSection: hasResourcesLink,

        // Conversion & Engagement
        leadCaptureTypes,
        hasEmailSignup: leadCaptureTypes.includes('newsletter') || leadCaptureTypes.includes('email signup'),
        hasPricingPage: hasPricingLink,
        ctaCount: ctaElements.length,
        ctaTypes: Array.from(new Set(ctaTypes)).slice(0, 10),

        // Social & Multimedia
        videoCount: videos.length,
        videoSources: Array.from(new Set(videoSources)),
        hasPodcast: hasPodcastLink,
        socialProfiles,

        // Business Overview
        hasAboutPage: hasAboutLink,
        hasContactPage: hasContactLink,
        hasMissionStatement,
        targetAudienceClarity,
      };
    });

    // Check pricing page for transparency
    let pricingTransparency: 'visible' | 'hidden' | 'contact-sales' | 'none' = 'none';
    try {
      const pricingPaths = ['/pricing', '/plans', '/packages'];
      for (const path of pricingPaths) {
        try {
          const response = await page.goto(`${domain}${path}`, { waitUntil: 'networkidle2', timeout: 15000 });
          if (response && response.ok()) {
            const pricingCheck = await page.evaluate(() => {
              const bodyText = document.body.innerText.toLowerCase();
              const hasPriceNumbers = /\$\d+|\d+\/mo|\d+\/month|\d+\/year/i.test(bodyText);
              const hasContactSales = bodyText.includes('contact sales') || bodyText.includes('contact us') ||
                bodyText.includes('get a quote') || bodyText.includes('request pricing');
              const hasHiddenPricing = bodyText.includes('custom pricing') || bodyText.includes('pricing on request');

              if (hasPriceNumbers) return 'visible';
              if (hasContactSales || hasHiddenPricing) return 'contact-sales';
              return 'hidden';
            });
            pricingTransparency = pricingCheck as 'visible' | 'hidden' | 'contact-sales';
            break;
          }
        } catch {
          continue;
        }
      }
    } catch {
      // Pricing page doesn't exist
    }

    // Check blog for post count
    let blogPostCount = 0;
    if (mainPageData.hasBlog) {
      try {
        const blogPaths = ['/blog', '/articles', '/news', '/insights'];
        for (const path of blogPaths) {
          try {
            await page.goto(`${domain}${path}`, { waitUntil: 'networkidle2', timeout: 15000 });
            blogPostCount = await page.$$eval(
              'article, .post, .blog-post, [class*="post-"], [class*="article-"], .entry, .blog-item',
              els => els.length
            );
            if (blogPostCount > 0) break;
          } catch {
            continue;
          }
        }
      } catch {
        // Couldn't access blog
      }
    }

    // Detect resource types if resources section exists
    let resourceTypes: string[] = [];
    if (mainPageData.hasResourcesSection) {
      try {
        const resourcePaths = ['/resources', '/library', '/downloads'];
        for (const path of resourcePaths) {
          try {
            await page.goto(`${domain}${path}`, { waitUntil: 'networkidle2', timeout: 15000 });
            resourceTypes = await page.evaluate(() => {
              const types: string[] = [];
              const text = document.body.innerText.toLowerCase();
              if (text.includes('guide')) types.push('guides');
              if (text.includes('ebook') || text.includes('e-book')) types.push('ebooks');
              if (text.includes('whitepaper') || text.includes('white paper')) types.push('whitepapers');
              if (text.includes('template')) types.push('templates');
              if (text.includes('checklist')) types.push('checklists');
              if (text.includes('webinar')) types.push('webinars');
              if (text.includes('case study') || text.includes('case-study')) types.push('case studies');
              return types;
            });
            if (resourceTypes.length > 0) break;
          } catch {
            continue;
          }
        }
      } catch {
        // Couldn't access resources
      }
    }

    // Detect trust badge types
    const trustBadgeTypes: string[] = [];
    if (mainPageData.trustBadgeCount > 0) {
      // Go back to homepage to check badge types
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      const badges = await page.evaluate(() => {
        const badgeTypes: string[] = [];
        const images = Array.from(document.querySelectorAll('img'));
        images.forEach(img => {
          const alt = (img.alt || '').toLowerCase();
          const src = (img.src || '').toLowerCase();
          const combined = alt + ' ' + src;
          if (combined.includes('bbb')) badgeTypes.push('BBB');
          if (combined.includes('norton')) badgeTypes.push('Norton');
          if (combined.includes('mcafee')) badgeTypes.push('McAfee');
          if (combined.includes('ssl') || combined.includes('secure')) badgeTypes.push('SSL Secure');
          if (combined.includes('gdpr')) badgeTypes.push('GDPR');
          if (combined.includes('hipaa')) badgeTypes.push('HIPAA');
          if (combined.includes('soc2') || combined.includes('soc 2')) badgeTypes.push('SOC 2');
          if (combined.includes('iso')) badgeTypes.push('ISO');
        });
        return Array.from(new Set(badgeTypes));
      });
      trustBadgeTypes.push(...badges);
    }

    await browser.close();

    return {
      // Trust & Credibility
      hasTestimonials: mainPageData.testimonialCount > 0,
      testimonialCount: mainPageData.testimonialCount,
      hasTeamPage: mainPageData.hasTeamPage,
      hasCaseStudies: mainPageData.hasCaseStudies,
      hasPrivacyPolicy: mainPageData.hasPrivacyPolicy,
      hasTermsOfService: mainPageData.hasTermsOfService,
      hasTrustBadges: mainPageData.trustBadgeCount > 0,
      trustBadgeTypes,

      // Content Strategy
      hasBlog: mainPageData.hasBlog,
      blogPostCount,
      hasResourcesSection: mainPageData.hasResourcesSection,
      resourceTypes,

      // Conversion & Engagement
      hasLeadCapture: mainPageData.leadCaptureTypes.length > 0,
      leadCaptureTypes: mainPageData.leadCaptureTypes,
      hasEmailSignup: mainPageData.hasEmailSignup,
      hasPricingPage: mainPageData.hasPricingPage,
      pricingTransparency,
      ctaCount: mainPageData.ctaCount,
      ctaTypes: mainPageData.ctaTypes,

      // Social & Multimedia
      hasVideoContent: mainPageData.videoCount > 0,
      videoSources: mainPageData.videoSources,
      videoCount: mainPageData.videoCount,
      hasPodcast: mainPageData.hasPodcast,
      socialProfiles: mainPageData.socialProfiles as SocialLink[],

      // Business Overview
      hasAboutPage: mainPageData.hasAboutPage,
      hasContactPage: mainPageData.hasContactPage,
      hasMissionStatement: mainPageData.hasMissionStatement,
      competitorsMentioned: [], // Would need NLP to detect this reliably
      targetAudienceClarity: mainPageData.targetAudienceClarity,
    };

  } catch (error) {
    await browser.close();
    throw error;
  }
}
