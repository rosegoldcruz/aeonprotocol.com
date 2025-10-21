"""
WebGen Queue Consumer
Processes web project generation jobs from Redis queue.
"""
import os
import sys
import json
import time
import logging
from urllib.parse import urlparse

import redis as redis_lib
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Redis connection
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
parsed = urlparse(REDIS_URL)
r = redis_lib.Redis(
    host=parsed.hostname or "redis",
    port=parsed.port or 6379,
    db=int((parsed.path or "/0")[1:]) or 0,
    decode_responses=True
)

# Database connection (sync)
DATABASE_URL = os.getenv("DATABASE_URL", "").replace("postgresql+asyncpg://", "postgresql://")
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine)


def process_web_project(data: dict):
    """
    Process a web project generation job.
    
    Args:
        data: Job payload containing project_id, webspec, and auto_deploy flag
    """
    project_id = data.get("project_id")
    webspec = data.get("webspec", {})
    auto_deploy = data.get("auto_deploy", True)
    
    logger.info(f"Processing web project {project_id}")
    
    try:
        # Update project status to 'processing'
        with SessionLocal() as db:
            db.execute(
                text("UPDATE web_projects SET status = 'processing' WHERE id = :id"),
                {"id": project_id}
            )
            db.commit()
        
        # TODO: Implement actual generation logic
        # - Generate Next.js project from webspec
        # - Create repository
        # - Deploy to Vercel/hosting platform
        # - Update artifact_url and preview_url
        
        logger.info(f"Web project {project_id} generation placeholder - implement actual logic")
        
        # Update project status to 'completed'
        with SessionLocal() as db:
            db.execute(
                text("""
                    UPDATE web_projects 
                    SET status = 'completed',
                        artifact_url = :artifact,
                        preview_url = :preview
                    WHERE id = :id
                """),
                {
                    "id": project_id,
                    "artifact": f"https://github.com/aeon/{project_id}",
                    "preview": f"https://{project_id}.vercel.app"
                }
            )
            db.commit()
        
        logger.info(f"Web project {project_id} completed successfully")
        
    except Exception as e:
        logger.error(f"Failed to process web project {project_id}: {str(e)}")
        
        # Update project status to 'failed'
        try:
            with SessionLocal() as db:
                db.execute(
                    text("""
                        UPDATE web_projects 
                        SET status = 'failed',
                            deploy_log = :error
                        WHERE id = :id
                    """),
                    {"id": project_id, "error": str(e)}
                )
                db.commit()
        except Exception as db_error:
            logger.error(f"Failed to update project status: {str(db_error)}")


def main():
    """Main consumer loop"""
    logger.info("WebGen consumer starting...")
    logger.info(f"Listening on Redis queue: aeon:webgen_queue")
    
    while True:
        try:
            # Block until job available (timeout 1 second for graceful shutdown)
            result = r.brpop("aeon:webgen_queue", timeout=1)
            
            if result:
                _, payload = result
                data = json.loads(payload)
                process_web_project(data)
            
        except KeyboardInterrupt:
            logger.info("Shutting down gracefully...")
            sys.exit(0)
        except Exception as e:
            logger.error(f"Consumer error: {str(e)}")
            time.sleep(5)  # Back off on errors


if __name__ == "__main__":
    main()

