'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  FileText,
  Home,
  Star,
  Users,
  Trash2,
  Settings,
  Activity,
  Plus,
  FileStack,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useState } from 'react';

const navItems = [
  { href: '/dashboard', label: 'All Documents', icon: Home },
  { href: '/dashboard/favorites', label: 'Favorites', icon: Star },
  { href: '/dashboard/shared', label: 'Shared with me', icon: Users },
  { href: '/dashboard/trash', label: 'Trash', icon: Trash2 },
];

const secondaryItems = [
  { href: '/activity', label: 'Activity', icon: Activity },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const { data } = await api.post('/documents', { title: 'Untitled Document' });
      router.push(`/documents/${data.document.id}`);
    } catch (error) {
      toast.error('Could not create document');
    } finally {
      setCreating(false);
    }
  };

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white/60 px-4 py-5 dark:border-slate-800 dark:bg-slate-900/40 lg:flex">
      <Link href="/dashboard" className="mb-6 flex items-center gap-2 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow-glow">
          <FileStack className="h-4.5 w-4.5" />
        </div>
        <span className="font-display text-[15px] font-semibold text-slate-900 dark:text-white">
          CollabDocs
        </span>
      </Link>

      <Button onClick={handleCreate} loading={creating} className="mb-6 w-full justify-center">
        <Plus className="h-4 w-4" />
        New Document
      </Button>

      <nav className="flex flex-1 flex-col gap-0.5">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        <div className="my-3 h-px bg-slate-200 dark:bg-slate-800" />

        {secondaryItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-xl bg-gradient-to-br from-brand-50 to-accent-50 p-4 dark:from-brand-500/10 dark:to-accent-500/10">
        <FileText className="mb-2 h-5 w-5 text-brand-600 dark:text-brand-400" />
        <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
          Real-time collaboration
        </p>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Invite teammates and edit together, live.
        </p>
      </div>
    </aside>
  );
}
