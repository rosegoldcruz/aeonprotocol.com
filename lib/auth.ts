import { headers } from 'next/headers';

export async function getTenantId(): Promise<string> {
  const headerData = await headers();
  const authHeader = headerData.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // TODO: Verify and decode JWT
    // const decoded = verifyJWT(token);
    // return decoded.tenantId;
  }

  const host = headerData.get('host');
  const subdomain = host?.split('.')[0];
  if (subdomain && subdomain !== 'www') {
    // TODO: Validate and map subdomain to tenantId
    return subdomain;
  }

  // Fallback for development
  return process.env.DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000000';
}