import Anthropic from '@anthropic-ai/sdk';
import { ScrapedData, CategoryScore, AuditResult, Issue, PassingItem, PageScore, WebsiteBrief, TokenUsage } from '@/lib/types/audit';
import { calculatePageScore } from '@/lib/scraper/pages';
import {
  getTechnicalPrompt,
  getBrandMessagingPrompt,
  getUserExperiencePrompt,
  getSecurityPrompt,
  getExecutiveSummaryPrompt,
  getBusinessOverviewPrompt,
  getTrafficReadinessPrompt,
  getContentStrategyPrompt,
  getConversionEngagementPrompt,
  getSocialMultimediaPrompt,
  getTrustCredibilityPrompt,
  getWebsiteBriefPrompt,
  getVisualDesignPrompt,
} from './prompts';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Token usage tracker
class TokenTracker {
  private inputTokens = 0;
  private outputTokens = 0;

  add(usage: { input_tokens: number; output_tokens: number }) {
    this.inputTokens += usage.input_tokens;
    this.outputTokens += usage.output_tokens;
  }

  getUsage(): TokenUsage {
    const totalTokens = this.inputTokens + this.outputTokens;
    // Claude Sonnet pricing: $3/1M input, $15/1M output
    const estimatedCost = (this.inputTokens * 3 + this.outputTokens * 15) / 1_000_000;
    return {
      inputTokens: this.inputTokens,
      outputTokens: this.outputTokens,
      totalTokens,
      estimatedCost: Math.round(estimatedCost * 10000) / 10000, // Round to 4 decimal places
    };
  }
}

interface CategoryAnalysis {
  score: number;
  issues: Issue[];
  passing: PassingItem[];
  recommendations: string[];
}

// Helper to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retry with exponential backoff for rate limits
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 2000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error as Error;
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Check if it's a rate limit error
      if (errorMessage.includes('rate_limit') || errorMessage.includes('429')) {
        const waitTime = baseDelay * Math.pow(2, attempt);
        console.log(`[Analysis] Rate limited, waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}...`);
        await delay(waitTime);
      } else {
        throw error; // Non-rate-limit errors should fail immediately
      }
    }
  }

  throw lastError;
}

async function analyzeCategory(prompt: string, tokenTracker?: TokenTracker): Promise<CategoryAnalysis> {
  console.log('[Analysis] Sending prompt to Claude...');

  const response = await withRetry(async () => {
    return await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500, // Reduced from 2000 to help with rate limits
      temperature: 0, // Deterministic output for consistent scoring
      messages: [{ role: 'user', content: prompt }],
    });
  });

  // Track token usage
  if (tokenTracker && response.usage) {
    tokenTracker.add(response.usage);
  }

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  console.log('[Analysis] Received response, parsing JSON...');

  // Parse JSON from response
  try {
    // Handle potential markdown code blocks
    let jsonStr = text;

    // Remove markdown code blocks if present
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1];
    }

    // Find JSON object in the text
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        score: Math.min(100, Math.max(0, parsed.score || 50)),
        issues: Array.isArray(parsed.issues) ? parsed.issues : [],
        passing: Array.isArray(parsed.passing) ? parsed.passing : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      };
    }
    throw new Error('No JSON object found in response');
  } catch {
    console.error('[Analysis] Failed to parse AI response:', text.slice(0, 500));
    return {
      score: 50,
      issues: [{
        severity: 'info',
        title: 'Analysis Incomplete',
        description: 'AI analysis could not be fully parsed',
        impact: 'Some insights may be missing'
      }],
      passing: [],
      recommendations: ['Manual review recommended']
    };
  }
}

function getDefaultAnalysis(): CategoryAnalysis {
  return {
    score: 50,
    issues: [],
    passing: [],
    recommendations: ['Analysis could not be completed']
  };
}

async function generateWebsiteBrief(data: ScrapedData, tokenTracker?: TokenTracker): Promise<WebsiteBrief> {
  console.log('[Analysis] Generating website brief...');

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      temperature: 0, // Deterministic output for consistent results
      messages: [{ role: 'user', content: getWebsiteBriefPrompt(data) }],
    });

    // Track token usage
    if (tokenTracker && response.usage) {
      tokenTracker.add(response.usage);
    }

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    // Parse JSON from response
    let jsonStr = text;
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1];
    }

    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        businessName: parsed.businessName || 'Unknown',
        businessDescription: parsed.businessDescription || 'No description available',
        targetAudience: parsed.targetAudience || 'General audience',
        industry: parsed.industry || 'Unknown',
        siteType: parsed.siteType || 'Website',
        totalPages: data.trafficSignals?.sitemapPageCount || null,
        websiteType: parsed.websiteType || undefined,
        siteStructure: parsed.siteStructure || undefined,
      };
    }
    throw new Error('No JSON found');
  } catch (error) {
    console.error('[Analysis] Failed to generate website brief:', error);
    // Extract business name from title as fallback
    const businessName = data.title?.split(/[-|–]/)[0]?.trim() || 'Unknown';
    return {
      businessName,
      businessDescription: data.metaDescription || 'No description available',
      targetAudience: 'Not determined',
      industry: 'Unknown',
      siteType: 'Website',
      totalPages: data.trafficSignals?.sitemapPageCount || null,
    };
  }
}

interface VisualAnalysisResult {
  overallVisualScore: number;
  designStyle: string;
  standoutElements: string[];
  improvementAreas: string[];
  details?: Record<string, { score: number; notes: string }>;
}

async function analyzeVisualDesign(data: ScrapedData, tokenTracker?: TokenTracker): Promise<VisualAnalysisResult | null> {
  // Only run if we have screenshots
  if (!data.screenshots?.desktop) {
    console.log('[Analysis] No screenshots available, skipping visual analysis');
    return null;
  }

  console.log('[Analysis] Running visual design analysis with screenshots...');

  try {
    const content: Anthropic.MessageCreateParams['messages'][0]['content'] = [
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/jpeg',
          data: data.screenshots.desktop,
        },
      },
    ];

    // Add mobile screenshot if available
    if (data.screenshots.mobile) {
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/jpeg',
          data: data.screenshots.mobile,
        },
      });
    }

    // Add the text prompt
    content.push({
      type: 'text',
      text: getVisualDesignPrompt(data),
    });

    const response = await withRetry(async () => {
      return await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        temperature: 0, // Deterministic output for consistent results
        messages: [{ role: 'user', content }],
      });
    });

    if (tokenTracker && response.usage) {
      tokenTracker.add(response.usage);
    }

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    // Parse JSON from response
    let jsonStr = text;
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1];
    }

    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        overallVisualScore: Math.min(100, Math.max(0, parsed.overallVisualScore || 50)),
        designStyle: parsed.designStyle || 'Unknown',
        standoutElements: Array.isArray(parsed.standoutElements) ? parsed.standoutElements : [],
        improvementAreas: Array.isArray(parsed.improvementAreas) ? parsed.improvementAreas : [],
        details: {
          visualHierarchy: parsed.visualHierarchy,
          typography: parsed.typography,
          colorUsage: parsed.colorUsage,
          layoutSpacing: parsed.layoutSpacing,
          visualPolish: parsed.visualPolish,
          creativeExecution: parsed.creativeExecution,
          overallAesthetic: parsed.overallAesthetic,
        },
      };
    }

    console.error('[Analysis] Failed to parse visual analysis response');
    return null;
  } catch (error) {
    console.error('[Analysis] Visual design analysis failed:', error);
    return null;
  }
}

// All category configurations
const ALL_CATEGORIES = [
  { name: 'Business Overview', weight: 1.0, getPrompt: (data: ScrapedData) => getBusinessOverviewPrompt(data) },
  { name: 'Technical Foundation', weight: 1.2, getPrompt: (data: ScrapedData) => getTechnicalPrompt(data) },
  { name: 'Brand & Messaging', weight: 1.0, getPrompt: (data: ScrapedData) => getBrandMessagingPrompt(data) },
  { name: 'User Experience', weight: 1.0, getPrompt: (data: ScrapedData) => getUserExperiencePrompt(data) },
  { name: 'Traffic Readiness', weight: 1.0, getPrompt: (data: ScrapedData) => getTrafficReadinessPrompt(data.trafficSignals, data) },
  { name: 'Security', weight: 0.8, getPrompt: (data: ScrapedData) => getSecurityPrompt(data) },
  { name: 'Content Strategy', weight: 0.8, getPrompt: (data: ScrapedData) => getContentStrategyPrompt(data) },
  { name: 'Conversion & Engagement', weight: 1.0, getPrompt: (data: ScrapedData) => getConversionEngagementPrompt(data) },
  { name: 'Social & Multimedia', weight: 0.6, getPrompt: (data: ScrapedData) => getSocialMultimediaPrompt(data) },
  { name: 'Trust & Credibility', weight: 1.0, getPrompt: (data: ScrapedData) => getTrustCredibilityPrompt(data) },
];

export async function analyzeWebsite(
  data: ScrapedData,
  selectedCategories?: string[]
): Promise<AuditResult> {
  const scrapedAt = new Date();
  const tokenTracker = new TokenTracker();

  // Filter categories if selection provided
  const categoriesToAnalyze = selectedCategories
    ? ALL_CATEGORIES.filter(c => selectedCategories.includes(c.name))
    : ALL_CATEGORIES;

  console.log(`[Analysis] Starting analysis for ${categoriesToAnalyze.length} categories: ${data.url}`);

  // Always generate the brief and visual analysis in parallel
  const briefPromise = generateWebsiteBrief(data, tokenTracker);
  const visualAnalysisPromise = analyzeVisualDesign(data, tokenTracker);

  // Run category analyses in batches of 3 to avoid rate limits
  const categoryResults: Map<string, CategoryAnalysis> = new Map();

  for (let i = 0; i < categoriesToAnalyze.length; i += 3) {
    const batch = categoriesToAnalyze.slice(i, i + 3);
    const batchNum = Math.floor(i / 3) + 1;
    const totalBatches = Math.ceil(categoriesToAnalyze.length / 3);

    console.log(`[Analysis] Batch ${batchNum}/${totalBatches}: ${batch.map(c => c.name).join(', ')}`);

    const results = await Promise.all(
      batch.map(cat =>
        analyzeCategory(cat.getPrompt(data), tokenTracker).catch(err => {
          console.error(`[Analysis] ${cat.name} failed:`, err);
          return getDefaultAnalysis();
        })
      )
    );

    batch.forEach((cat, idx) => {
      categoryResults.set(cat.name, results[idx]);
    });

    // Delay between batches (except last batch)
    if (i + 3 < categoriesToAnalyze.length) {
      await delay(1000);
    }
  }

  // Wait for brief and visual analysis
  const [brief, visualAnalysis] = await Promise.all([briefPromise, visualAnalysisPromise]);

  console.log('[Analysis] All category analyses + brief + visual complete');

  // Check if this is a high-craft creative site
  const creativeScore = data.designQuality?.animationAnalysis?.creativeScore ?? 0;
  const isHighCraft = data.designQuality?.animationAnalysis?.isHighCraft ?? false;
  const visualScore = visualAnalysis?.overallVisualScore ?? 0;

  // Calculate boost for UX score if high-craft creative site
  let uxBoost = 0;
  if (isHighCraft || creativeScore >= 40) {
    // If visual analysis confirms high quality, boost UX significantly
    if (visualScore >= 80) {
      uxBoost = 25; // Major boost for visually stunning + technically sophisticated
    } else if (visualScore >= 60 || creativeScore >= 60) {
      uxBoost = 15; // Moderate boost
    } else if (creativeScore >= 40) {
      uxBoost = 10; // Small boost for detected animation sophistication
    }
    console.log(`[Analysis] High-craft creative site detected. Creative score: ${creativeScore}, Visual score: ${visualScore}, UX boost: ${uxBoost}`);
  }

  // Build categories array from results
  const categories: CategoryScore[] = categoriesToAnalyze.map(cat => {
    const result = categoryResults.get(cat.name) || getDefaultAnalysis();
    let score = result.score;

    // Apply UX boost for high-craft sites
    if (cat.name === 'User Experience' && uxBoost > 0) {
      score = Math.min(100, score + uxBoost);

      // Add passing item noting the creative quality
      if (isHighCraft || creativeScore >= 40) {
        result.passing.push({
          title: 'High-Craft Creative Design',
          description: `This site demonstrates sophisticated animation and interaction design (Creative Score: ${creativeScore}/100)`,
          value: visualAnalysis?.designStyle || 'Creative/Immersive',
        });
      }

      // Add visual standout elements as passing items
      if (visualAnalysis?.standoutElements?.length) {
        visualAnalysis.standoutElements.slice(0, 3).forEach(element => {
          result.passing.push({
            title: 'Visual Design Strength',
            description: element,
          });
        });
      }
    }

    return {
      name: cat.name,
      score,
      weight: cat.weight,
      issues: result.issues,
      passing: result.passing,
      recommendations: result.recommendations,
    };
  });

  // Calculate overall score (weighted average)
  const totalWeight = categories.reduce((acc, c) => acc + c.weight, 0);
  const overallScore = Math.round(
    categories.reduce((acc, c) => acc + c.score * c.weight, 0) / totalWeight
  );

  console.log(`[Analysis] Overall score: ${overallScore}`);

  // Calculate page scores
  const pagesAnalyzed: PageScore[] = (data.pages || []).map(page => {
    const pageScore = calculatePageScore(page);
    return {
      url: page.url,
      path: page.path,
      title: page.title,
      overallScore: pageScore,
      scores: {
        technical: page.loadTime < 3000 ? 80 : page.loadTime < 5000 ? 60 : 40,
        content: page.wordCount >= 300 ? 80 : page.wordCount >= 100 ? 60 : 40,
        ux: (page.hasCTA ? 40 : 0) + (page.h1.length === 1 ? 30 : 15) + (page.hasForm ? 30 : 0),
      },
      issues: [],
      passing: [],
    };
  });

  // Sort pages by score to find best/worst
  const sortedPages = [...pagesAnalyzed].sort((a, b) => b.overallScore - a.overallScore);
  const bestPage = sortedPages.length > 0 ? sortedPages[0] : null;
  const worstPage = sortedPages.length > 0 ? sortedPages[sortedPages.length - 1] : null;

  // Generate executive summary
  console.log('[Analysis] Generating executive summary...');
  const summaryResponse = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    temperature: 0, // Deterministic output for consistent results
    messages: [{ role: 'user', content: getExecutiveSummaryPrompt(data, categories) }],
  });

  // Track token usage for summary
  if (summaryResponse.usage) {
    tokenTracker.add(summaryResponse.usage);
  }

  const summary = summaryResponse.content[0].type === 'text'
    ? summaryResponse.content[0].text.trim()
    : 'Audit complete. Review the detailed findings below.';

  // Get final token usage
  const tokenUsage = tokenTracker.getUsage();
  console.log(`[Analysis] Token usage: ${tokenUsage.inputTokens} input, ${tokenUsage.outputTokens} output, $${tokenUsage.estimatedCost.toFixed(4)} estimated cost`);

  console.log('[Analysis] Analysis complete');

  return {
    id: crypto.randomUUID(),
    url: data.url,
    overallScore,
    categories,
    summary,
    scrapedAt,
    analyzedAt: new Date(),
    clientLogo: data.logoUrl || null,
    brief,
    pageCount: pagesAnalyzed.length,
    pagesAnalyzed,
    bestPage,
    worstPage,
    tokenUsage,
  };
}

export {
  getTechnicalPrompt,
  getBrandMessagingPrompt,
  getUserExperiencePrompt,
  getSecurityPrompt,
  getBusinessOverviewPrompt,
  getTrafficReadinessPrompt,
  getContentStrategyPrompt,
  getConversionEngagementPrompt,
  getSocialMultimediaPrompt,
  getTrustCredibilityPrompt,
};
