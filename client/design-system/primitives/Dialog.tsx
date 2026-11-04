"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

type DialogProps = {
  open: boolean;
  title: string;
  description?: ReactNode;
  onClose: () => void;
  children: ReactNode;
};

/** DS-DIALOG-001: modal built on native <dialog> for focus containment, Escape and inert background. */
export function Dialog({ open, title, description, onClose, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="ds-dialog"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      {open ? (
        <div className="ds-dialog__panel">
          <div className="ds-dialog__header">
            <h2 id={titleId} className="ds-dialog__title">{title}</h2>
            <button type="button" className="ds-dialog__close" aria-label="Close" onClick={onClose}><X size={18} aria-hidden="true" /></button>
          </div>
          {description ? <div id={descriptionId} className="ds-dialog__description">{description}</div> : null}
          {children}
        </div>
      ) : null}
    </dialog>
  );
}
