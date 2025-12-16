import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import PrimaryButton from './PrimaryButton';
import SecondaryButton from './SecondaryButton';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonColor?: string;
  isDeleting?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  confirmButtonColor,
  isDeleting = false,
}: ConfirmModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  // Focus trap: keep focus within modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        onClose();
      } else if (e.key === 'Enter' && !isDeleting) {
        onConfirm();
      } else if (e.key === 'Tab') {
        // Trap focus within modal
        const focusableElements = modalRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) as NodeListOf<HTMLElement> | undefined;

        if (!focusableElements || focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    // Focus first focusable element (cancel button) when modal opens
    const timeoutId = setTimeout(() => {
      const cancelButton = modalRef.current?.querySelector('button:first-of-type') as HTMLElement | null;
      cancelButton?.focus();
    }, 0);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timeoutId);
    };
  }, [isOpen, onClose, onConfirm, isDeleting]);

  const handleConfirm = () => {
    if (!isDeleting) {
      onConfirm();
    }
  };

  const handleCancel = () => {
    if (!isDeleting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Get the origin/hostname for the title if not provided
  const defaultTitle = title || `Message from ${window.location.hostname || 'localhost'}`;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999]" 
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-message"
    >
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={handleCancel}
        aria-hidden="true"
      />
      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div
          ref={modalRef}
          className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-md p-6 space-y-4 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <h3 
              id="confirm-modal-title"
              className="text-lg font-medium" 
              style={{ color: '#464F5E' }}
            >
              {defaultTitle}
            </h3>
          </div>

          <div className="space-y-3">
            <p 
              id="confirm-modal-message"
              className="text-sm" 
              style={{ color: '#464F5E' }}
            >
              {message}
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <SecondaryButton 
              onClick={handleCancel}
              disabled={isDeleting}
            >
              {cancelText}
            </SecondaryButton>
            <PrimaryButton 
              onClick={handleConfirm} 
              primaryColor={confirmButtonColor}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : confirmText}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );

  // Render modal via portal to document.body to ensure it's above all content
  return createPortal(modalContent, document.body);
}

