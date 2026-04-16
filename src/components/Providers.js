"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { BillingProvider } from "@/components/BillingContext";
import { BankTopicsNavProvider } from "@/context/BankTopicsNavContext";

export function Providers({ children }) {
  return (
    <SessionProvider
      basePath="/api/auth"
      refetchInterval={5 * 60}
      refetchOnWindowFocus
    >
      <Toaster position="top-center" />
      <BillingProvider>
        <BankTopicsNavProvider>
          {children}
        </BankTopicsNavProvider>
      </BillingProvider>
    </SessionProvider>
  );
}
