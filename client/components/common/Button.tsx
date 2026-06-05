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
  primary: "bg-moss text-black shadow-[0_12px_28px_rgba(201,244,58,0.20)] hover:brightness-105",
  secondary: "border border-line bg-skyglass text-ink hover:border-moss",
  ghost: "text-slate-600 hover:bg-skyglass hover:text-ink"
};

export function Button(props: ButtonProps | LinkButtonProps) {
  const { className, variant = "primary" } = props;
  const base = clsx(
    "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition",
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
