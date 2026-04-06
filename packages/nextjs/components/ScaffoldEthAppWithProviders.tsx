"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { useTheme } from "next-themes";
import { Toaster } from "react-hot-toast";
import { WagmiProvider, useAccount } from "wagmi";
import { Breadcrumbs } from "~~/components/Breadcrumbs";
import { Footer } from "~~/components/Footer";
import { Header } from "~~/components/Header";
import { BlockieAvatar } from "~~/components/scaffold-eth";
import { wagmiConfig } from "~~/services/web3/wagmiConfig";

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  const { address } = useAccount();
  const pathname = usePathname();
  const [prevAddress, setPrevAddress] = useState<string | undefined>(address);

  useEffect(() => {
    // Define routes that require a connected wallet
    const privateRoutes = ["/create", "/orders", "/arbitration"];
    const isPrivateRoute = privateRoutes.some(route => pathname.startsWith(route));

    // Handle account change or disconnection
    if (prevAddress !== address) {
      if (isPrivateRoute) {
        // Force redirect to home if on a private page
        window.location.href = "/";
      }
    }
    setPrevAddress(address);
  }, [address, prevAddress, pathname]);

  return (
    <>
      <div className={`flex flex-col min-h-screen `}>
        {/* Dynamic Glowing Orbs Background */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-primary/10 blur-[100px] animate-pulse"></div>
          <div
            className="absolute top-[20%] -right-[10%] w-[40vw] h-[60vw] rounded-full bg-accent/10 blur-[120px] animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
          <div
            className="absolute -bottom-[20%] left-[20%] w-[60vw] h-[50vw] rounded-full bg-secondary/10 blur-[150px] animate-pulse"
            style={{ animationDelay: "4s" }}
          ></div>
        </div>
        <div className="z-10 flex flex-col flex-1">
          <Header />
          <Breadcrumbs />
          <main className="relative flex flex-col flex-1">{children}</main>
          <Footer />
        </div>
      </div>
      <Toaster />
    </>
  );
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

export const ScaffoldEthAppWithProviders = ({ children }: { children: React.ReactNode }) => {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          avatar={BlockieAvatar}
          theme={mounted ? (isDarkMode ? darkTheme() : lightTheme()) : lightTheme()}
        >
          <ProgressBar height="3px" color="#2299dd" />
          <ScaffoldEthApp>{children}</ScaffoldEthApp>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
