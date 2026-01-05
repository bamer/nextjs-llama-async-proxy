"use client";

import { m } from "framer-motion";
import { Card, CardContent, Typography, Button, Box, Link } from "@mui/material";
import type { EmptyStateProps } from "./EmptyState.types";
import { EmptyStateIllustration } from "./EmptyStateIllustration";

export function EmptyState({
  illustration,
  title,
  description,
  primaryAction,
  secondaryAction,
  tips,
  documentationUrl,
}: EmptyStateProps) {
  return (
    <Card component={m.div} sx={{ maxWidth: 500, mx: "auto", mt: 4 }}>
      <CardContent sx={{ textAlign: "center", p: 4 }}>
        <Box sx={{ mb: 3 }}>
          <EmptyStateIllustration type={illustration} />
        </Box>

        <Typography variant="h5" component="h2" gutterBottom>
          {title}
        </Typography>

        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {description}
        </Typography>

        {(primaryAction || secondaryAction) && (
          <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mb: 3 }}>
            {primaryAction && (
              <Button variant="contained" onClick={primaryAction.onClick}>
                {primaryAction.label}
              </Button>
            )}
            {secondaryAction && (
              <Button variant="outlined" onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </Button>
            )}
          </Box>
        )}

        {tips && tips.length > 0 && (
          <Box sx={{ textAlign: "left", bgcolor: "action.hover", p: 2, borderRadius: 1, mb: documentationUrl ? 2 : 0 }}>
            <Typography variant="subtitle2" gutterBottom>
              Tips:
            </Typography>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {tips.map((tip, index) => (
                <li key={index}>
                  <Typography variant="body2" color="text.secondary">
                    {tip}
                  </Typography>
                </li>
              ))}
            </ul>
          </Box>
        )}

        {documentationUrl && (
          <Link href={documentationUrl} target="_blank" rel="noopener noreferrer">
            View Documentation
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
