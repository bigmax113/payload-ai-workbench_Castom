import React from 'react'

const quickLinks = [
  {
    description: 'Build structured landing pages, guides, and internal help screens.',
    href: '/admin/collections/pages',
    label: 'Pages',
  },
  {
    description: 'Write and review long-form content with drafts, SEO, blocks, and tables.',
    href: '/admin/collections/articles',
    label: 'Articles',
  },
  {
    description: 'Track editorial stages, owners, readiness, and operational notes.',
    href: '/admin/collections/editorial-workflows',
    label: 'Workflows',
  },
  {
    description: 'Give testers clear tasks for checking editor behavior and admin usability.',
    href: '/admin/collections/review-tasks',
    label: 'Review Tasks',
  },
]

const metrics = [
  {
    label: 'Editor surfaces',
    value: '4',
  },
  {
    label: 'Draft autosave',
    value: '1.5s',
  },
  {
    label: 'Review states',
    value: '6',
  },
]

export const AdminDashboard = () => {
  return (
    <section className="custom-admin-dashboard" aria-label="Custom admin overview">
      <div className="custom-admin-dashboard__intro">
        <div>
          <p className="custom-admin-dashboard__eyebrow">Custom Payload Admin</p>
          <h1>Editorial control room</h1>
          <p>
            A focused admin workspace for testing real editor flows: pages, articles, media,
            review queues, and publishing handoff.
          </p>
        </div>
        <div className="custom-admin-dashboard__metrics" aria-label="Admin workspace metrics">
          {metrics.map((metric) => (
            <div className="custom-admin-dashboard__metric" key={metric.label}>
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="custom-admin-dashboard__grid">
        {quickLinks.map((item) => (
          <a className="custom-admin-dashboard__link" href={item.href} key={item.href}>
            <strong>{item.label}</strong>
            <span>{item.description}</span>
          </a>
        ))}
      </div>
    </section>
  )
}

export default AdminDashboard
