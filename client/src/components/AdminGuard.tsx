import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

/**
 * AdminGuard: Protects admin pages from unauthorized access.
 * Redirects non-admin users to home page immediately.
 * Shows loading state while checking authentication.
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // If auth check is complete and user is not admin, redirect to home
    if (!loading && (!user || user.role !== "admin")) {
      setLocation("/");
    }
  }, [user, loading, setLocation]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-primary font-heading text-xl mb-2">
            Verifying access...
          </div>
          <p className="text-muted-foreground">Please wait</p>
        </div>
      </div>
    );
  }

  // If user is admin, render the protected content
  if (user && user.role === "admin") {
    return <>{children}</>;
  }

  // Fallback: should not reach here due to redirect above, but just in case
  return null;
}
