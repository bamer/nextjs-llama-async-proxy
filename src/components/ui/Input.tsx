import React from 'react';

interface InputProps {
  className?: string;
  [key: string]: any;
}

export const Input = ({ className = "", ...props }: InputProps) => {
  return (
    <input className={`bg-input border border-border rounded-md p-2 md:p-3 focus:ring-2 focus:ring-primary ${className}`} {...props} />
  );
};

interface TextAreaProps {
  className?: string;
  [key: string]: any;
}

export const TextArea = ({ className = "", ...props }: TextAreaProps) => {
  return (
    <textarea className={`bg-input border border-border rounded-md p-2 md:p-3 focus:ring-2 focus:ring-primary ${className}`} {...props} />
  );
};

interface SelectProps {
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}

export const Select = ({ children, className = "", ...props }: SelectProps) => {
  return (
    <select className={`bg-input border border-border rounded-md p-2 md:p-3 focus:ring-2 focus:ring-primary ${className}`} {...props}>
      {children}
    </select>
  );
};

interface LabelProps {
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}

export const Label = ({ children, className = "", ...props }: LabelProps) => {
  return (
    <label className={`text-foreground ${className}`} {...props}>
      {children}
    </label>
  );
};