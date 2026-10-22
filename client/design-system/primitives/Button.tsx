"use client";

import Link from "next/link";
import clsx from "clsx";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

type Appearance = { variant?: "primary" | "secondary" | "ghost" | "danger"; size?: "sm" | "md" };
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & Appearance & { href?: never };
type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & Appearance & { href: string };

/** DS-ACTION-001: one action contract for buttons and navigational links. */
export function Button(props: ButtonProps | LinkProps) {
  const { variant = "primary", size = "md", className, ...rest } = props;
  const classes = clsx("ds-button", `ds-button--${variant}`, `ds-button--${size}`, className);
  if ("href" in rest && rest.href) return <Link {...rest as LinkProps} className={classes} />;
  const { href: _href, type = "button", ...button } = rest as ButtonProps;
  return <button {...button} type={type} className={classes} />;
}
