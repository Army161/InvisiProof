import React, { createContext, useContext, useState } from 'react';
import { PaywallModal, PaywallTrigger } from '@/components/PaywallModal';

interface PaywallContextValue {
  showPaywall: (trigger?: PaywallTrigger) => void;
}

const PaywallContext = createContext<PaywallContextValue | null>(null);

export function PaywallProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [trigger, setTrigger] = useState<PaywallTrigger>('generic');

  const showPaywall = (t: PaywallTrigger = 'generic') => {
    console.log('[PaywallContext] showPaywall called, trigger:', t);
    setTrigger(t);
    setVisible(true);
  };

  const handleClose = () => {
    console.log('[PaywallContext] paywall closed');
    setVisible(false);
  };

  return (
    <PaywallContext.Provider value={{ showPaywall }}>
      {children}
      <PaywallModal visible={visible} onClose={handleClose} trigger={trigger} />
    </PaywallContext.Provider>
  );
}

export function usePaywall(): PaywallContextValue {
  const ctx = useContext(PaywallContext);
  if (!ctx) {
    throw new Error('usePaywall must be used within a PaywallProvider');
  }
  return ctx;
}
