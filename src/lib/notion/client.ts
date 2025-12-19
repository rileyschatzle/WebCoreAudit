import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

// Database ID will be stored after creation
let emailDatabaseId: string | null = null;

// Format page ID for Notion API (add hyphens)
function formatPageId(id: string): string {
  if (id.includes('-')) return id;
  return `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`;
}

export async function getOrCreateEmailDatabase(): Promise<string> {
  if (emailDatabaseId) {
    return emailDatabaseId;
  }

  const pageId = formatPageId(process.env.NOTION_PAGE_ID || '');

  // Search for existing database in the page
  const response = await notion.blocks.children.list({
    block_id: pageId,
  });

  // Look for existing Email Subscribers database
  for (const block of response.results) {
    if ('type' in block && block.type === 'child_database') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dbBlock = block as any;
      if (dbBlock.child_database?.title === 'Email Subscribers') {
        emailDatabaseId = block.id;
        return emailDatabaseId;
      }
    }
  }

  // Create new database if not found
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const newDatabase = await (notion.databases.create as any)({
    parent: {
      type: 'page_id',
      page_id: pageId,
    },
    title: [
      {
        type: 'text',
        text: {
          content: 'Email Subscribers',
        },
      },
    ],
    properties: {
      Email: {
        title: {},
      },
      Source: {
        select: {
          options: [
            { name: 'audit', color: 'blue' },
            { name: 'waitlist', color: 'green' },
            { name: 'newsletter', color: 'purple' },
          ],
        },
      },
      'Audit URL': {
        url: {},
      },
      'Submitted At': {
        date: {},
      },
      Status: {
        select: {
          options: [
            { name: 'New', color: 'yellow' },
            { name: 'Contacted', color: 'blue' },
            { name: 'Converted', color: 'green' },
            { name: 'Unsubscribed', color: 'red' },
          ],
        },
      },
    },
  });

  emailDatabaseId = newDatabase.id;
  return emailDatabaseId as string;
}

export async function addEmailToNotion(
  email: string,
  source: 'audit' | 'waitlist' | 'newsletter',
  auditUrl?: string
): Promise<{ success: boolean; pageId?: string; error?: string }> {
  try {
    const databaseId = await getOrCreateEmailDatabase();

    // Check if email already exists using search
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await (notion as any).databases.query({
      database_id: databaseId,
      filter: {
        property: 'Email',
        title: {
          equals: email.toLowerCase().trim(),
        },
      },
    });

    if (existing.results.length > 0) {
      // Update existing entry if audit URL is new
      if (auditUrl) {
        const existingPage = existing.results[0];
        await notion.pages.update({
          page_id: existingPage.id,
          properties: {
            'Audit URL': {
              url: auditUrl,
            },
          },
        });
      }
      return { success: true, pageId: existing.results[0].id };
    }

    // Create new entry
    const page = await notion.pages.create({
      parent: {
        database_id: databaseId,
      },
      properties: {
        Email: {
          title: [
            {
              text: {
                content: email.toLowerCase().trim(),
              },
            },
          ],
        },
        Source: {
          select: {
            name: source,
          },
        },
        'Audit URL': auditUrl ? {
          url: auditUrl,
        } : { url: null },
        'Submitted At': {
          date: {
            start: new Date().toISOString(),
          },
        },
        Status: {
          select: {
            name: 'New',
          },
        },
      },
    });

    return { success: true, pageId: page.id };
  } catch (error) {
    console.error('Notion sync error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sync to Notion'
    };
  }
}

export { notion };
