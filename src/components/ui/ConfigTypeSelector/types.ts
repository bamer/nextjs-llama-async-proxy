import { ConfigType } from "@/types/model-config";

export interface ConfigTypeData {
  type: ConfigType;
  label: string;
  icon: React.ReactNode;
  color: "primary" | "secondary" | "success" | "warning" | "info" | "error";
}

export interface ConfigTypeSelectorProps {
  selectedType: ConfigType | null;
  onSelect: (type: ConfigType) => void;
  counts?: Record<ConfigType, number>;
  compact?: boolean;
}
