import type { Pool, PoolClient } from "pg";
import { HttpError, requireUuid } from "./auth";
import { deleteKeys, headObject, presignGet, presignPut } from "./s3";

const FREE_QUOTA_BYTES = 500 * 1024 * 1024;
const MAX_OBJECT_BYTES = 10 * 1024 * 1024;

const TYPES = {
  photo: { "image/webp": "webp", "image/jpeg": "jpg" },
  voice: { "audio/mp4": "m4a", "audio/m4a": "m4a", "audio/aac": "aac" },
} as const;

type Kind = keyof typeof TYPES;

async function usedBytes(db: Pool | PoolClient, userId: string): Promise<{ plan: string; used: number }> {
  const { rows } = await db.query(
    `select p.plan, coalesce(sum(m.size_bytes), 0)::bigint as used
       from profiles p left join media m on m.user_id = p.user_id
      where p.user_id = $1 group by p.plan`,
    [userId],
  );
  if (rows.length === 0) throw new HttpError(409, "profile_missing");
  return { plan: rows[0].plan, used: Number(rows[0].used) };
}

export async function signUpload(pool: Pool, userId: string, body: any) {
  const memoryId = requireUuid(body.memoryId, "memoryId");
  const kind = body.kind as Kind;
  if (!(kind in TYPES)) throw new HttpError(400, "invalid_request", "kind must be photo or voice");
  const ext = (TYPES[kind] as Record<string, string>)[body.contentType];
  if (!ext) throw new HttpError(400, "invalid_request", "unsupported content type");
  const size = Number(body.sizeBytes);
  if (!Number.isInteger(size) || size <= 0 || size > MAX_OBJECT_BYTES) {
    throw new HttpError(413, "too_large", "file exceeds 10 MB");
  }
  const durationMs = kind === "voice" ? Number(body.durationMs) : null;
  if (kind === "voice" && (!Number.isInteger(durationMs) || durationMs! < 1 || durationMs! > 60_000)) {
    throw new HttpError(400, "voice_too_long", "voice relics are limited to 60 seconds");
  }

  const owns = await pool.query(
    "select 1 from memories where id = $1 and user_id = $2 and deleted_at is null",
    [memoryId, userId],
  );
  if (owns.rowCount === 0) throw new HttpError(404, "memory_not_found");

  const mediaId = crypto.randomUUID();
  const key = `u/${userId}/${memoryId}/${mediaId}.${ext}`;
  const client = await pool.connect();
  try {
    await client.query("begin");
    // Serialise a keeper's concurrent uploads so parallel requests cannot overshoot the quota.
    await client.query("select pg_advisory_xact_lock(hashtextextended($1, 2))", [userId]);
    const { plan, used } = await usedBytes(client, userId);
    if (plan === "free" && used + size > FREE_QUOTA_BYTES) {
      throw new HttpError(402, "quota_exceeded", "vault capacity reached");
    }
    await client.query(
      `insert into media (id, user_id, memory_id, kind, object_key, content_type, size_bytes, duration_ms, width, height, position)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [mediaId, userId, memoryId, kind, key, body.contentType, size, durationMs, body.width ?? null, body.height ?? null, body.position ?? 0],
    );
    await client.query("commit");
  } catch (err: any) {
    await client.query("rollback");
    if (err?.code === "P0001") throw new HttpError(409, err.hint ?? "limit_reached", err.message);
    throw err;
  } finally {
    client.release();
  }
  return { mediaId, uploadUrl: await presignPut(key, body.contentType, size), headers: { "content-type": body.contentType } };
}

export async function confirmUpload(pool: Pool, userId: string, body: any) {
  const mediaId = requireUuid(body.mediaId, "mediaId");
  const { rows } = await pool.query(
    "select object_key, size_bytes from media where id = $1 and user_id = $2",
    [mediaId, userId],
  );
  if (rows.length === 0) throw new HttpError(404, "media_not_found");
  const head = await headObject(rows[0].object_key);
  if (!head) throw new HttpError(409, "upload_missing");
  if (head.size !== Number(rows[0].size_bytes)) {
    await deleteKeys([rows[0].object_key]);
    await pool.query("delete from media where id = $1", [mediaId]);
    throw new HttpError(409, "size_mismatch");
  }
  await pool.query("update media set status = 'ready' where id = $1", [mediaId]);
  return { mediaId, status: "ready" };
}

export async function signReads(pool: Pool, userId: string, body: any) {
  const ids: string[] = Array.isArray(body.mediaIds) ? body.mediaIds.slice(0, 100) : [];
  ids.forEach((id) => requireUuid(id, "mediaIds[]"));
  if (ids.length === 0) return { urls: {} };
  // Sealed relics stay sealed: their media is not signed until the date passes.
  const { rows } = await pool.query(
    `select m.id, m.object_key
       from media m join memories r on r.id = m.memory_id
      where m.id = any($1::uuid[]) and m.user_id = $2 and m.status = 'ready'
        and (r.sealed_until is null or r.sealed_until <= (now() at time zone (select timezone from profiles where user_id = $2))::date)`,
    [ids, userId],
  );
  const urls: Record<string, string> = {};
  await Promise.all(rows.map(async (r) => (urls[r.id] = await presignGet(r.object_key))));
  return { urls, expiresIn: 3600 };
}

export async function deleteMedia(pool: Pool, userId: string, body: any) {
  const mediaId = requireUuid(body.mediaId, "mediaId");
  const { rows } = await pool.query(
    "delete from media where id = $1 and user_id = $2 returning object_key",
    [mediaId, userId],
  );
  if (rows.length === 0) throw new HttpError(404, "media_not_found");
  await deleteKeys([rows[0].object_key]);
  return { deleted: mediaId };
}
