import puppeteer from 'puppeteer';
import { DesignQuality } from '@/lib/types/audit';

export async function scrapeDesignQuality(url: string): Promise<DesignQuality> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    await page.setViewport({ width: 1920, height: 1080 });

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    const designData = await page.evaluate(() => {
      const currentYear = new Date().getFullYear();

      // ============================================
      // 1. Footer Copyright Year Analysis
      // ============================================
      const footerAnalysis = (() => {
        const footer = document.querySelector('footer') ||
                      document.querySelector('[class*="footer"]') ||
                      document.querySelector('[id*="footer"]');

        const hasFooter = !!footer;
        let copyrightYear: number | null = null;

        if (footer) {
          const footerText = footer.textContent || '';
          // Match patterns like "© 2024", "Copyright 2023", "2022 Company Name"
          const yearMatch = footerText.match(/(?:©|copyright|\(c\))\s*(\d{4})/i) ||
                           footerText.match(/(\d{4})\s*(?:©|copyright|\(c\))/i) ||
                           footerText.match(/(?:©|copyright)\s*\d{4}\s*[-–]\s*(\d{4})/i); // Range like 2020-2024

          if (yearMatch) {
            copyrightYear = parseInt(yearMatch[1]);
          } else {
            // Try to find any 4-digit year in footer between 2000-2030
            const anyYear = footerText.match(/\b(20[0-3]\d)\b/);
            if (anyYear) {
              copyrightYear = parseInt(anyYear[1]);
            }
          }
        }

        return {
          hasFooter,
          footerCopyrightYear: copyrightYear,
          isCurrentYear: copyrightYear === currentYear,
          yearsOutdated: copyrightYear ? currentYear - copyrightYear : 0
        };
      })();

      // ============================================
      // 2. URL Structure Analysis
      // ============================================
      const urlAnalysis = (() => {
        const currentUrl = window.location.href;
        const pathname = window.location.pathname;
        const issues: string[] = [];

        const hasQueryString = window.location.search.length > 0;
        const hasFileExtension = /\.(html|php|asp|aspx|jsp|htm)$/i.test(pathname);
        const usesHyphens = pathname.includes('-');
        const usesUnderscores = pathname.includes('_');
        const isLowercase = pathname === pathname.toLowerCase();
        const hasProperHierarchy = pathname.split('/').filter(Boolean).length <= 4;
        const urlLength = currentUrl.length;

        if (hasQueryString) issues.push('URL contains query parameters');
        if (hasFileExtension) issues.push('URL contains file extension (.html, .php, etc.)');
        if (usesUnderscores) issues.push('URL uses underscores instead of hyphens');
        if (!isLowercase) issues.push('URL contains uppercase characters');
        if (urlLength > 75) issues.push('URL is too long (>75 characters)');
        if (!hasProperHierarchy) issues.push('URL hierarchy is too deep');

        return {
          isCleanUrl: !hasQueryString && !hasFileExtension && isLowercase,
          hasProperHierarchy,
          usesHyphens,
          isLowercase,
          hasFileExtension,
          urlLength,
          issues
        };
      })();

      // ============================================
      // 3. Color Analysis
      // ============================================
      const colorAnalysis = (() => {
        const issues: string[] = [];
        const colorMap = new Map<string, number>();

        // Get computed styles from key elements
        const body = document.body;
        const bodyStyle = window.getComputedStyle(body);
        const backgroundColor = bodyStyle.backgroundColor;
        const textColor = bodyStyle.color;

        // Extract colors from various elements
        const elements = document.querySelectorAll('*');
        const sampleSize = Math.min(elements.length, 500); // Sample for performance

        for (let i = 0; i < sampleSize; i++) {
          const el = elements[Math.floor(i * elements.length / sampleSize)];
          const style = window.getComputedStyle(el);

          const bgColor = style.backgroundColor;
          const txtColor = style.color;

          if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
            colorMap.set(bgColor, (colorMap.get(bgColor) || 0) + 1);
          }
          if (txtColor) {
            colorMap.set(txtColor, (colorMap.get(txtColor) || 0) + 1);
          }
        }

        // Get top colors by frequency
        const sortedColors = Array.from(colorMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([color]) => color);

        // Convert RGB to hex for cleaner output
        const rgbToHex = (rgb: string): string => {
          const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          if (!match) return rgb;
          const r = parseInt(match[1]);
          const g = parseInt(match[2]);
          const b = parseInt(match[3]);
          return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
        };

        // Calculate contrast ratio (simplified)
        const getLuminance = (rgb: string): number => {
          const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          if (!match) return 0;
          const [r, g, b] = [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])].map(v => {
            v = v / 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
          });
          return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };

        const bgLum = getLuminance(backgroundColor);
        const txtLum = getLuminance(textColor);
        const contrastRatio = (Math.max(bgLum, txtLum) + 0.05) / (Math.min(bgLum, txtLum) + 0.05);

        const passesWCAG_AA = contrastRatio >= 4.5;
        const passesWCAG_AAA = contrastRatio >= 7;

        const colorCount = colorMap.size;
        const hasConsistentPalette = colorCount <= 15;

        if (!passesWCAG_AA) issues.push('Text contrast does not meet WCAG AA standards (4.5:1)');
        if (colorCount > 20) issues.push('Too many colors used (>20), inconsistent palette');
        if (colorCount > 15) issues.push('Consider reducing color palette for consistency');

        return {
          primaryColors: sortedColors.slice(0, 5).map(c => rgbToHex(c)),
          backgroundColor: rgbToHex(backgroundColor),
          textColor: rgbToHex(textColor),
          contrastRatio: Math.round(contrastRatio * 100) / 100,
          passesWCAG_AA,
          passesWCAG_AAA,
          colorCount,
          hasConsistentPalette,
          issues
        };
      })();

      // ============================================
      // 4. Animation & Interactive Detection
      // ============================================
      const animationAnalysis = (() => {
        const html = document.documentElement.outerHTML;
        const scripts = Array.from(document.querySelectorAll('script')).map(s => s.src + ' ' + s.textContent);
        const stylesheets = Array.from(document.querySelectorAll('style')).map(s => s.textContent || '');
        const allStyles = stylesheets.join(' ');

        // Check for CSS animations
        const hasCSSAnimations = /@keyframes/i.test(allStyles) ||
                                 /animation:/i.test(allStyles) ||
                                 /animation-name:/i.test(allStyles);

        // Check for CSS transitions
        const hasCSSTransitions = /transition:/i.test(allStyles) ||
                                  /transition-property:/i.test(allStyles);

        // Check for animation libraries (expanded detection)
        const animationLibraries: string[] = [];
        const scriptContent = scripts.join(' ').toLowerCase();
        const htmlContent = html.toLowerCase();

        // Core animation libraries
        if (scriptContent.includes('gsap') || scriptContent.includes('greensock') || htmlContent.includes('gsap')) animationLibraries.push('GSAP');
        if (scriptContent.includes('aos') || htmlContent.includes('data-aos')) animationLibraries.push('AOS');
        if (scriptContent.includes('framer-motion') || scriptContent.includes('framer') || scriptContent.includes('motion/react')) animationLibraries.push('Framer Motion');
        if (scriptContent.includes('animatecss') || htmlContent.includes('animate__')) animationLibraries.push('Animate.css');
        if (scriptContent.includes('lottie') || scriptContent.includes('bodymovin')) animationLibraries.push('Lottie');
        if (scriptContent.includes('animejs') || /anime\s*\(/.test(scriptContent)) animationLibraries.push('Anime.js');
        if (scriptContent.includes('velocity')) animationLibraries.push('Velocity.js');
        if (scriptContent.includes('scrollmagic')) animationLibraries.push('ScrollMagic');
        if (scriptContent.includes('locomotive') || htmlContent.includes('data-scroll')) animationLibraries.push('Locomotive Scroll');
        if (scriptContent.includes('scrolltrigger')) animationLibraries.push('ScrollTrigger');
        if (scriptContent.includes('barba')) animationLibraries.push('Barba.js');
        if (scriptContent.includes('swup')) animationLibraries.push('Swup');
        if (scriptContent.includes('highway')) animationLibraries.push('Highway.js');
        if (scriptContent.includes('popmotion')) animationLibraries.push('Popmotion');
        if (scriptContent.includes('motion-one') || scriptContent.includes('@motionone')) animationLibraries.push('Motion One');
        if (scriptContent.includes('splitting') || htmlContent.includes('data-splitting')) animationLibraries.push('Splitting.js');

        // 3D & WebGL libraries
        const threeDLibraries: string[] = [];
        if (scriptContent.includes('three') || scriptContent.includes('threejs')) threeDLibraries.push('Three.js');
        if (scriptContent.includes('pixijs') || scriptContent.includes('pixi.js')) threeDLibraries.push('PixiJS');
        if (scriptContent.includes('babylonjs') || scriptContent.includes('babylon.js')) threeDLibraries.push('Babylon.js');
        if (scriptContent.includes('webgl')) threeDLibraries.push('WebGL');
        if (scriptContent.includes('ogl')) threeDLibraries.push('OGL');
        if (scriptContent.includes('react-three-fiber') || scriptContent.includes('@react-three')) threeDLibraries.push('React Three Fiber');
        if (scriptContent.includes('spline') || scriptContent.includes('@splinetool')) threeDLibraries.push('Spline');
        if (scriptContent.includes('curtainsjs') || scriptContent.includes('curtains.js')) threeDLibraries.push('Curtains.js');

        // Check for canvas and WebGL elements
        const canvasElements = document.querySelectorAll('canvas');
        const hasCanvas = canvasElements.length > 0;
        let hasWebGL = false;
        canvasElements.forEach(canvas => {
          try {
            const gl = canvas.getContext('webgl') || canvas.getContext('webgl2') || canvas.getContext('experimental-webgl');
            if (gl) hasWebGL = true;
          } catch {
            // Ignore errors
          }
        });

        // Check for SVG animations
        const svgElements = document.querySelectorAll('svg');
        let hasSVGAnimations = false;
        svgElements.forEach(svg => {
          if (svg.querySelector('animate, animateTransform, animateMotion, set')) {
            hasSVGAnimations = true;
          }
        });

        // Check for scroll animations
        const hasScrollAnimations = htmlContent.includes('data-aos') ||
                                   htmlContent.includes('data-scroll') ||
                                   htmlContent.includes('data-parallax') ||
                                   htmlContent.includes('data-rellax') ||
                                   animationLibraries.some(lib =>
                                     lib.toLowerCase().includes('scroll') ||
                                     lib.toLowerCase().includes('locomotive') ||
                                     lib.toLowerCase().includes('scrolltrigger'));

        // Check for parallax effects
        const hasParallax = htmlContent.includes('parallax') ||
                          htmlContent.includes('data-parallax') ||
                          htmlContent.includes('data-rellax') ||
                          scriptContent.includes('rellax') ||
                          scriptContent.includes('parallax');

        // Check for page transitions
        const hasPageTransitions = animationLibraries.some(lib =>
                                   ['Barba.js', 'Swup', 'Highway.js'].includes(lib)) ||
                                   scriptContent.includes('page-transition') ||
                                   htmlContent.includes('data-barba');

        // Check for hover effects (count elements with :hover in styles)
        const hasHoverEffects = /:hover/i.test(allStyles);

        // Count animation rules
        const animationCount = (allStyles.match(/@keyframes/gi) || []).length +
                              (allStyles.match(/animation:/gi) || []).length;

        // Calculate creative quality score (0-100)
        let creativeScore = 0;

        // Animation sophistication (up to 40 points)
        if (animationLibraries.includes('GSAP')) creativeScore += 15;
        if (animationLibraries.includes('Framer Motion')) creativeScore += 12;
        if (animationLibraries.includes('Lottie')) creativeScore += 10;
        if (animationLibraries.includes('ScrollTrigger') || animationLibraries.includes('Locomotive Scroll')) creativeScore += 10;
        if (animationLibraries.includes('Barba.js') || animationLibraries.includes('Swup')) creativeScore += 8;
        if (animationCount > 10) creativeScore += 5;
        creativeScore = Math.min(40, creativeScore);

        // 3D/WebGL (up to 25 points)
        if (hasWebGL) creativeScore += 15;
        if (threeDLibraries.length > 0) creativeScore += 10;
        creativeScore = Math.min(65, creativeScore);

        // Interactive features (up to 20 points)
        if (hasScrollAnimations) creativeScore += 8;
        if (hasParallax) creativeScore += 6;
        if (hasPageTransitions) creativeScore += 6;
        creativeScore = Math.min(85, creativeScore);

        // Basic animations (up to 15 points)
        if (hasCSSAnimations) creativeScore += 5;
        if (hasCSSTransitions) creativeScore += 3;
        if (hasHoverEffects) creativeScore += 3;
        if (hasSVGAnimations) creativeScore += 4;
        creativeScore = Math.min(100, creativeScore);

        const hasJSAnimations = animationLibraries.length > 0;
        const hasAnimations = hasCSSAnimations || hasCSSTransitions || hasJSAnimations;
        const has3D = hasWebGL || threeDLibraries.length > 0;
        const isHighCraft = creativeScore >= 50;

        return {
          hasAnimations,
          hasCSSAnimations,
          hasCSSTransitions,
          hasJSAnimations,
          animationLibraries,
          threeDLibraries,
          animationCount,
          hasScrollAnimations,
          hasHoverEffects,
          hasCanvas,
          hasWebGL,
          hasSVGAnimations,
          hasParallax,
          hasPageTransitions,
          has3D,
          creativeScore,
          isHighCraft
        };
      })();

      // ============================================
      // 5. Layout Analysis
      // ============================================
      const layoutAnalysis = (() => {
        const issues: string[] = [];
        const sections = document.querySelectorAll('section, [class*="section"], main > div, article');
        const sectionCount = sections.length;

        // Check for grid/flexbox usage
        let usesGridSystem = false;
        let usesFlexbox = false;
        const layoutPatterns: string[] = [];
        const paddingValues: number[] = [];

        const elements = document.querySelectorAll('*');
        const checkCount = Math.min(elements.length, 300);

        for (let i = 0; i < checkCount; i++) {
          const el = elements[Math.floor(i * elements.length / checkCount)];
          const style = window.getComputedStyle(el);

          if (style.display === 'grid' || style.display === 'inline-grid') usesGridSystem = true;
          if (style.display === 'flex' || style.display === 'inline-flex') usesFlexbox = true;
        }

        // Analyze section padding for consistency
        sections.forEach(section => {
          const style = window.getComputedStyle(section);
          const paddingTop = parseInt(style.paddingTop) || 0;
          const paddingBottom = parseInt(style.paddingBottom) || 0;
          if (paddingTop > 0 || paddingBottom > 0) {
            paddingValues.push((paddingTop + paddingBottom) / 2);
          }
        });

        // Calculate padding consistency
        let hasConsistentSpacing = true;
        let averageSectionPadding: number | null = null;

        if (paddingValues.length >= 2) {
          averageSectionPadding = paddingValues.reduce((a, b) => a + b, 0) / paddingValues.length;
          const variance = paddingValues.reduce((sum, val) => sum + Math.pow(val - averageSectionPadding!, 2), 0) / paddingValues.length;
          const stdDev = Math.sqrt(variance);
          // If std deviation is more than 50% of average, spacing is inconsistent
          hasConsistentSpacing = stdDev < (averageSectionPadding * 0.5);
        }

        // Detect common layout patterns
        const html = document.documentElement.outerHTML.toLowerCase();
        if (html.includes('hero') || document.querySelector('[class*="hero"]')) layoutPatterns.push('Hero section');
        if (html.includes('feature') || document.querySelector('[class*="feature"]')) layoutPatterns.push('Features grid');
        if (html.includes('testimonial') || document.querySelector('[class*="testimonial"]')) layoutPatterns.push('Testimonials');
        if (html.includes('pricing') || document.querySelector('[class*="pricing"]')) layoutPatterns.push('Pricing section');
        if (html.includes('cta') || document.querySelector('[class*="cta"]')) layoutPatterns.push('CTA section');
        if (html.includes('faq') || document.querySelector('[class*="faq"]')) layoutPatterns.push('FAQ section');
        if (html.includes('contact') || document.querySelector('[class*="contact"]')) layoutPatterns.push('Contact section');

        // Check for responsive design
        const hasResponsiveDesign = !!document.querySelector('meta[name="viewport"]');

        // Check visual hierarchy (H1 -> H2 -> H3 progression)
        const h1Count = document.querySelectorAll('h1').length;
        const h2Count = document.querySelectorAll('h2').length;
        const hasVisualHierarchy = h1Count >= 1 && h2Count >= h1Count;

        if (!hasConsistentSpacing) issues.push('Inconsistent spacing between sections');
        if (sectionCount < 3) issues.push('Page may lack visual structure (few sections)');
        if (!usesGridSystem && !usesFlexbox) issues.push('Not using modern CSS layout (Grid/Flexbox)');
        if (!hasVisualHierarchy) issues.push('Heading hierarchy may need improvement');
        if (!hasResponsiveDesign) issues.push('Missing responsive viewport meta tag');

        return {
          hasConsistentSpacing,
          sectionCount,
          averageSectionPadding: averageSectionPadding ? Math.round(averageSectionPadding) : null,
          hasVisualHierarchy,
          usesGridSystem,
          usesFlexbox,
          hasResponsiveDesign,
          layoutPatterns,
          issues
        };
      })();

      // ============================================
      // 6. Mobile Experience Analysis
      // ============================================
      const mobileAnalysis = (() => {
        const issues: string[] = [];
        let mobileScore = 100;

        // Check viewport meta tag
        const viewportMeta = document.querySelector('meta[name="viewport"]');
        const hasViewportMeta = !!viewportMeta;
        const viewportContent = viewportMeta?.getAttribute('content') || null;

        if (!hasViewportMeta) {
          issues.push('Missing viewport meta tag');
          mobileScore -= 30;
        }

        // Check for mobile menu indicators
        const html = document.documentElement.outerHTML.toLowerCase();
        const hasMobileMenu = html.includes('hamburger') ||
                             html.includes('mobile-menu') ||
                             html.includes('nav-toggle') ||
                             html.includes('menu-toggle') ||
                             !!document.querySelector('[class*="hamburger"]') ||
                             !!document.querySelector('[class*="mobile-nav"]') ||
                             !!document.querySelector('[aria-label*="menu"]');

        // Check for media queries
        const stylesheets = Array.from(document.querySelectorAll('style')).map(s => s.textContent || '');
        const allStyles = stylesheets.join(' ');
        const hasMediaQueries = /@media/i.test(allStyles);

        if (!hasMediaQueries) {
          issues.push('No CSS media queries detected');
          mobileScore -= 15;
        }

        // Check touch target sizes (sample interactive elements)
        const interactiveElements = document.querySelectorAll('a, button, input, select, textarea, [role="button"]');
        let touchTargetIssues = 0;
        const sampleSize = Math.min(interactiveElements.length, 50);

        for (let i = 0; i < sampleSize; i++) {
          const el = interactiveElements[Math.floor(i * interactiveElements.length / sampleSize)] as HTMLElement;
          const rect = el.getBoundingClientRect();
          // Touch targets should be at least 44x44px (Apple/Google guidelines)
          if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) {
            touchTargetIssues++;
          }
        }

        if (touchTargetIssues > 5) {
          issues.push(`${touchTargetIssues} elements may have small touch targets (<44px)`);
          mobileScore -= Math.min(20, touchTargetIssues * 2);
        }

        // Check base font size
        const bodyStyle = window.getComputedStyle(document.body);
        const fontSizeStr = bodyStyle.fontSize;
        const fontSizeBase = parseFloat(fontSizeStr) || null;
        const isReadableFontSize = fontSizeBase !== null && fontSizeBase >= 16;

        if (!isReadableFontSize) {
          issues.push('Base font size may be too small for mobile (<16px)');
          mobileScore -= 10;
        }

        // Check for horizontal scroll (elements wider than viewport)
        const hasHorizontalScroll = document.documentElement.scrollWidth > document.documentElement.clientWidth;

        if (hasHorizontalScroll) {
          issues.push('Page has horizontal scroll (elements overflow viewport)');
          mobileScore -= 20;
        }

        // Check for sticky/fixed header
        const header = document.querySelector('header, [class*="header"], nav');
        let hasStickyHeader = false;
        if (header) {
          const headerStyle = window.getComputedStyle(header);
          hasStickyHeader = headerStyle.position === 'fixed' || headerStyle.position === 'sticky';
        }

        // Bonus for good mobile practices
        if (hasMobileMenu) mobileScore = Math.min(100, mobileScore + 5);
        if (hasStickyHeader) mobileScore = Math.min(100, mobileScore + 5);

        return {
          hasViewportMeta,
          viewportContent,
          hasMobileMenu,
          hasMediaQueries,
          touchTargetIssues,
          fontSizeBase,
          isReadableFontSize,
          hasHorizontalScroll,
          hasStickyHeader,
          mobileScore: Math.max(0, mobileScore),
          issues
        };
      })();

      return {
        ...footerAnalysis,
        urlAnalysis,
        colorAnalysis,
        animationAnalysis,
        layoutAnalysis,
        mobileAnalysis
      };
    });

    await browser.close();
    return designData;

  } catch (error) {
    await browser.close();
    console.error('[Design] Scrape failed:', error);

    // Return defaults on error
    return {
      footerCopyrightYear: null,
      isCurrentYear: false,
      yearsOutdated: 0,
      hasFooter: false,
      urlAnalysis: {
        isCleanUrl: true,
        hasProperHierarchy: true,
        usesHyphens: false,
        isLowercase: true,
        hasFileExtension: false,
        urlLength: url.length,
        issues: []
      },
      colorAnalysis: {
        primaryColors: [],
        backgroundColor: null,
        textColor: null,
        contrastRatio: null,
        passesWCAG_AA: true,
        passesWCAG_AAA: false,
        colorCount: 0,
        hasConsistentPalette: true,
        issues: []
      },
      animationAnalysis: {
        hasAnimations: false,
        hasCSSAnimations: false,
        hasCSSTransitions: false,
        hasJSAnimations: false,
        animationLibraries: [],
        threeDLibraries: [],
        animationCount: 0,
        hasScrollAnimations: false,
        hasHoverEffects: false,
        hasCanvas: false,
        hasWebGL: false,
        hasSVGAnimations: false,
        hasParallax: false,
        hasPageTransitions: false,
        has3D: false,
        creativeScore: 0,
        isHighCraft: false
      },
      layoutAnalysis: {
        hasConsistentSpacing: true,
        sectionCount: 0,
        averageSectionPadding: null,
        hasVisualHierarchy: true,
        usesGridSystem: false,
        usesFlexbox: false,
        hasResponsiveDesign: true,
        layoutPatterns: [],
        issues: []
      },
      mobileAnalysis: {
        hasViewportMeta: true,
        viewportContent: null,
        hasMobileMenu: false,
        hasMediaQueries: false,
        touchTargetIssues: 0,
        fontSizeBase: null,
        isReadableFontSize: true,
        hasHorizontalScroll: false,
        hasStickyHeader: false,
        mobileScore: 70,
        issues: []
      }
    };
  }
}
