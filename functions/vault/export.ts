import type { Pool } from "pg";
import { strToU8, zipSync } from "fflate";
import { deletePrefix, getObjectBytes, presignGet, putObject } from "./s3";

// Builds a ZIP of everything the keeper owns: vault.json plus original media.
export async function exportVault(pool: Pool, userId: string) {
  const q = (sql: string) => pool.query(sql, [userId]).then((r) => r.rows);
  const [profile] = await q("select display_name, timezone, plan, created_at from profiles where user_id = $1");
  const memories = await q("select * from memories where user_id = $1 and deleted_at is null order by occurred_on");
  const people = await q("select id, name from people where user_id = $1 order by name");
  const memoryPeople = await q("select memory_id, person_id from memory_people where user_id = $1");
  const links = await q("select memory_id, url, label from links where user_id = $1");
  const media = await q(
    `select m.id, m.memory_id, m.kind, m.object_key, m.content_type, m.duration_ms, m.position
       from media m join memories r on r.id = m.memory_id
      where m.user_id = $1 and m.status = 'ready' and r.deleted_at is null`,
  );

  const files: Record<string, Uint8Array> = {};
  for (const m of media) {
    const name = `media/${m.memory_id}/${m.id}.${m.object_key.split(".").pop()}`;
    files[name] = await getObjectBytes(m.object_key);
    m.file = name;
    delete m.object_key;
  }
  const manifest = { exportedAt: new Date().toISOString(), profile, memories, people, memoryPeople, links, media };
  files["vault.json"] = strToU8(JSON.stringify(manifest, null, 2));

  const zip = zipSync(files, { level: 0 });
  await deletePrefix(`exports/${userId}/`);
  const key = `exports/${userId}/relic-vault-${Date.now()}.zip`;
  await putObject(key, zip, "application/zip");
  return { url: await presignGet(key, 3600), bytes: zip.byteLength, relics: memories.length };
}
