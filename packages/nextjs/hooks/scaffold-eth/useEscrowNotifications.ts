"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Abi } from "abitype";
import toast from "react-hot-toast";
import { useAccount, usePublicClient } from "wagmi";
import SupplyChainEscrowArtifact from "~~/contracts/SupplyChainEscrow.json";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface EscrowNotification {
  id: string;
  escrowAddress: string;
  itemName: string;
  oldStatus: number;
  newStatus: number;
  message: string;
  timestamp: number;
  read: boolean;
}

type StatusMap = Record<string, number>;

// ─── Constants ──────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 30_000; // 30 seconds

const STATUS_LABELS: Record<number, string> = {
  0: "Created",
  1: "Accepted",
  2: "In Production",
  3: "Production Completed",
  4: "Shipped",
  5: "Delivered",
  6: "Completed",
  7: "Disputed",
  8: "Refunded / Cancelled",
};

const STATUS_MESSAGES: Record<number, string> = {
  1: "Seller accepted your contract!",
  2: "Production has started",
  3: "Production is completed",
  4: "Your order has been shipped!",
  5: "Delivery confirmed",
  6: "Contract completed successfully!",
  7: "A dispute has been raised",
  8: "Contract has been cancelled / refunded",
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function storageKey(address: string) {
  return `supplychain_notifications_${address.toLowerCase()}`;
}
function statusMapKey(address: string) {
  return `supplychain_statusmap_${address.toLowerCase()}`;
}

function loadNotifications(walletAddress: string): EscrowNotification[] {
  try {
    const raw = localStorage.getItem(storageKey(walletAddress));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveNotifications(walletAddress: string, list: EscrowNotification[]) {
  localStorage.setItem(storageKey(walletAddress), JSON.stringify(list));
}

function loadStatusMap(walletAddress: string): StatusMap {
  try {
    const raw = localStorage.getItem(statusMapKey(walletAddress));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStatusMap(walletAddress: string, map: StatusMap) {
  localStorage.setItem(statusMapKey(walletAddress), JSON.stringify(map));
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useEscrowNotifications() {
  const { address: connectedAddress } = useAccount();
  const publicClient = usePublicClient();

  const [notifications, setNotifications] = useState<EscrowNotification[]>([]);
  const isInitialLoad = useRef(true);

  // Fetch escrow lists
  const { data: buyerEscrows, isLoading: isLoadingBuyer } = useScaffoldReadContract({
    contractName: "EscrowFactory",
    functionName: "getBuyerEscrows",
    args: [connectedAddress],
  });
  const { data: sellerEscrows, isLoading: isLoadingSeller } = useScaffoldReadContract({
    contractName: "EscrowFactory",
    functionName: "getSellerEscrows",
    args: [connectedAddress],
  });

  const isLoadingEscrows = isLoadingBuyer || isLoadingSeller;

  // Load persisted notifications when wallet changes
  useEffect(() => {
    if (connectedAddress) {
      setNotifications(loadNotifications(connectedAddress));
      isInitialLoad.current = true;
    } else {
      setNotifications([]);
      isInitialLoad.current = true;
    }
  }, [connectedAddress]);

  // ── Poll for status changes ──
  const pollStatuses = useCallback(async () => {
    if (!connectedAddress || !publicClient) return;

    // Wait until the initial RPC reads are completely finished
    if (isLoadingEscrows) return;

    const allAddrs = Array.from(new Set([...(buyerEscrows || []), ...(sellerEscrows || [])]));

    if (allAddrs.length === 0) {
      // User genuinely has 0 escrows
      if (isInitialLoad.current) {
        isInitialLoad.current = false;
      }
      return;
    }

    try {
      const escrowAbi = SupplyChainEscrowArtifact.abi as Abi;
      const oldMap = loadStatusMap(connectedAddress);
      const newMap: StatusMap = {};
      const freshNotifications: EscrowNotification[] = [];

      await Promise.all(
        allAddrs.map(async addr => {
          try {
            const [statusRaw, itemNameRaw] = await Promise.all([
              publicClient.readContract({
                address: addr as `0x${string}`,
                abi: escrowAbi,
                functionName: "status",
              }),
              publicClient.readContract({
                address: addr as `0x${string}`,
                abi: escrowAbi,
                functionName: "itemName",
              }),
            ]);

            const currentStatus = Number(statusRaw);
            const itemName = itemNameRaw as string;
            newMap[addr] = currentStatus;

            const previousStatus = oldMap[addr];
            const hasHistory = Object.keys(oldMap).length > 0;

            if (previousStatus === undefined) {
              // If we have history or it's not the first load, an undefined previousStatus means a NEW contract
              if (hasHistory || !isInitialLoad.current) {
                const message = `${itemName}: New contract created!`;
                freshNotifications.push({
                  id: `${addr}_create_${Date.now()}`,
                  escrowAddress: addr,
                  itemName,
                  oldStatus: 0, // treat creation as 0
                  newStatus: currentStatus,
                  message,
                  timestamp: Date.now(),
                  read: false,
                });

                // Fire a toast alert for the new contract
                toast.success(message);
              }
            } else if (previousStatus !== currentStatus && !isInitialLoad.current) {
              const statusLabel = STATUS_LABELS[currentStatus] || "Unknown";
              const message = STATUS_MESSAGES[currentStatus] || `Status changed to ${statusLabel}`;

              freshNotifications.push({
                id: `${addr}_${Date.now()}_${currentStatus}`,
                escrowAddress: addr,
                itemName,
                oldStatus: previousStatus,
                newStatus: currentStatus,
                message: `${itemName}: ${message}`,
                timestamp: Date.now(),
                read: false,
              });

              // Fire a toast alert for status changes
              if (currentStatus === 7 || currentStatus === 8) {
                toast.error(`${itemName}: ${message}`);
              } else {
                toast.success(`${itemName}: ${message}`);
              }
            }
          } catch {
            // individual escrow read failures shouldn't break the loop
          }
        }),
      );

      // Persist the latest status map
      saveStatusMap(connectedAddress, newMap);

      // After first successful load, flip the flag
      if (isInitialLoad.current) {
        isInitialLoad.current = false;
      }

      if (freshNotifications.length > 0) {
        setNotifications(prev => {
          // keep most recent 50
          const merged = [...freshNotifications, ...prev].slice(0, 50);
          saveNotifications(connectedAddress, merged);
          return merged;
        });
      }

      return freshNotifications;
    } catch {
      // Silently handle RPC/network errors during polling
    }
  }, [connectedAddress, publicClient, buyerEscrows, sellerEscrows]);

  // ── Set up interval ──
  useEffect(() => {
    pollStatuses(); // initial poll

    const interval = setInterval(pollStatuses, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [pollStatuses]);

  // ── Actions ──
  const markAsRead = useCallback(
    (id: string) => {
      setNotifications(prev => {
        const updated = prev.map(n => (n.id === id ? { ...n, read: true } : n));
        if (connectedAddress) saveNotifications(connectedAddress, updated);
        return updated;
      });
    },
    [connectedAddress],
  );

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      if (connectedAddress) saveNotifications(connectedAddress, updated);
      return updated;
    });
  }, [connectedAddress]);

  const clearAll = useCallback(() => {
    setNotifications([]);
    if (connectedAddress) saveNotifications(connectedAddress, []);
  }, [connectedAddress]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
  };
}
