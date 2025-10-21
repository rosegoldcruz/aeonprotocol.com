import warnings
from .database.neon_db import (
	engine,
	AsyncSessionLocal,
	Base,
	get_db,
	init_database,
	check_database_health,
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
	UserRole,
	JobStatus,
	JobType,
	MediaType,
)

warnings.warn(
	"services.api.app.database is a compatibility shim; import from services.api.app.database.neon_db instead",
	DeprecationWarning,
)
