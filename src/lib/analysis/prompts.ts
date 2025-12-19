import { ScrapedData, CategoryScore, TrafficSignals } from '@/lib/types/audit';

// Helper to get scope context for prompts
function getScopeContext(data: ScrapedData): string {
  const pageCount = data.pages?.length || 1;
  if (pageCount === 1) {
    return `IMPORTANT: This analysis is based on a SINGLE PAGE (the homepage/entry page).
When reporting findings, say "this page" not "the site" - you cannot make claims about the entire site from one page.
For example, say "No forms found on this page" not "No forms on the site".`;
  }
  return `This analysis is based on ${pageCount} pages across the site, giving a broader view of the overall website.`;
}

export function getTechnicalPrompt(data: ScrapedData): string {
  const scopeContext = getScopeContext(data);
  return `You are analyzing a website's technical foundation for WebCore Audit.

## Scope
${scopeContext}

## Website Data
URL: ${data.url}
Final URL: ${data.finalUrl}
Load Time: ${data.loadTime}ms
Status Code: ${data.statusCode}
SSL/HTTPS: ${data.ssl}
Mobile Viewport: ${data.mobileViewport}
Has Favicon: ${data.favicon}
Image Count: ${data.imageCount}
Has Analytics: ${data.hasAnalytics}
Has Forms: ${data.hasForms}
Content Size: ${Math.round(data.contentLength / 1024)}KB
Meta Title: ${data.title || 'MISSING'}
Meta Description: ${data.metaDescription || 'MISSING'}

## Scoring Guidelines
- Load time under 3s = good, 3-5s = okay, over 5s = poor
- SSL is required (critical if missing)
- Mobile viewport is required (critical if missing)
- Meta title should be 50-60 characters
- Meta description should be 150-160 characters
- Analytics tracking is expected for business sites
- Favicon helps with branding and bookmarks

## Task
Analyze this data and return a JSON object with:
- score: number 0-100
- issues: array of {severity: 'critical'|'warning'|'info', title: string, description: string, impact: string}
- passing: array of {title: string, description: string, value: string} - things the site does WELL
- recommendations: array of strings (actionable fixes, be specific)

Include ALL elements you check. For passing items, include things like:
- Fast load time (if under 3s)
- SSL enabled
- Mobile viewport configured
- Meta title present and proper length
- Meta description present and proper length
- Favicon present
- Analytics tracking detected
- Proper HTTP status code

Be comprehensive. List every element checked as either an issue OR a passing item.
Return ONLY valid JSON, no markdown formatting or other text.`;
}

export function getBrandMessagingPrompt(data: ScrapedData): string {
  const scopeContext = getScopeContext(data);
  return `You are analyzing a website's brand and messaging for WebCore Audit.

## Scope
${scopeContext}

## Website Data
URL: ${data.url}
Page Title: ${data.title || 'None'}
Meta Description: ${data.metaDescription || 'None'}

## Headlines Found
H1: ${data.h1?.join(' | ') || 'None found'}
H2: ${data.h2?.slice(0, 5).join(' | ') || 'None found'}

## Homepage Copy (first 3000 chars)
${data.bodyText?.slice(0, 3000) || 'No text extracted'}

## CTAs Found
${data.ctaButtons?.join(', ') || 'None found'}

## Navigation Items
${data.navLinks?.join(', ') || 'None found'}

## Scoring Guidelines
- Clear value proposition in H1 or first paragraph = critical
- Should answer: What do they do? For whom? Why does it matter?
- CTAs should be clear, specific, and action-oriented
- Avoid generic copy like "Welcome" or "We are the best"
- Navigation should be intuitive and cover key pages
- Messaging should differentiate from competitors

## Task
Analyze the messaging clarity, value proposition, and brand consistency. Return a JSON object with:
- score: number 0-100
- issues: array of {severity: 'critical'|'warning'|'info', title: string, description: string, impact: string}
- passing: array of {title: string, description: string, value: string} - things the site does WELL
- recommendations: array of strings (specific copy improvements, reference actual text from the site)

Include ALL elements you check. For passing items, include things like:
- Clear value proposition
- Strong H1 headline
- Specific CTAs (not generic)
- Good navigation structure
- Consistent brand voice
- Clear target audience messaging
- Differentiated positioning
- Compelling meta description

Be comprehensive. List every element checked as either an issue OR a passing item.
Return ONLY valid JSON, no markdown formatting or other text.`;
}

export function getUserExperiencePrompt(data: ScrapedData): string {
  const scopeContext = getScopeContext(data);
  const design = data.designQuality;
  const layout = design?.layoutAnalysis;
  const animation = design?.animationAnalysis;
  const mobile = design?.mobileAnalysis;
  const colors = design?.colorAnalysis;

  return `You are analyzing a website's user experience for WebCore Audit.

## Scope
${scopeContext}

## Website Data
URL: ${data.url}
Mobile Viewport: ${data.mobileViewport}
Has Forms: ${data.hasForms}
Load Time: ${data.loadTime}ms

## Navigation
${data.navLinks?.join(', ') || 'None found'}

## CTAs Found
${data.ctaButtons?.join(', ') || 'None found'}

## Content Structure
H1 Count: ${data.h1?.length || 0}
H2 Count: ${data.h2?.length || 0}
Image Count: ${data.imageCount}

## Social Links
${data.socialLinks?.join(', ') || 'None found'}

## Design Quality Analysis
### Color & Contrast
Primary Colors: ${colors?.primaryColors?.join(', ') || 'Not analyzed'}
Background: ${colors?.backgroundColor || 'Unknown'}
Text Color: ${colors?.textColor || 'Unknown'}
Contrast Ratio: ${colors?.contrastRatio || 'Unknown'}
WCAG AA Compliant: ${colors?.passesWCAG_AA ?? 'Unknown'}
WCAG AAA Compliant: ${colors?.passesWCAG_AAA ?? 'Unknown'}
Color Count: ${colors?.colorCount || 'Unknown'} colors used
Consistent Palette: ${colors?.hasConsistentPalette ?? 'Unknown'}
Color Issues: ${colors?.issues?.join('; ') || 'None'}

### Animations & Interactions
Has Animations: ${animation?.hasAnimations ?? 'Unknown'}
CSS Animations: ${animation?.hasCSSAnimations ?? false}
CSS Transitions: ${animation?.hasCSSTransitions ?? false}
Animation Libraries: ${animation?.animationLibraries?.join(', ') || 'None'}
3D/WebGL Libraries: ${animation?.threeDLibraries?.join(', ') || 'None'}
Scroll Animations: ${animation?.hasScrollAnimations ?? false}
Hover Effects: ${animation?.hasHoverEffects ?? false}
Has Canvas: ${animation?.hasCanvas ?? false}
Has WebGL: ${animation?.hasWebGL ?? false}
Has SVG Animations: ${animation?.hasSVGAnimations ?? false}
Has Parallax Effects: ${animation?.hasParallax ?? false}
Has Page Transitions: ${animation?.hasPageTransitions ?? false}
Creative Quality Score: ${animation?.creativeScore ?? 0}/100
Is High-Craft Creative: ${animation?.isHighCraft ?? false}

### Layout & Visual Flow
Section Count: ${layout?.sectionCount || 'Unknown'}
Consistent Spacing: ${layout?.hasConsistentSpacing ?? 'Unknown'}
Average Section Padding: ${layout?.averageSectionPadding ? layout.averageSectionPadding + 'px' : 'Unknown'}
Visual Hierarchy: ${layout?.hasVisualHierarchy ?? 'Unknown'}
Uses Grid System: ${layout?.usesGridSystem ?? false}
Uses Flexbox: ${layout?.usesFlexbox ?? false}
Layout Patterns Found: ${layout?.layoutPatterns?.join(', ') || 'None detected'}
Layout Issues: ${layout?.issues?.join('; ') || 'None'}

### Mobile Experience
Has Viewport Meta: ${mobile?.hasViewportMeta ?? 'Unknown'}
Has Mobile Menu: ${mobile?.hasMobileMenu ?? 'Unknown'}
Has Media Queries: ${mobile?.hasMediaQueries ?? 'Unknown'}
Touch Target Issues: ${mobile?.touchTargetIssues ?? 0} elements with small targets
Base Font Size: ${mobile?.fontSizeBase ? mobile.fontSizeBase + 'px' : 'Unknown'}
Readable Font Size: ${mobile?.isReadableFontSize ?? 'Unknown'}
Has Horizontal Scroll: ${mobile?.hasHorizontalScroll ?? false}
Has Sticky Header: ${mobile?.hasStickyHeader ?? false}
Mobile Score: ${mobile?.mobileScore ?? 'Unknown'}/100
Mobile Issues: ${mobile?.issues?.join('; ') || 'None'}

## Scoring Guidelines
CRITICAL:
- Mobile viewport not configured
- Horizontal scroll on mobile
- Very low contrast ratio (<3:1)
- No CSS transitions/animations (feels dated)

WARNING:
- Small touch targets (<44px)
- Font size below 16px on mobile
- Inconsistent section spacing
- Too many colors (>15)
- No scroll animations (missed opportunity)
- Missing visual hierarchy

POSITIVE (add points for these):
- Mobile responsive with proper viewport
- Good contrast ratio (4.5:1+ for AA)
- Smooth animations and transitions
- Consistent spacing throughout
- Modern layout patterns (Hero, Features grid, etc.)
- Sticky header for navigation
- Mobile menu present
- Hover effects for interactivity

## HIGH-CRAFT CREATIVE SITES (IMPORTANT!)
If Creative Quality Score is 50+ OR Is High-Craft Creative is true, this indicates a sophisticated, professionally-designed site with premium animation/interaction work. For these sites:
- GSAP, Framer Motion, Lottie = professional-grade animation tooling (+10-15 points)
- WebGL/Three.js/Canvas = immersive 3D experiences (+10-15 points)
- Scroll animations + parallax = engaging scroll experiences (+5-10 points)
- Page transitions (Barba.js, Swup) = seamless navigation (+5-8 points)
- Multiple animation libraries = comprehensive motion design approach

For high-craft creative sites, DO NOT penalize:
- Unconventional navigation (creative sites often use unique patterns)
- Heavy animation usage (it's intentional, not bloat)
- Non-standard layouts (creative expression)

Instead, recognize the craft and BOOST the UX score significantly (80-95 range) when:
- Professional animation libraries are detected
- WebGL/3D elements present
- Scroll-triggered animations implemented
- Page transitions are smooth
- The combination suggests intentional, high-quality motion design

## Task
Analyze the user experience factors with emphasis on visual design, mobile experience, and modern web practices. Return a JSON object with:
- score: number 0-100
- issues: array of {severity: 'critical'|'warning'|'info', title: string, description: string, impact: string}
- passing: array of {title: string, description: string, value: string} - things the site does WELL
- recommendations: array of strings (specific UX improvements)

Include design quality elements: animations, color contrast, mobile experience, layout consistency.
Be comprehensive. List every element checked as either an issue OR a passing item.
Return ONLY valid JSON, no markdown formatting or other text.`;
}

export function getSecurityPrompt(data: ScrapedData): string {
  const scopeContext = getScopeContext(data);
  return `You are analyzing a website's security basics for WebCore Audit.

## Scope
${scopeContext}

## Website Data
URL: ${data.url}
Final URL: ${data.finalUrl}
SSL/HTTPS: ${data.ssl}
SSL Certificate Error: ${data.sslError || 'None'}
Has Forms: ${data.hasForms}
Status Code: ${data.statusCode}

## Scoring Guidelines
- SSL/HTTPS is mandatory (critical if missing)
- SSL certificate errors (expired, invalid) are CRITICAL security issues - score should be very low
- Forms without HTTPS are a major security risk
- Redirects from HTTP to HTTPS should be in place
- Mixed content warnings hurt trust

## Task
Analyze the basic security posture. Return a JSON object with:
- score: number 0-100
- issues: array of {severity: 'critical'|'warning'|'info', title: string, description: string, impact: string}
- passing: array of {title: string, description: string, value: string} - things the site does WELL
- recommendations: array of strings (specific security improvements)

Include ALL elements you check. For passing items, include things like:
- SSL/HTTPS enabled
- Proper redirects from HTTP
- Secure form handling
- No mixed content
- Valid SSL certificate

Note: This is a basic surface-level security check, not a penetration test.
Be comprehensive. List every element checked as either an issue OR a passing item.
Return ONLY valid JSON, no markdown formatting or other text.`;
}

export function getExecutiveSummaryPrompt(
  data: ScrapedData,
  categoryScores: CategoryScore[]
): string {
  const overallScore = Math.round(
    categoryScores.reduce((acc, c) => acc + c.score * c.weight, 0) /
    categoryScores.reduce((acc, c) => acc + c.weight, 0)
  );

  const criticalIssues = categoryScores
    .flatMap(c => c.issues)
    .filter(i => i.severity === 'critical')
    .slice(0, 3);

  const topStrength = categoryScores.reduce((best, c) =>
    c.score > best.score ? c : best
  );

  return `Write a 2-3 sentence executive summary for a website audit report.

Website: ${data.url}
Overall Score: ${overallScore}/100

Category Scores:
${categoryScores.map(c => `- ${c.name}: ${c.score}/100`).join('\n')}

Top Strength: ${topStrength.name} (${topStrength.score}/100)

Critical Issues:
${criticalIssues.length > 0
    ? criticalIssues.map(i => `- ${i.title}: ${i.description}`).join('\n')
    : '- No critical issues found'}

Write a professional, direct summary that:
1. States the overall assessment (good/needs work/critical issues)
2. Highlights the biggest strength
3. Calls out the most important issue to fix

Be direct and specific. No fluff or generic statements.
Return only the summary text, no JSON or formatting.`;
}

// ============================================
// NEW CATEGORY PROMPTS (6 new categories)
// ============================================

export function getBusinessOverviewPrompt(data: ScrapedData): string {
  const ext = data.extendedContent;
  const scopeContext = getScopeContext(data);
  return `You are analyzing a website's business overview for WebCore Audit.

## Scope
${scopeContext}

## Website Data
URL: ${data.url}
Page Title: ${data.title || 'None'}

## Business Presence
Has About Page: ${ext?.hasAboutPage ?? 'Unknown'}
Has Contact Page: ${ext?.hasContactPage ?? 'Unknown'}
Has Mission Statement: ${ext?.hasMissionStatement ?? 'Unknown'}
Target Audience Clarity: ${ext?.targetAudienceClarity ?? 'Unknown'}

## Homepage Copy (first 2000 chars)
${data.bodyText?.slice(0, 2000) || 'No text extracted'}

## Headlines
H1: ${data.h1?.join(' | ') || 'None'}
H2: ${data.h2?.slice(0, 5).join(' | ') || 'None'}

## Navigation
${data.navLinks?.join(', ') || 'None found'}

## Scoring Guidelines
CRITICAL:
- No clear indication of what the business does
- No way to understand who they serve
- Missing contact information

WARNING:
- Vague value proposition
- No differentiation from competitors
- Missing about page
- Unclear target market

POSITIVE:
- Clear statement of what they do
- Obvious target audience
- Visible contact information
- Professional about page
- Clear business model

## Task
Analyze the business clarity and positioning. Return a JSON object with:
- score: number 0-100
- issues: array of {severity: 'critical'|'warning'|'info', title: string, description: string, impact: string}
- passing: array of {title: string, description: string, value: string}
- recommendations: array of strings

Be comprehensive. Check: value proposition clarity, target market definition, business model transparency, contact accessibility, about page quality.
Return ONLY valid JSON, no markdown formatting.`;
}

export function getTrafficReadinessPrompt(signals: TrafficSignals | undefined, data?: ScrapedData): string {
  if (!signals) {
    return `You are analyzing a website's traffic readiness but no data was collected.
Return a JSON object with score: 50, a warning issue about incomplete analysis, empty passing array, and recommendation to retry.
Return ONLY valid JSON.`;
  }

  const urlAnalysis = data?.designQuality?.urlAnalysis;

  return `You are analyzing a website's traffic readiness for WebCore Audit.

## Analytics & Tracking
Google Analytics: ${signals.hasGoogleAnalytics ? 'Installed' : 'NOT DETECTED'}
Google Tag Manager: ${signals.hasGTM ? 'Installed' : 'NOT DETECTED'}
Other Analytics: ${signals.hasOtherAnalytics.length > 0 ? signals.hasOtherAnalytics.join(', ') : 'None'}
Marketing Pixels: ${signals.hasPixels.length > 0 ? signals.hasPixels.join(', ') : 'None'}

## SEO Infrastructure
Sitemap.xml: ${signals.hasSitemap ? `Yes (${signals.sitemapPageCount || 'unknown'} pages)` : 'NOT FOUND'}
Robots.txt: ${signals.hasRobotsTxt ? (signals.robotsAllowsCrawling ? 'Yes, allows crawling' : 'Yes, but blocks crawling') : 'NOT FOUND'}
Structured Data: ${signals.hasStructuredData ? signals.structuredDataTypes.join(', ') : 'None'}
Canonical Tags: ${signals.canonicalTag ? 'Yes' : 'No'}

## Content Volume
Blog/Articles Section: ${signals.blogExists ? `Yes (~${signals.estimatedBlogPosts} posts visible)` : 'No'}
Resources Section: ${signals.hasResourcesSection ? 'Yes' : 'No'}

## Social Presence
${signals.socialLinks.length > 0 ? signals.socialLinks.map(s => `- ${s.platform}`).join('\n') : '- No social links found'}

## On-Page SEO
Meta Title: ${signals.metaTitle ? `Yes (${signals.metaTitleLength} chars)` : 'MISSING'}
Meta Description: ${signals.metaDescription ? `Yes (${signals.metaDescriptionLength} chars)` : 'MISSING'}
H1 Tags: ${signals.h1Count}
Internal Links: ${signals.internalLinkCount}
External Links: ${signals.externalLinkCount}

## URL Structure Best Practices
${urlAnalysis ? `
Is Clean URL: ${urlAnalysis.isCleanUrl} (no query params, no file extensions)
Has Proper Hierarchy: ${urlAnalysis.hasProperHierarchy} (not too deep)
Uses Hyphens: ${urlAnalysis.usesHyphens} (hyphens preferred over underscores)
Is Lowercase: ${urlAnalysis.isLowercase} (lowercase URLs are best practice)
Has File Extension: ${urlAnalysis.hasFileExtension} (should be false for modern sites)
URL Length: ${urlAnalysis.urlLength} characters
URL Issues: ${urlAnalysis.issues?.join('; ') || 'None'}
` : 'URL analysis not available'}

## Scoring Guidelines
CRITICAL (Major impact):
- No analytics at all = Can't measure anything
- No sitemap = Hurts discoverability
- Missing meta title/description = Poor SEO
- URLs with file extensions (.php, .html) = Outdated/harder to rank

WARNING (Moderate impact):
- No blog/content = Limited organic traffic potential
- No social presence = Limited referral potential
- No structured data = Missing rich snippets
- Wrong title/description length
- URLs with query parameters = Duplicate content risk
- URLs with underscores = Harder to read
- Uppercase characters in URLs = Can cause issues
- URLs too long (>75 chars) = Truncated in search results

POSITIVE:
- Multiple analytics tools = Data-driven
- Active blog = Content marketing
- Social links present = Multi-channel
- Structured data = SEO sophistication
- Sitemap with many pages = Crawlable
- Clean URLs (no params, no extensions) = SEO friendly
- Short, readable URLs with hyphens = Best practice
- Lowercase URLs = Properly formatted

## Task
Analyze traffic readiness infrastructure. Return a JSON object with:
- score: number 0-100
- issues: array of {severity: 'critical'|'warning'|'info', title: string, description: string, impact: string}
- passing: array of {title: string, description: string, value: string}
- recommendations: array of strings

Focus on what they need to DO to be ready for traffic.
Return ONLY valid JSON, no markdown formatting.`;
}

export function getContentStrategyPrompt(data: ScrapedData): string {
  const ext = data.extendedContent;
  const scopeContext = getScopeContext(data);
  return `You are analyzing a website's content strategy for WebCore Audit.

## Scope
${scopeContext}

## Content Presence
Has Blog: ${ext?.hasBlog ?? 'Unknown'}
Blog Post Count: ${ext?.blogPostCount ?? 0}
Has Resources Section: ${ext?.hasResourcesSection ?? 'Unknown'}
Resource Types: ${ext?.resourceTypes?.join(', ') || 'None detected'}

## SEO Elements
Meta Title: ${data.title || 'MISSING'}
Meta Description: ${data.metaDescription || 'MISSING'}
H1 Headlines: ${data.h1?.join(' | ') || 'None'}
H2 Headlines: ${data.h2?.slice(0, 5).join(' | ') || 'None'}

## Homepage Content (first 2000 chars)
${data.bodyText?.slice(0, 2000) || 'No text extracted'}

## Scoring Guidelines
CRITICAL:
- No content strategy visible (no blog, no resources)
- Thin content (very little text)
- Missing SEO fundamentals

WARNING:
- Blog exists but low post count (<5)
- No downloadable resources
- Generic/unfocused content
- Missing keyword targeting signals

POSITIVE:
- Active blog with regular posts
- Multiple resource types (guides, ebooks, etc.)
- SEO-optimized headlines
- Content addressing pain points
- Clear content hierarchy

## Task
Analyze content strategy maturity. Return a JSON object with:
- score: number 0-100
- issues: array of {severity: 'critical'|'warning'|'info', title: string, description: string, impact: string}
- passing: array of {title: string, description: string, value: string}
- recommendations: array of strings

Check: blog presence, content volume, resource variety, SEO optimization, content quality signals.
Return ONLY valid JSON, no markdown formatting.`;
}

export function getConversionEngagementPrompt(data: ScrapedData): string {
  const ext = data.extendedContent;
  const scopeContext = getScopeContext(data);
  return `You are analyzing a website's conversion & engagement for WebCore Audit.

## Scope
${scopeContext}

## Lead Capture
Has Lead Capture: ${ext?.hasLeadCapture ?? 'Unknown'}
Lead Capture Types: ${ext?.leadCaptureTypes?.join(', ') || 'None'}
Has Email Signup: ${ext?.hasEmailSignup ?? 'Unknown'}
Has Pricing Page: ${ext?.hasPricingPage ?? 'Unknown'}
Pricing Transparency: ${ext?.pricingTransparency ?? 'Unknown'}

## CTAs
CTA Count: ${ext?.ctaCount ?? data.ctaButtons?.length ?? 0}
CTA Types: ${ext?.ctaTypes?.join(', ') || data.ctaButtons?.join(', ') || 'None'}

## Forms
Has Forms: ${data.hasForms}

## Navigation
${data.navLinks?.join(', ') || 'None'}

## Scoring Guidelines
CRITICAL:
- No clear CTA on homepage
- No way to contact or engage
- No conversion paths

WARNING:
- Generic CTAs ("Submit", "Click here")
- Hidden or unclear pricing
- No lead capture mechanism
- Confusing navigation to conversion points

POSITIVE:
- Clear, specific CTAs
- Multiple conversion paths
- Visible pricing (builds trust)
- Newsletter/email signup
- Easy contact options
- Demo/trial request option

## Task
Analyze conversion optimization. Return a JSON object with:
- score: number 0-100
- issues: array of {severity: 'critical'|'warning'|'info', title: string, description: string, impact: string}
- passing: array of {title: string, description: string, value: string}
- recommendations: array of strings

Check: CTA clarity, conversion paths, lead capture, pricing transparency, engagement options.
Return ONLY valid JSON, no markdown formatting.`;
}

export function getSocialMultimediaPrompt(data: ScrapedData): string {
  const ext = data.extendedContent;
  const traffic = data.trafficSignals;
  const scopeContext = getScopeContext(data);

  return `You are analyzing a website's social & multimedia presence for WebCore Audit.

## Scope
${scopeContext}

## Social Profiles
${ext?.socialProfiles?.map(s => `- ${s.platform}: ${s.url}`).join('\n') || traffic?.socialLinks?.map(s => `- ${s.platform}`).join('\n') || 'No social links found'}

## Video Content
Has Video: ${ext?.hasVideoContent ?? 'Unknown'}
Video Count: ${ext?.videoCount ?? 0}
Video Sources: ${ext?.videoSources?.join(', ') || 'None'}

## Other Media
Has Podcast: ${ext?.hasPodcast ?? 'Unknown'}
Image Count: ${data.imageCount}

## Scoring Guidelines
CRITICAL:
- No social presence at all (suspicious for modern business)

WARNING:
- Social links but profiles seem inactive
- No video content (misses engagement opportunities)
- Broken or outdated social links

POSITIVE:
- Active social profiles on relevant platforms
- Video content embedded (high engagement)
- Multiple social channels
- Podcast/audio content
- Media optimized for web

## Task
Analyze social and multimedia strategy. Return a JSON object with:
- score: number 0-100
- issues: array of {severity: 'critical'|'warning'|'info', title: string, description: string, impact: string}
- passing: array of {title: string, description: string, value: string}
- recommendations: array of strings

Check: social profile presence, platform relevance, video content, multimedia engagement.
Return ONLY valid JSON, no markdown formatting.`;
}

export function getTrustCredibilityPrompt(data: ScrapedData): string {
  const ext = data.extendedContent;
  const design = data.designQuality;
  const scopeContext = getScopeContext(data);
  const currentYear = new Date().getFullYear();

  return `You are analyzing a website's trust & credibility for WebCore Audit.

## Scope
${scopeContext}

## Trust Elements
Has Testimonials: ${ext?.hasTestimonials ?? 'Unknown'}
Testimonial Count: ${ext?.testimonialCount ?? 0}
Has Case Studies: ${ext?.hasCaseStudies ?? 'Unknown'}
Has Team Page: ${ext?.hasTeamPage ?? 'Unknown'}

## Legal & Compliance
Has Privacy Policy: ${ext?.hasPrivacyPolicy ?? 'Unknown'}
Has Terms of Service: ${ext?.hasTermsOfService ?? 'Unknown'}
SSL/HTTPS: ${data.ssl}

## Trust Badges
Has Trust Badges: ${ext?.hasTrustBadges ?? 'Unknown'}
Badge Types: ${ext?.trustBadgeTypes?.join(', ') || 'None'}

## Contact
Has Contact Page: ${ext?.hasContactPage ?? 'Unknown'}
Has About Page: ${ext?.hasAboutPage ?? 'Unknown'}

## Website Freshness & Maintenance
Has Footer: ${design?.hasFooter ?? 'Unknown'}
Footer Copyright Year: ${design?.footerCopyrightYear ?? 'Not found'}
Current Year: ${currentYear}
Is Current Year: ${design?.isCurrentYear ?? 'Unknown'}
Years Outdated: ${design?.yearsOutdated ?? 0} years old

## Scoring Guidelines
CRITICAL:
- No SSL/HTTPS = Major trust issue
- No privacy policy = Legal risk
- No contact information = Suspicious
- Copyright year 3+ years outdated = Site appears abandoned

WARNING:
- No testimonials or social proof
- No team/about information
- Missing terms of service
- No trust badges
- Copyright year 1-2 years outdated = Site may be unmaintained
- No footer copyright = Missing professionalism signal

POSITIVE:
- Customer testimonials visible
- Case studies showing results
- Team page with real people
- Trust badges (security, certifications)
- Clear privacy policy
- Professional about page
- Multiple contact options
- Current copyright year (${currentYear}) = Site is maintained
- Recent update indicators

## Task
Analyze trust and credibility signals. Return a JSON object with:
- score: number 0-100
- issues: array of {severity: 'critical'|'warning'|'info', title: string, description: string, impact: string}
- passing: array of {title: string, description: string, value: string}
- recommendations: array of strings

Check: social proof, legal compliance, transparency, security indicators, professional presence, AND website freshness (copyright year).
If copyright year is outdated, this is a SIGNIFICANT trust issue - visitors assume the site is abandoned or unmaintained.
Return ONLY valid JSON, no markdown formatting.`;
}

export function getWebsiteBriefPrompt(data: ScrapedData): string {
  const animation = data.designQuality?.animationAnalysis;
  const isHighCraft = animation?.isHighCraft ?? false;
  const creativeScore = animation?.creativeScore ?? 0;

  return `You are analyzing a website to create a brief summary for WebCore Audit.

## Website Data
URL: ${data.url}
Title: ${data.title || 'Unknown'}
Meta Description: ${data.metaDescription || 'None'}
Navigation Links: ${data.navLinks?.join(', ') || 'Unknown'}
Main Headings (H1): ${data.h1?.join(' | ') || 'Unknown'}
Section Headings (H2): ${data.h2?.slice(0, 5).join(' | ') || 'Unknown'}
CTA Buttons: ${data.ctaButtons?.join(', ') || 'None'}
Has Pricing Page: ${data.extendedContent?.hasPricingPage ?? 'Unknown'}
Has Blog: ${data.extendedContent?.hasBlog ?? data.trafficSignals?.blogExists ?? 'Unknown'}
Has About Page: ${data.extendedContent?.hasAboutPage ?? 'Unknown'}
Has Case Studies: ${data.extendedContent?.hasCaseStudies ?? 'Unknown'}
Has Team Page: ${data.extendedContent?.hasTeamPage ?? 'Unknown'}
Has Testimonials: ${data.extendedContent?.hasTestimonials ?? 'Unknown'}
Has Contact Page: ${data.extendedContent?.hasContactPage ?? 'Unknown'}
Social Profiles: ${data.extendedContent?.socialProfiles?.map(s => s.platform).join(', ') || 'None'}

## Creative/Animation Detection
Creative Quality Score: ${creativeScore}/100
Is High-Craft Creative Site: ${isHighCraft}
Animation Libraries Detected: ${animation?.animationLibraries?.join(', ') || 'None'}
3D/WebGL Libraries: ${animation?.threeDLibraries?.join(', ') || 'None'}
Has WebGL/Canvas: ${animation?.hasWebGL ?? false}
Has Scroll Animations: ${animation?.hasScrollAnimations ?? false}
Has Parallax Effects: ${animation?.hasParallax ?? false}
Has Page Transitions: ${animation?.hasPageTransitions ?? false}
Has SVG Animations: ${animation?.hasSVGAnimations ?? false}

## IMPORTANT: Creative Site Detection
If the site has:
- Creative Score >= 50, OR
- GSAP, Framer Motion, Three.js, PixiJS, Lottie, or other premium animation libraries, OR
- WebGL/Canvas/3D elements, OR
- Multiple sophisticated animation features (scroll animations + parallax + page transitions)

Then this is likely a CREATIVE/IMMERSIVE website type. These are typically:
- Award-winning agency sites
- Creative portfolios showcasing animation/interaction skills
- Immersive brand experiences
- Interactive storytelling sites
- Design studio showcases

For such sites, set websiteType.primaryType to "Creative/Immersive" with high confidence.

## Task
Based on the website data, extract key business information. You must infer from the available data.

Return a JSON object with:
- businessName: string (the company/person name - extract from title or content)
- businessDescription: string (1-2 sentence description of what they do/offer)
- targetAudience: string (who is this website for? e.g., "Small business owners", "Enterprise marketing teams", "Freelance designers")
- industry: string (e.g., "Marketing", "Technology", "Healthcare", "Finance", "Creative Services", "E-commerce")
- siteType: string (one of: "SaaS", "Agency", "E-commerce", "Portfolio", "Blog", "Corporate", "Non-profit", "Local Business", "Marketplace", "Service Provider", "Creative/Immersive")
- websiteType: object with:
  - primaryType: string (e.g., "Agency", "E-commerce", "Portfolio", "SaaS", "Service Provider", "Corporate", "Non-profit", "Local Business", "Marketplace", "Blog/Media", "Creative/Immersive")
  - confidence: number 0-100 (how confident are you in this classification)
  - characteristics: array of 3-5 strings describing the site (e.g., ["Service-based", "B2B focused", "Lead generation", "Content marketing", "Subscription model"])
  - subType: string (optional, more specific classification like "Creative Agency", "Digital Marketing Agency", "Fashion E-commerce", "Tech Blog")
- siteStructure: array of objects, each with:
  - name: string (section name like "About Us", "Services", "Portfolio", "Blog", "Pricing", "Contact", "Case Studies", "Team", "FAQ", "Testimonials")
  - path: string (likely URL path like "/about", "/services", "/contact")
  - exists: boolean (true if detected in navigation or content)
  - description: string (brief description of what this section contains based on what you found)

For siteStructure, analyze the navigation links and content to determine what sections exist. Common sections to look for:
- About/About Us - Company information
- Services/What We Do - Service offerings
- Portfolio/Work/Projects - Past work examples
- Blog/News/Articles - Content marketing
- Pricing/Plans - Pricing information
- Contact/Get in Touch - Contact information
- Case Studies/Success Stories - Detailed project showcases
- Team/Our Team - Team member profiles
- FAQ/Help - Frequently asked questions
- Testimonials/Reviews - Customer testimonials
- Careers/Jobs - Job listings
- Resources/Downloads - Downloadable content

Be specific with targetAudience - don't just say "businesses" - say what KIND of businesses or people.
If you can't determine something, make your best educated guess based on available signals.

Return ONLY valid JSON, no markdown formatting.`;
}

export function getVisualDesignPrompt(data: ScrapedData): string {
  const animation = data.designQuality?.animationAnalysis;
  const colors = data.designQuality?.colorAnalysis;

  return `You are a visual design expert analyzing website screenshots for WebCore Audit.

## Context
URL: ${data.url}
Business: ${data.title || 'Unknown'}

## Technical Data Already Collected
Animation Libraries Detected: ${animation?.animationLibraries?.join(', ') || 'None'}
3D/WebGL Libraries: ${animation?.threeDLibraries?.join(', ') || 'None'}
Has WebGL: ${animation?.hasWebGL ?? false}
Has Scroll Animations: ${animation?.hasScrollAnimations ?? false}
Has Parallax: ${animation?.hasParallax ?? false}
Has Page Transitions: ${animation?.hasPageTransitions ?? false}
Computed Creative Score: ${animation?.creativeScore ?? 0}/100
Primary Colors: ${colors?.primaryColors?.join(', ') || 'Unknown'}

## Your Task
Analyze the provided screenshot(s) and evaluate the visual design quality. Consider:

1. **Visual Hierarchy** (0-100): Is there clear hierarchy? Does the eye flow naturally?
2. **Typography** (0-100): Font choices, readability, consistency, creative use
3. **Color Usage** (0-100): Harmony, brand consistency, appropriate contrast
4. **Layout & Spacing** (0-100): Grid alignment, whitespace, balance
5. **Visual Polish** (0-100): Attention to detail, professional finish
6. **Creative Execution** (0-100): Originality, memorability, art direction
7. **Overall Aesthetic** (0-100): How does it feel? Premium, modern, dated?

For CREATIVE/IMMERSIVE sites (sites with GSAP, Three.js, WebGL, etc.):
- Give significant credit for sophisticated animation work
- Recognize artistic merit even if unconventional
- Value unique art direction and creative risks
- Award high scores (85-95+) for museum-quality design work

Return a JSON object with:
- visualHierarchy: { score: number, notes: string }
- typography: { score: number, notes: string }
- colorUsage: { score: number, notes: string }
- layoutSpacing: { score: number, notes: string }
- visualPolish: { score: number, notes: string }
- creativeExecution: { score: number, notes: string }
- overallAesthetic: { score: number, notes: string }
- overallVisualScore: number (weighted average, 0-100)
- designStyle: string (e.g., "Modern Minimalist", "Bold & Creative", "Corporate", "Artistic", "Playful", "Premium Luxury")
- standoutElements: array of strings (what makes this design notable)
- improvementAreas: array of strings (what could be better)

Return ONLY valid JSON, no markdown formatting.`;
}
