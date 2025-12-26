import { Card, Tabs, Tab } from "@mui/material";
import { useTheme } from "@/contexts/ThemeContext";

interface ConfigurationTabsProps {
  activeTab: number;
  onChange: (event: React.SyntheticEvent, newValue: number) => void;
}

export function ConfigurationTabs({
  activeTab,
  onChange,
}: ConfigurationTabsProps): React.ReactNode {
  const { isDark } = useTheme();

  return (
    <Card
      sx={{
        mb: 4,
        background: isDark
          ? "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)"
          : "linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)",
        boxShadow: isDark
          ? "0 4px 20px rgba(0, 0, 0, 0.3)"
          : "0 4px 20px rgba(0, 0, 0, 0.05)",
      }}
    >
      <Tabs value={activeTab} onChange={onChange} centered>
        <Tab label="General Settings" />
        <Tab label="Llama-Server Settings" />
        <Tab label="Advanced" />
      </Tabs>
    </Card>
  );
}
