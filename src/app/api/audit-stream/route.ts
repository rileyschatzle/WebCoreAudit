import { scrapeWebsite } from "@/lib/scraper";
import {
  ScrapedData,
  CategoryScore,
  AuditResult,
  PageScore,
  WebsiteBrief,
  TokenUsage,
  PageSpeedData,
} from "@/lib/types/audit";
import { calculatePageScore } from "@/lib/scraper/pages";
import Anthropic from "@anthropic-ai/sdk";
import {
  fetchPageSpeedBoth,
  PageSpeedResult,
  PageSpeedError,
} from "@/lib/services/pagespeed";
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
} from "@/lib/analysis/prompts";
import {
  createAuditRecord,
  completeAuditRecord,
  failAuditRecord,
  incrementUserAuditUsage,
} from "@/lib/supabase/audit-logger";
import { checkUserUsage } from "@/lib/stripe/usage";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  timeout: 60000, // 60 second timeout per request
});

// Map category IDs to full names
const CATEGORY_MAP: Record<string, string> = {
  business: "Business Overview",
  technical: "Technical Foundation",
  brand: "Brand & Messaging",
  ux: "User Experience",
  traffic: "Traffic Readiness",
  security: "Security",
  content: "Content Strategy",
  conversion: "Conversion & Engagement",
  social: "Social & Multimedia",
  trust: "Trust & Credibility",
};

// All category configurations
const ALL_CATEGORIES = [
  {
    name: "Business Overview",
    weight: 1.0,
    getPrompt: (data: ScrapedData) => getBusinessOverviewPrompt(data),
  },
  {
    name: "Technical Foundation",
    weight: 1.2,
    getPrompt: (data: ScrapedData) => getTechnicalPrompt(data),
  },
  {
    name: "Brand & Messaging",
    weight: 1.0,
    getPrompt: (data: ScrapedData) => getBrandMessagingPrompt(data),
  },
  {
    name: "User Experience",
    weight: 1.0,
    getPrompt: (data: ScrapedData) => getUserExperiencePrompt(data),
  },
  {
    name: "Traffic Readiness",
    weight: 1.0,
    getPrompt: (data: ScrapedData) =>
      getTrafficReadinessPrompt(data.trafficSignals),
  },
  {
    name: "Security",
    weight: 0.8,
    getPrompt: (data: ScrapedData) => getSecurityPrompt(data),
  },
  {
    name: "Content Strategy",
    weight: 0.8,
    getPrompt: (data: ScrapedData) => getContentStrategyPrompt(data),
  },
  {
    name: "Conversion & Engagement",
    weight: 1.0,
    getPrompt: (data: ScrapedData) => getConversionEngagementPrompt(data),
  },
  {
    name: "Social & Multimedia",
    weight: 0.6,
    getPrompt: (data: ScrapedData) => getSocialMultimediaPrompt(data),
  },
  {
    name: "Trust & Credibility",
    weight: 1.0,
    getPrompt: (data: ScrapedData) => getTrustCredibilityPrompt(data),
  },
];

// Token tracker
class TokenTracker {
  private inputTokens = 0;
  private outputTokens = 0;

  add(usage: { input_tokens: number; output_tokens: number }) {
    this.inputTokens += usage.input_tokens;
    this.outputTokens += usage.output_tokens;
  }

  getUsage(): TokenUsage {
    const totalTokens = this.inputTokens + this.outputTokens;
    const estimatedCost =
      (this.inputTokens * 3 + this.outputTokens * 15) / 1_000_000;
    return {
      inputTokens: this.inputTokens,
      outputTokens: this.outputTokens,
      totalTokens,
      estimatedCost: Math.round(estimatedCost * 10000) / 10000,
    };
  }
}

// Helper to delay execution
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Retry with exponential backoff
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 2000,
): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error as Error;
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("rate_limit") || errorMessage.includes("429")) {
        const waitTime = baseDelay * Math.pow(2, attempt);
        await delay(waitTime);
      } else {
        throw error;
      }
    }
  }
  throw lastError;
}

interface CategoryAnalysis {
  score: number;
  issues: {
    severity: string;
    title: string;
    description: string;
    impact: string;
  }[];
  passing: { title: string; description: string; value?: string }[];
  recommendations: string[];
}

async function analyzeCategory(
  prompt: string,
  tokenTracker: TokenTracker,
): Promise<CategoryAnalysis> {
  const response = await withRetry(async () => {
    return await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      temperature: 0, // Deterministic output for consistent scoring
      messages: [{ role: "user", content: prompt }],
    });
  });

  if (response.usage) {
    tokenTracker.add(response.usage);
  }

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  try {
    let jsonStr = text;
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1];
    }

    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        score: Math.min(100, Math.max(0, parsed.score || 50)),
        issues: Array.isArray(parsed.issues) ? parsed.issues : [],
        passing: Array.isArray(parsed.passing) ? parsed.passing : [],
        recommendations: Array.isArray(parsed.recommendations)
          ? parsed.recommendations
          : [],
      };
    }
    throw new Error("No JSON found");
  } catch {
    return {
      score: 50,
      issues: [
        {
          severity: "info",
          title: "Analysis Incomplete",
          description: "AI analysis could not be fully parsed",
          impact: "Some insights may be missing",
        },
      ],
      passing: [],
      recommendations: ["Manual review recommended"],
    };
  }
}

async function generateWebsiteBrief(
  data: ScrapedData,
  tokenTracker: TokenTracker,
): Promise<WebsiteBrief> {
  try {
    const response = await withRetry(async () => {
      return await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        temperature: 0, // Deterministic output for consistent results
        messages: [{ role: "user", content: getWebsiteBriefPrompt(data) }],
      });
    });

    if (response.usage) {
      tokenTracker.add(response.usage);
    }

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    let jsonStr = text;
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1];
    }

    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        businessName: parsed.businessName || "Unknown",
        businessDescription:
          parsed.businessDescription || "No description available",
        targetAudience: parsed.targetAudience || "General audience",
        industry: parsed.industry || "Unknown",
        siteType: parsed.siteType || "Website",
        totalPages: data.trafficSignals?.sitemapPageCount || null,
      };
    }
    throw new Error("No JSON found");
  } catch {
    const businessName = data.title?.split(/[-|–]/)[0]?.trim() || "Unknown";
    return {
      businessName,
      businessDescription: data.metaDescription || "No description available",
      targetAudience: "Not determined",
      industry: "Unknown",
      siteType: "Website",
      totalPages: data.trafficSignals?.sitemapPageCount || null,
    };
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  const pagesParam = searchParams.get("pages");
  const categoriesParam = searchParams.get("categories");
  const isAdmin = searchParams.get("admin") === "true";

  if (!url) {
    return new Response(JSON.stringify({ error: "URL required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Get authenticated user from session (if any)
  let userId: string | undefined;
  if (!isAdmin) {
    try {
      const cookieStore = cookies();
      const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value;
            },
            set() {},
            remove() {},
          },
        },
      );
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
      }
    } catch (err) {
      console.error("Error getting user session:", err);
    }
  }

  // Get source info for tracking
  const sourceIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";

  // Check user usage limits (if authenticated and not admin)
  let enforcedMaxPages = pagesParam ? parseInt(pagesParam) : 1;
  let allowedCategoryIds = categoriesParam
    ? categoriesParam.split(",")
    : Object.keys(CATEGORY_MAP);

  if (userId && !isAdmin) {
    try {
      const usageCheck = await checkUserUsage(userId);

      if (!usageCheck.allowed) {
        return new Response(
          JSON.stringify({
            error: usageCheck.reason || "Usage limit exceeded",
            upgradeUrl: "/pricing",
            auditsRemaining: usageCheck.auditsRemaining,
            auditsLimit: usageCheck.auditsLimit,
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // Enforce tier limits on pages
      enforcedMaxPages = Math.min(enforcedMaxPages, usageCheck.pagesLimit);

      // Enforce tier limits on categories
      const allowedCategories = usageCheck.allowedCategories;
      allowedCategoryIds = allowedCategoryIds.filter((id) =>
        allowedCategories.includes(id),
      );
    } catch (err) {
      console.error("Error checking usage limits:", err);
      // Continue without enforcement if check fails
    }
  }

  const maxPages = enforcedMaxPages;
  const selectedCategoryNames = allowedCategoryIds
    .map((id) => CATEGORY_MAP[id])
    .filter(Boolean);

  const categoriesToAnalyze = ALL_CATEGORIES.filter((c) =>
    selectedCategoryNames.includes(c.name),
  );

  // Create SSE response with TransformStream for proper streaming
  const encoder = new TextEncoder();

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  const send = async (event: string, data: unknown) => {
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    await writer.write(encoder.encode(message));
  };

  // Start async processing (don't await - runs in background while returning response)
  (async () => {
    try {
      // Send initial status IMMEDIATELY before anything else
      await send("status", {
        phase: "scraping",
        message: "Starting audit...",
        progress: 1,
      });

      // Create audit record in Supabase (don't block on this)
      const auditIdPromise = createAuditRecord({
        url,
        source_ip: sourceIp,
        user_agent: userAgent,
        user_id: userId,
        is_admin: isAdmin,
      }).catch((err) => {
        console.error("[Audit] Failed to create audit record:", err);
        return null;
      });

      try {
        const tokenTracker = new TokenTracker();
        const scrapedAt = new Date();

        // Send another status update
        await send("status", {
          phase: "scraping",
          message: "Connecting to website...",
          progress: 5,
        });

        // Quick fetch to get basic info FAST (just URL verification)
        let finalUrl = url;
        let sslStatus = url.startsWith("https");

        try {
          const quickResponse = await fetch(url, {
            method: "HEAD",
            redirect: "follow",
            signal: AbortSignal.timeout(5000),
          });
          finalUrl = quickResponse.url;
          sslStatus = finalUrl.startsWith("https");

          // Send quick initial data
          await send("scraped", {
            url: url,
            finalUrl: finalUrl,
            title: null, // Will update later
            loadTime: 0,
            ssl: sslStatus,
          });
          await send("status", {
            phase: "scraping",
            message: "Website found, scanning structure...",
            progress: 10,
          });
        } catch (quickErr) {
          console.log(
            "[Audit] Quick fetch failed, continuing with full scrape:",
            quickErr,
          );
          await send("status", {
            phase: "scraping",
            message: "Scanning website structure...",
            progress: 10,
          });
        }

        // Start PageSpeed fetch in parallel with scraping
        const pageSpeedPromise = fetchPageSpeedBoth(url);

        // Full scrape with timeout
        await send("status", {
          phase: "scraping",
          message: "Analyzing page content...",
          progress: 15,
        });
        console.log("[Audit] Starting full scrape for:", url);

        const scrapePromise = scrapeWebsite(url, {
          maxPages,
          additionalUrls: [],
        });
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(
            () => reject(new Error("Scrape timeout after 60 seconds")),
            60000,
          );
        });

        const scraped = await Promise.race([scrapePromise, timeoutPromise]);
        console.log("[Audit] Scrape complete, title:", scraped.title);

        await send("status", {
          phase: "scraped",
          message: "Website scanned successfully",
          progress: 25,
        });
        await send("scraped", {
          url: scraped.url,
          finalUrl: scraped.finalUrl,
          title: scraped.title,
          loadTime: scraped.loadTime,
          ssl: scraped.ssl,
          emails: scraped.emails || [],
          socialLinks: scraped.socialLinks || [],
        });

        // Wait for PageSpeed results (with timeout handling)
        await send("status", {
          phase: "pagespeed",
          message: "Fetching Core Web Vitals...",
          progress: 30,
        });
        const pageSpeedResults = await pageSpeedPromise;

        // Convert PageSpeed results to data format
        const pageSpeedData: {
          mobile: PageSpeedData | null;
          desktop: PageSpeedData | null;
        } = {
          mobile: null,
          desktop: null,
        };

        const isPageSpeedResult = (
          result: PageSpeedResult | PageSpeedError,
        ): result is PageSpeedResult => {
          return !("error" in result);
        };

        if (isPageSpeedResult(pageSpeedResults.mobile)) {
          pageSpeedData.mobile = pageSpeedResults.mobile as PageSpeedData;
        }
        if (isPageSpeedResult(pageSpeedResults.desktop)) {
          pageSpeedData.desktop = pageSpeedResults.desktop as PageSpeedData;
        }

        // Send PageSpeed data to client
        await send("pagespeed", pageSpeedData);
        console.log("[Audit] PageSpeed complete");

        // Phase 2: Generate brief
        await send("status", {
          phase: "brief",
          message: "Analyzing business profile...",
          progress: 35,
        });
        console.log("[Audit] Generating brief...");
        const brief = await generateWebsiteBrief(scraped, tokenTracker);
        await send("brief", brief);
        console.log("[Audit] Brief complete:", brief.businessName);

        // Phase 3: Analyze categories in parallel batches
        const categories: CategoryScore[] = [];
        let totalWeight = 0;
        let weightedSum = 0;
        let completedCount = 0;

        await send("status", {
          phase: "analyzing",
          message: `Starting analysis of ${categoriesToAnalyze.length} categories...`,
          progress: 40,
          current: 0,
          total: categoriesToAnalyze.length,
        });
        console.log(
          "[Audit] Starting category analysis, count:",
          categoriesToAnalyze.length,
        );

        // Process categories in parallel batches of 3 to balance speed vs rate limits
        const BATCH_SIZE = 3;
        const batches: (typeof categoriesToAnalyze)[] = [];
        for (let i = 0; i < categoriesToAnalyze.length; i += BATCH_SIZE) {
          batches.push(categoriesToAnalyze.slice(i, i + BATCH_SIZE));
        }

        for (const batch of batches) {
          // Process batch in parallel
          const batchResults = await Promise.all(
            batch.map(async (cat) => {
              const result = await analyzeCategory(
                cat.getPrompt(scraped),
                tokenTracker,
              );
              return {
                cat,
                result,
              };
            }),
          );

          // Process results and send updates
          for (const { cat, result } of batchResults) {
            const categoryScore: CategoryScore = {
              name: cat.name,
              score: result.score,
              weight: cat.weight,
              issues: result.issues as CategoryScore["issues"],
              passing: result.passing,
              recommendations: result.recommendations,
            };

            categories.push(categoryScore);
            totalWeight += cat.weight;
            weightedSum += result.score * cat.weight;
            completedCount++;

            console.log(
              `[Audit] Category complete: ${cat.name}, score: ${result.score}`,
            );

            // Send this category result immediately
            await send("category", {
              category: categoryScore,
              runningScore: Math.round(weightedSum / totalWeight),
            });

            // Progress: 40% base + up to 55% for categories (40-95%)
            const categoryProgress =
              40 +
              Math.round((completedCount / categoriesToAnalyze.length) * 55);
            await send("status", {
              phase: "analyzing",
              message: `Analyzed ${cat.name}`,
              progress: categoryProgress,
              current: completedCount,
              total: categoriesToAnalyze.length,
            });
          }

          // Small delay between batches to help with rate limits
          if (batch !== batches[batches.length - 1]) {
            await delay(300);
          }
        }

        // Phase 4: Calculate page scores
        const pagesAnalyzed: PageScore[] = (scraped.pages || []).map((page) => {
          const pageScore = calculatePageScore(page);
          return {
            url: page.url,
            path: page.path,
            title: page.title,
            overallScore: pageScore,
            scores: {
              technical:
                page.loadTime < 3000 ? 80 : page.loadTime < 5000 ? 60 : 40,
              content:
                page.wordCount >= 300 ? 80 : page.wordCount >= 100 ? 60 : 40,
              ux:
                (page.hasCTA ? 40 : 0) +
                (page.h1.length === 1 ? 30 : 15) +
                (page.hasForm ? 30 : 0),
            },
            issues: [],
            passing: [],
          };
        });

        const sortedPages = [...pagesAnalyzed].sort(
          (a, b) => b.overallScore - a.overallScore,
        );
        await send("pages", {
          pagesAnalyzed,
          bestPage: sortedPages[0] || null,
          worstPage: sortedPages[sortedPages.length - 1] || null,
        });

        // Phase 5: Generate summary
        await send("status", {
          phase: "summary",
          message: "Generating executive summary...",
        });

        const summaryResponse = await withRetry(async () => {
          return await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 300,
            temperature: 0, // Deterministic output for consistent results
            messages: [
              {
                role: "user",
                content: getExecutiveSummaryPrompt(scraped, categories),
              },
            ],
          });
        });

        if (summaryResponse.usage) {
          tokenTracker.add(summaryResponse.usage);
        }

        const summary =
          summaryResponse.content[0].type === "text"
            ? summaryResponse.content[0].text.trim()
            : "Audit complete. Review the detailed findings below.";

        // Final overall score
        const overallScore = Math.round(weightedSum / totalWeight);
        const tokenUsage = tokenTracker.getUsage();

        // Build category scores for DB
        const categoryScoresForDb: Record<string, number> = {};
        categories.forEach((cat) => {
          const key = cat.name.toLowerCase().replace(/[^a-z]/g, "_");
          categoryScoresForDb[key] = cat.score;
        });

        // Log completed audit to Supabase
        const auditId = await auditIdPromise;
        if (auditId) {
          await completeAuditRecord(auditId, {
            overall_score: overallScore,
            category_scores: categoryScoresForDb,
            summary,
            brief: {
              business_name: brief.businessName,
              business_description: brief.businessDescription,
              target_audience: brief.targetAudience,
              industry: brief.industry,
              site_type: brief.siteType,
              total_pages: brief.totalPages || undefined,
            },
            input_tokens: tokenUsage.inputTokens,
            output_tokens: tokenUsage.outputTokens,
            total_tokens: tokenUsage.totalTokens,
            estimated_cost: tokenUsage.estimatedCost,
          });

          // Increment user's audit usage (only for non-admin audits)
          if (userId && !isAdmin) {
            await incrementUserAuditUsage(userId);
          }
        }

        // Send complete result
        const result: AuditResult = {
          id: auditId || crypto.randomUUID(),
          url: scraped.url,
          overallScore,
          categories,
          summary,
          scrapedAt,
          analyzedAt: new Date(),
          clientLogo: scraped.logoUrl || null,
          brief,
          pageCount: pagesAnalyzed.length,
          pagesAnalyzed,
          bestPage: sortedPages[0] || null,
          worstPage: sortedPages[sortedPages.length - 1] || null,
          tokenUsage,
          pageSpeed: pageSpeedData,
        };

        await send("complete", result);
        await writer.close();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        console.error("[Audit] Error:", errorMessage);

        // Log failed audit to Supabase
        const auditId = await auditIdPromise;
        if (auditId) {
          await failAuditRecord(auditId, errorMessage);
        }

        await send("error", { message: errorMessage });
        await writer.close();
      }
    } catch (outerError) {
      console.error("[Audit] Outer error:", outerError);
      try {
        await send("error", { message: "Audit failed unexpectedly" });
        await writer.close();
      } catch {
        // Ignore close errors
      }
    }
  })();

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
