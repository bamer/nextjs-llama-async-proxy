export interface FieldDefinition {
  name: string;
  label: string;
  type: "text" | "number" | "select" | "boolean";
  options?: string[];
  defaultValue: unknown;
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  validation?: unknown;
  unit?: string;
  step?: number;
  marks?: Array<{ value: number; label: string }>;
}
