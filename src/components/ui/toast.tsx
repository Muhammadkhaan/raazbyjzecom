'use client';

import { useState } from 'react';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  message?: string;
  type?: 'success' | 'error' | 'info' | 'warning' | string;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = ({ title, description, message, type = 'info' }: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2);
    const newToast = { id, title, description: description || message, message, type };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  return { toast, showToast: toast, toasts };
}
