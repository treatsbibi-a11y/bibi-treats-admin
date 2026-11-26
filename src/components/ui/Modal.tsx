'use client';

import React, { useEffect, useId, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerRight?: React.ReactNode;
  footer?: React.ReactNode;
  size?: ModalSize;
  mobileSheet?: boolean;
  closeOnBackdrop?: boolean;
  hideHeader?: boolean;
  ariaLabel?: string;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-3xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  headerRight,
  footer,
  size = 'md',
  mobileSheet = false,
  closeOnBackdrop = true,
  hideHeader = false,
  ariaLabel,
  className = '',
  bodyClassName = '',
  children,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const pressedOutsideRef = useRef(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      if (isOpen) {
        onClose();
      }
    };

    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };

    dialog.addEventListener('close', handleClose);
    dialog.addEventListener('cancel', handleCancel);
    return () => {
      dialog.removeEventListener('close', handleClose);
      dialog.removeEventListener('cancel', handleCancel);
    };
  }, [isOpen, onClose]);

  const isPointerOutside = (e: React.PointerEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog) return false;
    const rect = dialog.getBoundingClientRect();
    return (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    );
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={title && !hideHeader ? titleId : undefined}
      aria-label={!title || hideHeader ? ariaLabel || 'หน้าต่างโต้ตอบ' : undefined}
      onPointerDown={(e) => {
        pressedOutsideRef.current = closeOnBackdrop && isPointerOutside(e);
      }}
      onPointerUp={(e) => {
        if (closeOnBackdrop && pressedOutsideRef.current && isPointerOutside(e)) {
          onClose();
        }
        pressedOutsideRef.current = false;
      }}
      className={`${SIZE_CLASSES[size]} w-[calc(100%-1.5rem)] m-auto rounded-xl max-h-[88dvh] bg-surface text-ink border border-surface-border shadow-overlay overflow-hidden flex flex-col open:animate-in open:fade-in open:zoom-in-95 duration-150 ${className}`}
    >

      {!hideHeader && (
        <div className="no-print shrink-0 px-4 sm:px-5 py-3.5 border-b border-surface-border-light bg-surface flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            {title && (
              <h1
                id={titleId}
                className="text-[15px] font-semibold text-ink tracking-tight leading-snug truncate"
              >
                {title}
              </h1>
            )}
            {subtitle && (
              <div className="text-xs text-ink-muted mt-0.5 truncate">{subtitle}</div>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {headerRight}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 min-h-[34px] min-w-[34px] flex items-center justify-center rounded text-ink-muted hover:text-ink hover:bg-surface-secondary transition-colors"
              aria-label="ปิด"
            >
              <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className={`flex-1 overflow-y-auto touch-scroll p-4 sm:p-5 ${bodyClassName}`}>
        {children}
      </div>

      {footer && (
        <div className="no-print shrink-0 px-4 sm:px-5 py-3 border-t border-surface-border-light bg-surface-secondary flex items-center justify-end gap-2">
          {footer}
        </div>
      )}
    </dialog>
  );
}
