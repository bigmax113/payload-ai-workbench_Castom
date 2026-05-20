import type { CollectionConfig } from 'payload'

export const editorialWorkflowsSlug = 'editorial-workflows'

export const EditorialWorkflowsCollection: CollectionConfig = {
  slug: editorialWorkflowsSlug,
  admin: {
    defaultColumns: ['name', 'status', 'owner', 'updatedAt'],
    group: 'Operations',
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      admin: {
        position: 'sidebar',
      },
      defaultValue: 'active',
      options: [
        {
          label: 'Planned',
          value: 'planned',
        },
        {
          label: 'Active',
          value: 'active',
        },
        {
          label: 'Paused',
          value: 'paused',
        },
        {
          label: 'Archived',
          value: 'archived',
        },
      ],
      required: true,
    },
    {
      name: 'owner',
      type: 'text',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'summary',
      type: 'textarea',
      admin: {
        description: 'What this workflow is used to validate or publish.',
      },
      maxLength: 420,
    },
    {
      name: 'stages',
      type: 'array',
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
        },
        {
          name: 'state',
          type: 'select',
          defaultValue: 'todo',
          options: [
            {
              label: 'To do',
              value: 'todo',
            },
            {
              label: 'In progress',
              value: 'in-progress',
            },
            {
              label: 'Done',
              value: 'done',
            },
          ],
          required: true,
        },
        {
          name: 'notes',
          type: 'textarea',
        },
      ],
      labels: {
        plural: 'Stages',
        singular: 'Stage',
      },
    },
  ],
}
