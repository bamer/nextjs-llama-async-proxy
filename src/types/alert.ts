export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';
export type AlertCategory = 'cpu' | 'memory' | 'gpu' | 'storage' | 'temperature' | 'network' | 'model' | 'custom';
export type AlertCondition = 'above' | 'below' | 'equals' | 'not_equals';

export interface AlertThreshold {
  condition: AlertCondition;
  value: number;
  duration?: number; // seconds before triggering
}

export interface AlertConfig {
  id: string;
  name: string;
  description?: string;
  category: AlertCategory;
  severity: AlertSeverity;
  enabled: boolean;
  threshold: AlertThreshold;
  cooldown: number; // seconds between notifications
  actions: AlertAction[];
  lastTriggered?: Date;
  triggerCount: number;
}

export interface AlertAction {
  type: 'notification' | 'webhook' | 'email' | 'auto_scale';
  config: Record<string, unknown>;
}

export interface ActiveAlert {
  id: string;
  configId: string;
  name: string;
  category: AlertCategory;
  severity: AlertSeverity;
  message: string;
  currentValue: number;
  threshold: number;
  triggeredAt: Date;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
}

export interface AlertStatistics {
  totalAlerts: number;
  activeAlerts: number;
  acknowledgedAlerts: number;
  byCategory: Record<AlertCategory, number>;
  bySeverity: Record<AlertSeverity, number>;
}

export const ALERT_CATEGORY_LABELS: Record<AlertCategory, string> = {
  cpu: 'CPU Usage',
  memory: 'Memory',
  gpu: 'GPU',
  storage: 'Storage',
  temperature: 'Temperature',
  network: 'Network',
  model: 'Model',
  custom: 'Custom',
};

export const ALERT_SEVERITY_LABELS: Record<AlertSeverity, string> = {
  info: 'Info',
  warning: 'Warning',
  error: 'Error',
  critical: 'Critical',
};

export const ALERT_CONDITION_LABELS: Record<AlertCondition, string> = {
  above: 'Above',
  below: 'Below',
  equals: 'Equals',
  not_equals: 'Not Equals',
};

export const ALERT_SEVERITY_COLORS: Record<AlertSeverity, string> = {
  info: '#3b82f6',
  warning: '#f59e0b',
  error: '#ef4444',
  critical: '#dc2626',
};

export const DEFAULT_ALERTS: AlertConfig[] = [
  {
    id: 'cpu-high',
    name: 'High CPU Usage',
    description: 'Triggered when CPU usage exceeds threshold',
    category: 'cpu',
    severity: 'warning',
    enabled: true,
    threshold: { condition: 'above', value: 80 },
    cooldown: 300,
    actions: [{ type: 'notification', config: {} }],
    triggerCount: 0,
  },
  {
    id: 'memory-high',
    name: 'High Memory Usage',
    description: 'Triggered when memory usage exceeds threshold',
    category: 'memory',
    severity: 'warning',
    enabled: true,
    threshold: { condition: 'above', value: 85 },
    cooldown: 300,
    actions: [{ type: 'notification', config: {} }],
    triggerCount: 0,
  },
  {
    id: 'gpu-high',
    name: 'High GPU Usage',
    description: 'Triggered when GPU usage exceeds threshold',
    category: 'gpu',
    severity: 'info',
    enabled: false,
    threshold: { condition: 'above', value: 90 },
    cooldown: 600,
    actions: [{ type: 'notification', config: {} }],
    triggerCount: 0,
  },
  {
    id: 'temperature-high',
    name: 'High Temperature',
    description: 'Triggered when temperature exceeds threshold',
    category: 'temperature',
    severity: 'error',
    enabled: true,
    threshold: { condition: 'above', value: 80 },
    cooldown: 120,
    actions: [{ type: 'notification', config: {} }],
    triggerCount: 0,
  },
];
