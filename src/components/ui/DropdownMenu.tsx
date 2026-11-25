'use client';

import React, { useEffect, useRef } from 'react';

interface DropdownMenuProps {
  trigger: React.ReactNode;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  align?: 'left' | 'right';
  widthClass?: string;
  children: React.ReactNode;
  className?: string;
}

export function DropdownMenu({
  trigger,
  isOpen,
  onOpenChange,
  align = 'right',
  widthClass = 'w-60',
  children,
  className = '',
}: DropdownMenuProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onOpenChange(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onOpenChange(false);
        const firstFocusable = containerRef.current?.querySelector<HTMLElement>(
          'button, [href], [tabindex]'
        );
        firstFocusable?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onOpenChange]);

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {trigger}

      {isOpen && (
        <div
          role="menu"
          className={`absolute top-full mt-1.5 ${
            align === 'right' ? 'right-0' : 'left-0'
          } ${widthClass} bg-surface text-ink rounded-lg shadow-overlay border border-surface-border py-1 z-40 animate-in fade-in zoom-in-95 duration-100`}
        >
          {children}
        </div>
      )}
    </div>
  );
}
