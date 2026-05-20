import type { CollectionConfig } from 'payload'

export const usersSlug = 'users'

export const Users: CollectionConfig = {
  slug: usersSlug,
  admin: {
    defaultColumns: ['email', 'name', 'role', 'updatedAt'],
    group: 'Administration',
    useAsTitle: 'email',
  },
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'role',
      type: 'select',
      defaultValue: 'editor',
      options: [
        {
          label: 'Admin',
          value: 'admin',
        },
        {
          label: 'Editor',
          value: 'editor',
        },
        {
          label: 'Reviewer',
          value: 'reviewer',
        },
      ],
      required: true,
    },
    {
      name: 'department',
      type: 'text',
    },
  ],
}
