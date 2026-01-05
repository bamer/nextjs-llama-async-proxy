"use client";

import { Grid } from "@mui/material";
import { Dns as ServerIcon } from "@mui/icons-material";
import { FormSection } from "@/components/ui/FormSection";
import { FormField } from "@/components/ui/FormField";

export function ServerBindingSection({
  serverBindingFields,
  handleChange
}: {
  serverBindingFields: Array<{
    name: string;
    label: string;
    value: string | number;
    helperText: string;
    error?: string;
    type?: "text" | "number";
  }>;
  handleChange: (name: string, value: string | number | boolean) => void;
}) {
  return (
    <FormSection title="Server Binding" icon={<ServerIcon />} spacing={2}>
      {serverBindingFields.map((field) => (
        <Grid key={field.name} size={{ xs: 12, md: 6 }}>
          <FormField {...field} onChange={handleChange} fullWidth />
        </Grid>
      ))}
    </FormSection>
  );
}