'use client';
import { useEffect } from 'react';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div onClick={onClose} className="fixed inset-0 z-[80] flex items-end bg-black/40">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-h-[85%] overflow-auto rounded-t-3xl bg-surface px-5 pb-7 pt-3 animate-sheet-up"
      >
        <div className="mx-auto mb-3.5 mt-1 h-1 w-9 rounded-full bg-border-strong" />
        {title && <h2 className="mb-3.5 text-[17px] font-bold tracking-tight text-textc">{title}</h2>}
        {children}
      </div>
    </div>
  );
}
