export interface ModelMemoryConfig {
  id?: number;
  model_id?: number;
  cache_ram?: number;
  cache_type_k?: string;
  cache_type_v?: string;
  mmap?: number;
  mlock?: number;
  numa?: string;
  defrag_thold?: number;
  created_at?: number;
  updated_at?: number;
}
