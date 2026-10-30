import { createRemoteJWKSet, jwtVerify } from "jose";

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message?: string,
  ) {
    super(message ?? code);
  }
}

const jwks = createRemoteJWKSet(new URL(process.env.NEON_AUTH_JWKS_URL!));
const issuer = new URL(process.env.NEON_AUTH_BASE_URL!).origin;

export async function authenticate(request: Request): Promise<string> {
  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) throw new HttpError(401, "unauthorized");
  try {
    const { payload } = await jwtVerify(header.slice(7), jwks, { issuer });
    if (typeof payload.sub !== "string" || payload.role !== "authenticated") {
      throw new HttpError(401, "unauthorized");
    }
    return payload.sub;
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new HttpError(401, "unauthorized");
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function requireUuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID.test(value)) throw new HttpError(400, "invalid_request", `${field} must be a uuid`);
  return value;
}
