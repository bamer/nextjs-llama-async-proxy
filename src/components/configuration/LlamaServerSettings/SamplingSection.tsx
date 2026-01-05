"use client";

import { Grid } from "@mui/material";
import { Tune as AdvancedIcon } from "@mui/icons-material";
import { FormSection } from "@/components/ui/FormSection";
import { FormField } from "@/components/ui/FormField";

export function SamplingSection({
  samplingFields,
  handleChange
}: {
  samplingFields: Array<{
    name: string;
    label: string;
    type: "number";
    value: number;
    helperText: string;
  }>;
  handleChange: (name: string, value: string | number | boolean) => void;
}) {
  return (
    <FormSection title="Sampling Parameters" icon={<AdvancedIcon />} spacing={2} divider={false}>
      {samplingFields.map((field) => (
        <Grid key={field.name} size={{ xs: 12, md: 6 }}>
          <FormField {...field} onChange={handleChange} fullWidth />
        </Grid>
      ))}
    </FormSection>
  );
}