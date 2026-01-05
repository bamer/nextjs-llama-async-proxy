"use client";

import { ReactNode } from 'react';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';

export interface ConfigurationSectionProps {
  title: string;
  children: ReactNode;
  level?: 'basic' | 'advanced' | 'expert';
  description?: string;
  defaultExpanded?: boolean;
}

export function ConfigurationSection({
  title,
  children,
  level = 'basic',
  description,
  defaultExpanded = level === 'basic'
}: ConfigurationSectionProps) {
  return (
    <CollapsibleSection
      title={title}
      level={level}
      {...(description && { description })}
      defaultExpanded={defaultExpanded}
    >
      {children}
    </CollapsibleSection>
  );
}