# AEON Protocol

> Advanced Enterprise AI Operations Network - Production-ready monorepo for AI-powered media generation and enterprise automation.

## 🚀 Architecture

AEON Protocol is a comprehensive platform that combines AI-powered media generation with enterprise-grade integrations. Built with modern technologies and production-ready patterns.

### Core Components

- **Frontend** (`/frontend`) - Next.js 14 with TypeScript, Tailwind CSS, shadcn/ui, and Clerk authentication
- **Backend API** (`/backend-api`) - FastAPI 0.115+ with Python 3.11, structured for high-performance async operations
- **Workers** (`/backend-workers`) - Celery 5 task queue with Redis for background processing
- **Infrastructure** (`/infra`) - Docker Compose with Nginx reverse proxy and production configs
- **Shared** (`/shared`) - Type-safe schemas and contracts between frontend and backend
- **Documentation** (`/docs`) - Runbooks, API docs, and operational guides

## 🛠 Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Authentication**: Clerk
- **Package Manager**: pnpm

### Backend
- **API Framework**: FastAPI 0.115+
- **Language**: Python 3.11
- **Task Queue**: Celery 5
- **Message Broker**: Redis
- **Database**: Supabase (PostgreSQL)
- **Package Manager**: uv

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx
- **Deployment**: Vercel (Frontend), Docker (Backend)
- **Monitoring**: Sentry, Prometheus + Grafana

## 🏃‍♂️ Quick Start

### Prerequisites

- Node.js 20.17.0 (use `.nvmrc`)
- Python 3.11 (use `.python-version`)
- pnpm
- uv
- Docker & Docker Compose
- Redis

### Development Setup

```bash
# Clone and setup
git clone <repo-url>
cd aeon-protocol

# Install dependencies and start development
make dev
```

### Available Commands

```bash
# Development
make dev          # Start all services in development mode
make fmt          # Format all code (frontend + backend)
make lint         # Lint all code
make build        # Build all services

# Infrastructure
make up           # Start all services with Docker Compose
make down         # Stop all services

# Individual services
make frontend-dev # Start frontend only
make api-dev      # Start API only
make workers-dev  # Start workers only
```

## 🌟 Features

### AI Media Generation
- **Video Generation**: Script-to-video with scene splitting and provider abstraction
- **Image Generation**: Multiple AI providers (OpenAI, Replicate)
- **Music Generation**: AI-powered music creation with MusicGen
- **Provider Abstraction**: Seamless switching between AI providers

### Enterprise Integration
- **CRM Integration**: HubSpot OAuth with automatic lead sync
- **Payment Processing**: Stripe subscriptions + Coinbase Commerce crypto payments
- **Credit System**: Usage-based billing with rate limiting
- **Audit Logging**: Complete audit trail for compliance

### Production Features
- **Authentication**: Clerk with JWT verification and role-based access
- **Security**: CORS, CSRF protection, input validation, security headers
- **Monitoring**: Structured logging, metrics, error tracking
- **Storage**: S3-compatible storage with encryption and streaming
- **Email**: Transactional emails with templates

## 🏗 Project Structure

```
aeon-protocol/
├── frontend/           # Next.js 14 application
│   ├── app/           # App Router pages
│   ├── components/    # Reusable UI components
│   ├── lib/          # Utilities and configurations
│   └── public/       # Static assets
├── backend-api/       # FastAPI application
│   ├── aeon/         # Main application package
│   │   ├── routers/  # API route handlers
│   │   ├── models/   # Database models
│   │   ├── services/ # Business logic
│   │   └── providers/# AI provider integrations
│   └── tests/        # API tests
├── backend-workers/   # Celery workers
│   ├── tasks/        # Task definitions
│   └── workers/      # Worker configurations
├── infra/            # Infrastructure as code
│   ├── docker-compose.yml
│   ├── nginx/        # Nginx configurations
│   └── systemd/      # Service files
├── shared/           # Shared types and schemas
│   ├── schemas/      # JSON schemas
│   └── types/        # Generated TypeScript types
└── docs/             # Documentation
    ├── api/          # API documentation
    ├── deployment/   # Deployment guides
    └── runbook.md    # Operations runbook
```

## 📊 Monitoring & Observability

- **Error Tracking**: Sentry integration for both frontend and backend
- **Metrics**: Prometheus metrics with Grafana dashboards
- **Logging**: Structured logging with request IDs
- **Health Checks**: Comprehensive health endpoints

## 🔒 Security

- **Authentication**: Clerk JWT with audience/issuer validation
- **Authorization**: Role-based access control
- **Data Protection**: Row-level security (RLS) in database
- **Input Validation**: Zod (frontend) + Pydantic (backend)
- **Security Headers**: Comprehensive security header configuration

## 🚀 Deployment

### Development
```bash
make dev
```

### Production
```bash
# Build and deploy
make build
make up

# Or use individual deployment scripts
./scripts/deploy-frontend.sh
./scripts/deploy-backend.sh
```

## 📝 Environment Variables

Each service requires specific environment variables. See:
- `frontend/.env.example`
- `backend-api/.env.example`
- `backend-workers/.env.example`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions, please refer to the [documentation](docs/) or contact the development team.