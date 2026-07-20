export type InputType = 'image' | 'text' | 'url';
export type SourceType = 'camera' | 'library' | 'paste';
export type ScanStatus = 'ready_for_analysis';

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
  storage_path: string | null;
  image_size_bytes: number | null;
  image_width: number | null;
  image_height: number | null;
  text_content: string | null;
  normalized_url: string | null;
  consent_at: string;
  created_at: string;
  updated_at: string;
}
