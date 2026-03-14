# Scripts

Scripts used for deployment, dev servers, and one-off tests. Run from **project root**.

---

## Deploy (npm)

| Script | Command | Description |
|--------|---------|-------------|
| deploy:railway | `npm run deploy:railway` | Railway backend deploy prep |
| deploy:vercel | `npm run deploy:vercel` | Vercel frontend deploy prep |
| deploy:quick | `npm run deploy:quick` | Quick one-shot deploy |
| railway:env | `npm run railway:env` | Generate Railway env from `.env` |
| trigger:vercel | `npm run trigger:vercel` | Trigger Vercel deploy |

**Files:** `deploy-railway.sh`, `deploy-vercel.sh`, `quick-deploy.sh`, `generate-railway-env.sh`, `trigger-vercel-deploy.js`

---

## Dev / Start (npm)

| Script | Command | Description |
|--------|---------|-------------|
| start | `npm start` | Start app (Railway entry: `start-railway.js`) |
| start:railway | `npm run start:railway` | Same as above |
| dev:full | `npm run dev:full` | Mobile dev (runs `start-mobile-dev.js`) |

**Files:** `start-railway.js`, `start-mobile-dev.js`

---

## Test / Diagnose (npm)

| Script | Command | Description |
|--------|---------|-------------|
| test:login | `npm run test:login` | Login flow diagnostic |
| test:language | `npm run test:language` | Language sync test |
| test:mongodb | `npm run test:mongodb` | MongoDB connection + healthSummary read/write |
| fix:deployment | `npm run fix:deployment` | Deployment error diagnostic |

**Files:** `test-login.js`, `test-language-sync.js`, `test-mongodb-health-summary.js`, `fix-deployment-errors.js`

---

## Run manually (no npm script)

| File | Usage | Description |
|------|--------|-------------|
| test-qwen-cn.js | `node scripts/test-qwen-cn.js` | Check China/Qwen (DashScope) config and optional healthChat call |
| sync-branches.sh | `./scripts/sync-branches.sh` | Sync `main` and `release` branches (git) |

---

## Direct run (from project root)

```bash
# Shell (need execute permission: chmod +x scripts/*.sh)
./scripts/deploy-railway.sh
./scripts/deploy-vercel.sh
./scripts/quick-deploy.sh
./scripts/generate-railway-env.sh
./scripts/sync-branches.sh

# Node
node scripts/test-login.js
node scripts/test-language-sync.js
node scripts/test-mongodb-health-summary.js
node scripts/test-qwen-cn.js
node scripts/fix-deployment-errors.js
node scripts/start-railway.js
node scripts/start-mobile-dev.js
node scripts/trigger-vercel-deploy.js
```

---

## Notes

- All scripts assume they are run from the **project root**.
- Shell scripts need `chmod +x scripts/*.sh` if you get permission denied.
- Node scripts require `npm install` to be run first.
