import type { ReactNode } from "react";

export type IllustrationType = "models" | "logs" | "search" | "monitoring";

export interface EmptyStateProps {
  illustration: IllustrationType;
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
  } | null;
  secondaryAction?: {
    label: string;
    onClick: () => void;
  } | null;
  tips?: string[];
  documentationUrl?: string;
}

export interface EmptyStateComponentProps extends EmptyStateProps {
  children?: ReactNode;
}
