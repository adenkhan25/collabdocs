'use client';

import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/utils';

interface AvatarProps {
  name: string;
  color?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  ring?: boolean;
}

const sizeMap = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
};

const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(
  ({ name, color = '#6366f1', size = 'md', className, ring = false }, ref) => {
    return (
      <AvatarPrimitive.Root
        ref={ref}
        className={cn(
          'relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full font-semibold text-white',
          sizeMap[size],
          ring && 'ring-2 ring-white dark:ring-slate-900',
          className
        )}
        style={{ backgroundColor: color }}
      >
        <AvatarPrimitive.Fallback delayMs={0}>{getInitials(name)}</AvatarPrimitive.Fallback>
      </AvatarPrimitive.Root>
    );
  }
);
Avatar.displayName = 'Avatar';

export { Avatar };
