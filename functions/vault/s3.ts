import {
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const BUCKET = "media";

const s3 = new S3Client({
  endpoint: process.env.AWS_ENDPOINT_URL_S3,
  region: process.env.AWS_REGION,
  forcePathStyle: true,
});

export function presignPut(key: string, contentType: string, contentLength: number): Promise<string> {
  return getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType, ContentLength: contentLength }),
    { expiresIn: 600, signableHeaders: new Set(["content-type", "content-length"]) },
  );
}

export function presignGet(key: string, expiresIn = 3600): Promise<string> {
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn });
}

export async function headObject(key: string): Promise<{ size: number; contentType?: string } | null> {
  try {
    const head = await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return { size: head.ContentLength ?? 0, contentType: head.ContentType };
  } catch (err: any) {
    if (err?.$metadata?.httpStatusCode === 404 || err?.name === "NotFound") return null;
    throw err;
  }
}

export async function getObjectBytes(key: string): Promise<Uint8Array> {
  const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  return res.Body!.transformToByteArray();
}

export async function putObject(key: string, body: Uint8Array, contentType: string): Promise<void> {
  await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body, ContentType: contentType }));
}

export async function deleteKeys(keys: string[]): Promise<void> {
  for (let i = 0; i < keys.length; i += 1000) {
    const chunk = keys.slice(i, i + 1000);
    if (chunk.length === 0) continue;
    await s3.send(new DeleteObjectsCommand({ Bucket: BUCKET, Delete: { Objects: chunk.map((Key) => ({ Key })), Quiet: true } }));
  }
}

export async function deletePrefix(prefix: string): Promise<void> {
  let token: string | undefined;
  do {
    const page = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix, ContinuationToken: token }));
    await deleteKeys((page.Contents ?? []).map((o) => o.Key!).filter(Boolean));
    token = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (token);
}
