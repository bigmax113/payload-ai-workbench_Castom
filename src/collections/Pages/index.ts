import type { CollectionConfig } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { mediaSlug } from '../Media'

export const pagesSlug = 'pages'

export const PagesCollection: CollectionConfig = {
  slug: pagesSlug,
  admin: {
    defaultColumns: ['title', 'reviewStatus', 'template', 'updatedAt'],
    group: 'Content',
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      admin: {
        description: 'Stable URL segment or internal page key.',
        position: 'sidebar',
      },
      index: true,
      required: true,
      unique: true,
    },
    {
      name: 'reviewStatus',
      type: 'select',
      admin: {
        position: 'sidebar',
      },
      defaultValue: 'draft',
      options: [
        {
          label: 'Draft',
          value: 'draft',
        },
        {
          label: 'Ready for review',
          value: 'review',
        },
        {
          label: 'Approved',
          value: 'approved',
        },
        {
          label: 'Published',
          value: 'published',
        },
      ],
      required: true,
    },
    {
      name: 'template',
      type: 'select',
      defaultValue: 'standard',
      options: [
        {
          label: 'Standard page',
          value: 'standard',
        },
        {
          label: 'Product detail',
          value: 'product',
        },
        {
          label: 'Documentation',
          value: 'docs',
        },
        {
          label: 'Internal landing',
          value: 'internal',
        },
      ],
    },
    {
      type: 'tabs',
      tabs: [
        {
          fields: [
            {
              name: 'hero',
              type: 'group',
              fields: [
                {
                  name: 'eyebrow',
                  type: 'text',
                },
                {
                  name: 'headline',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'summary',
                  type: 'textarea',
                  maxLength: 360,
                },
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: mediaSlug,
                },
              ],
            },
            {
              name: 'body',
              type: 'richText',
              editor: lexicalEditor({
                features: ({ defaultFeatures }) => [
                  ...defaultFeatures,
                  FixedToolbarFeature(),
                  InlineToolbarFeature(),
                ],
              }),
              required: true,
            },
          ],
          label: 'Content',
        },
        {
          fields: [
            {
              name: 'owner',
              type: 'text',
            },
            {
              name: 'reviewNotes',
              type: 'textarea',
              admin: {
                description: 'Short handoff notes for the person validating this page.',
              },
            },
            {
              name: 'publishedAt',
              type: 'date',
              admin: {
                date: {
                  pickerAppearance: 'dayAndTime',
                },
              },
            },
          ],
          label: 'Review',
        },
      ],
    },
  ],
  versions: {
    drafts: {
      autosave: {
        interval: 1_500,
      },
    },
    maxPerDoc: 20,
  },
}
