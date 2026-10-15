'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Menu, 
  X, 
  Lock, 
  Loader2, 
  ArrowLeft,
  KeyRound,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { showToast } = useToast();

  const [isLoadingAuth, setIsLoadingAuth] = React.useState(true);
  const [adminUser, setAdminUser] = React.useState<{
    id: string;
    email: string;
    role: string;
    name: string;
  } | null>(null);
  const [authError, setAuthError] = React.useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Login form state for quick admin authentication if not signed in
  const [loginEmail, setLoginEmail] = React.useState('admin@laamstore.com');
  const [loginPassword, setLoginPassword] = React.useState('');
  const [isSubmittingLogin, setIsSubmittingLogin] = React.useState(false);
  const [loginError, setLoginError] = React.useState<string | null>(null);

  const checkAdminAuth = React.useCallback(async () => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/admin/metrics?preset=today');
      if (res.ok) {
        const data = await res.json();
        setAdminUser(data.authorizedAdmin);
      } else {
        const err = await res.json().catch(() => ({}));
        setAuthError(err.error || 'Authentication required');
        setAdminUser(null);
      }
    } catch {
      setAuthError('Network error checking administrative authentication');
      setAdminUser(null);
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  React.useEffect(() => {
    checkAdminAuth();
  }, [checkAdminAuth]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingLogin(true);
    setLoginError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || 'Invalid credentials.');
        return;
      }

      if (data.user?.role !== 'SUPER_ADMIN' && data.user?.role !== 'STAFF') {
        setLoginError('This account is registered as a CUSTOMER and is prohibited from entering the administrative portal.');
        return;
      }

      showToast({
        type: 'success',
        title: 'Super-Admin Authenticated',
        message: `Welcome back, ${data.user.name}.`,
      });

      await checkAdminAuth();
    } catch {
      setLoginError('Connection failure during login attempt.');
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] text-white flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#087443]" />
        <p className="text-xs font-mono text-[#A3A3A3] tracking-widest uppercase">
          Verifying Administrative Cryptographic Session...
        </p>
      </div>
    );
  }

  // Not authenticated or customer account
  if (!adminUser) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] text-white flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#087443] flex items-center justify-center text-white font-extrabold text-xl mx-auto shadow-md">
              L
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              Laam Studio Super-Admin
            </h1>
            <p className="text-xs text-[#A3A3A3]">
              Restricted portal. Only authorized administrators and staff with verified database credentials may proceed.
            </p>
          </div>

          <Card className="p-6 bg-[#1A1A1A] border border-[#262626] rounded-2xl shadow-xl space-y-5 text-white">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#F87171] bg-[#7F1D1D]/30 border border-[#991B1B]/40 px-3 py-2 rounded-lg">
              <Lock className="w-4 h-4 shrink-0" />
              <span>Administrative Privilege Required</span>
            </div>

            {loginError && (
              <div className="flex items-center gap-2 text-xs text-[#F87171] bg-[#7F1D1D]/40 p-3 rounded-lg border border-[#991B1B]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#D4D4D4]">
                  Administrator Email
                </label>
                <Input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="admin@laamstore.com"
                  className="bg-[#262626] border-[#404040] text-white placeholder:text-[#737373] focus:border-[#087443]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#D4D4D4]">
                  Master Password
                </label>
                <Input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter initial or updated password"
                  className="bg-[#262626] border-[#404040] text-white placeholder:text-[#737373] focus:border-[#087443]"
                />
              </div>

              <div className="text-[11px] text-[#A3A3A3] bg-[#262626] p-2.5 rounded-lg space-y-1">
                <p className="font-semibold text-white">Initial Super-Admin Credentials:</p>
                <p className="font-mono text-[10px]">Email: admin@laamstore.com</p>
                <p className="font-mono text-[10px]">Password: AdminSecurePassword123!</p>
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={isSubmittingLogin}
                className="w-full bg-[#087443] hover:bg-[#065F38] text-white font-bold text-xs py-2.5 rounded-lg"
              >
                {isSubmittingLogin ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Authorizing...</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4" />
                    <span>Authorize Admin Session</span>
                  </span>
                )}
              </Button>
            </form>

            <div className="pt-3 border-t border-[#262626] text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs text-[#A3A3A3] hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Storefront</span>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#141414] flex flex-col md:flex-row font-sans">
      {/* Mobile Top Header */}
      <header className="md:hidden bg-[#141414] text-white px-4 py-3 border-b border-[#262626] flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#087443] flex items-center justify-center text-white font-bold text-sm">
            L
          </div>
          <span className="font-bold text-sm text-white">LAAM ADMIN</span>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg text-white hover:bg-[#262626]"
          aria-label="Toggle navigation"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-72 max-w-[85%] bg-[#141414] h-full shadow-2xl">
            <AdminSidebar
              user={adminUser}
              onNavigate={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:block">
        <AdminSidebar user={adminUser} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Top Operational Bar */}
        <div className="bg-white border-b border-[#E5E5E5] px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-[#737373]">Active Environment:</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#D3F8DF] text-[#087443] border border-[#73E2A3]">
              <CheckCircle2 className="w-3 h-3" />
              <span>Production Single-Store Engine</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="text-xs font-semibold text-[#087443] hover:underline inline-flex items-center gap-1"
            >
              <span>Live Storefront</span>
              <span className="text-[10px]">↗</span>
            </Link>
          </div>
        </div>

        {/* Content Body */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto space-y-8">
          {children}
        </main>
      </div>
    </div>
  );
}
