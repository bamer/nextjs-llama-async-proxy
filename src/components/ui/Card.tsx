import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card = ({ children, className = "", ...props }: CardProps) => {
  return (
    <div className={`bg-white border border-gray-300 rounded-lg p-6 ${className}`} {...props}>
      {children}
    </div>
  );
};