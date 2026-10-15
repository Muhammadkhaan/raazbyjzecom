'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  User, 
  MapPin, 
  Package, 
  Heart, 
  ShieldCheck, 
  LogOut 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';

const navItems = [
  { href: '/account', label: 'Overview', icon: LayoutDashboard },
  { href: '/account/profile', label: 'Personal Profile', icon: User },
  { href: '/account/addresses', label: 'Delivery Addresses', icon: MapPin },
  { href: '/account/orders', label: 'Order History', icon: Package },
  { href: '/wishlist', label: 'Saved Wishlist', icon: Heart },
  { href: '/account/settings', label: 'Security & Settings', icon: ShieldCheck },
];

export function AccountNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useToast();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      showToast({
        type: 'info',
        title: 'Logged Out',
        message: 'Your session has ended.',
      });
      router.push('/');
      router.refresh();
    } catch {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Could not log out.',
      });
    }
  };

  return (
    <aside className="w-full md:w-64 shrink-0 space-y-6">
      {/* Navigation Card */}
      <nav
        aria-label="Account Navigation"
        className="border border-[#E5E5E5] rounded-2xl bg-white p-3 space-y-1 shadow-2xs"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all',
                isActive
                  ? 'bg-[#141414] text-white shadow-xs'
                  : 'text-[#525252] hover:bg-neutral-100 hover:text-[#141414]'
              )}
            >
              <Icon className={cn('w-4 h-4', isActive ? 'text-white' : 'text-[#737373]')} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <div className="pt-2 mt-2 border-t border-[#E5E5E5]">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#B91C1C] hover:bg-[#FEF2F2] transition-colors"
          >
            <LogOut className="w-4 h-4 text-[#B91C1C]" />
            <span>Sign Out</span>
          </button>
        </div>
      </nav>
    </aside>
  );
}
