export type InputType = 'image' | 'text' | 'url';

export interface AssessmentResult {
  id: string;
  scan_id: string;
  user_id: string;
  risk_level: 'low' | 'moderate' | 'high' | 'critical' | 'inconclusive';
  risk_score: number;
  summary: string;
  warning_signals: string[];
  recommended_actions: string[];
  limitations: string[] | null;
  provider: string;
  model: string;
  analysis_mode: 'local' | 'cloud_byok';
  trust_level: 'device_generated' | 'server_verified';
  analysis_version: string;
  completed_at: string;
  created_at: string;
}

export interface ProofRequest {
  id: string;
  requester_id: string;
  share_code: string;
  challenge: string;
  expires_at: string;
  status: 'pending' | 'completed' | 'expired' | 'cancelled' | 'responded' | 'failed';
  response_scan_id: string | null;
  respondent_id: string | null;
  responded_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
  analysis_requirement?: 'local_or_cloud' | 'server_verified_cloud';
  created_at: string;
  updated_at: string;
}

export type SourceType = 'camera' | 'library' | 'paste';
export type ScanStatus = 'ready_for_analysis' | 'processing' | 'completed' | 'failed';

export interface PreparedImage {
  uri: string;
  width: number;
  height: number;
  sizeBytes: number;
  mimeType: 'image/jpeg';
}

export interface ImageMeta {
  uri: string;
  width: number;
  height: number;
  sizeBytes: number;
  mimeType: 'image/jpeg';
}

export interface Scan {
  id: string;
  user_id: string;
  input_type: InputType;
  source_type: SourceType;
  status: ScanStatus;
  storage_bucket: string | null;
  storage_path: string | null;
  mime_type: string | null;
  file_size_bytes: number | null;
  image_width: number | null;
  image_height: number | null;
  text_content: string | null;
  normalized_url: string | null;
  original_filename?: string | null;
  consent_confirmed_at: string;
  analysis_started_at?: string | null;
  analysis_completed_at?: string | null;
  analysis_error_code?: string | null;
  analysis_attempt_count?: number;
  created_at: string;
  updated_at: string;
}
