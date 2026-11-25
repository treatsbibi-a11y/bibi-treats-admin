'use client';

import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'neutral' | 'primary' | 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
}: BadgeProps) {
  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 font-medium leading-tight',
    md: 'text-xs px-2.5 py-0.5 font-medium leading-snug',
  }[size];

  const variantConfig = {
    neutral: {
      box: 'bg-surface-secondary text-ink-secondary border border-surface-border',
      dot: 'bg-ink-muted',
    },
    primary: {
      box: 'bg-primary-lt text-primary-text border border-primary/25',
      dot: 'bg-primary',
    },
    brand: {
      box: 'bg-primary-lt text-primary-text border border-primary/25',
      dot: 'bg-primary',
    },
    success: {
      box: 'bg-semantic-green-lt text-semantic-green border border-semantic-green/25',
      dot: 'bg-semantic-green',
    },
    warning: {
      box: 'bg-semantic-yellow-lt text-semantic-yellow border border-semantic-yellow/30',
      dot: 'bg-semantic-yellow',
    },
    danger: {
      box: 'bg-semantic-red-lt text-semantic-red border border-semantic-red/25',
      dot: 'bg-semantic-red',
    },
    info: {
      box: 'bg-semantic-blue-lt text-semantic-blue border border-semantic-blue/25',
      dot: 'bg-semantic-blue',
    },
    purple: {
      box: 'bg-semantic-purple-lt text-semantic-purple border border-semantic-purple/25',
      dot: 'bg-semantic-purple',
    },
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full whitespace-nowrap ${sizeClasses} ${variantConfig.box} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${variantConfig.dot}`} />}
      {children}
    </span>
  );
}
