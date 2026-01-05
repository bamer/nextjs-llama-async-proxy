"use client";

import { usePathname } from "next/navigation";
import {
  Breadcrumbs as MuiBreadcrumbs,
  Link,
  Typography,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useMemo } from "react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  maxItems?: number;
  sx?: object;
}

export function Breadcrumbs({ items, maxItems = 8, sx }: BreadcrumbsProps) {
  const pathname = usePathname();

  const breadcrumbs = useMemo(() => {
    if (items) return items;
    const segments = pathname.split("/").filter(Boolean);
    return segments.map((segment, index) => ({
      label: segment.charAt(0).toUpperCase() + segment.slice(1),
      href: "/" + segments.slice(0, index + 1).join("/"),
    }));
  }, [pathname, items]);

  const visibleItems = breadcrumbs.length > maxItems
    ? [...breadcrumbs.slice(0, 2), { label: "..." }, ...breadcrumbs.slice(-2)]
    : breadcrumbs;

  return (
    <MuiBreadcrumbs
      separator={<ChevronRightIcon fontSize="small" />}
      sx={sx || {}}
      aria-label="breadcrumb"
    >
      <Link key="home" color="inherit" href="/" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <HomeIcon fontSize="small" />Home
      </Link>

      {visibleItems.map((item, i) => {
        const last = i === visibleItems.length - 1;
        return last ? (
          <Typography key={item.label} color="text.primary">{item.label}</Typography>
        ) : (
          <Link key={item.label + item.href} color="inherit" href={item.href}>{item.label}</Link>
        );
      })}
    </MuiBreadcrumbs>
  );
}
