"use client";

import { useEffect, useMemo, useState } from "react";
import { formatEther } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import deployedContracts from "~~/contracts/deployedContracts";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface EscrowDetail {
  address: string;
  buyer: string;
  seller: string;
  itemName: string;
  totalAmount: bigint;
  totalAmountMON: string;
  status: number;
  createdAt: number; // unix seconds
  deliveredAt: number;
  quantity: number;
}

export interface TimelinePoint {
  date: string; // "Mar 5"
  count: number;
  volume: number;
}

export interface StatusCount {
  status: number;
  label: string;
  count: number;
  color: string;
}

const STATUS_LABELS: Record<number, string> = {
  0: "Created",
  1: "Accepted",
  2: "In Production",
  3: "Production Done",
  4: "Shipped",
  5: "Delivered",
  6: "Completed",
  7: "Disputed",
  8: "Cancelled",
};

const STATUS_COLORS: Record<number, string> = {
  0: "#60a5fa", // blue
  1: "#38bdf8", // sky
  2: "#facc15", // yellow
  3: "#fb923c", // orange
  4: "#818cf8", // indigo
  5: "#34d399", // emerald
  6: "#22c55e", // green
  7: "#f87171", // red
  8: "#a1a1aa", // gray
};

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useDashboardData() {
  const { address: connectedAddress } = useAccount();
  const publicClient = usePublicClient();

  const [escrows, setEscrows] = useState<EscrowDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { data: buyerEscrows } = useScaffoldReadContract({
    contractName: "EscrowFactory",
    functionName: "getBuyerEscrows",
    args: [connectedAddress],
  });

  const { data: sellerEscrows } = useScaffoldReadContract({
    contractName: "EscrowFactory",
    functionName: "getSellerEscrows",
    args: [connectedAddress],
  });

  const allAddresses = useMemo(() => {
    const combined = [...(buyerEscrows || []), ...(sellerEscrows || [])];
    return Array.from(new Set(combined));
  }, [buyerEscrows, sellerEscrows]);

  useEffect(() => {
    let active = true;

    const fetchAll = async () => {
      if (!allAddresses.length || !publicClient) {
        setEscrows([]);
        return;
      }

      const chainId = publicClient.chain.id;
      const escrowAbi = (deployedContracts as any)[chainId]?.SupplyChainEscrow?.abi;
      if (!escrowAbi) return;

      setIsLoading(true);
      let needsRetry = false;

      try {
        const results = await Promise.all(
          allAddresses.map(async addr => {
            try {
              const contract = { address: addr as `0x${string}`, abi: escrowAbi } as const;

              const calls = [
                "buyer",
                "seller",
                "itemName",
                "totalAmount",
                "status",
                "createdAt",
                "deliveredAt",
                "quantity",
              ] as const;

              const fetchPromises = calls.map(functionName =>
                publicClient
                  .readContract({
                    ...contract,
                    functionName: functionName as any,
                    args: [],
                  })
                  .catch(() => undefined),
              );

              const results = await Promise.all(fetchPromises);

              if (results[0] === undefined) {
                needsRetry = true;
                return null;
              }

              const [buyer, seller, itemName, totalAmount, status, createdAt, deliveredAt, quantity] = results;

              return {
                address: addr,
                buyer: buyer as string,
                seller: seller as string,
                itemName: itemName as string,
                totalAmount: (totalAmount as bigint) || 0n,
                totalAmountMON: formatEther((totalAmount as bigint) || 0n),
                status: Number(status || 0),
                createdAt: Number(createdAt || 0),
                deliveredAt: Number(deliveredAt || 0),
                quantity: Number(quantity || 0),
              };
            } catch {
              return null;
            }
          }),
        );

        if (active) {
          setEscrows(results.filter((r): r is EscrowDetail => r !== null));
        }

        if (needsRetry && active) {
          setTimeout(fetchAll, 2500);
        }
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        if (active && (!needsRetry || escrows.length > 0)) {
          setIsLoading(false);
        }
      }
    };

    fetchAll();

    return () => {
      active = false;
    };
  }, [allAddresses, publicClient]);

  // ─── Derived Stats ────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const totalEscrows = escrows.length;

    const totalVolume = escrows.reduce((sum, e) => sum + parseFloat(e.totalAmountMON), 0);

    const activeOrders = escrows.filter(e => e.status >= 0 && e.status <= 5).length;
    const completedOrders = escrows.filter(e => e.status === 6 || e.status === 8).length;
    const disputedOrders = escrows.filter(e => e.status === 7).length;

    // Spend (as buyer) & Earned (as seller)
    const lowerAddr = connectedAddress?.toLowerCase();
    const yourSpend = escrows
      .filter(e => e.buyer.toLowerCase() === lowerAddr)
      .reduce((sum, e) => sum + parseFloat(e.totalAmountMON), 0);

    const yourEarned = escrows
      .filter(e => e.seller.toLowerCase() === lowerAddr && e.status === 6)
      .reduce((sum, e) => sum + parseFloat(e.totalAmountMON), 0);

    // Pending actions
    const pendingActions = escrows.filter(e => {
      if (!lowerAddr) return false;
      const isBuyer = e.buyer.toLowerCase() === lowerAddr;
      const isSeller = e.seller.toLowerCase() === lowerAddr;
      // Buyer needs to act: status 5 (confirm delivery) or 3 (deposit)
      if (isBuyer && (e.status === 5 || e.status === 0)) return true;
      // Seller needs to act: status 0 (accept), 1 (start production), 3 (ship)
      if (isSeller && (e.status === 0 || e.status === 1 || e.status === 3)) return true;
      return false;
    }).length;

    // Average completion time (days)
    const completedWithTimes = escrows.filter(e => e.status === 6 && e.deliveredAt > 0 && e.createdAt > 0);
    const avgCompletionDays =
      completedWithTimes.length > 0
        ? completedWithTimes.reduce((sum, e) => sum + (e.deliveredAt - e.createdAt), 0) /
          completedWithTimes.length /
          86400
        : 0;

    return {
      totalEscrows,
      totalVolume,
      activeOrders,
      completedOrders,
      disputedOrders,
      yourSpend,
      yourEarned,
      pendingActions,
      avgCompletionDays,
    };
  }, [escrows, connectedAddress]);

  // ─── Timeline Data ────────────────────────────────────────────────────

  const timelineData = useMemo((): TimelinePoint[] => {
    if (escrows.length === 0) return [];

    // Group by date
    const groups: Record<string, { count: number; volume: number }> = {};
    escrows.forEach(e => {
      const d = new Date(e.createdAt * 1000);
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      if (!groups[key]) groups[key] = { count: 0, volume: 0 };
      groups[key].count++;
      groups[key].volume += parseFloat(e.totalAmountMON);
    });

    return Object.entries(groups)
      .map(([date, data]) => ({ date, count: data.count, volume: Math.round(data.volume * 100) / 100 }))
      .sort((a, b) => {
        const [am, ad] = a.date.split("/").map(Number);
        const [bm, bd] = b.date.split("/").map(Number);
        return am !== bm ? am - bm : ad - bd;
      });
  }, [escrows]);

  // ─── Status Breakdown ────────────────────────────────────────────────

  const statusBreakdown = useMemo((): StatusCount[] => {
    const counts: Record<number, number> = {};
    escrows.forEach(e => {
      counts[e.status] = (counts[e.status] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([status, count]) => ({
        status: Number(status),
        label: STATUS_LABELS[Number(status)] || "Unknown",
        count,
        color: STATUS_COLORS[Number(status)] || "#999",
      }))
      .sort((a, b) => b.count - a.count);
  }, [escrows]);

  // ─── Recent Activity ──────────────────────────────────────────────────

  const recentActivity = useMemo(() => {
    return [...escrows].sort((a, b) => b.createdAt - a.createdAt).slice(0, 8);
  }, [escrows]);

  return {
    isLoading,
    escrows,
    stats,
    timelineData,
    statusBreakdown,
    recentActivity,
    connectedAddress,
  };
}
