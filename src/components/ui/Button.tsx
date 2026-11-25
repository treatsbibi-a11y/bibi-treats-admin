'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 whitespace-nowrap';

  const sizeClasses = {
    xs: 'text-[11px] px-2.5 py-1 h-7 gap-1',
    sm: 'text-xs px-3 py-1.5 h-8 gap-1.5',
    md: 'text-[13px] px-3.5 py-2 h-9 gap-2',
    lg: 'text-sm px-5 py-2.5 h-10 gap-2 font-semibold',
  }[size];

  const variantClasses = {
    primary: 'bg-primary hover:bg-primary-dk text-white shadow-subtle',
    secondary: 'bg-surface-secondary hover:bg-surface-border text-ink border border-surface-border',
    outline: 'border border-surface-border hover:border-ink-muted bg-surface text-ink shadow-subtle',
    ghost: 'text-ink-secondary hover:text-ink hover:bg-surface-secondary',
    danger: 'bg-semantic-red hover:opacity-90 text-white shadow-subtle',
  }[variant];

  return (
    <button
      type={type}
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin h-3.5 w-3.5 text-current shrink-0"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>กำลังดำเนินการ...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
