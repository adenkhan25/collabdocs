'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FileStack, Users, Zap, ShieldCheck } from 'lucide-react';

export function AuthLayout({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#0b0d13]">
      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-1/2 lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mx-auto w-full max-w-sm"
        >
          <Link href="/" className="mb-10 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow-glow">
              <FileStack className="h-5 w-5" />
            </div>
            <span className="font-display text-lg font-semibold text-slate-900 dark:text-white">
              CollabDocs
            </span>
          </Link>

          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>

          <div className="mt-8">{children}</div>
        </motion.div>
      </div>

      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-accent-700 lg:flex lg:w-1/2">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-accent-300 blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <h2 className="font-display text-3xl font-bold leading-tight">
            Write together,
            <br />
            in real time.
          </h2>
          <p className="mt-4 max-w-sm text-brand-100">
            CollabDocs brings your team into one shared document — live cursors, instant comments,
            and version history included.
          </p>

          <div className="mt-10 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                <Users className="h-4.5 w-4.5" />
              </div>
              <span className="text-sm text-brand-50">See who&apos;s editing, live</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                <Zap className="h-4.5 w-4.5" />
              </div>
              <span className="text-sm text-brand-50">Instant sync across every device</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                <ShieldCheck className="h-4.5 w-4.5" />
              </div>
              <span className="text-sm text-brand-50">Secure, role-based sharing</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
