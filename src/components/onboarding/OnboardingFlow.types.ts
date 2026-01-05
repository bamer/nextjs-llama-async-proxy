export type OnboardingStep = "welcome" | "scan" | "configure" | "complete";

export interface OnboardingConfig {
  modelName: string;
  maxTokens: string;
  temperature: string;
  enableStreaming: boolean;
  contextSize: number;
  gpuLayers: number;
  serverPort: string;
}

export interface OnboardingFlowProps {
  open: boolean;
  onComplete?: (config: OnboardingConfig) => void;
  onSkip?: () => void;
}
