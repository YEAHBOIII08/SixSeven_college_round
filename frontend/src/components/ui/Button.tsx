import { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface BaseProps {
  variant?: Variant;
  size?: Size;
  className?: string;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-accent-600 text-white hover:bg-accent-500 hover:shadow-glow-accent border border-accent-500/50',
  secondary:
    'bg-base-800 text-slate-200 hover:bg-base-700 border border-base-700',
  ghost:
    'bg-transparent text-slate-300 hover:text-white hover:bg-base-800/50 border border-transparent',
  danger:
    'bg-danger-600 text-white hover:bg-danger-500 border border-danger-500/50',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
  md: 'px-4 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-6 py-3 text-base rounded-xl gap-2.5',
};

const baseClass =
  'inline-flex items-center justify-center font-medium transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent-500/50 disabled:opacity-50 disabled:cursor-not-allowed';

interface ButtonProps
  extends BaseProps,
    ButtonHTMLAttributes<HTMLButtonElement> {}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${baseClass} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

interface ButtonLinkProps extends BaseProps {
  to: string;
  children: ReactNode;
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  to,
}: ButtonLinkProps) {
  return (
    <Link
      to={to}
      className={`${baseClass} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </Link>
  );
}
