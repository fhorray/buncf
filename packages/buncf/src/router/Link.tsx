/**
 * Link Component for SPA Navigation
 *
 * Usage:
 * ```tsx
 * <Link href="/about">About</Link>
 * <Link href="/blog/my-post" prefetch>Read more</Link>
 * ```
 */

import React, { type AnchorHTMLAttributes, type MouseEvent } from 'react';
import { routerStore } from './client';

export interface LinkProps extends Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  'href'
> {
  /** Target URL */
  href: string;
  /** Prefetch on hover (not implemented yet) */
  prefetch?: boolean;
  /** Replace instead of push */
  replace?: boolean;
  /** Class to add when link matches current path */
  activeClassName?: string;
  /** Style to add when link matches current path */
  activeStyle?: React.CSSProperties;
}

/**
 * Client-side navigation Link component
 * Prevents full page reload and uses History API
 */
export function Link({
  href,
  children,
  prefetch,
  replace,
  activeClassName,
  activeStyle,
  onClick,
  className,
  style,
  ...props
}: LinkProps) {
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // Call original onClick if provided
    onClick?.(e);

    // Allow default behavior for special cases
    if (
      e.defaultPrevented ||
      e.button !== 0 || // Not left click
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      props.target === '_blank'
    ) {
      return;
    }

    // Check if it's an external link
    if (
      href.startsWith('http://') ||
      href.startsWith('https://') ||
      href.startsWith('//')
    ) {
      return;
    }

    e.preventDefault();

    if (replace) {
      routerStore.replace(href);
    } else {
      routerStore.push(href);
    }
  };

  // Check if active
  const isActive =
    typeof window !== 'undefined' && window.location.pathname === href;

  const combinedClassName = [className, isActive && activeClassName]
    .filter(Boolean)
    .join(' ');

  const combinedStyle = isActive ? { ...style, ...activeStyle } : style;

  return (
    <a
      href={href}
      onClick={handleClick}
      className={combinedClassName || undefined}
      style={combinedStyle}
      {...props}
    >
      {children}
    </a>
  );
}

export default Link;
