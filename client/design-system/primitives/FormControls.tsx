"use client";

import { cloneElement, isValidElement, forwardRef, useId, type ComponentProps, type ReactNode, type ReactElement } from "react";
import clsx from "clsx";

type FieldProps = { label: string; children: ReactNode; hint?: string; error?: string };
/** Explicit label and description associations preserve accessible field context. */
export function Field({ label, children, hint, error }: FieldProps) {
  const id = useId();
  const control = isValidElement(children) ? children as ReactElement<{ id?: string; "aria-describedby"?: string; "aria-invalid"?: boolean }> : null;
  const controlId = control?.props.id ?? id;
  const describedBy = [control?.props["aria-describedby"], hint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ");
  const content = control ? cloneElement(control, { id: controlId, "aria-describedby": describedBy || undefined, "aria-invalid": error ? true : control.props["aria-invalid"] }) : children;
  return <div className="ds-field"><label htmlFor={control ? controlId : undefined} className="ds-field__label">{label}</label>{content}
    {hint ? <span id={`${id}-hint`} className="ds-field__hint">{hint}</span> : null}
    {error ? <span id={`${id}-error`} role="alert" className="ds-field__error">{error}</span> : null}
  </div>;
}
export const Input = forwardRef<HTMLInputElement, ComponentProps<"input">>(function Input({ className, ...props }, ref) {
  return <input {...props} ref={ref} className={clsx("ds-input", className)} />;
});
export const Select = forwardRef<HTMLSelectElement, ComponentProps<"select">>(function Select({ className, ...props }, ref) {
  return <select {...props} ref={ref} className={clsx("ds-input", className)} />;
});
export const Textarea = forwardRef<HTMLTextAreaElement, ComponentProps<"textarea">>(function Textarea({ className, ...props }, ref) {
  return <textarea {...props} ref={ref} className={clsx("ds-input ds-textarea", className)} />;
});
