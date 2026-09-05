import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  getSubscriptionStatus,
  purchaseMonthlySubscription,
  type SubscriptionStatus,
} from '../services/subscription';

interface SubscriptionContextValue {
  status: SubscriptionStatus;
  loading: boolean;
  subscribe: () => Promise<void>;
  refresh: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SubscriptionStatus>({
    isActive: false,
    productId: null,
    expiresIso: null,
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setStatus(await getSubscriptionStatus());
    } finally {
      setLoading(false);
    }
  }, []);

  const subscribe = useCallback(async () => {
    setLoading(true);
    try {
      setStatus(await purchaseMonthlySubscription());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <SubscriptionContext.Provider value={{ status, loading, subscribe, refresh }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within a SubscriptionProvider');
  return ctx;
}
