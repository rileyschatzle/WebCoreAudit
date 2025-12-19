import { createHash } from 'crypto';
import { AuditResult } from '@/lib/types/audit';

// Check if database is configured
function isDatabaseConfigured(): boolean {
  return !!(process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('[project-ref]'));
}

// Lazy load Prisma client only if database is configured
async function getPrismaClient() {
  if (!isDatabaseConfigured()) {
    return null;
  }
  try {
    const { prisma } = await import('@/lib/db');
    return prisma;
  } catch (error) {
    console.warn('[AuditLogger] Prisma client not available:', error);
    return null;
  }
}

// Hash IP address for privacy (one-way hash)
function hashIP(ip: string): string {
  const salt = process.env.NEXTAUTH_SECRET || 'default-salt';
  return createHash('sha256').update(ip + salt).digest('hex').slice(0, 16);
}

// Truncate user agent to reasonable length
function sanitizeUserAgent(ua: string | null): string | null {
  if (!ua) return null;
  return ua.slice(0, 256);
}

export async function logAudit(
  result: AuditResult,
  request: Request
): Promise<void> {
  try {
    const prisma = await getPrismaClient();
    if (!prisma) {
      console.log('[AuditLogger] Database not configured, skipping audit log');
      return;
    }

    // Extract IP address
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const rawIP = forwardedFor?.split(',')[0]?.trim() || realIP || 'unknown';

    // Hash the IP for privacy
    const hashedIP = rawIP !== 'unknown' ? hashIP(rawIP) : null;

    // Get user agent
    const userAgent = sanitizeUserAgent(request.headers.get('user-agent'));

    // Prepare category scores for storage
    const categoryScores = result.categories.map((c) => ({
      name: c.name,
      score: c.score,
    }));

    await prisma.auditLog.create({
      data: {
        url: result.url,
        overallScore: result.overallScore,
        categoryScores: categoryScores,
        inputTokens: result.tokenUsage?.inputTokens || 0,
        outputTokens: result.tokenUsage?.outputTokens || 0,
        totalTokens: result.tokenUsage?.totalTokens || 0,
        estimatedCost: result.tokenUsage?.estimatedCost || 0,
        ipAddress: hashedIP,
        userAgent,
        status: 'complete',
        completedAt: new Date(),
      },
    });

    console.log('[AuditLogger] Logged audit for:', result.url);
  } catch (error) {
    // Log error but don't throw - audit logging should not block the response
    console.error('[AuditLogger] Failed to log audit:', error);
  }
}

export async function logFailedAudit(
  url: string,
  errorMessage: string,
  request: Request
): Promise<void> {
  try {
    const prisma = await getPrismaClient();
    if (!prisma) {
      console.log('[AuditLogger] Database not configured, skipping failed audit log');
      return;
    }

    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const rawIP = forwardedFor?.split(',')[0]?.trim() || realIP || 'unknown';
    const hashedIP = rawIP !== 'unknown' ? hashIP(rawIP) : null;
    const userAgent = sanitizeUserAgent(request.headers.get('user-agent'));

    await prisma.auditLog.create({
      data: {
        url,
        overallScore: 0,
        ipAddress: hashedIP,
        userAgent,
        status: 'failed',
        errorMessage: errorMessage.slice(0, 500),
      },
    });

    console.log('[AuditLogger] Logged failed audit for:', url);
  } catch (error) {
    console.error('[AuditLogger] Failed to log failed audit:', error);
  }
}
