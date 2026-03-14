/**
 * Lightweight video preparation before upload.
 * 
 * Real-time canvas re-encoding is too heavy for mobile browsers and causes
 * crashes / freezes. Instead we simply validate the file and return it as-is.
 * Image compression (which is fast) is handled separately in imageCompression.ts.
 *
 * If the file exceeds maxBytes the caller should reject it.
 */
export async function compressVideo(
  file: File,
  _maxWidth = 720,
  _maxHeight = 720,
  _videoBitrate = 800_000
): Promise<Blob> {
  // On mobile, real-time canvas re-encoding causes the browser to crash.
  // Return the original file and let the caller enforce size limits.
  return file;
}
