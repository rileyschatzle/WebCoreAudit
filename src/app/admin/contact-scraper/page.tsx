'use client';

import { useState, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  Download,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  AlertCircle,
} from 'lucide-react';

// Social platform detection
const SOCIAL_PLATFORMS: Record<string, { name: string; abbrev: string; color: string }> = {
  facebook: { name: 'Facebook', abbrev: 'FB', color: '#1877F2' },
  twitter: { name: 'Twitter/X', abbrev: 'X', color: '#000000' },
  'x.com': { name: 'Twitter/X', abbrev: 'X', color: '#000000' },
  linkedin: { name: 'LinkedIn', abbrev: 'LI', color: '#0A66C2' },
  instagram: { name: 'Instagram', abbrev: 'IG', color: '#E4405F' },
  youtube: { name: 'YouTube', abbrev: 'YT', color: '#FF0000' },
  tiktok: { name: 'TikTok', abbrev: 'TT', color: '#000000' },
};

function getSocialPlatform(url: string): { name: string; abbrev: string; color: string } | null {
  const urlLower = url.toLowerCase();
  for (const [key, value] of Object.entries(SOCIAL_PLATFORMS)) {
    if (urlLower.includes(key)) {
      return value;
    }
  }
  return null;
}

interface ScrapeResult {
  url: string;
  status: 'pending' | 'scraping' | 'success' | 'error';
  emails: string[];
  socialLinks: string[];
  error?: string;
}

export default function ContactScraperPage() {
  const { data: session } = useSession();
  const [urls, setUrls] = useState<string[]>([]);
  const [results, setResults] = useState<ScrapeResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [dragActive, setDragActive] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse CSV line handling quoted values
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim().replace(/^["']|["']$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^["']|["']$/g, ''));
    return result;
  };

  // Check if URL is a third-party service (not a business website)
  const isThirdPartyUrl = (str: string): boolean => {
    const s = str.toLowerCase();
    const thirdPartyDomains = [
      'google.com/maps', 'maps.google', 'goo.gl/maps', 'maps.app.goo.gl',
      'facebook.com', 'fb.com', 'instagram.com', 'twitter.com', 'x.com',
      'linkedin.com', 'youtube.com', 'youtu.be', 'tiktok.com',
      'yelp.com', 'tripadvisor.com', 'yellowpages.com',
      'apple.com/maps', 'bing.com/maps',
    ];
    return thirdPartyDomains.some(domain => s.includes(domain));
  };

  // Check if a string looks like a business website URL (not a third-party service)
  const looksLikeWebsiteUrl = (str: string): boolean => {
    if (!str || str.length < 4) return false;
    const s = str.toLowerCase().trim();

    // Skip third-party services
    if (isThirdPartyUrl(s)) return false;

    // Check for common URL patterns
    return (
      s.startsWith('http://') ||
      s.startsWith('https://') ||
      s.startsWith('www.') ||
      /^[a-z0-9]([a-z0-9-]*[a-z0-9])?\.[a-z]{2,}/.test(s) || // domain.tld pattern
      s.includes('.com') ||
      s.includes('.org') ||
      s.includes('.net') ||
      s.includes('.io') ||
      s.includes('.co')
    );
  };

  // Check if a string looks like any URL (including third-party)
  const looksLikeUrl = (str: string): boolean => {
    if (!str || str.length < 4) return false;
    const s = str.toLowerCase().trim();
    return (
      s.startsWith('http://') ||
      s.startsWith('https://') ||
      s.startsWith('www.') ||
      /^[a-z0-9]([a-z0-9-]*[a-z0-9])?\.[a-z]{2,}/.test(s)
    );
  };

  // Parse file content to extract URLs
  const parseFile = useCallback((content: string, fileName: string): string[] => {
    const lines = content.split(/[\r\n]+/).map(line => line.trim()).filter(Boolean);

    if (fileName.endsWith('.csv')) {
      if (lines.length === 0) return [];

      // Parse header row
      const headerRow = parseCSVLine(lines[0]);
      const headerLower = headerRow.map(h => h.toLowerCase());

      // Find URL column by header name - PRIORITIZE "website" over generic "url"
      // Order matters: prefer more specific names first
      const urlColumnNames = ['website', 'site_url', 'web', 'homepage', 'domain', 'site', 'url', 'link', 'address'];
      let urlColumnIndex = -1;

      // First pass: exact match for "website" column
      const websiteIdx = headerLower.findIndex(h => h === 'website' || h === 'web' || h === 'site_url');
      if (websiteIdx !== -1) {
        urlColumnIndex = websiteIdx;
      } else {
        // Second pass: partial match in priority order
        for (const name of urlColumnNames) {
          const idx = headerLower.findIndex(h => h.includes(name) && !h.includes('map'));
          if (idx !== -1) {
            urlColumnIndex = idx;
            break;
          }
        }
      }

      // Check if first row looks like headers or data
      const firstRowHasUrls = headerRow.some(cell => looksLikeUrl(cell));
      const hasHeaderRow = !firstRowHasUrls && headerRow.some(h =>
        urlColumnNames.some(name => h.toLowerCase().includes(name))
      );

      // If still no URL column found, scan columns to find one with WEBSITE URLs (not maps/social)
      if (urlColumnIndex === -1) {
        const dataStartIndex = hasHeaderRow ? 1 : 0;
        const sampleRows = lines.slice(dataStartIndex, Math.min(dataStartIndex + 5, lines.length));

        if (sampleRows.length > 0) {
          const firstDataRow = parseCSVLine(sampleRows[0]);
          let bestColumnIndex = -1;
          let bestWebsiteCount = 0;

          // Find column with most WEBSITE URLs (excluding maps, social, etc.)
          for (let i = 0; i < firstDataRow.length; i++) {
            const websiteCount = sampleRows.filter(row => {
              const cells = parseCSVLine(row);
              return cells[i] && looksLikeWebsiteUrl(cells[i]);
            }).length;

            if (websiteCount > bestWebsiteCount) {
              bestWebsiteCount = websiteCount;
              bestColumnIndex = i;
            }
          }

          if (bestColumnIndex !== -1 && bestWebsiteCount >= sampleRows.length * 0.3) {
            urlColumnIndex = bestColumnIndex;
          }
        }
      }

      // Default to first column if still not found
      if (urlColumnIndex === -1) {
        urlColumnIndex = 0;
      }

      const startIndex = hasHeaderRow ? 1 : 0;

      // Extract URLs and filter out third-party service URLs
      return lines.slice(startIndex).map(line => {
        const parts = parseCSVLine(line);
        const url = parts[urlColumnIndex]?.trim() || '';
        // Skip if it's a maps/social URL
        if (isThirdPartyUrl(url)) return '';
        return url;
      }).filter(Boolean);
    } else {
      // Plain text - one URL per line, filter out third-party URLs
      return lines.filter(line => !isThirdPartyUrl(line));
    }
  }, []);

  // Validate URL
  const isValidUrl = (url: string): boolean => {
    try {
      const normalized = url.startsWith('http') ? url : `https://${url}`;
      new URL(normalized);
      return true;
    } catch {
      return false;
    }
  };

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.txt'))) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const parsedUrls = parseFile(content, file.name);
        const validUrls = Array.from(new Set(parsedUrls.filter(isValidUrl)));
        setUrls(validUrls);
        setResults([]);
      };
      reader.readAsText(file);
    }
  }, [parseFile]);

  // Handle file select
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const parsedUrls = parseFile(content, file.name);
        const validUrls = Array.from(new Set(parsedUrls.filter(isValidUrl)));
        setUrls(validUrls);
        setResults([]);
      };
      reader.readAsText(file);
    }
  }, [parseFile]);

  // Start scraping - process URLs one at a time
  const startScraping = useCallback(async () => {
    if (urls.length === 0) return;

    setIsProcessing(true);
    setProgress({ current: 0, total: urls.length });

    // Initialize results with pending status
    const initialResults: ScrapeResult[] = urls.map(url => ({
      url,
      status: 'pending',
      emails: [],
      socialLinks: [],
    }));
    setResults(initialResults);

    // Process URLs one at a time
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];

      // Update progress and mark current as scraping
      setProgress({ current: i + 1, total: urls.length });
      setResults(prev => prev.map((r, idx) =>
        idx === i ? { ...r, status: 'scraping' } : r
      ));

      try {
        const response = await fetch('/api/admin/contact-scraper', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urls: [url] }),
        });

        if (!response.ok) {
          throw new Error('Request failed');
        }

        const data = await response.json();
        const result = data.results?.[0];

        if (result) {
          setResults(prev => prev.map((r, idx) =>
            idx === i ? {
              url: r.url,
              status: result.status,
              emails: result.emails || [],
              socialLinks: result.socialLinks || [],
              error: result.error,
            } : r
          ));
        }
      } catch (error) {
        setResults(prev => prev.map((r, idx) =>
          idx === i ? {
            ...r,
            status: 'error',
            error: error instanceof Error ? error.message : 'Failed to scrape',
          } : r
        ));
      }

      // Small delay between requests
      if (i < urls.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    setIsProcessing(false);
  }, [urls]);

  // Export to CSV
  const exportToCsv = useCallback(() => {
    const headers = ['URL', 'Status', 'Error', 'Emails', 'Facebook', 'Twitter', 'LinkedIn', 'Instagram', 'YouTube', 'TikTok'];

    const rows = results.map(r => {
      const socials: Record<string, string> = {};
      r.socialLinks.forEach(link => {
        const platform = getSocialPlatform(link);
        if (platform) {
          socials[platform.name.toLowerCase().replace('twitter/x', 'twitter')] = link;
        }
      });

      return [
        r.url,
        r.status,
        r.error || '',
        r.emails.join('; '),
        socials['facebook'] || '',
        socials['twitter'] || '',
        socials['linkedin'] || '',
        socials['instagram'] || '',
        socials['youtube'] || '',
        socials['tiktok'] || '',
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contact-scrape-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [results]);

  // Copy emails
  const copyEmails = useCallback(async (emails: string[], index: number) => {
    await navigator.clipboard.writeText(emails.join(', '));
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }, []);

  // Clear all
  const clearAll = useCallback(() => {
    setUrls([]);
    setResults([]);
    setProgress({ current: 0, total: 0 });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Contact Scraper</h1>
        <p className="text-gray-500">Upload a list of websites to extract contact emails and social media links</p>
      </div>

      {/* File Upload Zone */}
      {urls.length === 0 && !isProcessing && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all
            ${dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100'
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Upload className={`w-12 h-12 mx-auto mb-4 ${dragActive ? 'text-blue-500' : 'text-gray-400'}`} />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Drop CSV or TXT file here
          </h3>
          <p className="text-gray-500 mb-4">or click to browse</p>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <FileText className="w-4 h-4" /> .csv
            </span>
            <span className="flex items-center gap-1">
              <FileText className="w-4 h-4" /> .txt
            </span>
          </div>
        </div>
      )}

      {/* URL Preview (before processing) */}
      {urls.length > 0 && results.length === 0 && !isProcessing && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">{urls.length} URLs loaded</h3>
              <p className="text-sm text-gray-500">Review and start scraping</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={clearAll}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
              <button
                onClick={startScraping}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-medium"
              >
                Start Scraping
              </button>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            <div className="space-y-1">
              {urls.slice(0, 50).map((url, i) => (
                <div key={i} className="text-sm text-gray-600 py-1 px-2 bg-gray-50 rounded">
                  {url}
                </div>
              ))}
              {urls.length > 50 && (
                <div className="text-sm text-gray-400 py-2 px-2">
                  ... and {urls.length - 50} more URLs
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar (during processing) */}
      {isProcessing && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <span className="font-medium text-gray-900">Scraping websites...</span>
            </div>
            <span className="text-sm text-gray-500">
              {progress.current} of {progress.total}
            </span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Results Table */}
      {results.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          {/* Results Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="font-semibold text-gray-900">Results</h3>
              {!isProcessing && (
                <div className="flex items-center gap-3 text-sm">
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="w-4 h-4" /> {successCount} successful
                  </span>
                  {errorCount > 0 && (
                    <span className="flex items-center gap-1 text-red-600">
                      <XCircle className="w-4 h-4" /> {errorCount} failed
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {!isProcessing && (
                <>
                  <button
                    onClick={clearAll}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear
                  </button>
                  <button
                    onClick={exportToCsv}
                    className="flex items-center gap-2 px-4 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Results Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-left text-sm text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-medium">URL</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Emails</th>
                  <th className="px-4 py-3 font-medium">Social Media</th>
                  <th className="px-4 py-3 font-medium w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {results.map((result, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <a
                        href={result.url.startsWith('http') ? result.url : `https://${result.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {result.url.replace(/^https?:\/\//, '').slice(0, 40)}
                        {result.url.replace(/^https?:\/\//, '').length > 40 && '...'}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      {result.status === 'pending' && (
                        <span className="text-sm text-gray-400">Pending</span>
                      )}
                      {result.status === 'scraping' && (
                        <span className="flex items-center gap-1 text-sm text-blue-600">
                          <Loader2 className="w-3 h-3 animate-spin" /> Scraping
                        </span>
                      )}
                      {result.status === 'success' && (
                        <span className="flex items-center gap-1 text-sm text-green-600">
                          <CheckCircle className="w-3 h-3" /> Done
                        </span>
                      )}
                      {result.status === 'error' && (
                        <div className="group relative">
                          <span className="flex items-center gap-1 text-sm text-red-600 cursor-help">
                            <XCircle className="w-3 h-3" /> Error
                          </span>
                          {result.error && (
                            <div className="absolute left-0 top-full mt-1 z-10 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
                              {result.error}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {result.emails.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {result.emails.slice(0, 3).map((email, i) => (
                            <span key={i} className="text-sm text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                              {email}
                            </span>
                          ))}
                          {result.emails.length > 3 && (
                            <span className="text-sm text-gray-500">+{result.emails.length - 3}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {result.socialLinks.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {result.socialLinks.map((link, i) => {
                            const platform = getSocialPlatform(link);
                            if (!platform) return null;
                            return (
                              <a
                                key={i}
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-medium px-2 py-0.5 rounded"
                                style={{
                                  backgroundColor: `${platform.color}15`,
                                  color: platform.color
                                }}
                              >
                                {platform.abbrev}
                              </a>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {result.emails.length > 0 && (
                        <button
                          onClick={() => copyEmails(result.emails, index)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          title="Copy emails"
                        >
                          {copiedIndex === index ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {urls.length === 0 && results.length === 0 && !isProcessing && (
        <div className="mt-8 text-center">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No data yet</h3>
          <p className="text-gray-400">Upload a file with website URLs to get started</p>
        </div>
      )}
    </div>
  );
}
