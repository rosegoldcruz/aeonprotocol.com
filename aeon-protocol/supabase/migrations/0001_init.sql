-- AEON Protocol Database Schema
-- Initial migration with all tables, RLS policies, and indexes

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE job_status AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELED');
CREATE TYPE asset_type AS ENUM ('video', 'image', 'audio', 'document', 'other');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'unpaid', 'incomplete');
CREATE TYPE invoice_status AS ENUM ('draft', 'open', 'paid', 'void', 'uncollectible');
CREATE TYPE webhook_status AS ENUM ('pending', 'succeeded', 'failed');
CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'login', 'logout', 'payment', 'webhook');

-- Users table (extends Clerk user data)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_user_id TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'enterprise')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles with additional metadata
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    company_name TEXT,
    industry TEXT,
    phone TEXT,
    timezone TEXT DEFAULT 'UTC',
    preferences JSONB DEFAULT '{}',
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Credits system
CREATE TABLE credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
    total_earned INTEGER NOT NULL DEFAULT 0,
    total_spent INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Credit transactions ledger
CREATE TABLE credit_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- Positive for credits, negative for debits
    reason TEXT NOT NULL,
    reference_id UUID, -- Job ID, invoice ID, etc.
    reference_type TEXT, -- 'job', 'purchase', 'refund', etc.
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Jobs table for tracking AI generation tasks
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('video', 'image', 'music', 'audio')),
    status job_status DEFAULT 'QUEUED',
    title TEXT,
    description TEXT,
    input_data JSONB NOT NULL DEFAULT '{}', -- Prompt, settings, etc.
    output_data JSONB DEFAULT '{}', -- Generated assets, metadata
    provider TEXT, -- 'replicate', 'openai', 'elevenlabs'
    model TEXT, -- Specific model used
    credits_cost INTEGER NOT NULL DEFAULT 0,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assets table for storing generated media
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type asset_type NOT NULL,
    filename TEXT NOT NULL,
    original_filename TEXT,
    mime_type TEXT NOT NULL,
    size_bytes BIGINT NOT NULL,
    duration_seconds DECIMAL(10,2), -- For video/audio
    width INTEGER, -- For images/video
    height INTEGER, -- For images/video
    url TEXT NOT NULL, -- S3/Supabase Storage URL
    thumbnail_url TEXT, -- For video/image previews
    sha256_hash TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions table (Stripe integration)
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    stripe_subscription_id TEXT UNIQUE NOT NULL,
    stripe_customer_id TEXT NOT NULL,
    plan_name TEXT NOT NULL, -- 'basic', 'pro', 'enterprise'
    status subscription_status NOT NULL,
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    monthly_credits INTEGER NOT NULL DEFAULT 0,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    stripe_invoice_id TEXT UNIQUE NOT NULL,
    amount_paid INTEGER NOT NULL, -- In cents
    currency TEXT DEFAULT 'usd',
    status invoice_status NOT NULL,
    credits_awarded INTEGER DEFAULT 0,
    invoice_pdf_url TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crypto payments (Coinbase Commerce)
CREATE TABLE crypto_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    coinbase_charge_id TEXT UNIQUE NOT NULL,
    amount DECIMAL(20,8) NOT NULL, -- Crypto amount
    currency TEXT NOT NULL, -- BTC, ETH, etc.
    usd_amount INTEGER NOT NULL, -- USD amount in cents
    status TEXT NOT NULL,
    credits_to_award INTEGER NOT NULL,
    credits_awarded BOOLEAN DEFAULT FALSE,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Webhooks log for debugging and replay protection
CREATE TABLE webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source TEXT NOT NULL, -- 'stripe', 'coinbase', 'hubspot'
    event_type TEXT NOT NULL,
    event_id TEXT NOT NULL, -- External event ID
    status webhook_status DEFAULT 'pending',
    payload JSONB NOT NULL,
    response JSONB,
    error_message TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(source, event_id) -- Prevent duplicate processing
);

-- CRM integrations
CREATE TABLE crm_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL, -- 'hubspot'
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    scopes TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, provider)
);

-- Audit logs for compliance and security
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action audit_action NOT NULL,
    resource_type TEXT NOT NULL, -- 'user', 'job', 'payment', etc.
    resource_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_clerk_user_id ON users(clerk_user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

CREATE INDEX idx_profiles_user_id ON profiles(user_id);

CREATE INDEX idx_credits_user_id ON credits(user_id);

CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at);
CREATE INDEX idx_credit_transactions_reference ON credit_transactions(reference_type, reference_id);

CREATE INDEX idx_jobs_user_id ON jobs(user_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_type ON jobs(type);
CREATE INDEX idx_jobs_created_at ON jobs(created_at);
CREATE INDEX idx_jobs_user_status ON jobs(user_id, status);

CREATE INDEX idx_assets_job_id ON assets(job_id);
CREATE INDEX idx_assets_user_id ON assets(user_id);
CREATE INDEX idx_assets_type ON assets(type);
CREATE INDEX idx_assets_sha256_hash ON assets(sha256_hash);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_stripe_invoice_id ON invoices(stripe_invoice_id);
CREATE INDEX idx_invoices_status ON invoices(status);

CREATE INDEX idx_crypto_payments_user_id ON crypto_payments(user_id);
CREATE INDEX idx_crypto_payments_coinbase_charge_id ON crypto_payments(coinbase_charge_id);
CREATE INDEX idx_crypto_payments_status ON crypto_payments(status);

CREATE INDEX idx_webhooks_source_event ON webhooks(source, event_type);
CREATE INDEX idx_webhooks_status ON webhooks(status);
CREATE INDEX idx_webhooks_created_at ON webhooks(created_at);

CREATE INDEX idx_crm_integrations_user_id ON crm_integrations(user_id);
CREATE INDEX idx_crm_integrations_provider ON crm_integrations(provider);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users: Users can only see their own data
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (clerk_user_id = auth.jwt() ->> 'sub');

-- Profiles: Users can only access their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR ALL USING (
        user_id IN (
            SELECT id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

-- Credits: Users can only see their own credits
CREATE POLICY "Users can view own credits" ON credits
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

-- Credit transactions: Users can only see their own transactions
CREATE POLICY "Users can view own credit transactions" ON credit_transactions
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

-- Jobs: Users can only access their own jobs
CREATE POLICY "Users can view own jobs" ON jobs
    FOR ALL USING (
        user_id IN (
            SELECT id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

-- Assets: Users can only access their own assets
CREATE POLICY "Users can view own assets" ON assets
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

-- Subscriptions: Users can only see their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON subscriptions
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

-- Invoices: Users can only see their own invoices
CREATE POLICY "Users can view own invoices" ON invoices
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

-- Crypto payments: Users can only see their own payments
CREATE POLICY "Users can view own crypto payments" ON crypto_payments
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

-- CRM integrations: Users can only access their own integrations
CREATE POLICY "Users can view own CRM integrations" ON crm_integrations
    FOR ALL USING (
        user_id IN (
            SELECT id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

-- Audit logs: Users can only see their own audit logs (admins can see all)
CREATE POLICY "Users can view own audit logs" ON audit_logs
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
        )
        OR 
        EXISTS (
            SELECT 1 FROM users 
            WHERE clerk_user_id = auth.jwt() ->> 'sub' 
            AND role = 'admin'
        )
    );

-- Admin policies: Admins can access all data
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE clerk_user_id = auth.jwt() ->> 'sub' 
            AND role = 'admin'
        )
    );

-- Service role policies for backend operations
-- (These tables don't have RLS for service role operations)
-- webhooks table is accessible by service role only

-- Functions for common operations

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credits_updated_at BEFORE UPDATE ON credits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crypto_payments_updated_at BEFORE UPDATE ON crypto_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_integrations_updated_at BEFORE UPDATE ON crm_integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to debit credits atomically
CREATE OR REPLACE FUNCTION debit_credits(
    p_user_id UUID,
    p_amount INTEGER,
    p_reason TEXT,
    p_reference_id UUID DEFAULT NULL,
    p_reference_type TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    current_balance INTEGER;
BEGIN
    -- Lock the credits row for update
    SELECT balance INTO current_balance
    FROM credits
    WHERE user_id = p_user_id
    FOR UPDATE;
    
    -- Check if user has sufficient credits
    IF current_balance < p_amount THEN
        RETURN FALSE;
    END IF;
    
    -- Update credits balance
    UPDATE credits
    SET 
        balance = balance - p_amount,
        total_spent = total_spent + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Insert transaction record
    INSERT INTO credit_transactions (
        user_id, amount, reason, reference_id, reference_type
    ) VALUES (
        p_user_id, -p_amount, p_reason, p_reference_id, p_reference_type
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to credit user account
CREATE OR REPLACE FUNCTION credit_user(
    p_user_id UUID,
    p_amount INTEGER,
    p_reason TEXT,
    p_reference_id UUID DEFAULT NULL,
    p_reference_type TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    -- Update credits balance
    UPDATE credits
    SET 
        balance = balance + p_amount,
        total_earned = total_earned + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- If credits record doesn't exist, create it
    IF NOT FOUND THEN
        INSERT INTO credits (user_id, balance, total_earned)
        VALUES (p_user_id, p_amount, p_amount);
    END IF;
    
    -- Insert transaction record
    INSERT INTO credit_transactions (
        user_id, amount, reason, reference_id, reference_type
    ) VALUES (
        p_user_id, p_amount, p_reason, p_reference_id, p_reference_type
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get user credit balance
CREATE OR REPLACE FUNCTION get_user_balance(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    user_balance INTEGER;
BEGIN
    SELECT COALESCE(balance, 0) INTO user_balance
    FROM credits
    WHERE user_id = p_user_id;
    
    RETURN COALESCE(user_balance, 0);
END;
$$ LANGUAGE plpgsql;