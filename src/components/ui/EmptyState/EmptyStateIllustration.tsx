import type { IllustrationType } from "./EmptyState.types";
import { m } from "framer-motion";

interface EmptyStateIllustrationProps {
  type: IllustrationType;
}

export function EmptyStateIllustration({ type }: EmptyStateIllustrationProps) {
  if (type === "models") {
    return (
      <m.svg viewBox="0 0 200 200" style={{ width: 120, height: 120 }}>
        <circle cx="100" cy="100" r="60" fill="none" stroke="#6366f1" strokeWidth="3" />
        <circle cx="100" cy="100" r="40" fill="none" stroke="#8b5cf6" strokeWidth="3" />
        <circle cx="100" cy="100" r="20" fill="#a78bfa" />
      </m.svg>
    );
  }

  if (type === "logs") {
    return (
      <m.svg viewBox="0 0 200 200" style={{ width: 120, height: 120 }}>
        <rect x="50" y="40" width="100" height="120" rx="8" fill="none" stroke="#10b981" strokeWidth="3" />
        <line x1="70" y1="70" x2="130" y2="70" stroke="#34d399" strokeWidth="2" />
        <line x1="70" y1="95" x2="110" y2="95" stroke="#34d399" strokeWidth="2" />
        <line x1="70" y1="120" x2="120" y2="120" stroke="#34d399" strokeWidth="2" />
        <line x1="70" y1="145" x2="90" y2="145" stroke="#34d399" strokeWidth="2" />
      </m.svg>
    );
  }

  if (type === "search") {
    return (
      <m.svg viewBox="0 0 200 200" style={{ width: 120, height: 120 }}>
        <circle cx="80" cy="80" r="40" fill="none" stroke="#f59e0b" strokeWidth="3" />
        <line x1="110" y1="110" x2="150" y2="150" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" />
      </m.svg>
    );
  }

  return (
    <m.svg viewBox="0 0 200 200" style={{ width: 120, height: 120 }}>
      <rect x="40" y="60" width="120" height="80" rx="8" fill="none" stroke="#3b82f6" strokeWidth="3" />
      <polyline points="50,110 70,90 90,100 110,70 130,85 145,75" fill="none" stroke="#60a5fa" strokeWidth="2" />
      <circle cx="145" cy="75" r="4" fill="#93c5fd" />
    </m.svg>
  );
}
