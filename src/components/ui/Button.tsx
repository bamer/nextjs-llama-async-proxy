import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outline" | "ghost" | "primary" | "secondary";
  disabled?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
}

export const Button = ({ 
  children, 
  className = "", 
  variant = "default", 
  disabled = false,
  onClick,
  ariaLabel
}: ButtonProps) => {
  // Define variants with proper styling
  const variants = {
    default: "bg-primary text-foreground hover:bg-primary-dark",
    outline: "border border-border hover:bg-accent",
    ghost: "hover:bg-accent",
    primary: "bg-primary text-foreground hover:bg-primary-dark",
    secondary: "bg-secondary text-foreground hover:bg-accent"
  };

  const baseClasses = "px-4 md:px-6 lg:px-8 py-2 rounded-md shadow-sm hover:shadow-md transition-shadow transition-colors";
  
  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${className}`}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
};

export const MetricCard = ({
  title,
  value,
  unit = "",
  icon = "",
  trend,
  className = ""
}: {
  title: string;
  value: number | string;
  unit?: string;
  icon?: string;
  trend?: number;
  className?: string;
}) => {
  return (
    <div
      className={`bg-card border border-border rounded-lg p-5 md:p-6 lg:p-8 shadow-sm text-foreground ${className}`}
    >
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xl">{icon}</span>
        <h4 className="font-semibold">{title}</h4>
      </div>
      <div className="flex flex-col items-center mt-2">
        <span className="text-2xl font-bold">{value}</span>
        {unit && <span className="opacity-75">{unit}</span>}
        {trend !== undefined && (
          <div className={`mt-2 ${trend > 0 ? 'text-success' : 'text-danger'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </div>
        )}
      </div>
    </div>
  );
};

export const ActivityMetricCard = ({
  title,
  value,
  unit = "",
  icon = "",
  trend,
  isActive = true
}: {
  title: string;
  value: number | string;
  unit?: string;
  icon?: string;
  trend?: number;
  isActive?: boolean;
}) => {
  return (
    <div
      className={`bg-card border border-border rounded-lg p-5 md:p-6 lg:p-8 shadow-sm text-foreground ${
        isActive ? "" : "opacity-50"
      }`}
    >
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xl">{icon}</span>
        <h4 className="font-semibold">{title}</h4>
      </div>
      <div className="flex flex-col items-center mt-2">
        <span className="text-2xl font-bold">{value}</span>
        {unit && <span className="opacity-75">{unit}</span>}
        {trend !== undefined && (
          <div className={`mt-2 ${trend > 0 ? 'text-success' : 'text-danger'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </div>
        )}
      </div>
    </div>
  );
};