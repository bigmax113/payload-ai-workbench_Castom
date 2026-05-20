import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { aiDocsEndpoint, aiFoldersEndpoint, askEndpoint } from './ai/endpoints'
import { AIProjectsCollection, aiProjectsSlug } from './collections/AIProjects'
import { ArticlesCollection, articlesSlug } from './collections/Articles'
import { Media } from './collections/Media'
import { PromptTemplatesCollection, promptTemplatesSlug } from './collections/PromptTemplates'
import { TestRunsCollection, testRunsSlug } from './collections/TestRuns'
import { Users, usersSlug } from './collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: usersSlug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    AIProjectsCollection,
    PromptTemplatesCollection,
    TestRunsCollection,
    ArticlesCollection,
    Media,
    Users,
  ],
  editor: lexicalEditor(),
  endpoints: [aiDocsEndpoint, aiFoldersEndpoint, askEndpoint],
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
          password: adminPassword,
        },
      })
    }

    const demoProjects = await payload.find({
      collection: aiProjectsSlug,
      limit: 1,
      where: {
        name: {
          equals: 'AI Docs Workbench Demo',
        },
      },
    })

    let demoProjectID = demoProjects.docs[0]?.id

    if (!demoProjectID) {
      const project = await payload.create({
        collection: aiProjectsSlug,
        data: {
          defaultModel: 'qwen/qwen3.6-35b-a3b',
          docsFolder: 'all',
          goal: 'Let a non-technical tester ask questions over local product documents, inspect sources, and save validation notes in the admin panel.',
          name: 'AI Docs Workbench Demo',
          owner: 'Content QA',
          status: 'testing',
          successCriteria: [
            {
              criterion: 'Open /ai and preview retrieved sources before calling the model.',
            },
            {
              criterion: 'Open /admin and manage articles, prompts, media, and test runs.',
            },
          ],
        },
      })

      demoProjectID = project.id
    }

    const demoPrompts = await payload.find({
      collection: promptTemplatesSlug,
      limit: 1,
      where: {
        title: {
          equals: 'Document QA starter',
        },
      },
    })

    let demoPromptID = demoPrompts.docs[0]?.id

    if (!demoPromptID) {
      const prompt = await payload.create({
        collection: promptTemplatesSlug,
        data: {
          isEnabled: true,
          maxChunks: 8,
          mode: 'qa',
          systemPrompt:
            'Answer in the same language as the question. Use only the retrieved context. If the answer is not present, say what is missing and list the closest sources.',
          temperature: 0.2,
          title: 'Document QA starter',
          userPrompt:
            'Summarize the answer for a business tester and cite the most relevant files.',
        },
      })

      demoPromptID = prompt.id
    }

    const demoArticles = await payload.find({
      collection: articlesSlug,
      limit: 1,
      where: {
        slug: {
          equals: 'payload-ai-workbench-demo',
        },
      },
    })

    if (!demoArticles.totalDocs) {
      await payload.create({
        collection: articlesSlug,
        data: {
          category: 'knowledge-base',
          content: {
            root: {
              children: [
                {
                  children: [
                    {
                      text: 'This starter article demonstrates the Payload editor, drafts, media fields, and SEO fields for a tester-friendly AI CMS workflow.',
                      type: 'text',
                    },
                  ],
                  direction: null,
                  format: '',
                  indent: 0,
                  type: 'paragraph',
                  version: 1,
                },
              ],
              direction: null,
              format: '',
              indent: 0,
              type: 'root',
              version: 1,
            },
          },
          owner: 'Content QA',
          slug: 'payload-ai-workbench-demo',
          status: 'draft',
          summary: 'A ready-made article for testing the Payload admin editor.',
          title: 'Payload AI Workbench demo article',
        },
      })
    }

    const demoRuns = await payload.find({
      collection: testRunsSlug,
      limit: 1,
      where: {
        title: {
          equals: 'First tester run',
        },
      },
    })

    if (!demoRuns.totalDocs) {
      await payload.create({
        collection: testRunsSlug,
        data: {
          project: demoProjectID,
          promptTemplate: demoPromptID,
          question: 'What should a tester check first in this workspace?',
          status: 'new',
          title: 'First tester run',
        },
      })
    }
  },
  sharp,
  plugins: [],
})
