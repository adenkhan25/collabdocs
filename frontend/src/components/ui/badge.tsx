import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300',
        secondary: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
        success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
        warning: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
        danger: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
        outline: 'border border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
