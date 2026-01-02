"use client";

import type { FieldDefinition } from "../../components/ui/ModelConfigDialog/types";

// Basic configuration fields - memory and GPU settings
export const basicFields: FieldDefinition[] = [
  { name: "cache_ram", label: "Cache RAM", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "Go", step: 0.1 },
  { name: "cache_type_k", label: "Type de Cache K", type: "text", defaultValue: "", xs: 12, sm: 6 },
  { name: "cache_type_v", label: "Type de Cache V", type: "text", defaultValue: "", xs: 12, sm: 6 },
  { name: "mmap", label: "MMap (Cartographie Mémoire)", type: "boolean", defaultValue: true, xs: 12, sm: 6 },
  { name: "mlock", label: "MLock (Verrou Mémoire)", type: "boolean", defaultValue: false, xs: 12, sm: 6 },
  { name: "numa", label: "NUMA", type: "text", defaultValue: "", xs: 12, sm: 6 },
  { name: "defrag_thold", label: "Seuil de Défragmentation", type: "number", defaultValue: -1, xs: 12, sm: 6, unit: "", step: 0.01 },
  { name: "device", label: "Périphérique", type: "text", defaultValue: "", xs: 12, sm: 6 },
  { name: "list_devices", label: "Lister les Périphériques", type: "boolean", defaultValue: false, xs: 12, sm: 6 },
  { name: "gpu_layers", label: "Couches GPU", type: "number", defaultValue: -1, xs: 12, sm: 6, unit: "couches", step: 1 },
  { name: "split_mode", label: "Mode de Partage", type: "select", options: ["", "layer", "row"], defaultValue: "", xs: 12, sm: 6 },
  { name: "tensor_split", label: "Répartition Tensor", type: "text", defaultValue: "", xs: 12, sm: 6 },
  { name: "main_gpu", label: "GPU Principal", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "", step: 1 },
  { name: "kv_offload", label: "Déchargement KV", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "", step: 1 },
  { name: "repack", label: "Réempaqueter", type: "boolean", defaultValue: false, xs: 12, sm: 6 },
  { name: "no_host", label: "Pas d'Hôte", type: "boolean", defaultValue: false, xs: 12, sm: 6 },
];
