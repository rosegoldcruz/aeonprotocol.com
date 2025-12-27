import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url(),
  CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_ANON_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  COINBASE_COMMERCE_API_KEY: z.string().min(1),
  COINBASE_COMMERCE_WEBHOOK_SECRET: z.string().min(1),
  REPLICATE_API_TOKEN: z.string().min(1),
  ELEVENLABS_API_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  S3_ENDPOINT: z.string().min(1),
  S3_ACCESS_KEY: z.string().min(1),
  S3_SECRET_KEY: z.string().min(1),
  S3_BUCKET: z.string().min(1),
  REDIS_URL: z.string().min(1),
  SENTRY_DSN: z.string().min(1).optional().default('')
})

export type Env = z.infer<typeof envSchema>

export class ConfigError extends Error {}

let cachedEnv: Env | null = null

export function getEnv(): Env {
  if (cachedEnv) return cachedEnv
  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    const issues = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')
    throw new ConfigError(`Missing or invalid environment variables: ${issues}`)
  }
  cachedEnv = parsed.data
  return cachedEnv
}

