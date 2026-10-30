import React from 'react';
import clsx from 'clsx';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required,
  error,
  helpText,
  children,
  className,
}) => {
  return (
    <div className={clsx('space-y-1', className)}>
      <label className="block text-xs font-medium text-[#3c4043]">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      ) : helpText ? (
        <p className="text-xs text-[#5f6368] mt-1">{helpText}</p>
      ) : null}
    </div>
  );
};
