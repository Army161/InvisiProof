import * as ImageManipulator from 'expo-image-manipulator';
import { File } from 'expo-file-system';
import type { ImagePickerAsset } from 'expo-image-picker';
import type { ImageMeta } from '@/types/scan';

const MAX_DIMENSION = 2048;
const MAX_SIZE_BYTES = 8 * 1024 * 1024;       // 8 MB
const MAX_PRE_SIZE = 15 * 1024 * 1024;         // 15 MB
const SUPPORTED_MIME_PREFIXES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

export async function prepareImage(asset: ImagePickerAsset): Promise<ImageMeta> {
  console.log('[imagePrep] prepareImage called', { mimeType: asset.mimeType, width: asset.width, height: asset.height });

  // Step 1 — Validate URI
  if (!asset.uri) throw new Error('Could not read the selected image.');

  // Step 2 — Validate MIME type (only when present)
  const mimeType = asset.mimeType ?? '';
  if (mimeType && !SUPPORTED_MIME_PREFIXES.some(t => mimeType === t || mimeType.startsWith(t + '/'))) {
    throw new Error('Choose a supported screenshot or photo.');
  }

  // Step 3 — Determine original file size
  let originalSize: number = asset.fileSize ?? 0;
  if (originalSize <= 0) {
    const srcFile = new File(asset.uri);
    originalSize = srcFile.size;
  }

  // Step 4 — Reject zero-byte source
  if (originalSize === 0) throw new Error('The selected image appears to be empty.');

  // Step 5 — Reject source > 15 MB
  if (originalSize > MAX_PRE_SIZE) throw new Error('Please choose an image smaller than 15 MB.');

  // Step 6 — Validate dimensions
  if (!asset.width || asset.width <= 0 || !asset.height || asset.height <= 0) {
    throw new Error('Could not read the selected image.');
  }

  // Step 7 — Build resize actions (only when a dimension exceeds 2048; do NOT enlarge)
  const actions: ImageManipulator.Action[] = [];
  if (asset.width > MAX_DIMENSION || asset.height > MAX_DIMENSION) {
    if (asset.width >= asset.height) {
      actions.push({ resize: { width: MAX_DIMENSION } });
    } else {
      actions.push({ resize: { height: MAX_DIMENSION } });
    }
    console.log('[imagePrep] resizing', asset.width, 'x', asset.height);
  }

  // Step 8 — First manipulation at quality 0.83
  const first = await ImageManipulator.manipulateAsync(
    asset.uri,
    actions,
    { compress: 0.83, format: ImageManipulator.SaveFormat.JPEG }
  );
  console.log('[imagePrep] first pass complete', { width: first.width, height: first.height });

  // Step 9 — Verify first output exists and has positive size
  const firstFile = new File(first.uri);
  if (!firstFile.exists) throw new Error('Could not read the selected image.');
  const firstSize = firstFile.size;
  if (firstSize === 0) throw new Error('The selected image appears to be empty.');

  // Step 10 — If first output is within 8 MB, return it
  if (firstSize <= MAX_SIZE_BYTES) {
    console.log('[imagePrep] first pass accepted, sizeBytes:', firstSize);
    return { uri: first.uri, width: first.width, height: first.height, sizeBytes: firstSize, mimeType: 'image/jpeg' };
  }

  // Step 11 — First output exceeds 8 MB: perform exactly ONE retry at quality 0.60
  console.log('[imagePrep] first pass too large, retrying at 0.60, sizeBytes:', firstSize);
  // Delete the superseded first output
  try { await firstFile.delete(); } catch { /* ignore cleanup error */ }

  const second = await ImageManipulator.manipulateAsync(
    asset.uri,
    actions,
    { compress: 0.60, format: ImageManipulator.SaveFormat.JPEG }
  );
  const secondFile = new File(second.uri);
  const secondSize = secondFile.exists ? secondFile.size : 0;

  if (secondSize === 0 || secondSize > MAX_SIZE_BYTES) {
    // Delete unusable second output
    try { await secondFile.delete(); } catch { /* ignore */ }
    throw new Error('This image is still too large after preparation. Choose a different image.');
  }

  console.log('[imagePrep] second pass accepted, sizeBytes:', secondSize);
  return { uri: second.uri, width: second.width, height: second.height, sizeBytes: secondSize, mimeType: 'image/jpeg' };
}

export async function deleteTempImage(uri: string): Promise<void> {
  try {
    const file = new File(uri);
    if (file.exists) {
      await file.delete();
    }
  } catch {
    // Ignore cleanup errors
  }
}
