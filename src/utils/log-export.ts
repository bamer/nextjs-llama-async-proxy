export interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  source?: string;
}

type ExportFormat = "json" | "csv" | "text" | "html";

export function exportLogs(logs: LogEntry[], format: ExportFormat): void {
  const mimeTypes: Record<ExportFormat, string> = {
    json: "application/json",
    csv: "text/csv",
    text: "text/plain",
    html: "text/html",
  };

  let content: string;
  switch (format) {
    case "json":
      content = JSON.stringify(logs, null, 2);
      break;
    case "csv":
      const headers = "timestamp,level,message,source";
      content = [headers, ...logs.map((l) => `${l.timestamp},${l.level},"${l.message.replace(/"/g, '""')}",${l.source || ""}`)].join("\n");
      break;
    case "text":
      content = logs.map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}${l.source ? ` (${l.source})` : ""}`).join("\n");
      break;
    case "html":
      const colors = { info: "#1e7e34", warn: "#ffc107", error: "#dc3545", debug: "#6c757d" };
      content = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Log Export</title>
<style>body{font-family: Arial, margin: 20px;} table{width: 100%; border-collapse: collapse;}</style></head>
<body><h1>Log Export</h1><table><thead><tr><th>Timestamp</th><th>Level</th><th>Message</th><th>Source</th></tr></thead>
<tbody>${logs.map((l) => `<tr style="border-bottom: 1px solid #dee2e6;"><td style="padding: 8px;">${l.timestamp}</td>
<td style="padding: 8px; color: ${colors[l.level]}; font-weight: bold;">${l.level.toUpperCase()}</td>
<td style="padding: 8px;">${l.message}</td><td style="padding: 8px;">${l.source || "-"}</td></tr>`).join("")}</tbody></table></body></html>`;
      break;
  }

  const blob = new Blob([content], { type: mimeTypes[format] });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `logs-${new Date().toISOString().slice(0, 10)}.${format}`;
  a.click();
  URL.revokeObjectURL(url);
}
