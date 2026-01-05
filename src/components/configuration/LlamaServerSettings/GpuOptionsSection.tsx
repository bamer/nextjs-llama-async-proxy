"use client";

import { Grid } from "@mui/material";
import { Memory as GpuIcon } from "@mui/icons-material";
import { FormSection } from "@/components/ui/FormSection";
import { FormField } from "@/components/ui/FormField";

export function GpuOptionsSection({
  gpuOptionsFields,
  handleChange
}: {
  gpuOptionsFields: Array<{
    name: string;
    label: string;
    type: "number";
    value: number;
    helperText: string;
    error?: string;
  }>;
  handleChange: (name: string, value: string | number | boolean) => void;
}) {
  return (
    <FormSection title="GPU Options" icon={<GpuIcon />} spacing={2}>
      {gpuOptionsFields.map((field) => (
        <Grid key={field.name} size={{ xs: 12, md: 6 }}>
          <FormField {...field} onChange={handleChange} fullWidth />
        </Grid>
      ))}
    </FormSection>
  );
}