import type { CollectionConfig } from 'payload'

import { articlesSlug } from '../Articles'
import { editorialWorkflowsSlug } from '../EditorialWorkflows'
import { pagesSlug } from '../Pages'

export const reviewTasksSlug = 'review-tasks'

export const ReviewTasksCollection: CollectionConfig = {
  slug: reviewTasksSlug,
  admin: {
    defaultColumns: ['title', 'status', 'priority', 'assignee', 'updatedAt'],
    group: 'Operations',
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      admin: {
        position: 'sidebar',
      },
      defaultValue: 'new',
      options: [
        {
          label: 'New',
          value: 'new',
        },
        {
          label: 'In progress',
          value: 'in-progress',
        },
        {
          label: 'Blocked',
          value: 'blocked',
        },
        {
          label: 'Ready for sign-off',
          value: 'ready',
        },
        {
          label: 'Done',
          value: 'done',
        },
      ],
      required: true,
    },
    {
      name: 'priority',
      type: 'select',
      admin: {
        position: 'sidebar',
      },
      defaultValue: 'normal',
      options: [
        {
          label: 'Low',
          value: 'low',
        },
        {
          label: 'Normal',
          value: 'normal',
        },
        {
          label: 'High',
          value: 'high',
        },
      ],
      required: true,
    },
    {
      name: 'assignee',
      type: 'text',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'dueAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
    },
    {
      name: 'workflow',
      type: 'relationship',
      relationTo: editorialWorkflowsSlug,
    },
    {
      name: 'target',
      type: 'relationship',
      admin: {
        description: 'The page or article this review task belongs to.',
      },
      relationTo: [pagesSlug, articlesSlug],
    },
    {
      name: 'checklist',
      type: 'array',
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
        },
        {
          name: 'isDone',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
      labels: {
        plural: 'Checklist items',
        singular: 'Checklist item',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Tester observations, blockers, or handoff notes.',
      },
    },
  ],
}
