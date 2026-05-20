import React from 'react'
import './styles.css'

export const metadata = {
  description: 'Custom Payload admin workspace for editor and review-flow testing.',
  title: 'Payload Custom Admin',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
