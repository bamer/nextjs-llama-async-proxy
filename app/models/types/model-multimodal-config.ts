export interface ModelMultimodalConfig {
  id?: number;
  model_id?: number;
  mmproj?: string;
  mmproj_url?: string;
  mmproj_auto?: number;
  mmproj_offload?: number;
  image_min_tokens?: number;
  image_max_tokens?: number;
  created_at?: number;
  updated_at?: number;
}
