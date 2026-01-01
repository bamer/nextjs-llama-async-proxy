export interface TooltipContent {
  title: string;
  description: string;
  recommendedValue?: string;
  effectOnModel?: string;
  whenToAdjust?: string;
}

export interface TooltipConfig {
  [configType: string]: {
    [fieldName: string]: TooltipContent;
  };
}
