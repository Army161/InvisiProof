import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export type Entitlement = 'free' | 'plus' | 'pro' | 'max';

export interface SubscriptionState {
  entitlement: Entitlement;
  status: string;
  expiresAt: string | null;
  loading: boolean;
}

const PLAN_RANK: Record<Entitlement, number> = { free: 0, plus: 1, pro: 2, max: 3 };

export function planRank(e: Entitlement): number {
  return PLAN_RANK[e] ?? 0;
}

export function useSubscription(): SubscriptionState {
  const { user } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    entitlement: 'free',
    status: 'active',
    expiresAt: null,
    loading: true,
  });

  // Supabase source of truth
  useEffect(() => {
    if (!user) {
      setState({ entitlement: 'free', status: 'active', expiresAt: null, loading: false });
      return;
    }
    supabase
      .from('subscriptions')
      .select('entitlement, status, expires_at')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (data && (data.status === 'active' || data.status === 'grace_period')) {
          setState({
            entitlement: (data.entitlement as Entitlement) ?? 'free',
            status: data.status,
            expiresAt: data.expires_at,
            loading: false,
          });
        } else {
          setState({ entitlement: 'free', status: 'active', expiresAt: null, loading: false });
        }
      });
  }, [user]);

  // Android: listen to RC CustomerInfo for real-time updates after a purchase,
  // without waiting for the Supabase webhook to fire.
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    let listener: { remove: () => void } | null = null;
    try {
      const Purchases = require('react-native-purchases').default;
      listener = Purchases.addCustomerInfoUpdateListener((info: any) => {
        const subs = info.activeSubscriptions as string[];
        console.log('[useSubscription] RC CustomerInfo update — activeSubscriptions:', subs);
        if (subs.length > 0) {
          const sub = subs[0];
          let entitlement: Entitlement = 'free';
          if (sub.includes('max')) entitlement = 'max';
          else if (sub.includes('pro')) entitlement = 'pro';
          else if (sub.includes('plus')) entitlement = 'plus';
          console.log('[useSubscription] RC entitlement resolved:', entitlement);
          setState(prev => ({ ...prev, entitlement, status: 'active', loading: false }));
        }
      });
    } catch {
      // RC not available on this platform/build
    }
    return () => {
      listener?.remove();
    };
  }, []);

  return state;
}
