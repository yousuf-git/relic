// Media pipeline: shrink on device, sign with the vault function, PUT straight
// to object storage, then confirm so the server records the real size.
import { File } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { vault } from "./vault";

export const LIMITS = {
  photoLongEdge: 1600,
  photosPerRelic: 5,
  voiceMaxMs: 60_000,
  quotaBytes: 500 * 1024 * 1024,
  relicsPerDay: 5,
} as const;

export type PreparedPhoto = { uri: string; width: number; height: number; sizeBytes: number };

export async function preparePhoto(uri: string, width: number, height: number): Promise<PreparedPhoto> {
  const longEdge = Math.max(width, height);
  const ctx = ImageManipulator.manipulate(uri);
  if (longEdge > LIMITS.photoLongEdge) {
    ctx.resize(width >= height ? { width: LIMITS.photoLongEdge } : { height: LIMITS.photoLongEdge });
  }
  const image = await ctx.renderAsync();
  const out = await image.saveAsync({ format: SaveFormat.WEBP, compress: 0.8 });
  return { uri: out.uri, width: out.width, height: out.height, sizeBytes: new File(out.uri).size ?? 0 };
}

async function putFile(uploadUrl: string, headers: Record<string, string>, uri: string) {
  const res = await fetch(uploadUrl, { method: "PUT", headers, body: new File(uri) });
  if (!res.ok) throw new Error(`upload failed (${res.status})`);
}

export async function uploadPhoto(memoryId: string, photo: PreparedPhoto, position: number) {
  const signed = await vault.signUpload({
    memoryId,
    kind: "photo",
    contentType: "image/webp",
    sizeBytes: photo.sizeBytes,
    width: photo.width,
    height: photo.height,
    position,
  });
  await putFile(signed.uploadUrl, signed.headers, photo.uri);
  await vault.confirm(signed.mediaId);
  return signed.mediaId;
}

export async function uploadVoice(memoryId: string, uri: string, durationMs: number) {
  const sizeBytes = new File(uri).size ?? 0;
  const signed = await vault.signUpload({ memoryId, kind: "voice", contentType: "audio/mp4", sizeBytes, durationMs });
  await putFile(signed.uploadUrl, signed.headers, uri);
  await vault.confirm(signed.mediaId);
  return signed.mediaId;
}
