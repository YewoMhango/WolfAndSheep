import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  /** Optional leading icon (e.g. a lucide icon element). */
  icon?: ReactNode;
}

export function Button({
  variant = 'secondary',
  fullWidth = false,
  icon,
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = [
    styles.button,
    styles[variant],
    fullWidth ? styles.fullWidth : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} {...rest}>
      {icon}
      {children}
    </button>
  );
}
