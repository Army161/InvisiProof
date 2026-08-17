import { Platform } from 'react-native';
import type { NormalizedAssessment } from './types';

/**
 * InvisiProof Local Provider
 *
 * STATUS: Architecture ready. Runtime not yet available.
 *
 * BLOCKER: React Native / Expo does not currently have a stable, maintained
 * on-device LLM inference runtime that supports all three platforms
 * (iOS, Android, Web) with the required model size and performance.
 *
 * Candidates under evaluation:
 * - llama.cpp via react-native-llama.rn (iOS/Android only, no Web)
 * - MediaPipe LLM Inference (Android/iOS, limited model support)
 * - WebLLM (Web only via WebGPU)
 * - ONNX Runtime (cross-platform, limited LLM support)
 *
 * When a runtime is selected:
 * 1. Add the model entry to MODEL_MANIFEST in types.ts
 * 2. Implement downloadModel() using expo-file-system with SHA-256 verification
 * 3. Implement runInference() using the selected runtime
 * 4. Set analysis_mode = 'local', trust_level = 'device_generated'
 * 5. Remove this stub and replace with real implementation
 *
 * IMPORTANT: Do NOT return fake/random results as if they were real analysis.
 */

export function isLocalAvailable(): boolean {
  // Local inference not yet available on any platform
  return false;
}

export function getLocalUnavailableReason(): string {
  if (Platform.OS === 'web') {
    return 'Local analysis is not yet available on web. Please use a BYOK provider.';
  }
  return 'Local analysis is coming soon. Please configure a BYOK provider in Profile → AI Provider to run analysis.';
}

export async function runLocalAnalysis(_content: string): Promise<NormalizedAssessment> {
  throw new Error(getLocalUnavailableReason());
}
