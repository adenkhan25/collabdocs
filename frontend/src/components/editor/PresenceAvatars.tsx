'use client';

import { Avatar } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { PresenceUser } from '@/types';

export function PresenceAvatars({ users }: { users: PresenceUser[] }) {
  if (users.length === 0) return null;

  const visible = users.slice(0, 4);
  const overflow = users.length - visible.length;

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex items-center -space-x-2">
        {visible.map((u) => (
          <Tooltip key={u.socketId}>
            <TooltipTrigger asChild>
              <div>
                <Avatar name={u.name} color={u.color} size="sm" ring />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {u.name} · <span className="capitalize">{u.role}</span>
            </TooltipContent>
          </Tooltip>
        ))}
        {overflow > 0 && (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600 ring-2 ring-white dark:bg-slate-700 dark:text-slate-300 dark:ring-slate-900">
            +{overflow}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
