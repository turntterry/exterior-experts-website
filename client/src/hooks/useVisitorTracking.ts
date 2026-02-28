import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

/**
 * Hook to track visitor sessions and page views
 * Call this once in the root App component
 */
export function useVisitorTracking() {
  const [location] = useLocation();
  const sessionIdRef = useRef<string>("");
  const trackMutation = trpc.visitor.trackPageView.useMutation();

  // Initialize session ID on mount
  useEffect(() => {
    if (!sessionIdRef.current) {
      // Generate or retrieve session ID from localStorage
      let sessionId = localStorage.getItem("visitor_session_id");
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem("visitor_session_id", sessionId);
      }
      sessionIdRef.current = sessionId;
    }
  }, []);

  // Track page views on location change
  useEffect(() => {
    if (sessionIdRef.current) {
      const pageTitle = document.title || location;
      trackMutation.mutate({
        sessionId: sessionIdRef.current,
        pagePath: location,
        pageTitle,
      });
    }
  }, [location, trackMutation]);

  return sessionIdRef.current;
}
