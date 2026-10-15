'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Boxes,
  ClipboardList,
  Users,
  Ticket,
  Settings,
  ShieldAlert,
  ArrowUpRight,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

const navItems: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/products', label: 'Products', icon: ShoppingBag },
  { href: '/admin/inventory', label: 'Inventory', icon: Boxes },
  { href: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/coupons', label: 'Promotions', icon: Ticket },
  { href: '/admin/settings', label: 'Store Settings', icon: Settings },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: ShieldAlert },
];

export interface AdminSidebarProps {
  user?: {
    email: string;
    role: string;
    name: string;
  } | null;
  onNavigate?: () => void;
}

export function AdminSidebar({ user, onNavigate }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useToast();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      showToast({
        type: 'info',
        title: 'Logged Out',
        message: 'Administrative session ended securely.',
      });
      router.push('/');
      router.refresh();
    } catch {
      showToast({
        type: 'error',
        title: 'Sign Out Error',
        message: 'Could not terminate session.',
      });
    }
  };

  return (
    <aside className="w-64 bg-[#141414] text-white flex flex-col shrink-0 min-h-screen border-r border-[#262626]">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#262626] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#087443] flex items-center justify-center text-white font-bold text-base shadow-sm">
            L
          </div>
          <div>
            <h2 className="text-sm font-extrabold tracking-tight text-white leading-none">
              LAAM STUDIO
            </h2>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#73E2A3]">
              Super-Admin
            </span>
          </div>
        </div>

        <Link
          href="/"
          target="_blank"
          title="View Live Storefront"
          className="p-1.5 rounded-md text-[#A3A3A3] hover:text-white hover:bg-[#262626] transition-colors"
        >
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#737373]">
          Store Operations
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all',
                isActive
                  ? 'bg-[#087443] text-white shadow-xs font-bold'
                  : 'text-[#A3A3A3] hover:text-white hover:bg-[#262626]'
              )}
            >
              <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-white' : 'text-[#737373]')} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Admin User Footer */}
      <div className="p-3 border-t border-[#262626] bg-[#1A1A1A] space-y-2">
        <div className="px-2 py-1 flex items-center justify-between">
          <div className="truncate">
            <p className="text-xs font-bold text-white truncate">
              {user?.name || 'Administrator'}
            </p>
            <p className="text-[10px] text-[#A3A3A3] truncate">
              {user?.email || 'admin@laamstore.com'}
            </p>
          </div>
          <Badge variant="mint" size="sm">
            {user?.role || 'SUPER_ADMIN'}
          </Badge>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-medium text-[#F87171] hover:bg-[#7F1D1D]/30 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out Admin</span>
        </button>
      </div>
    </aside>
  );
}
