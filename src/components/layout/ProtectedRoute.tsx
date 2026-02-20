import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, profile } = useAuth();

  // Still checking session
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="p-3 rounded-xl bg-primary animate-pulse">
          <Shield className="h-8 w-8 text-primary-foreground" />
        </div>
        <div className="space-y-3 w-64">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4 mx-auto" />
        </div>
        <p className="text-sm text-muted-foreground">Verifying session…</p>
      </div>
    );
  }

  // No user → redirect to login
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // User exists but profile not yet loaded → show brief loader
  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="p-3 rounded-xl bg-primary animate-pulse">
          <Shield className="h-8 w-8 text-primary-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">Loading profile…</p>
      </div>
    );
  }

  return <>{children}</>;
}
