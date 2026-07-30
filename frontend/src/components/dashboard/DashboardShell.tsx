'use client';

import { ReactNode, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { X, FileStack, Home, Star, Users, Trash2, Activity, Settings } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface DashboardShellProps {
  children: ReactNode;
  onSearch?: (v: string) => void;
  showSearch?: boolean;
}

const mobileNavItems = [
  { href: '/dashboard', label: 'All Documents', icon: Home },
  { href: '/dashboard/favorites', label: 'Favorites', icon: Star },
  { href: '/dashboard/shared', label: 'Shared with me', icon: Users },
  { href: '/dashboard/trash', label: 'Trash', icon: Trash2 },
  { href: '/activity', label: 'Activity', icon: Activity },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function DashboardShell({ children, onSearch, showSearch = true }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#0b0d13]">
        <Sidebar />

        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
                onClick={() => setMobileOpen(false)}
              />
              <motion.div
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: 'tween', duration: 0.2 }}
                className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white px-4 py-5 dark:bg-slate-900 lg:hidden"
              >
                <div className="mb-6 flex items-center justify-between px-2">
                  <Link href="/dashboard" className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 text-white">
                      <FileStack className="h-4.5 w-4.5" />
                    </div>
                    <span className="font-display text-[15px] font-semibold text-slate-900 dark:text-white">
                      CollabDocs
                    </span>
                  </Link>
                  <button onClick={() => setMobileOpen(false)}>
                    <X className="h-5 w-5 text-slate-400" />
                  </button>
                </div>
                <nav className="flex flex-col gap-0.5">
                  {mobileNavItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium',
                        pathname === item.href
                          ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
                          : 'text-slate-600 dark:text-slate-400'
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div className="flex min-w-0 flex-1 flex-col">
          <Navbar onSearch={onSearch} showSearch={showSearch} onMobileMenu={() => setMobileOpen(true)} />
          <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
