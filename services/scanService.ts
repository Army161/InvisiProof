import { supabase } from '@/lib/supabase';
import { File } from 'expo-file-system';
import type { Scan, ImageMeta } from '@/types/scan';

function generateScanId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function isAuthError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('auth') ||
    lower.includes('jwt') ||
    lower.includes('token') ||
    lower.includes('401') ||
    lower.includes('unauthorized')
  );
}

async function requireAuthenticatedUser(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Your session has expired. Please sign in again.');
  }
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('Your session has expired. Please sign in again.');
  }
  return user.id;
}

export async function uploadImageScan(
  image: ImageMeta,
  sourceType: 'camera' | 'library',
  consentAt: Date
): Promise<Scan> {
  const userId = await requireAuthenticatedUser();

  const scanId = generateScanId();
  const storagePath = `${userId}/${scanId}/source.jpg`;

  console.log('[scanService] uploadImageScan start', { sourceType, sizeBytes: image.sizeBytes });

  // 1. Read bytes immediately before upload — do not retain in state
  const uploadFile = new File(image.uri);
  if (!uploadFile.exists) throw new Error('Could not read the prepared image.');
  const uploadSize = uploadFile.size;
  if (uploadSize === 0) throw new Error('The selected image appears to be empty.');
  if (uploadSize > 8 * 1024 * 1024) throw new Error('The prepared image exceeds the maximum upload size.');
  const imageBytes = await uploadFile.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from('scan-uploads')
    .upload(storagePath, imageBytes, {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (uploadError) {
    console.log('[scanService] uploadImageScan storage upload failed:', uploadError.message);
    if (isAuthError(uploadError.message)) {
      throw new Error('Your session has expired. Please sign in again.');
    }
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  console.log('[scanService] uploadImageScan storage upload success, inserting scan row');

  // 2. Insert scan row
  const { data, error: insertError } = await supabase
    .from('scans')
    .insert({
      id: scanId,
      user_id: userId,
      input_type: 'image',
      source_type: sourceType,
      status: 'ready_for_analysis',
      storage_bucket: 'scan-uploads',
      storage_path: storagePath,
      mime_type: 'image/jpeg',
      file_size_bytes: image.sizeBytes,
      image_width: image.width,
      image_height: image.height,
      consent_confirmed_at: consentAt.toISOString(),
    })
    .select()
    .single();

  if (insertError || !data) {
    console.log('[scanService] uploadImageScan insert failed, rolling back storage:', insertError?.message);
    // Rollback: delete the uploaded file to prevent orphan
    await supabase.storage.from('scan-uploads').remove([storagePath]);
    if (insertError && isAuthError(insertError.message)) {
      throw new Error('Your session has expired. Please sign in again.');
    }
    throw new Error(`Failed to save scan record: ${insertError?.message ?? 'Unknown error'}`);
  }

  console.log('[scanService] uploadImageScan complete');
  return data as Scan;
}

export async function submitTextScan(
  textContent: string,
  consentAt: Date
): Promise<Scan> {
  const userId = await requireAuthenticatedUser();

  console.log('[scanService] submitTextScan start', { textLength: textContent.trim().length });

  const { data, error } = await supabase
    .from('scans')
    .insert({
      user_id: userId,
      input_type: 'text',
      source_type: 'paste',
      status: 'ready_for_analysis',
      storage_bucket: null,
      mime_type: null,
      text_content: textContent.trim(),
      consent_confirmed_at: consentAt.toISOString(),
    })
    .select()
    .single();

  if (error || !data) {
    console.log('[scanService] submitTextScan failed:', error?.message);
    if (error && isAuthError(error.message)) {
      throw new Error('Your session has expired. Please sign in again.');
    }
    throw new Error(`Failed to save text scan: ${error?.message ?? 'Unknown error'}`);
  }

  console.log('[scanService] submitTextScan complete');
  return data as Scan;
}

export async function submitUrlScan(
  normalizedUrl: string,
  consentAt: Date
): Promise<Scan> {
  const userId = await requireAuthenticatedUser();

  console.log('[scanService] submitUrlScan start', {});

  const { data, error } = await supabase
    .from('scans')
    .insert({
      user_id: userId,
      input_type: 'url',
      source_type: 'paste',
      status: 'ready_for_analysis',
      storage_bucket: null,
      mime_type: null,
      normalized_url: normalizedUrl,
      consent_confirmed_at: consentAt.toISOString(),
    })
    .select()
    .single();

  if (error || !data) {
    console.log('[scanService] submitUrlScan failed:', error?.message);
    if (error && isAuthError(error.message)) {
      throw new Error('Your session has expired. Please sign in again.');
    }
    throw new Error(`Failed to save URL scan: ${error?.message ?? 'Unknown error'}`);
  }

  console.log('[scanService] submitUrlScan complete');
  return data as Scan;
}
