import type { Pool } from "pg";
import { deleteKeys } from "./s3";

// Nightly: hard-delete relics released more than 30 days ago, and media rows
// whose upload never completed within a day. Idempotent, so a spoofed trigger
// delivery can only run work that was already due.
export async function purgeReleased(pool: Pool) {
  const { rows: media } = await pool.query(
    `delete from media
      where memory_id in (select id from memories where deleted_at < now() - interval '30 days')
         or (status = 'pending' and created_at < now() - interval '1 day')
      returning object_key`,
  );
  await deleteKeys(media.map((m) => m.object_key));
  const { rowCount } = await pool.query("delete from memories where deleted_at < now() - interval '30 days'");
  return { memories: rowCount, media: media.length };
}
