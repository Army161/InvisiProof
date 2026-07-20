import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import type { ImagePickerAsset } from 'expo-image-picker';
import type { ImageMeta } from '@/types/scan';

const MAX_DIMENSION = 2048;
const MAX_SIZE_BYTES = 8 * 1024 * 1024;
const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

export async function prepareImage(asset: ImagePickerAsset): Promise<ImageMeta> {
  console.log('[imagePrep] prepareImage called', { mimeType: asset.mimeType, width: asset.width, height: asset.height });

  // Validate type
  const mimeType = asset.mimeType ?? '';
  if (mimeType && !mimeType.startsWith('image/')) {
    throw new Error('Unsupported file type. Please select a JPEG, PNG, WebP, or HEIC image.');
  }
  if (mimeType && !SUPPORTED_TYPES.some(t => mimeType === t || mimeType.startsWith(t))) {
    throw new Error('Unsupported file type. Please select a JPEG, PNG, WebP, or HEIC image.');
  }

  // Reject missing URI
  if (!asset.uri) {
    throw new Error('Could not read the selected image. Please try again.');
  }

  // Reject files over 15 MB before manipulation
  const MAX_PRE_SIZE = 15 * 1024 * 1024;
  if (asset.fileSize && asset.fileSize > MAX_PRE_SIZE) {
    throw new Error('Please select an image under 15 MB.');
  }

  // Determine resize actions
  const actions: ImageManipulator.Action[] = [];
  const { width, height } = asset;
  if (width && height && (width > MAX_DIMENSION || height > MAX_DIMENSION)) {
    if (width >= height) {
      actions.push({ resize: { width: MAX_DIMENSION } });
    } else {
      actions.push({ resize: { height: MAX_DIMENSION } });
    }
    console.log('[imagePrep] resizing image, original dimensions:', width, 'x', height);
  }

  // Manipulate: resize + convert to JPEG
  const result = await ImageManipulator.manipulateAsync(
    asset.uri,
    actions,
    { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
  );

  console.log('[imagePrep] manipulation complete', { width: result.width, height: result.height });

  // Read as ArrayBuffer
  const response = await fetch(result.uri);
  if (!response.ok) {
    throw new Error('Failed to read processed image.');
  }
  const arrayBuffer = await response.arrayBuffer();
  const sizeBytes = arrayBuffer.byteLength;

  console.log('[imagePrep] image read as ArrayBuffer, sizeBytes:', sizeBytes);

  if (sizeBytes === 0) {
    throw new Error('The selected image appears to be empty. Please choose a different image.');
  }

  if (sizeBytes > MAX_SIZE_BYTES) {
    // One retry at lower quality
    const retryResult = await ImageManipulator.manipulateAsync(
      asset.uri,
      actions,
      { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
    );
    const retryResponse = await fetch(retryResult.uri);
    if (!retryResponse.ok) throw new Error('Failed to read processed image.');
    const retryBuffer = await retryResponse.arrayBuffer();
    const retrySizeBytes = retryBuffer.byteLength;
    if (retrySizeBytes > MAX_SIZE_BYTES) {
      throw new Error('This image is too large to upload even after compression. Please select a smaller image.');
    }
    return {
      uri: retryResult.uri,
      arrayBuffer: retryBuffer,
      width: retryResult.width,
      height: retryResult.height,
      sizeBytes: retrySizeBytes,
    };
  }

  return {
    uri: result.uri,
    arrayBuffer,
    width: result.width,
    height: result.height,
    sizeBytes,
  };
}

export async function deleteTempImage(uri: string): Promise<void> {
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // Ignore cleanup errors — temp files will be cleared by OS cache eviction
  }
}
