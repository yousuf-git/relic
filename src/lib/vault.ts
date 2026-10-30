// Client for the `vault` Neon Function (media signing, export, deletion).
import { getJwt } from "./auth";
import { config } from "./config";

export class VaultError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function call<T>(path: string, body: unknown = {}): Promise<T> {
  const post = async (force: boolean) =>
    fetch(`${config.vaultUrl}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${await getJwt(force)}` },
      body: JSON.stringify(body),
    });
  let res = await post(false);
  if (res.status === 401) res = await post(true);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new VaultError(data.error ?? `http_${res.status}`, data.message ?? "Request failed", res.status);
  return data as T;
}

export type SignedUpload = { mediaId: string; uploadUrl: string; headers: Record<string, string> };

export const vault = {
  signUpload: (input: {
    memoryId: string;
    kind: "photo" | "voice";
    contentType: string;
    sizeBytes: number;
    durationMs?: number;
    width?: number;
    height?: number;
    position?: number;
  }) => call<SignedUpload>("/media/sign-upload", input),
  confirm: (mediaId: string) => call<{ status: "ready" }>("/media/confirm", { mediaId }),
  signReads: (mediaIds: string[]) => call<{ urls: Record<string, string>; expiresIn: number }>("/media/sign-read", { mediaIds }),
  deleteMedia: (mediaId: string) => call("/media/delete", { mediaId }),
  exportVault: () => call<{ url: string; bytes: number; relics: number }>("/account/export"),
  deleteAccount: () => call<{ deleted: true }>("/account/delete"),
};
