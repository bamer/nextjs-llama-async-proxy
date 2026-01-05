"use client";

import { useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

const ROUTES: Record<string, string> = {
  "1": "/dashboard",
  "2": "/monitoring",
  "3": "/models",
  "4": "/logs",
  "5": "/settings",
};

interface UseKeyboardNavOptions {
  enabled?: boolean;
  onNavigate?: (path: string) => void;
  onSearchFocus?: () => void;
}

export function useKeyboardNav(options: UseKeyboardNavOptions = {}): void {
  const { enabled = true, onNavigate, onSearchFocus } = options;
  const router = useRouter();
  const pathname = usePathname();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent): void => {
      if (!enabled) return;

      // Alt + number for navigation
      if (e.altKey && ROUTES[e.key]) {
        e.preventDefault();
        const targetPath = ROUTES[e.key];
        // Don't navigate if already on that page
        if (pathname !== targetPath) {
          if (onNavigate) {
            onNavigate(targetPath);
          } else {
            router.push(targetPath);
          }
        }
      }

      // Ctrl/Cmd + / for search focus
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>('[data-search-input]');
        if (searchInput) {
          searchInput.focus();
        } else if (onSearchFocus) {
          onSearchFocus();
        }
      }

      // Escape to blur search input
      if (e.key === "Escape") {
        const searchInput = document.querySelector<HTMLInputElement>('[data-search-input]');
        if (searchInput && searchInput === document.activeElement) {
          searchInput.blur();
        }
      }
    },
    [enabled, router, pathname, onNavigate, onSearchFocus]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

export function KeyboardNavListener(): null {
  useKeyboardNav();
  return null;
}
