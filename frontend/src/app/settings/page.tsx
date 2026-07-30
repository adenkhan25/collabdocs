'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sun, Moon } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import api from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || '' },
  });

  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const onProfileSubmit = async (values: ProfileForm) => {
    setSavingProfile(true);
    try {
      const { data } = await api.put('/auth/profile', values);
      updateUser(data.user);
      toast.success('Profile updated');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Could not update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const onPasswordSubmit = async (values: PasswordForm) => {
    setSavingPassword(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast.success('Password changed successfully');
      passwordForm.reset();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Could not change password');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <DashboardShell showSearch={false}>
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 font-display text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>

        <Tabs defaultValue="profile">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-6 flex items-center gap-4">
                <Avatar name={user?.name || ''} color={user?.avatarColor} size="lg" />
                <div>
                  <p className="font-display text-base font-semibold text-slate-900 dark:text-white">
                    {user?.name}
                  </p>
                  <p className="text-sm text-slate-400">{user?.email}</p>
                </div>
              </div>

              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="flex flex-col gap-4">
                <div>
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" {...profileForm.register('name')} />
                  {profileForm.formState.errors.name && (
                    <p className="mt-1 text-xs text-red-500">
                      {profileForm.formState.errors.name.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={user?.email} disabled />
                </div>
                <Button type="submit" loading={savingProfile} className="w-fit">
                  Save changes
                </Button>
              </form>
            </div>
          </TabsContent>

          <TabsContent value="security">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="mb-4 font-display text-base font-semibold text-slate-900 dark:text-white">
                Change password
              </h3>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="flex flex-col gap-4">
                <div>
                  <Label htmlFor="currentPassword">Current password</Label>
                  <Input id="currentPassword" type="password" {...passwordForm.register('currentPassword')} />
                  {passwordForm.formState.errors.currentPassword && (
                    <p className="mt-1 text-xs text-red-500">
                      {passwordForm.formState.errors.currentPassword.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="newPassword">New password</Label>
                  <Input id="newPassword" type="password" {...passwordForm.register('newPassword')} />
                  {passwordForm.formState.errors.newPassword && (
                    <p className="mt-1 text-xs text-red-500">
                      {passwordForm.formState.errors.newPassword.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm new password</Label>
                  <Input id="confirmPassword" type="password" {...passwordForm.register('confirmPassword')} />
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-500">
                      {passwordForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>
                <Button type="submit" loading={savingPassword} className="w-fit">
                  Update password
                </Button>
              </form>
            </div>
          </TabsContent>

          <TabsContent value="appearance">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="mb-4 font-display text-base font-semibold text-slate-900 dark:text-white">
                Theme
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setTheme('light')}
                  className={cn(
                    'flex flex-col items-center gap-3 rounded-xl border-2 p-5 transition-colors',
                    theme === 'light'
                      ? 'border-brand-500 bg-brand-50/50'
                      : 'border-slate-200 dark:border-slate-700'
                  )}
                >
                  <Sun className="h-6 w-6 text-amber-500" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Light</span>
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={cn(
                    'flex flex-col items-center gap-3 rounded-xl border-2 p-5 transition-colors',
                    theme === 'dark'
                      ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-500/10'
                      : 'border-slate-200 dark:border-slate-700'
                  )}
                >
                  <Moon className="h-6 w-6 text-indigo-500" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Dark</span>
                </button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
}
