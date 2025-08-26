import os, json, tempfile, zipfile, boto3, requests
from pathlib import Path
from tenacity import retry, wait_exponential_jitter, stop_after_attempt, retry_if_exception_type
from botocore.exceptions import BotoCoreError, ClientError
from requests import RequestException

VERCEL_DEPLOY_HOOK = os.getenv("VERCEL_DEPLOY_HOOK_URL")

BASE_TEMPLATE = {
  "package.json": '{ "name":"aeon-site","private":true,"scripts":{"dev":"next","build":"next build","start":"next start"},"dependencies":{"next":"14.2.5","react":"18.3.1","react-dom":"18.3.1","tailwindcss":"^3","clsx":"^2"}}',
  "tsconfig.json": '{ "compilerOptions": { "jsx":"react-jsx","module":"esnext","target":"es2022","moduleResolution":"bundler","strict":true } }',
  "next.config.ts": 'import type { NextConfig } from "next"; const nextConfig: NextConfig = { experimental:{ serverActions:true } }; export default nextConfig;',
  ".gitignore": ".next\nnode_modules\n.env*\n",
  "styles/globals.css": "@tailwind base;@tailwind components;@tailwind utilities;"
}

def write_files(root: Path, files: dict):
  for p, content in files.items():
    fp = root / p
    fp.parent.mkdir(parents=True, exist_ok=True)
    fp.write_text(content)

def zip_dir(src: Path, out_zip: Path):
  with zipfile.ZipFile(out_zip, "w", zipfile.ZIP_DEFLATED) as z:
    for path in src.rglob("*"):
      if path.is_file():
        z.write(path, path.relative_to(src))

@retry(wait=wait_exponential_jitter(initial=1, max=8), stop=stop_after_attempt(5), reraise=True,
       retry=retry_if_exception_type((BotoCoreError, ClientError)))
def s3_upload(local_path: Path) -> str:
  s3 = boto3.client("s3", region_name=os.getenv("AWS_REGION"))
  bucket = os.getenv("S3_BUCKET")
  key = f"webgen/{local_path.name}"
  s3.upload_file(str(local_path), bucket, key, ExtraArgs={"ContentType": "application/zip"})
  return f"s3://{bucket}/{key}"

@retry(wait=wait_exponential_jitter(initial=1, max=8), stop=stop_after_attempt(5), reraise=True,
       retry=retry_if_exception_type(RequestException))
def vercel_deploy(zip_url: str) -> str:
  if not VERCEL_DEPLOY_HOOK:
    return ""
  res = requests.post(VERCEL_DEPLOY_HOOK, json={"artifact": zip_url}, timeout=30)
  return f"deployHook:{res.status_code}"

def generate_from_webspec(webspec: dict) -> dict:
  # NOTE: Hook to actual LLM later. For now, minimal stub to keep pipeline working.
  files = {
    **BASE_TEMPLATE,
    "app/page.tsx": "export default function Page(){return <main className=\"p-8\"><h1 className=\"text-3xl\">Hello from AEON</h1></main>}"
  }
  return files

def handle_job(job: dict):
  webspec = job["webspec"]
  with tempfile.TemporaryDirectory() as td:
    root = Path(td) / "site"
    root.mkdir(parents=True, exist_ok=True)
    files = generate_from_webspec(webspec)
    write_files(root, files)
    z = Path(td) / "site.zip"
    zip_dir(root, z)
    url = s3_upload(z)
    deploy_msg = vercel_deploy(url) if job.get("auto_deploy") else ""
    return url, deploy_msg

