export type ProofLoopProvider = 'local' | 'openai' | 'anthropic' | 'gemini' | 'grok' | 'custom';

export type AnalysisMode = 'local' | 'cloud_byok';
export type TrustLevel = 'device_generated' | 'server_verified';

export interface NormalizedAssessment {
  risk_level: 'low' | 'moderate' | 'high' | 'critical' | 'inconclusive';
  risk_score: number;
  summary: string;
  warning_signals: string[];
  recommended_actions: string[];
  limitations: string[];
  provider: ProofLoopProvider;
  model: string;
  analysis_mode: AnalysisMode;
  trust_level: TrustLevel;
  completed_at: string;
}

export interface ProviderCredential {
  provider: ProofLoopProvider;
  apiKey: string;
  customBaseUrl?: string;
  model?: string;
}

export interface ModelManifestEntry {
  id: string;
  name: string;
  version: string;
  license: string;
  downloadUrl: string;
  fileSizeBytes: number;
  sha256: string;
  minStorageBytes: number;
  platforms: ('ios' | 'android' | 'web')[];
}

export const MODEL_MANIFEST: ModelManifestEntry[] = [
  // Placeholder — real model entries added when local inference runtime is available
  // {
  //   id: 'proofloop-local-v1',
  //   name: 'ProofLoop Local v1',
  //   version: '1.0.0',
  //   license: 'Apache-2.0',
  //   downloadUrl: 'https://models.proofloop.app/v1/proofloop-local-v1.bin',
  //   fileSizeBytes: 150_000_000,
  //   sha256: 'placeholder',
  //   minStorageBytes: 300_000_000,
  //   platforms: ['ios', 'android'],
  // },
];
