import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card = ({ children, className = "", ...props }: CardProps) => {
  return (
    <div className={`bg-card border border-border rounded-lg p-4 md:p-6 lg:p-8 shadow-sm ${className}`} {...props}>
      {children}
    </div>
  );
};