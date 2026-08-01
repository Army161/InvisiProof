export type InputType = 'image' | 'text' | 'url';

export interface AssessmentResult {
  id: string;
  scan_id: string;
  user_id: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  risk_score: number;
  summary: string;
  warning_signals: string[];
  recommended_actions: string[];
  limitations: string | null;
  input_type: InputType;
  provider: string;
  model: string;
  completed_at: string;
  created_at: string;
}

export interface ProofRequest {
  id: string;
  requester_id: string;
  share_code: string;
  challenge: string;
  expires_at: string;
  status: 'pending' | 'completed' | 'expired' | 'cancelled';
  response_scan_id: string | null;
  respondent_id: string | null;
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
  consent_confirmed_at: string;
  created_at: string;
  updated_at: string;
}
