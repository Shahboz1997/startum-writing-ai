"use client";

import { useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { BillingProvider } from "@/components/BillingContext";
import { BankTopicsNavProvider } from "@/context/BankTopicsNavContext";

function AuthDbWarm() {
  useEffect(() => {
    void fetch("/api/auth/warm-db", { cache: "no-store" }).catch(() => {});
  }, []);
  return null;
}

export function Providers({ children }) {
  return (
    <SessionProvider
      basePath="/api/auth"
      refetchInterval={5 * 60}
      refetchOnWindowFocus
    >
      <AuthDbWarm />
      <Toaster position="top-center" />
      <BillingProvider>
        <BankTopicsNavProvider>
          {children}
        </BankTopicsNavProvider>
      </BillingProvider>
    </SessionProvider>
  );
}
