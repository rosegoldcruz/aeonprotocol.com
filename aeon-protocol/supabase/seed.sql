-- AEON Protocol Database Seed Data
-- This script populates the database with initial test data

-- Insert test users (these would normally be created by Clerk)
INSERT INTO users (clerk_user_id, email, first_name, last_name, role) VALUES
('user_test_admin', 'admin@aeonprotocol.com', 'Admin', 'User', 'admin'),
('user_test_enterprise', 'enterprise@example.com', 'Enterprise', 'User', 'enterprise'),
('user_test_regular', 'user@example.com', 'Regular', 'User', 'user')
ON CONFLICT (clerk_user_id) DO NOTHING;

-- Insert profiles for test users
INSERT INTO profiles (user_id, company_name, industry, onboarding_completed)
SELECT 
    u.id,
    CASE 
        WHEN u.role = 'admin' THEN 'AEON Protocol Inc.'
        WHEN u.role = 'enterprise' THEN 'Enterprise Corp'
        ELSE 'Personal'
    END,
    CASE 
        WHEN u.role = 'enterprise' THEN 'Technology'
        ELSE 'Media & Entertainment'
    END,
    true
FROM users u
WHERE u.clerk_user_id IN ('user_test_admin', 'user_test_enterprise', 'user_test_regular')
ON CONFLICT (user_id) DO NOTHING;

-- Initialize credits for test users
INSERT INTO credits (user_id, balance, total_earned)
SELECT 
    u.id,
    CASE 
        WHEN u.role = 'admin' THEN 10000
        WHEN u.role = 'enterprise' THEN 5000
        ELSE 1000
    END,
    CASE 
        WHEN u.role = 'admin' THEN 10000
        WHEN u.role = 'enterprise' THEN 5000
        ELSE 1000
    END
FROM users u
WHERE u.clerk_user_id IN ('user_test_admin', 'user_test_enterprise', 'user_test_regular')
ON CONFLICT (user_id) DO NOTHING;

-- Insert initial credit transactions
INSERT INTO credit_transactions (user_id, amount, reason, reference_type)
SELECT 
    u.id,
    CASE 
        WHEN u.role = 'admin' THEN 10000
        WHEN u.role = 'enterprise' THEN 5000
        ELSE 1000
    END,
    'Initial signup bonus',
    'signup'
FROM users u
WHERE u.clerk_user_id IN ('user_test_admin', 'user_test_enterprise', 'user_test_regular');

-- Insert sample subscription plans (these would come from Stripe)
INSERT INTO subscriptions (
    user_id, 
    stripe_subscription_id, 
    stripe_customer_id, 
    plan_name, 
    status, 
    current_period_start, 
    current_period_end, 
    monthly_credits
)
SELECT 
    u.id,
    'sub_test_' || u.clerk_user_id,
    'cus_test_' || u.clerk_user_id,
    CASE 
        WHEN u.role = 'enterprise' THEN 'enterprise'
        WHEN u.role = 'admin' THEN 'pro'
        ELSE 'basic'
    END,
    'active',
    NOW(),
    NOW() + INTERVAL '1 month',
    CASE 
        WHEN u.role = 'enterprise' THEN 10000
        WHEN u.role = 'admin' THEN 5000
        ELSE 1000
    END
FROM users u
WHERE u.clerk_user_id IN ('user_test_enterprise', 'user_test_admin');

-- Insert sample jobs with different statuses
INSERT INTO jobs (
    user_id, 
    type, 
    status, 
    title, 
    description, 
    input_data, 
    provider, 
    model, 
    credits_cost,
    progress,
    started_at,
    completed_at
)
SELECT 
    u.id,
    'image',
    'SUCCEEDED',
    'Sample AI Image Generation',
    'Generated a beautiful landscape image using AI',
    '{"prompt": "A serene mountain landscape at sunset", "style": "photorealistic", "dimensions": "1024x1024"}',
    'openai',
    'dall-e-3',
    100,
    100,
    NOW() - INTERVAL '1 hour',
    NOW() - INTERVAL '30 minutes'
FROM users u
WHERE u.clerk_user_id = 'user_test_regular'

UNION ALL

SELECT 
    u.id,
    'video',
    'RUNNING',
    'Corporate Video Generation',
    'Creating a promotional video for enterprise client',
    '{"script": "Welcome to the future of AI-powered content creation...", "duration": 60, "style": "corporate"}',
    'replicate',
    'stable-video-diffusion',
    500,
    65,
    NOW() - INTERVAL '10 minutes',
    NULL
FROM users u
WHERE u.clerk_user_id = 'user_test_enterprise'

UNION ALL

SELECT 
    u.id,
    'music',
    'QUEUED',
    'Background Music Generation',
    'Generating ambient music for video background',
    '{"prompt": "Upbeat electronic music for tech presentation", "duration": 120, "genre": "electronic"}',
    'replicate',
    'musicgen-large',
    200,
    0,
    NULL,
    NULL
FROM users u
WHERE u.clerk_user_id = 'user_test_admin';

-- Insert sample assets for completed jobs
INSERT INTO assets (
    job_id,
    user_id,
    type,
    filename,
    original_filename,
    mime_type,
    size_bytes,
    width,
    height,
    url,
    thumbnail_url,
    sha256_hash,
    metadata
)
SELECT 
    j.id,
    j.user_id,
    'image',
    'landscape_' || j.id || '.png',
    'ai_generated_landscape.png',
    'image/png',
    2048576, -- 2MB
    1024,
    1024,
    'https://storage.aeonprotocol.com/assets/landscape_' || j.id || '.png',
    'https://storage.aeonprotocol.com/thumbnails/landscape_' || j.id || '_thumb.jpg',
    encode(sha256(random()::text::bytea), 'hex'),
    '{"generated_at": "2024-01-15T10:30:00Z", "model_version": "dall-e-3-v1", "safety_rating": "safe"}'
FROM jobs j
WHERE j.status = 'SUCCEEDED' AND j.type = 'image';

-- Insert sample invoices
INSERT INTO invoices (
    user_id,
    subscription_id,
    stripe_invoice_id,
    amount_paid,
    currency,
    status,
    credits_awarded,
    paid_at
)
SELECT 
    s.user_id,
    s.id,
    'in_test_' || s.stripe_subscription_id,
    CASE 
        WHEN s.plan_name = 'enterprise' THEN 19900 -- $199
        WHEN s.plan_name = 'pro' THEN 4900 -- $49
        ELSE 1900 -- $19
    END,
    'usd',
    'paid',
    s.monthly_credits,
    NOW() - INTERVAL '5 days'
FROM subscriptions s;

-- Insert sample webhook logs
INSERT INTO webhooks (source, event_type, event_id, status, payload, processed_at) VALUES
('stripe', 'invoice.payment_succeeded', 'evt_test_webhook_001', 'succeeded', 
 '{"id": "in_test_invoice_001", "amount_paid": 1900, "customer": "cus_test_user"}', 
 NOW() - INTERVAL '5 days'),
('stripe', 'customer.subscription.created', 'evt_test_webhook_002', 'succeeded',
 '{"id": "sub_test_subscription_001", "customer": "cus_test_user", "plan": {"id": "price_basic"}}',
 NOW() - INTERVAL '7 days'),
('coinbase', 'charge:confirmed', 'evt_test_coinbase_001', 'succeeded',
 '{"id": "charge_test_001", "pricing": {"local": {"amount": "50.00", "currency": "USD"}}}',
 NOW() - INTERVAL '3 days');

-- Insert sample audit logs
INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address) 
SELECT 
    u.id,
    'login',
    'user',
    u.id,
    '{"login_method": "clerk", "success": true}',
    '192.168.1.100'::inet
FROM users u
WHERE u.clerk_user_id IN ('user_test_admin', 'user_test_enterprise', 'user_test_regular')

UNION ALL

SELECT 
    j.user_id,
    'create',
    'job',
    j.id,
    '{"job_type": "' || j.type || '", "credits_cost": ' || j.credits_cost || '}',
    '192.168.1.100'::inet
FROM jobs j;

-- Create some sample rate limiting data in a separate table for Redis simulation
-- (This would normally be in Redis, but we'll create a table for reference)
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    resource TEXT NOT NULL, -- 'api_calls', 'job_submissions', etc.
    count INTEGER NOT NULL DEFAULT 0,
    window_start TIMESTAMP WITH TIME ZONE NOT NULL,
    window_duration INTERVAL NOT NULL DEFAULT INTERVAL '1 hour',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, resource, window_start)
);

-- Insert sample rate limit data
INSERT INTO rate_limits (user_id, resource, count, window_start, window_duration)
SELECT 
    u.id,
    'job_submissions',
    CASE 
        WHEN u.role = 'enterprise' THEN 15
        WHEN u.role = 'admin' THEN 10
        ELSE 5
    END,
    date_trunc('hour', NOW()),
    INTERVAL '1 hour'
FROM users u
WHERE u.clerk_user_id IN ('user_test_admin', 'user_test_enterprise', 'user_test_regular');

-- Create a view for user dashboard summary
CREATE OR REPLACE VIEW user_dashboard_summary AS
SELECT 
    u.id as user_id,
    u.first_name,
    u.last_name,
    u.email,
    u.role,
    c.balance as credits_balance,
    c.total_spent as credits_spent,
    (
        SELECT COUNT(*) 
        FROM jobs j 
        WHERE j.user_id = u.id AND j.created_at > NOW() - INTERVAL '30 days'
    ) as jobs_last_30_days,
    (
        SELECT COUNT(*) 
        FROM jobs j 
        WHERE j.user_id = u.id AND j.status = 'RUNNING'
    ) as active_jobs,
    s.plan_name as subscription_plan,
    s.status as subscription_status,
    s.current_period_end as subscription_expires
FROM users u
LEFT JOIN credits c ON c.user_id = u.id
LEFT JOIN subscriptions s ON s.user_id = u.id AND s.status = 'active';

-- Grant necessary permissions
-- (In production, these would be handled by Supabase's service role)

COMMENT ON TABLE users IS 'User accounts synchronized with Clerk authentication';
COMMENT ON TABLE profiles IS 'Extended user profile information and preferences';
COMMENT ON TABLE credits IS 'User credit balances and totals';
COMMENT ON TABLE credit_transactions IS 'Detailed ledger of all credit transactions';
COMMENT ON TABLE jobs IS 'AI generation jobs and their status';
COMMENT ON TABLE assets IS 'Generated media assets and metadata';
COMMENT ON TABLE subscriptions IS 'Stripe subscription information';
COMMENT ON TABLE invoices IS 'Payment invoices and credit awards';
COMMENT ON TABLE crypto_payments IS 'Coinbase Commerce crypto payments';
COMMENT ON TABLE webhooks IS 'Webhook event log for debugging and replay protection';
COMMENT ON TABLE crm_integrations IS 'CRM system integrations (HubSpot, etc.)';
COMMENT ON TABLE audit_logs IS 'Security and compliance audit trail';

-- Create materialized view for analytics (refresh periodically)
CREATE MATERIALIZED VIEW analytics_daily_stats AS
SELECT 
    date_trunc('day', created_at) as date,
    COUNT(*) as total_jobs,
    COUNT(*) FILTER (WHERE status = 'SUCCEEDED') as successful_jobs,
    COUNT(*) FILTER (WHERE status = 'FAILED') as failed_jobs,
    SUM(credits_cost) as total_credits_used,
    COUNT(DISTINCT user_id) as active_users,
    AVG(EXTRACT(EPOCH FROM (completed_at - started_at))/60) as avg_processing_time_minutes
FROM jobs
WHERE created_at >= NOW() - INTERVAL '90 days'
GROUP BY date_trunc('day', created_at)
ORDER BY date DESC;

-- Create index on materialized view
CREATE UNIQUE INDEX idx_analytics_daily_stats_date ON analytics_daily_stats(date);

-- Refresh the materialized view
REFRESH MATERIALIZED VIEW analytics_daily_stats;