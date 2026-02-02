import { headers } from "next/headers";
import { isValidUUID } from "@/lib/utils";

export async function getTenantId(): Promise<string> {
  const headerData = await headers();
  const authHeader = headerData.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // TODO: Verify and decode JWT
    // const decoded = verifyJWT(token);
    // return decoded.tenantId;
  }

  const tenantHeader = headerData.get("x-tenant-id");
  if (tenantHeader && isValidUUID(tenantHeader)) {
    return tenantHeader;
  }

  const host = headerData.get("host");
  const hostWithoutPort = host?.split(":")[0];
  const subdomain = hostWithoutPort?.split(".")[0];
  if (subdomain && subdomain !== "www" && isValidUUID(subdomain)) {
    // TODO: Validate and map subdomain to tenantId
    return subdomain;
  }

  // Fallback for development
  return (
    process.env.DEFAULT_TENANT_ID || "00000000-0000-0000-0000-000000000000"
  );
}