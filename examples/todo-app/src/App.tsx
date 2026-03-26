import React from "react";
import { AuthGuard } from "@lemma/client/react";
import { getClient } from "./lib/client.ts";
import TodoApp from "./components/TodoApp.tsx";

// Loading spinner shown while checking auth
function LoadingScreen() {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      minHeight: "100vh", color: "#6b7280", fontSize: "14px",
    }}>
      Loading...
    </div>
  );
}

export default function App() {
  return (
    <AuthGuard client={getClient()} loadingFallback={<LoadingScreen />}>
      <TodoApp />
    </AuthGuard>
  );
}
