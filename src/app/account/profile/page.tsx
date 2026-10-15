'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Check, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { AccountNav } from '@/components/account/account-nav';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';

export default function AccountProfilePage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [marketingOptIn, setMarketingOptIn] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/account/profile');
        if (res.ok) {
          const data = await res.json();
          setName(data.profile.name || '');
          setEmail(data.profile.email || '');
          setPhone(data.profile.phone || '');
          setMarketingOptIn(Boolean(data.profile.marketingOptIn));
        } else if (res.status === 401) {
          router.push('/');
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Name is required.',
      });
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || undefined,
          marketingOptIn,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast({
          type: 'success',
          title: 'Profile Updated',
          message: 'Your personal information has been saved.',
        });
      } else {
        showToast({
          type: 'error',
          title: 'Update Error',
          message: data.error || 'Failed to save changes.',
        });
      }
    } catch {
      showToast({
        type: 'error',
        title: 'Connection Error',
        message: 'Unable to reach profile service.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="container-storefront py-20 flex-1 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#087443]" />
          <p className="text-xs text-[#737373]">Loading your profile details...</p>
        </main>
        <Footer />
      </div>
    );
  }

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
              <li className="font-semibold text-[#141414]">Personal Profile</li>
            </ol>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#141414]">
            Personal Profile Information
          </h1>
          <p className="text-xs text-[#737373]">
            Manage your customer account details and communication preferences.
          </p>
        </div>

        {/* Layout */}
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <AccountNav />

          <section className="flex-1 w-full max-w-2xl">
            <Card className="p-6 sm:p-8 border border-[#E5E5E5] bg-white space-y-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  label="Full Name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                />

                <Input
                  label="Email Address"
                  disabled
                  value={email}
                  helperText="Primary email cannot be modified directly. Contact customer support for email change requests."
                />

                <Input
                  label="Contact Phone Number"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0300-1234567"
                  helperText="Used for doorstep courier delivery notifications"
                />

                <div className="pt-2 border-t border-[#E5E5E5]">
                  <Checkbox
                    id="marketingOptIn"
                    checked={marketingOptIn}
                    onChange={(e) => setMarketingOptIn(e.target.checked)}
                    label="Receive Designer Drops & Festive Collection Previews"
                    helperText="We send exclusive subscriber discounts and new arrival alerts (maximum 1-2 per week)."
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <Button
                    variant="primary"
                    size="md"
                    type="submit"
                    isLoading={isSaving}
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </Card>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
