'use client';

import { useEffect } from 'react';
import { initializeStores } from '@/store';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  useEffect(() => {
    // Initialize stores when the app loads
    initializeStores().catch(console.error);
  }, []);

  return <>{children}</>;
}