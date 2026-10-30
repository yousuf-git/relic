// End-to-end checks for the deployed `vault` Neon Function on the checked-out branch.
// Run: node --env-file=.env --test db/tests/vault.test.mjs
import assert from "node:assert/strict";
import { test } from "node:test";

const AUTH = process.env.NEON_AUTH_BASE_URL;
const API = process.env.NEON_DATA_API_URL;
const VAULT = process.env.NEON_FUNCTION_VAULT_BASE_URL?.replace(/\/$/, "");
const ORIGIN = "http://localhost:8081";
assert.ok(AUTH && API && VAULT, "auth, data api and vault URLs must be set");

const email = `vault-${Date.now()}@example.com`;
const password = "Vault-test-pass-123";

const signUp = await fetch(`${AUTH}/sign-up/email`, {
  method: "POST",
  headers: { "content-type": "application/json", origin: ORIGIN },
  body: JSON.stringify({ email, password, name: "Vault test" }),
});
assert.equal(signUp.status, 200);
const userId = (await signUp.clone().json()).user.id;
const cookie = signUp.headers.get("set-cookie").split(";")[0];
const jwt = (await fetch(`${AUTH}/token`, { headers: { origin: ORIGIN, cookie } }).then((r) => r.json())).token;

const data = (path, init = {}) =>
  fetch(`${API}/${path}`, {
    ...init,
    headers: { "content-type": "application/json", prefer: "return=representation", authorization: `Bearer ${jwt}` },
  });
const vault = (path, body, token = jwt) =>
  fetch(`${VAULT}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body ?? {}),
  });

const prof = await data("profiles", { method: "POST", body: JSON.stringify({ user_id: userId }) });
assert.equal(prof.status, 201, await prof.text());
const [memory] = await data("memories", {
  method: "POST",
  body: JSON.stringify({ body: "first light", occurred_on: "2025-01-01", vessel: "plate" }),
}).then((r) => r.json());

// A tiny valid WebP (1x1) is enough: the function checks size, not pixels.
const webp = Buffer.from("UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=", "base64");

test("rejects calls without a valid token", async () => {
  assert.equal((await vault("/media/sign-upload", {}, null)).status, 401);
  assert.equal((await vault("/media/sign-upload", {}, "not.a.jwt")).status, 401);
});

test("uploads a photo through a presigned URL and reads it back", async () => {
  const sign = await vault("/media/sign-upload", {
    memoryId: memory.id, kind: "photo", contentType: "image/webp", sizeBytes: webp.length, width: 1, height: 1,
  });
  assert.equal(sign.status, 200, await sign.clone().text());
  const { mediaId, uploadUrl, headers } = await sign.json();

  const put = await fetch(uploadUrl, { method: "PUT", headers, body: webp });
  assert.equal(put.status, 200, await put.text());

  const confirm = await vault("/media/confirm", { mediaId });
  assert.equal(confirm.status, 200, await confirm.clone().text());

  const rows = await data(`media?id=eq.${mediaId}&select=status,size_bytes`).then((r) => r.json());
  assert.deepEqual(rows, [{ status: "ready", size_bytes: webp.length }]);

  const { urls } = await vault("/media/sign-read", { mediaIds: [mediaId] }).then((r) => r.json());
  const got = Buffer.from(await fetch(urls[mediaId]).then((r) => r.arrayBuffer()));
  assert.ok(got.equals(webp));
});

test("refuses media for a memory the caller does not own", async () => {
  const r = await vault("/media/sign-upload", {
    memoryId: "00000000-0000-4000-8000-000000000000", kind: "photo", contentType: "image/webp", sizeBytes: 10,
  });
  assert.equal(r.status, 404);
});

test("enforces type, size, voice length and 5-photo limits", async () => {
  const base = { memoryId: memory.id, kind: "photo", contentType: "image/webp", sizeBytes: 100 };
  assert.equal((await vault("/media/sign-upload", { ...base, contentType: "video/mp4" })).status, 400);
  assert.equal((await vault("/media/sign-upload", { ...base, sizeBytes: 11 * 1024 * 1024 })).status, 413);
  assert.equal((await vault("/media/sign-upload", { ...base, kind: "voice", contentType: "audio/mp4", durationMs: 61_000 })).status, 400);
  for (let i = 0; i < 4; i++) assert.equal((await vault("/media/sign-upload", base)).status, 200);
  const sixth = await vault("/media/sign-upload", base);
  assert.equal(sixth.status, 409);
  assert.equal((await sixth.json()).error, "photo_limit");
});

test("sealed relics keep their media sealed", async () => {
  const [sealed] = await data("memories", {
    method: "POST",
    body: JSON.stringify({ body: "open me later", occurred_on: "2025-01-02", sealed_until: "2099-01-01" }),
  }).then((r) => r.json());
  const { mediaId, uploadUrl, headers } = await vault("/media/sign-upload", {
    memoryId: sealed.id, kind: "photo", contentType: "image/webp", sizeBytes: webp.length,
  }).then((r) => r.json());
  await fetch(uploadUrl, { method: "PUT", headers, body: webp });
  await vault("/media/confirm", { mediaId });
  const { urls } = await vault("/media/sign-read", { mediaIds: [mediaId] }).then((r) => r.json());
  assert.deepEqual(urls, {});
});

test("exports the vault as a zip", async () => {
  const r = await vault("/account/export");
  assert.equal(r.status, 200, await r.clone().text());
  const { url, relics } = await r.json();
  assert.equal(relics, 2);
  const zip = Buffer.from(await fetch(url).then((x) => x.arrayBuffer()));
  assert.equal(zip.subarray(0, 2).toString(), "PK");
});

test("deleting the account removes the keeper and their data", async () => {
  const r = await vault("/account/delete");
  assert.equal(r.status, 200, await r.clone().text());
  const signIn = await fetch(`${AUTH}/sign-in/email`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: ORIGIN },
    body: JSON.stringify({ email, password }),
  });
  assert.notEqual(signIn.status, 200);
});
