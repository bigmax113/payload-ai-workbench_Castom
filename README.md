# Payload Custom Admin Workbench

Standalone Payload CMS project for testing a customized admin panel. There is no chat, no external model integration, and no generated-answer workflow: the project is focused on the admin experience only.

## What Is Inside

- `/admin` - customized Payload Admin with an editorial dashboard block.
- `Pages` - page editor with tabs, hero fields, rich text, draft autosave, and review notes.
- `Articles` - long-form editor with SEO, blocks, tables, media, and draft versions.
- `Editorial Workflows` - operational stages for review and publishing validation.
- `Review Tasks` - tester-friendly checklist items linked to content and workflows.
- `Media` and `Users` - supporting admin surfaces for uploads and account management.

The public root route redirects straight to `/admin`.

## Local Start

```powershell
Copy-Item .env.example .env
notepad .env
corepack pnpm install
corepack pnpm dev
```

Open:

```text
http://localhost:3000/admin
```

Default local admin:

```text
dev@payloadcms.com
test
```

## Docker Start

```powershell
docker compose up --build
```

## Render

This project includes `render.yaml`.

1. Push this folder to GitHub.
2. In Render, choose `New -> Blueprint`.
3. Connect the repository.
4. Set `PAYLOAD_ADMIN_PASSWORD`.
5. Recommended: set `PAYLOAD_SECRET` to a long random string for persistent sessions.

If you are using an existing Render Web Service instead of creating from Blueprint, create a Render PostgreSQL database and add its Internal Database URL to the web service as both `DATABASE_URL` and `POSTGRES_URL`.

For this tester build, `PAYLOAD_DB_PUSH=true` lets Payload create and update Postgres tables on boot. Set it to `false` only when you decide to manage migrations manually.
