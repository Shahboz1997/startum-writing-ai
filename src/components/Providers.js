"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { BillingProvider } from "@/components/BillingContext";

export function Providers({ children }) {
  return (
    <SessionProvider
      refetchInterval={5 * 60}
      refetchOnWindowFocus={false}
    >
      <Toaster position="top-center" />
      <BillingProvider>
        {children}
      </BillingProvider>
    </SessionProvider>
  );
}
