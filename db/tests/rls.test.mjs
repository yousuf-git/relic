// End-to-end RLS and limit checks against the checked-out Neon branch, through
// the real Managed Auth + Data API path the app uses.
// Run: node --env-file=.env db/tests/rls.test.mjs
import assert from "node:assert/strict";
import { test } from "node:test";

const AUTH = process.env.NEON_AUTH_BASE_URL;
const API = process.env.NEON_DATA_API_URL;
const ORIGIN = "http://localhost:8081";
assert.ok(AUTH && API, "NEON_AUTH_BASE_URL and NEON_DATA_API_URL must be set");

async function newKeeper(tag) {
  const email = `rls-${tag}-${Date.now()}@example.com`;
  const res = await fetch(`${AUTH}/sign-up/email`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: ORIGIN },
    body: JSON.stringify({ email, password: "Rls-test-pass-123", name: tag }),
  });
  assert.equal(res.status, 200, await res.clone().text());
  const cookie = res.headers.get("set-cookie").split(";")[0];
  const tok = await fetch(`${AUTH}/token`, { headers: { origin: ORIGIN, cookie } }).then((r) => r.json());
  const user = await res.json();
  return { id: user.user.id, jwt: tok.token };
}

function api(jwt, path, init = {}) {
  return fetch(`${API}/${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      prefer: "return=representation",
      ...(jwt ? { authorization: `Bearer ${jwt}` } : {}),
      ...init.headers,
    },
  });
}

const insertMemory = (k, body) =>
  api(k.jwt, "memories", { method: "POST", body: JSON.stringify({ body, occurred_on: "2024-03-14" }) });

const a = await newKeeper("a");
const b = await newKeeper("b");
for (const k of [a, b]) {
  const r = await api(k.jwt, "profiles", { method: "POST", body: JSON.stringify({ user_id: k.id, timezone: "Asia/Karachi" }) });
  assert.equal(r.status, 201, await r.text());
}

test("anonymous gets nothing", async () => {
  const r = await api(null, "memories?select=id");
  assert.ok(r.status >= 400, `status ${r.status}`);
  assert.ok(!Array.isArray(await r.json()));
});

test("keeper cannot create a profile for someone else", async () => {
  const r = await api(a.jwt, "profiles", { method: "POST", body: JSON.stringify({ user_id: b.id }) });
  assert.ok(r.status >= 400, `status ${r.status}`);
});

test("keeper cannot upgrade own plan", async () => {
  const r = await api(a.jwt, `profiles?user_id=eq.${a.id}`, { method: "PATCH", body: JSON.stringify({ plan: "premium" }) });
  assert.ok(r.status >= 400, `status ${r.status}`);
});

test("memories are isolated between keepers", async () => {
  const r = await insertMemory(a, "a's first relic");
  assert.equal(r.status, 201, await r.clone().text());
  const [row] = await r.json();
  const seenByB = await api(b.jwt, `memories?id=eq.${row.id}`).then((x) => x.json());
  assert.deepEqual(seenByB, []);
  const patchByB = await api(b.jwt, `memories?id=eq.${row.id}`, { method: "PATCH", body: JSON.stringify({ body: "x" }) });
  assert.deepEqual(await patchByB.json(), []);
  const delByB = await api(b.jwt, `memories?id=eq.${row.id}`, { method: "DELETE" });
  assert.deepEqual(await delByB.json(), []);
  const stillThere = await api(a.jwt, `memories?id=eq.${row.id}`).then((x) => x.json());
  assert.equal(stillThere.length, 1);
});

test("keeper cannot link a person to another keeper's memory", async () => {
  const [mem] = await insertMemory(a, "a's second relic").then((r) => r.json());
  const [person] = await api(b.jwt, "people", { method: "POST", body: JSON.stringify({ name: "Ali" }) }).then((r) => r.json());
  const r = await api(b.jwt, "memory_people", { method: "POST", body: JSON.stringify({ memory_id: mem.id, person_id: person.id }) });
  assert.ok(r.status >= 400, `status ${r.status}`);
});

test("keeper cannot write media rows directly", async () => {
  const [mem] = await api(a.jwt, "memories?select=id&limit=1").then((r) => r.json());
  const r = await api(a.jwt, "media", {
    method: "POST",
    body: JSON.stringify({ user_id: a.id, memory_id: mem.id, kind: "photo", object_key: "x", content_type: "image/webp", size_bytes: 1 }),
  });
  assert.ok(r.status >= 400, `status ${r.status}`);
});

test("free plan: 5 relics per day, the 6th is refused", async () => {
  // a already has 2 relics today
  for (let i = 0; i < 3; i++) assert.equal((await insertMemory(a, `relic ${i}`)).status, 201);
  const sixth = await insertMemory(a, "one too many");
  assert.ok(sixth.status >= 400, `status ${sixth.status}`);
  const err = await sixth.json();
  assert.equal(err.hint, "daily_limit");
});

test("vault_usage reports own usage only", async () => {
  const [u] = await api(a.jwt, "rpc/vault_usage", { method: "POST", body: "{}" }).then((r) => r.json());
  assert.equal(u.relics_today, 5);
  assert.equal(u.relics_today_limit, 5);
  assert.equal(Number(u.bytes_limit), 524288000);
  const [ub] = await api(b.jwt, "rpc/vault_usage", { method: "POST", body: "{}" }).then((r) => r.json());
  assert.equal(ub.relics_today, 0);
});
