import * as ImageManipulator from 'expo-image-manipulator';
import type { ImagePickerAsset } from 'expo-image-picker';
import type { ImageMeta } from '@/types/scan';

const MAX_DIMENSION = 2048;
const MAX_SIZE_BYTES = 8 * 1024 * 1024;
const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

export async function prepareImage(asset: ImagePickerAsset): Promise<ImageMeta> {
  console.log('[imagePrep] prepareImage called', { uri: asset.uri, mimeType: asset.mimeType, width: asset.width, height: asset.height });

  // Validate type
  const mimeType = asset.mimeType ?? '';
  if (mimeType && !mimeType.startsWith('image/')) {
    throw new Error('Unsupported file type. Please select a JPEG, PNG, WebP, or HEIC image.');
  }
  if (mimeType && !SUPPORTED_TYPES.some(t => mimeType === t || mimeType.startsWith(t))) {
    throw new Error('Unsupported file type. Please select a JPEG, PNG, WebP, or HEIC image.');
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

  console.log('[imagePrep] manipulation complete', { uri: result.uri, width: result.width, height: result.height });

  // Read as ArrayBuffer
  const response = await fetch(result.uri);
  if (!response.ok) {
    throw new Error('Failed to read processed image.');
  }
  const arrayBuffer = await response.arrayBuffer();
  const sizeBytes = arrayBuffer.byteLength;

  console.log('[imagePrep] image read as ArrayBuffer, sizeBytes:', sizeBytes);

  if (sizeBytes > MAX_SIZE_BYTES) {
    throw new Error('Image is too large. Please select an image under 8 MB.');
  }

  return {
    uri: result.uri,
    arrayBuffer,
    width: result.width,
    height: result.height,
    sizeBytes,
  };
}
