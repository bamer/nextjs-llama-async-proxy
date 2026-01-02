export interface Stat {
  value: string;
  label: string;
  color: "primary" | "secondary" | "success" | "warning";
}

export const stats: Stat[] = [
  { value: "4+", label: "Active Models", color: "primary" },
  { value: "99.9%", label: "Uptime", color: "secondary" },
  { value: "150ms", label: "Avg Response", color: "success" },
  { value: "1000+", label: "Requests", color: "warning" },
];
