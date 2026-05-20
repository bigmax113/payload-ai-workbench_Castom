import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { ArticlesCollection, articlesSlug } from './collections/Articles'
import {
  EditorialWorkflowsCollection,
  editorialWorkflowsSlug,
} from './collections/EditorialWorkflows'
import { Media } from './collections/Media'
import { PagesCollection, pagesSlug } from './collections/Pages'
import { ReviewTasksCollection, reviewTasksSlug } from './collections/ReviewTasks'
import { Users, usersSlug } from './collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const richTextParagraph = (text: string) => ({
  root: {
    children: [
      {
        children: [
          {
            text,
            type: 'text',
          },
        ],
        direction: null,
        format: '' as const,
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
    ],
    direction: null,
    format: '' as const,
    indent: 0,
    type: 'root',
    version: 1,
  },
})

export default buildConfig({
  admin: {
    user: usersSlug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' - Custom Admin',
    },
    components: {
      beforeDashboard: ['/admin/components/AdminDashboard#AdminDashboard'],
    },
  },
  collections: [
    PagesCollection,
    ArticlesCollection,
    EditorialWorkflowsCollection,
    ReviewTasksCollection,
    Media,
    Users,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL || '',
    },
    push: process.env.PAYLOAD_DB_PUSH !== 'false',
  }),
  onInit: async (payload) => {
    const adminEmail = process.env.PAYLOAD_ADMIN_EMAIL || 'dev@payloadcms.com'
    const adminPassword = process.env.PAYLOAD_ADMIN_PASSWORD || 'test'
    const users = await payload.find({
      collection: usersSlug,
      limit: 1,
      where: {
        email: {
          equals: adminEmail,
        },
      },
    })

    if (!users.totalDocs) {
      await payload.create({
        collection: usersSlug,
        data: {
          email: adminEmail,
          name: 'Demo Admin',
          password: adminPassword,
          role: 'admin',
        },
      })
    }

    const pages = await payload.find({
      collection: pagesSlug,
      limit: 1,
      where: {
        slug: {
          equals: 'custom-admin-overview',
        },
      },
    })

    let demoPageID = pages.docs[0]?.id

    if (!demoPageID) {
      const page = await payload.create({
        collection: pagesSlug,
        data: {
          body: richTextParagraph(
            'Use this page to validate tabs, rich text editing, review notes, autosave, and publishing states inside the custom admin.',
          ),
          hero: {
            eyebrow: 'Admin test page',
            headline: 'Custom admin overview',
            summary:
              'A realistic page record for checking editor ergonomics without the stock starter screen.',
          },
          owner: 'Content Operations',
          reviewNotes: 'Check field grouping, sidebar controls, autosave behavior, and draft previews.',
          slug: 'custom-admin-overview',
          status: 'review',
          template: 'internal',
          title: 'Custom admin overview',
        },
      })

      demoPageID = page.id
    }

    const articles = await payload.find({
      collection: articlesSlug,
      limit: 1,
      where: {
        slug: {
          equals: 'editor-testing-guide',
        },
      },
    })

    let demoArticleID = articles.docs[0]?.id

    if (!demoArticleID) {
      const article = await payload.create({
        collection: articlesSlug,
        data: {
          category: 'internal-guide',
          content: richTextParagraph(
            'This starter article demonstrates the Payload editor, drafts, media fields, SEO fields, blocks, and review handoff for a tester-friendly CMS.',
          ),
          owner: 'Content Operations',
          slug: 'editor-testing-guide',
          status: 'draft',
          summary: 'A ready-made article for testing the custom Payload admin editor.',
          title: 'Editor testing guide',
        },
      })

      demoArticleID = article.id
    }

    const workflows = await payload.find({
      collection: editorialWorkflowsSlug,
      limit: 1,
      where: {
        name: {
          equals: 'Editorial review pipeline',
        },
      },
    })

    let demoWorkflowID = workflows.docs[0]?.id

    if (!demoWorkflowID) {
      const workflow = await payload.create({
        collection: editorialWorkflowsSlug,
        data: {
          name: 'Editorial review pipeline',
          owner: 'Content Operations',
          stages: [
            {
              label: 'Create draft',
              notes: 'Author fills required content fields and uploads supporting media.',
              state: 'done',
            },
            {
              label: 'Review structure',
              notes: 'Tester checks tabs, sidebar fields, validation, relationships, and autosave.',
              state: 'in-progress',
            },
            {
              label: 'Approve for publishing',
              notes: 'Final reviewer confirms SEO fields, status changes, and handoff notes.',
              state: 'todo',
            },
          ],
          status: 'active',
          summary:
            'A compact workflow for validating whether the admin panel feels clear to a non-technical editor.',
        },
      })

      demoWorkflowID = workflow.id
    }

    const reviewTasks = await payload.find({
      collection: reviewTasksSlug,
      limit: 1,
      where: {
        title: {
          equals: 'Validate custom admin flow',
        },
      },
    })

    if (!reviewTasks.totalDocs) {
      await payload.create({
        collection: reviewTasksSlug,
        data: {
          assignee: 'Tester',
          checklist: [
            {
              isDone: false,
              label: 'Open the dashboard and confirm the custom overview is visible.',
            },
            {
              isDone: false,
              label: 'Create or edit a page using the Content and Review tabs.',
            },
            {
              isDone: false,
              label: 'Update workflow stages and confirm list columns are useful.',
            },
          ],
          notes:
            'This task is intentionally admin-only. It exists to validate editing comfort and review handoff.',
          priority: 'high',
          status: 'new',
          target: {
            relationTo: pagesSlug,
            value: demoPageID,
          },
          title: 'Validate custom admin flow',
          workflow: demoWorkflowID,
        },
      })
    }

    if (demoArticleID) {
      payload.logger.info(`Seed article ready: ${demoArticleID}`)
    }
  },
  sharp,
  plugins: [],
})
