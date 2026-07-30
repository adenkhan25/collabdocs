'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  FileStack,
  Users,
  MessageSquare,
  History,
  ShieldCheck,
  ArrowRight,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const features = [
  {
    icon: Users,
    title: 'Real-time collaboration',
    description: 'See live cursors, presence, and typing indicators as your team edits together.',
  },
  {
    icon: MessageSquare,
    title: 'Contextual comments',
    description: 'Highlight any text, leave a comment, reply in threads, and resolve when done.',
  },
  {
    icon: History,
    title: 'Version history',
    description: 'Save snapshots as you go and restore any previous version in one click.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure sharing',
    description: 'Share by link with editor or viewer roles, backed by JWT authentication.',
  },
];

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [loading, user, router]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0d13]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow-glow">
            <FileStack className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-semibold text-slate-900 dark:text-white">
            CollabDocs
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost">Log in</Button>
          </Link>
          <Link href="/register">
            <Button>Get started</Button>
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 pb-20 pt-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
            <FileText className="h-3 w-3" />   — Real-Time Document Editor.
          </span>
          <h1 className="mt-6 font-display text-4xl font-bold leading-tight text-slate-900 dark:text-white sm:text-5xl">
            Write together, in real time.
            <br />
            <span className="bg-gradient-to-r from-brand-600 to-accent-600 bg-clip-text text-transparent">
              No silos, no delays.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-slate-500 dark:text-slate-400">
            A modern, Google-Docs-style editor with live multi-user editing, threaded comments,
            version history, and secure sharing — built with Next.js and Socket.io.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/register">
              <Button size="lg">
                Start writing free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Log in
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-400 dark:border-slate-800">
        Built with Next.js, Express, MongoDB, Socket.io, and Yjs.
      </footer>
    </div>
  );
}
