# GitHub Upload

Use this folder as the repository root.

## Git Commands

```powershell
cd "C:\Users\bigma\OneDrive\Документы\New project\payload-ai-workbench_Castom-extracted"
git add .
git commit -m "Convert to custom admin-only Payload project"
git push origin main
```

## First Checks

```powershell
corepack pnpm install
corepack pnpm run build
```

For local Docker:

```powershell
docker compose up --build
```

For Render:

1. Connect the GitHub repository as a Blueprint or Docker web service.
2. Set `PAYLOAD_ADMIN_PASSWORD`.
3. Keep `PAYLOAD_DB_PUSH=true` for the first deployment.
