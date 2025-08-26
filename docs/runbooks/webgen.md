# Runbook

1) Migrate DB
   cd services/api
   alembic upgrade head

2) Restart services
   systemctl restart aeon-api
   systemctl enable --now aeon-webgen-worker
   systemctl status aeon-webgen-worker

3) Required env
   DATABASE_URL=postgresql+asyncpg://...
   REDIS_HOST=redis
   REDIS_PORT=6379
   S3_BUCKET=aeon-artifacts
   AWS_REGION=us-west-2
   VERCEL_DEPLOY_HOOK_URL=https://api.vercel.com/v1/integrations/deploy/prj_xxx/xxx
   API_BASE=https://api.aeonprotocol.com
   OPENAI_API_KEY=***
   OPENAI_MODEL=gpt-4o-mini

4) Smoke test
   # Enhance
   curl -s -X POST "$API_BASE/v1/enhance/webspec" \
     -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
     -d '{"raw":"SaaS landing with pricing and signup"}' | tee /tmp/enh.json

   # Commit
   ENH=$(jq -r .enhancement_id /tmp/enh.json)
   curl -s -X POST "$API_BASE/v1/webgen/commit?enhancement_id=$ENH" \
     -H "Authorization: Bearer <token>" | tee /tmp/commit.json

   # Expect web_projects.status -> built and artifact_url set by worker

