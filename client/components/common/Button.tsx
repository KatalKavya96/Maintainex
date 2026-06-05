"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";
import clsx from "clsx";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  href?: never;
  variant?: "primary" | "secondary" | "ghost";
};

type LinkButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: "primary" | "secondary" | "ghost";
};

const styles = {
  primary: "bg-moss text-white hover:bg-[#285f51]",
  secondary: "border border-line bg-white text-ink hover:bg-slate-50",
  ghost: "text-slate-600 hover:bg-slate-100"
};

export function Button(props: ButtonProps | LinkButtonProps) {
  const { className, variant = "primary" } = props;
  const base = clsx(
    "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition",
    styles[variant],
    className
  );

  if ("href" in props && props.href) {
    const { href, variant: _variant, className: _className, ...rest } = props;
    return <Link href={href} className={base} {...rest} />;
  }

  const { variant: _variant, className: _className, ...rest } = props as ButtonProps;
  return <button className={base} {...rest} />;
}
