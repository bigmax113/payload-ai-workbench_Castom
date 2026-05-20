# Payload AI Tester Workbench

Clean standalone Payload CMS project for testing AI-assisted document workflows.

## What Is Inside

- `/ai` - convenient web UI for document QA, source preview, and LM Studio calls.
- `/admin` - Payload Admin for non-technical testers.
- `AI Projects` - goals, owners, model defaults, and success criteria.
- `Prompt Templates` - reusable QA, summary, audit, and draft prompts.
- `Test Runs` - saved tester questions, answers, sources, and review notes.
- `Articles` and `Media` - normal CMS editor surfaces for content testing.

## Local Start

```powershell
Copy-Item .env.example .env
notepad .env
corepack pnpm install
corepack pnpm dev
```

Open:

```text
http://localhost:3000/ai
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

Set `AI_DOCS_DIR` in `.env` if you want Docker to mount a real document folder.

## LM Studio

For local development:

```text
LM_STUDIO_BASE_URL=http://127.0.0.1:1234/v1
LM_STUDIO_MODEL=qwen/qwen3.6-35b-a3b
LM_STUDIO_EMBEDDING_MODEL=text-embedding-bge-m3
```

For Docker, use `host.docker.internal` instead of `127.0.0.1`.

## Render

This project includes `render.yaml`.

1. Push this folder as a new GitHub repository.
2. In Render, choose `New -> Blueprint`.
3. Connect the new repository.
4. Set `PAYLOAD_ADMIN_PASSWORD`.
5. Optional: set remote LM Studio URLs if AI calls should work in the cloud.

Render cannot call LM Studio running on your laptop through `localhost`.

For this tester build, `PAYLOAD_DB_PUSH=true` lets Payload create/update Postgres tables on boot.
Set it to `false` only when you decide to manage migrations manually.
