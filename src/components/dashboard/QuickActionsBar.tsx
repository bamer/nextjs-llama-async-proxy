"use client";

import { memo } from "react";
import { Button } from "@/components/ui/Button";

export interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  loading?: boolean;
  tooltip?: string;
  danger?: boolean;
}

interface QuickActionsBarProps {
  title?: string;
  actions: QuickAction[];
  className?: string;
}

export const QuickActionsBar = memo(function QuickActionsBar({
  title = "Quick Actions",
  actions,
  className = "",
}: QuickActionsBarProps) {
  return (
    <div
      className={`bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-lg ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <div key={action.id} title={action.tooltip || ""}>
            <Button
              variant={action.variant || "primary"}
              disabled={Boolean(action.disabled || action.loading)}
              onClick={action.onClick}
              className={action.danger ? "bg-danger hover:bg-danger/90" : ""}
            >
              {action.loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {action.label}
                </span>
              ) : (
                <span className="flex items-center gap-2">{action.icon}{action.label}</span>
              )}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
});

export function createDefaultActions(handlers: {
  onStartServer: () => void;
  onStopServer: () => void;
  onRefreshAll: () => void;
  onDownloadLogs: () => void;
  onScanModels: () => void;
}): QuickAction[] {
  return [
    { id: "start-server", label: "Start Server", icon: <span>▶</span>, onClick: handlers.onStartServer, variant: "primary" },
    { id: "stop-server", label: "Stop Server", icon: <span>⏹</span>, onClick: handlers.onStopServer, variant: "primary", danger: true },
    { id: "refresh-all", label: "Refresh All", icon: <span>↻</span>, onClick: handlers.onRefreshAll, variant: "secondary" },
    { id: "download-logs", label: "Download Logs", icon: <span>↓</span>, onClick: handlers.onDownloadLogs, variant: "secondary", tooltip: "Download server logs" },
    { id: "scan-models", label: "Scan Models", icon: <span>🔍</span>, onClick: handlers.onScanModels, variant: "secondary", tooltip: "Scan for new models" },
  ];
}

export default QuickActionsBar;
