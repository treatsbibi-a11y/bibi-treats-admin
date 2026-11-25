'use client';

import React, { useEffect, useId, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Drawer({
  isOpen,
  onClose,
  title,
  children,
  footer,
}: DrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const pressedOutsideRef = useRef(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    const handleClose = () => {
      if (isOpen) onClose();
    };

    dialog.addEventListener('cancel', handleCancel);
    dialog.addEventListener('close', handleClose);
    return () => {
      dialog.removeEventListener('cancel', handleCancel);
      dialog.removeEventListener('close', handleClose);
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
      aria-labelledby={titleId}
      onPointerDown={(e) => {
        pressedOutsideRef.current = isPointerOutside(e);
      }}
      onPointerUp={(e) => {
        if (pressedOutsideRef.current && isPointerOutside(e)) {
          onClose();
        }
        pressedOutsideRef.current = false;
      }}
      className="fixed inset-y-0 right-0 left-auto h-[100dvh] max-h-[100dvh] w-screen max-w-md m-0 bg-surface text-ink shadow-overlay border-l border-surface-border flex flex-col open:animate-in open:slide-in-from-right duration-200"
    >
      <div className="px-4 py-3.5 border-b border-surface-border-light flex items-center justify-between">
        <h1 id={titleId} className="text-[15px] font-semibold text-ink">
          {title || 'รายละเอียด'}
        </h1>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded text-ink-muted hover:text-ink hover:bg-surface-secondary transition-colors"
          aria-label="ปิดแผงด้านข้าง"
        >
          <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto touch-scroll p-4">{children}</div>

      {footer && (
        <div className="border-t border-surface-border-light p-4 bg-surface-secondary">
          {footer}
        </div>
      )}
    </dialog>
  );
}
