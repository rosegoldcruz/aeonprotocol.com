import os, redis, json, traceback
from webgen import handle_job
from db import update_project

r = redis.Redis(host=os.getenv("REDIS_HOST","redis"), port=int(os.getenv("REDIS_PORT","6379")), db=0)

while True:
    _, payload = r.brpop("aeon:webgen_queue")
    job = json.loads(payload)
    if job.get("type") == "generate_web_project":
        try:
            url, deploy = handle_job(job)
            update_project(job["project_id"], status="built", artifact_url=url, deploy_log=deploy)
        except Exception as e:
            update_project(job["project_id"], status="failed", deploy_log=f"{type(e).__name__}: {e}\n{traceback.format_exc()}")

