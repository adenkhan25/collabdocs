'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, ShieldAlert } from 'lucide-react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import api from '@/lib/api';

export default function SharedLinkPage() {
  const params = useParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const resolve = async () => {
      try {
        const { data } = await api.get(`/documents/shared/${params.token}`);
        router.replace(`/documents/${data.document.id}`);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'This share link is invalid or has expired');
      }
    };
    resolve();
  }, [params.token, router]);

  return (
    <ProtectedRoute>
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-slate-50 px-6 text-center dark:bg-[#0b0d13]">
        {error ? (
          <>
            <ShieldAlert className="h-10 w-10 text-red-400" />
            <p className="font-display text-lg font-semibold text-slate-800 dark:text-white">{error}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
            >
              Back to dashboard
            </button>
          </>
        ) : (
          <>
            <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Opening shared document...</p>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
