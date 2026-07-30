'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2 } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { toast } from 'sonner';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetLink, setResetLink] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormData) => {
    setSubmitting(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email: values.email });
      setSent(true);
      if (data.resetToken) {
        setResetLink(`/reset-password/${data.resetToken}`);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter your email and we'll help you reset it"
    >
      {sent ? (
        <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center dark:border-slate-800 dark:bg-slate-900">
          <CheckCircle2 className="mb-3 h-10 w-10 text-emerald-500" />
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
            If an account exists for that email, a reset link has been generated.
          </p>
          {resetLink && (
            <Link
              href={resetLink}
              className="mt-4 text-sm font-medium text-brand-600 underline dark:text-brand-400"
            >
              Continue to reset password
            </Link>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email')}
            />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>
          <Button type="submit" loading={submitting} className="mt-2 w-full justify-center">
            Send reset link
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Remembered your password?{' '}
        <Link href="/login" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
          Back to login
        </Link>
      </p>
    </AuthLayout>
  );
}
