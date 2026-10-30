// Relic vault function: every operation that needs a secret (object storage
// credentials, owner DB role) lives here. Callers authenticate with the Neon
// Auth JWT; the scheduled purge authenticates as a Neon trigger delivery.
import { attachDatabasePool } from "@neon/functions";
import { parseTriggerDelivery } from "@neon/functions/triggers";
import { Pool } from "pg";
import { authenticate, HttpError } from "./auth";
import { exportVault } from "./export";
import { confirmUpload, deleteMedia, signReads, signUpload } from "./media";
import { deleteAccount } from "./account";
import { purgeReleased } from "./purge";

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
attachDatabasePool(pool);

type Handler = (userId: string, body: any) => Promise<unknown>;

const routes: Record<string, Handler> = {
  "/media/sign-upload": (uid, body) => signUpload(pool, uid, body),
  "/media/confirm": (uid, body) => confirmUpload(pool, uid, body),
  "/media/sign-read": (uid, body) => signReads(pool, uid, body),
  "/media/delete": (uid, body) => deleteMedia(pool, uid, body),
  "/account/export": (uid) => exportVault(pool, uid),
  "/account/delete": (uid) => deleteAccount(pool, uid),
};

function json(status: number, data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

export default {
  async fetch(request: Request): Promise<Response> {
    const { pathname } = new URL(request.url);
    try {
      if (pathname === "/cron/purge") {
        const delivery = await parseTriggerDelivery(request);
        if (!delivery.ok) return json(401, { error: "unauthorized" });
        return json(200, await purgeReleased(pool));
      }

      const handler = routes[pathname];
      if (!handler) return json(404, { error: "not_found" });
      if (request.method !== "POST") return json(405, { error: "method_not_allowed" });

      const userId = await authenticate(request);
      const body = await request.json().catch(() => ({}));
      return json(200, await handler(userId, body));
    } catch (err) {
      if (err instanceof HttpError) return json(err.status, { error: err.code, message: err.message });
      console.error(pathname, err);
      return json(500, { error: "internal" });
    }
  },
};
