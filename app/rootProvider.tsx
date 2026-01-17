"use client";
import { ReactNode, useState } from "react";
import { base } from "wagmi/chains";
import { http, createConfig } from "wagmi";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import "@coinbase/onchainkit/styles.css";

// Create wagmi config with proper RPC (outside component to avoid recreation)
const wagmiConfig = createConfig({
  chains: [base],
  transports: {
    [base.id]: http("https://mainnet.base.org"),
  },
  ssr: true,
});

// Helper to create query client with default options
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        retry: 2,
      },
    },
  });
}

export function RootProvider({ children }: { children: ReactNode }) {
  // Create query client once per component instance (survives HMR)
  const [queryClient] = useState(() => makeQueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
          chain={base}
          config={{
            appearance: {
              mode: "dark",
            },
            wallet: {
              display: "modal",
              preference: "all",
            },
          }}
          miniKit={{
            enabled: true,
            autoConnect: true,
          }}
        >
          {children}
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
