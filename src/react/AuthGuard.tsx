import React from "react";
import type { LemmaClient } from "../client.js";
import { useAuth } from "./useAuth.js";

export interface AuthGuardProps {
  client: LemmaClient;
  children: React.ReactNode;
  /** Optional custom loading element. Defaults to a blank screen. */
  loadingFallback?: React.ReactNode;
  /** Optional custom unauthenticated element. Defaults to a centered sign-in page. */
  unauthenticatedFallback?: React.ReactNode;
}

function DefaultSignInPage({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        fontFamily: "system-ui, -apple-system, sans-serif",
        backgroundColor: "#f9fafb",
        gap: "16px",
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
          padding: "40px 48px",
          textAlign: "center",
          maxWidth: "360px",
          width: "100%",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "8px",
            backgroundColor: "#111827",
            margin: "0 auto 20px",
          }}
        />
        <h1 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: 600, color: "#111827" }}>
          Sign in to continue
        </h1>
        <p style={{ margin: "0 0 24px", fontSize: "14px", color: "#6b7280" }}>
          You need to be signed in to access this app.
        </p>
        <button
          onClick={onSignIn}
          style={{
            width: "100%",
            padding: "10px 16px",
            backgroundColor: "#111827",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Sign In
        </button>
      </div>
    </div>
  );
}

/**
 * AuthGuard wraps your application and handles auth state:
 * - Loading: shows loadingFallback (blank by default)
 * - Unauthenticated: shows sign-in page (or custom unauthenticatedFallback)
 * - Authenticated: renders children
 *
 * Usage:
 *   <AuthGuard client={getClient()}>
 *     <App />
 *   </AuthGuard>
 */
export function AuthGuard({
  client,
  children,
  loadingFallback = null,
  unauthenticatedFallback,
}: AuthGuardProps) {
  const { isLoading, isAuthenticated, redirectToAuth } = useAuth(client);

  if (isLoading) {
    return <>{loadingFallback}</>;
  }

  if (!isAuthenticated) {
    if (unauthenticatedFallback !== undefined) {
      return <>{unauthenticatedFallback}</>;
    }
    return <DefaultSignInPage onSignIn={redirectToAuth} />;
  }

  return <>{children}</>;
}
