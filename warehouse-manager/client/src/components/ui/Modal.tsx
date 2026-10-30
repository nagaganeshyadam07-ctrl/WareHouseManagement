import React, { useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'lg',
  footer,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#202124]/40 backdrop-blur-[1px] transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div
          className={clsx(
            'relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all w-full my-8 border border-[#dadce0]',
            maxWidthClasses[maxWidth]
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#e8eaed] px-5 py-4">
            <div>
              <h3 className="text-base font-semibold text-[#202124] leading-snug">{title}</h3>
              {description && (
                <p className="mt-0.5 text-xs text-[#5f6368]">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded p-1 text-[#5f6368] hover:bg-[#f1f3f4] hover:text-[#202124] transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-5 py-4 max-h-[calc(85vh-130px)] overflow-y-auto text-[#202124] text-sm">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="flex items-center justify-end gap-2.5 border-t border-[#e8eaed] bg-[#f8f9fa] px-5 py-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
