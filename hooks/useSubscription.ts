import { useEffect, useState } from 'react';
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

  return state;
}
