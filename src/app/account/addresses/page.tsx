'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, Plus, Trash2, Edit2, Check, Star, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { AccountNav } from '@/components/account/account-nav';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/toast';

export default function AccountAddressesPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [addresses, setAddresses] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingAddress, setEditingAddress] = React.useState<any | null>(null);

  // Form State
  const [recipientName, setRecipientName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [street, setStreet] = React.useState('');
  const [city, setCity] = React.useState('Karachi');
  const [state, setState] = React.useState('');
  const [postalCode, setPostalCode] = React.useState('75500');
  const [country, setCountry] = React.useState('Pakistan');
  const [isDefault, setIsDefault] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  const fetchAddresses = React.useCallback(async () => {
    try {
      const res = await fetch('/api/account/addresses');
      if (res.ok) {
        const data = await res.json();
        setAddresses(data.addresses || []);
      } else if (res.status === 401) {
        router.push('/');
      }
    } catch (err) {
      console.error('Failed to load addresses:', err);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  React.useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const openAddModal = () => {
    setEditingAddress(null);
    setRecipientName('');
    setPhone('');
    setStreet('');
    setCity('Karachi');
    setState('');
    setPostalCode('75500');
    setCountry('Pakistan');
    setIsDefault(addresses.length === 0);
    setIsDialogOpen(true);
  };

  const openEditModal = (addr: any) => {
    setEditingAddress(addr);
    setRecipientName(addr.recipientName);
    setPhone(addr.phone);
    setStreet(addr.street);
    setCity(addr.city);
    setState(addr.state || '');
    setPostalCode(addr.postalCode);
    setCountry(addr.country);
    setIsDefault(addr.isDefault);
    setIsDialogOpen(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const url = editingAddress
        ? `/api/account/addresses/${editingAddress.id}`
        : '/api/account/addresses';
      const method = editingAddress ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientName,
          phone,
          street,
          city,
          state: state || undefined,
          postalCode,
          country,
          isDefault,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast({
          type: 'error',
          title: 'Error',
          message: data.error || 'Failed to save address.',
        });
      } else {
        setAddresses(data.addresses || []);
        setIsDialogOpen(false);
        showToast({
          type: 'success',
          title: 'Address Saved',
          message: editingAddress ? 'Address updated successfully.' : 'New address added.',
        });
      }
    } catch {
      showToast({
        type: 'error',
        title: 'Connection Error',
        message: 'Could not connect to address service.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      const res = await fetch(`/api/account/addresses/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setAddresses(data.addresses || []);
        showToast({
          type: 'info',
          title: 'Address Removed',
          message: 'Delivery address was deleted.',
        });
      } else {
        showToast({
          type: 'error',
          title: 'Error',
          message: data.error || 'Could not delete address.',
        });
      }
    } catch {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Could not remove address.',
      });
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch(`/api/account/addresses/${id}/default`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setAddresses(data.addresses || []);
        showToast({
          type: 'success',
          title: 'Default Address Updated',
          message: 'Primary delivery address set.',
        });
      }
    } catch {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Could not set default address.',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="container-storefront py-20 flex-1 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#087443]" />
          <p className="text-xs text-[#737373]">Loading your saved addresses...</p>
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
              <li className="font-semibold text-[#141414]">Delivery Addresses</li>
            </ol>
          </nav>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#141414]">
                Saved Delivery Addresses ({addresses.length})
              </h1>
              <p className="text-xs text-[#737373]">
                Manage shipping destinations for swift nationwide checkout.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={openAddModal}
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Address</span>
            </Button>
          </div>
        </div>

        {/* Layout */}
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <AccountNav />

          <section className="flex-1 w-full space-y-6">
            {addresses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <Card
                    key={addr.id}
                    className={`p-5 border rounded-2xl flex flex-col justify-between space-y-4 bg-white transition-all ${
                      addr.isDefault
                        ? 'border-[#087443] ring-1 ring-[#087443] shadow-xs'
                        : 'border-[#E5E5E5]'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-[#141414] line-clamp-1">
                          {addr.recipientName}
                        </span>
                        {addr.isDefault && (
                          <Badge variant="mint" size="sm">
                            Default Address
                          </Badge>
                        )}
                      </div>

                      <div className="text-xs text-[#525252] space-y-0.5">
                        <p>{addr.street}</p>
                        <p>{addr.city}{addr.state ? `, ${addr.state}` : ''}, {addr.postalCode}</p>
                        <p>{addr.country}</p>
                        <p className="text-[#737373] pt-1">Phone: {addr.phone}</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#E5E5E5] flex items-center justify-between gap-2 text-xs">
                      {!addr.isDefault ? (
                        <button
                          type="button"
                          onClick={() => handleSetDefault(addr.id)}
                          className="text-[#087443] font-semibold hover:underline flex items-center gap-1"
                        >
                          <Star className="w-3.5 h-3.5" />
                          <span>Set as Default</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-[#737373] flex items-center gap-1">
                          <Check className="w-3 h-3 text-[#087443]" />
                          <span>Primary Destination</span>
                        </span>
                      )}

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(addr)}
                          className="p-1.5 rounded-lg text-[#737373] hover:text-[#141414] hover:bg-neutral-100 transition-colors"
                          aria-label="Edit address"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="p-1.5 rounded-lg text-[#737373] hover:text-[#B91C1C] hover:bg-[#FEF2F2] transition-colors"
                          aria-label="Delete address"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="p-12 rounded-2xl border border-dashed border-[#D6D6D6] text-center space-y-3 bg-neutral-50/50">
                <MapPin className="w-8 h-8 text-[#737373] mx-auto" />
                <h3 className="font-semibold text-sm text-[#141414]">No saved delivery addresses</h3>
                <p className="text-xs text-[#737373] max-w-sm mx-auto">
                  Save your home, office, or gifting addresses for quick, one-click checkout.
                </p>
                <Button variant="primary" size="sm" onClick={openAddModal}>
                  Add First Address
                </Button>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Add / Edit Address Dialog */}
      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingAddress ? 'Edit Delivery Address' : 'Add New Delivery Address'}
        description="Address details are encrypted and utilized strictly for courier package delivery."
      >
        <form onSubmit={handleSaveAddress} className="space-y-4 py-2">
          <Input
            label="Recipient Full Name"
            required
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder="e.g. Fatima Ali"
          />

          <Input
            label="Phone Number"
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0300-1234567"
            helperText="Courier will call this number prior to arrival"
          />

          <Input
            label="Street Address / Building"
            required
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            placeholder="e.g. House 14, Street 8, Sector F-7/2"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="City"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Islamabad"
            />
            <Input
              label="Postal Code"
              required
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="e.g. 44000"
            />
          </div>

          <Input
            label="Country"
            disabled
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />

          <Checkbox
            id="makeDefault"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            label="Set as default shipping address"
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-[#E5E5E5]">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={isSaving}
            >
              {editingAddress ? 'Update Address' : 'Save Address'}
            </Button>
          </div>
        </form>
      </Dialog>

      <Footer />
    </div>
  );
}
