// The server's 500 MB free quota is 500 * 1024 * 1024 bytes.
const MB = 1024 * 1024;

export function formatMb(bytes: number): string {
  const mb = bytes / MB;
  if (bytes > 0 && mb < 0.05) return "<0.1";
  return String(Number(mb.toFixed(1)));
}
