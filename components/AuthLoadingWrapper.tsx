import { useAuth } from '@/contexts/AuthContext';
import { AppLoadingScreen } from '@/components/ui/AppLoadingScreen';
import { ReactNode } from 'react';

interface AuthLoadingWrapperProps {
  children: ReactNode;
}

/**
 * Wrapper component that shows loading screen while authentication is being checked
 */
export function AuthLoadingWrapper({ children }: AuthLoadingWrapperProps) {
  const { loading } = useAuth();

  if (loading) {
    return <AppLoadingScreen />;
  }

  return <>{children}</>;
}
