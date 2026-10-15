'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, KeyRound, AlertTriangle, Trash2, Check, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { AccountNav } from '@/components/account/account-nav';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';

export default function AccountSettingsPage() {
  const router = useRouter();
  const { showToast } = useToast();

  // Password Change Form State
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isChangingPass, setIsChangingPass] = React.useState(false);

  // Deactivation State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [deleteConfirmationPassword, setDeleteConfirmationPassword] = React.useState('');
  const [isDeactivating, setIsDeactivating] = React.useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'New password and confirmation do not match.',
      });
      return;
    }

    setIsChangingPass(true);
    try {
      const res = await fetch('/api/account/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast({
          type: 'error',
          title: 'Update Failed',
          message: data.error || 'Could not update password.',
        });
      } else {
        showToast({
          type: 'success',
          title: 'Password Changed',
          message: 'Your account password has been updated securely.',
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch {
      showToast({
        type: 'error',
        title: 'Connection Error',
        message: 'Failed to connect to authentication service.',
      });
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleDeactivateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteConfirmationPassword) return;

    setIsDeactivating(true);
    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmationPassword: deleteConfirmationPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast({
          type: 'error',
          title: 'Deactivation Error',
          message: data.error || 'Failed to deactivate account.',
        });
      } else {
        showToast({
          type: 'info',
          title: 'Account Deactivated',
          message: 'Your customer account has been closed.',
        });
        setIsDeleteDialogOpen(false);
        router.push('/');
        router.refresh();
      }
    } catch {
      showToast({
        type: 'error',
        title: 'Connection Error',
        message: 'Failed to process account deactivation.',
      });
    } finally {
      setIsDeactivating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="container-storefront py-8 sm:py-12 flex-1 space-y-8">
        {/* Breadcrumb & Title */}
        <div className="space-y-2 border-b border-[#E5E5E5] pb-6">
          <nav aria-label="Breadcrumb" className="text-xs text-[#737373]">
            <ol className="flex items-center gap-1.5">
              <li><Link href="/" className="hover:underline">Home</Link></li>
              <li>/</li>
              <li><Link href="/account" className="hover:underline">My Account</Link></li>
              <li>/</li>
              <li className="font-semibold text-[#141414]">Security & Settings</li>
            </ol>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#141414]">
            Account Security & Preferences
          </h1>
          <p className="text-xs text-[#737373]">
            Update your authentication credentials or review privacy settings.
          </p>
        </div>

        {/* Layout */}
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <AccountNav />

          <section className="flex-1 w-full max-w-2xl space-y-8">
            {/* Change Password Card */}
            <Card className="p-6 sm:p-8 border border-[#E5E5E5] bg-white space-y-5">
              <div className="flex items-center gap-2 border-b border-[#E5E5E5] pb-3">
                <KeyRound className="w-5 h-5 text-[#087443]" />
                <h2 className="font-heading font-semibold text-base text-[#141414]">
                  Update Password
                </h2>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <Input
                  label="Current Password"
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your existing password"
                />

                <Input
                  label="New Password"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  helperText="Must include at least 1 uppercase letter, 1 lowercase letter, and 1 number"
                />

                <Input
                  label="Confirm New Password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                />

                <div className="pt-2 flex justify-end">
                  <Button
                    variant="primary"
                    size="md"
                    type="submit"
                    isLoading={isChangingPass}
                  >
                    Update Password
                  </Button>
                </div>
              </form>
            </Card>

            {/* Account Deactivation Danger Zone */}
            <Card className="p-6 border border-[#FECACA] bg-[#FEF2F2]/30 space-y-4">
              <div className="flex items-center gap-2 text-[#B91C1C]">
                <AlertTriangle className="w-5 h-5" />
                <h2 className="font-heading font-semibold text-base">
                  Deactivate Customer Account
                </h2>
              </div>

              <p className="text-xs text-[#525252] leading-relaxed">
                Deactivating your account will invalidate all active sessions and disable access to saved delivery addresses, wishlist items, and past order records.
              </p>

              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="text-xs text-[#B91C1C] border-[#FECACA] hover:bg-[#FEF2F2]"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  <span>Deactivate My Account</span>
                </Button>
              </div>
            </Card>
          </section>
        </div>
      </main>

      {/* Account Deactivation Modal */}
      <Dialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        title="Confirm Account Deactivation"
        description="This action is permanent and will close your customer account. To confirm, enter your current password."
      >
        <form onSubmit={handleDeactivateAccount} className="space-y-4 py-2">
          <Input
            label="Account Password"
            type="password"
            required
            value={deleteConfirmationPassword}
            onChange={(e) => setDeleteConfirmationPassword(e.target.value)}
            placeholder="Enter password to verify ownership"
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-[#E5E5E5]">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={isDeactivating}
              className="bg-[#B91C1C] hover:bg-[#991B1B] text-white"
            >
              Confirm Deactivation
            </Button>
          </div>
        </form>
      </Dialog>

      <Footer />
    </div>
  );
}
