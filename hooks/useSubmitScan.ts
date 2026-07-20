import { useState, useRef, useCallback } from 'react';
import type { ImagePickerAsset } from 'expo-image-picker';
import { prepareImage, deleteTempImage } from '@/utils/imagePrep';
import { uploadImageScan, submitTextScan, submitUrlScan } from '@/services/scanService';
import type { Scan } from '@/types/scan';

export type SubmitStage = 'idle' | 'preparing' | 'uploading' | 'saving' | 'done' | 'error';

export const STAGE_LABELS: Record<SubmitStage, string> = {
  idle: '',
  preparing: 'Preparing image…',
  uploading: 'Uploading securely…',
  saving: 'Saving submission…',
  done: 'Submitted',
  error: '',
};

interface UseSubmitScanResult {
  stage: SubmitStage;
  stageLabel: string;
  error: string | null;
  submitImage: (asset: ImagePickerAsset, sourceType: 'camera' | 'library') => Promise<Scan | null>;
  submitText: (textContent: string) => Promise<Scan | null>;
  submitUrl: (normalizedUrl: string) => Promise<Scan | null>;
  reset: () => void;
}

export function useSubmitScan(): UseSubmitScanResult {
  const [stage, setStage] = useState<SubmitStage>('idle');
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const reset = useCallback(() => {
    console.log('[useSubmitScan] reset');
    setStage('idle');
    setError(null);
    inFlightRef.current = false;
  }, []);

  const submitImage = useCallback(async (
    asset: ImagePickerAsset,
    sourceType: 'camera' | 'library'
  ): Promise<Scan | null> => {
    if (inFlightRef.current) {
      console.log('[useSubmitScan] submitImage blocked — already in flight');
      return null;
    }
    inFlightRef.current = true;
    setError(null);
    console.log('[useSubmitScan] submitImage start', { sourceType });
    let preparedUri: string | null = null;
    try {
      setStage('preparing');
      const prepared = await prepareImage(asset);
      preparedUri = prepared.uri;
      setStage('uploading');
      const consentAt = new Date();
      setStage('saving');
      const scan = await uploadImageScan(prepared, sourceType, consentAt);
      setStage('done');
      console.log('[useSubmitScan] submitImage done');
      await deleteTempImage(prepared.uri);
      return scan;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      console.log('[useSubmitScan] submitImage error:', msg);
      setError(msg);
      setStage('error');
      if (preparedUri) await deleteTempImage(preparedUri);
      return null;
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  const submitText = useCallback(async (
    textContent: string
  ): Promise<Scan | null> => {
    if (inFlightRef.current) {
      console.log('[useSubmitScan] submitText blocked — already in flight');
      return null;
    }
    inFlightRef.current = true;
    setError(null);
    console.log('[useSubmitScan] submitText start', { textLength: textContent.length });
    try {
      setStage('saving');
      const consentAt = new Date();
      const scan = await submitTextScan(textContent, consentAt);
      setStage('done');
      console.log('[useSubmitScan] submitText done');
      return scan;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      console.log('[useSubmitScan] submitText error:', msg);
      setError(msg);
      setStage('error');
      return null;
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  const submitUrl = useCallback(async (
    normalizedUrl: string
  ): Promise<Scan | null> => {
    if (inFlightRef.current) {
      console.log('[useSubmitScan] submitUrl blocked — already in flight');
      return null;
    }
    inFlightRef.current = true;
    setError(null);
    console.log('[useSubmitScan] submitUrl start', {});
    try {
      setStage('saving');
      const consentAt = new Date();
      const scan = await submitUrlScan(normalizedUrl, consentAt);
      setStage('done');
      console.log('[useSubmitScan] submitUrl done');
      return scan;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      console.log('[useSubmitScan] submitUrl error:', msg);
      setError(msg);
      setStage('error');
      return null;
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  return {
    stage,
    stageLabel: STAGE_LABELS[stage],
    error,
    submitImage,
    submitText,
    submitUrl,
    reset,
  };
}
