import type { Pool } from "pg";
import { deletePrefix } from "./s3";

// Deleting the auth user cascades to sessions, accounts, the profile and
// every vault row (memories → people links, media rows, links, waitlist).
export async function deleteAccount(pool: Pool, userId: string) {
  await deletePrefix(`u/${userId}/`);
  await deletePrefix(`exports/${userId}/`);
  await pool.query(`delete from neon_auth."user" where id = $1`, [userId]);
  return { deleted: true };
}
