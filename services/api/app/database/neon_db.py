"""
Neon PostgreSQL Database Configuration and Models (canonical)
"""
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from ..config import settings
from .models import (
	Base,
	UserRole,
	JobStatus,
	JobType,
	MediaType,
	Tenant,
	User,
	Membership,
	Project,
	Job,
	Asset,
	Agent,
	Integration,
	Workflow,
	Comment,
)

# Async engine using strict env configuration
engine = create_async_engine(
	settings.DATABASE_URL,
	echo=False,
	pool_size=int(os.environ.get("DB_POOL_SIZE", 10)),
	max_overflow=int(os.environ.get("DB_MAX_OVERFLOW", 10)),
	pool_pre_ping=True,
	pool_recycle=3600
)

# Create async session factory
AsyncSessionLocal = sessionmaker(
	engine,
	class_=AsyncSession,
	expire_on_commit=False
)

# Models are now imported from .models

# Database dependency
async def get_db():
	async with AsyncSessionLocal() as session:
		try:
			yield session
		finally:
			await session.close()

# Database initialization
async def init_database():
	async with engine.begin() as conn:
		await conn.run_sync(Base.metadata.create_all)

# Database health check
async def check_database_health():
	try:
		async with AsyncSessionLocal() as session:
			await session.execute("SELECT 1")
			return {"status": "healthy", "database": "postgresql"}
	except Exception as e:
		return {"status": "unhealthy", "error": str(e)}
