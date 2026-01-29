'use client';

import { type ReactNode } from 'react';

const inputBase =
  'w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors';

export function Field({
  id,
  label,
  required,
  hint,
  children,
  className = '',
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-foreground mb-1.5">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Input({
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled,
  required,
  className = '',
  ...rest
}: {
  id: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  [key: string]: unknown;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      className={`${inputBase} ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}
      {...rest}
    />
  );
}

export function Textarea({
  id,
  value,
  onChange,
  placeholder,
  disabled,
  rows = 2,
  className = '',
}: {
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
  className?: string;
}) {
  const minHeightClass = rows <= 1 ? 'min-h-[2.5rem]' : 'min-h-[80px]';
  return (
    <textarea
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      rows={rows}
      className={`${inputBase} resize-y ${minHeightClass} ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}
    />
  );
}

export function Section({
  title,
  description,
  icon: Icon,
  children,
  className = '',
}: {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`bg-card border border-border rounded-xl p-6 space-y-5 shadow-sm ${className}`.trim()}>
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
