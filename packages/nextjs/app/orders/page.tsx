"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Address } from "@scaffold-ui/components";
import type { NextPage } from "next";
import { formatEther } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import {
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  ArrowTopRightOnSquareIcon,
  CubeIcon,
  MagnifyingGlassIcon,
  ShoppingBagIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import deployedContracts from "~~/contracts/deployedContracts";
import { useScaffoldReadContract, useTargetNetwork } from "~~/hooks/scaffold-eth";

interface Order {
  address: string;
  buyer: string;
  seller: string;
  item: string;
  amount: string;
  status: number;
  createdAt: bigint;
}

const STATUS_OPTIONS = [
  { value: "0", label: "Created" },
  { value: "1", label: "Accepted" },
  { value: "2", label: "In Production" },
  { value: "3", label: "Prod. Complete" },
  { value: "4", label: "Shipped" },
  { value: "5", label: "Delivered" },
  { value: "7", label: "Disputed" },
];

const ViewOrders: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const router = useRouter();
  const publicClient = usePublicClient();
  const { targetNetwork } = useTargetNetwork();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const moreFiltersRef = useRef<HTMLDivElement>(null);

  // Count active filters (excluding defaults)
  const activeFilterCount = [
    statusFilter !== "all",
    roleFilter !== "all",
    startDate !== "",
    endDate !== "",
    sortBy !== "date-desc",
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setRoleFilter("all");
    setSortBy("date-desc");
    setStartDate("");
    setEndDate("");
  };

  // Fetch escrows where user is buyer
  const { data: buyerEscrows } = useScaffoldReadContract({
    contractName: "EscrowFactory",
    functionName: "getBuyerEscrows",
    args: [connectedAddress],
  });

  // Fetch escrows where user is seller
  const { data: sellerEscrows } = useScaffoldReadContract({
    contractName: "EscrowFactory",
    functionName: "getSellerEscrows",
    args: [connectedAddress],
  });

  const allEscrowAddresses = useMemo(() => {
    const combined = [...(buyerEscrows || []), ...(sellerEscrows || [])];
    return Array.from(new Set(combined)); // Remove duplicates
  }, [buyerEscrows, sellerEscrows]);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!allEscrowAddresses.length || !publicClient) {
        setOrders([]);
        return;
      }

      const chainId = publicClient.chain.id;
      const escrowAbi = (deployedContracts as any)[chainId].SupplyChainEscrow.abi;

      setIsLoading(true);
      try {
        const fetchedOrders = await Promise.all(
          allEscrowAddresses.map(async addr => {
            const contract = { address: addr as `0x${string}`, abi: escrowAbi } as const;

            const results = await publicClient.multicall({
              contracts: [
                { ...contract, functionName: "buyer", args: [] },
                { ...contract, functionName: "seller", args: [] },
                { ...contract, functionName: "itemName", args: [] },
                { ...contract, functionName: "totalAmount", args: [] },
                { ...contract, functionName: "status", args: [] },
                { ...contract, functionName: "createdAt", args: [] },
              ],
            });

            const [buyer, seller, itemName, totalAmount, status, createdAt] = results.map(r => r.result);

            if (results.some(r => r.status === "failure")) {
              return null; // Ignore unindexed contracts
            }

            return {
              address: addr,
              buyer: buyer as string,
              seller: seller as string,
              item: itemName as string,
              amount: formatEther(totalAmount as bigint),
              status: Number(status),
              createdAt: createdAt as bigint,
            };
          }),
        );
        const validOrders = fetchedOrders.filter((order): order is NonNullable<typeof order> => order !== null);
        setOrders(validOrders);
      } catch (error) {
        console.error("Error fetching order details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetails();
  }, [allEscrowAddresses, publicClient, setOrders]);

  const getStatusLabel = (status: number) => {
    const labels = [
      "Created", // 0
      "Accepted", // 1
      "In Production", // 2
      "Production Completed", // 3
      "Shipped", // 4
      "Delivered", // 5
      "Completed", // 6
      "Disputed", // 7
      "Refunded/Cancelled", // 8
    ];
    return labels[status] || "Unknown";
  };

  const filteredOrders = useMemo(() => {
    return orders
      .filter(order => {
        // Tab filtering
        const isCompleted = order.status === 6 || order.status === 8;
        if (activeTab === "completed" && !isCompleted) return false;
        if (activeTab === "active" && isCompleted) return false;

        // Search filtering
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          if (!order.item.toLowerCase().includes(q) && !order.address.toLowerCase().includes(q)) {
            return false;
          }
        }

        // Date Range filtering
        if (startDate) {
          const startTimestamp = new Date(startDate).getTime() / 1000;
          if (Number(order.createdAt) < startTimestamp) return false;
        }
        if (endDate) {
          const endTimestamp = new Date(endDate).getTime() / 1000 + 86400;
          if (Number(order.createdAt) >= endTimestamp) return false;
        }

        // Status filtering
        if (statusFilter !== "all" && order.status.toString() !== statusFilter) {
          return false;
        }

        // Role filtering
        if (roleFilter === "buyer" && order.buyer.toLowerCase() !== connectedAddress?.toLowerCase()) return false;
        if (roleFilter === "seller" && order.seller.toLowerCase() !== connectedAddress?.toLowerCase()) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "date-desc") return Number(b.createdAt) - Number(a.createdAt);
        if (sortBy === "date-asc") return Number(a.createdAt) - Number(b.createdAt);
        if (sortBy === "amount-desc") return parseFloat(b.amount) - parseFloat(a.amount);
        if (sortBy === "amount-asc") return parseFloat(a.amount) - parseFloat(b.amount);
        if (sortBy === "status") return a.status - b.status;
        return 0;
      });
  }, [orders, activeTab, searchQuery, statusFilter, roleFilter, sortBy, connectedAddress, startDate, endDate]);

  return (
    <div className="flex flex-col grow bg-base-200 pb-20">
      <div className="max-w-7xl w-full mx-auto px-2 sm:px-4 mt-4 sm:mt-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <h1 className="text-xl sm:text-3xl font-bold text-primary flex items-center gap-3">
            <ShoppingBagIcon className="h-6 w-6 sm:h-8 sm:w-8" />
            My Escrow Orders
          </h1>
          <Link href="/create" className="btn btn-primary btn-sm sm:btn-md rounded-sm shadow-md">
            New Contract
          </Link>
        </div>

        {/* ── Filter Bar ── */}
        <div className="bg-base-100 border border-base-content/10 rounded-sm shadow-sm mb-6">
          {/* Row 1: Tabs · Search · Filters toggle */}
          <div className="flex flex-col gap-3 p-2 sm:p-3">
            {/* Tabs */}
            <div className="flex bg-base-200 rounded-sm p-0.5 shrink-0">
              <button
                className={`px-4 py-1.5 text-xs font-bold rounded-sm transition-all ${activeTab === "active" ? "bg-primary text-primary-content shadow-sm" : "hover:bg-base-300"}`}
                onClick={() => setActiveTab("active")}
              >
                Active
              </button>
              <button
                className={`px-4 py-1.5 text-xs font-bold rounded-sm transition-all ${activeTab === "completed" ? "bg-primary text-primary-content shadow-sm" : "hover:bg-base-300"}`}
                onClick={() => setActiveTab("completed")}
              >
                Completed
              </button>
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px h-6 bg-base-300" />

            {/* Search */}
            <div className="relative flex-1 min-w-0">
              <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
              <input
                type="text"
                placeholder="Search by item name or contract address…"
                className="input input-sm w-full pl-9 bg-base-200 border-0 rounded-sm focus:outline-primary placeholder:opacity-40"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100"
                  onClick={() => setSearchQuery("")}
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Role pills */}
            <div className="flex flex-wrap gap-1 shrink-0">
              {["all", "buyer", "seller"].map(role => (
                <button
                  key={role}
                  className={`px-3 py-1.5 text-[11px] font-bold uppercase rounded-sm transition-all ${
                    roleFilter === role
                      ? "bg-primary text-primary-content shadow-sm"
                      : "bg-base-200 hover:bg-base-300 opacity-60 hover:opacity-100"
                  }`}
                  onClick={() => setRoleFilter(role)}
                >
                  {role === "all" ? "All" : role === "buyer" ? "Buyer" : "Seller"}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px h-6 bg-base-300" />

            {/* More Filters toggle */}
            <button
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase rounded-sm transition-all shrink-0 ${
                showMoreFilters || activeFilterCount > 0
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "bg-base-200 hover:bg-base-300 opacity-60 hover:opacity-100"
              }`}
              onClick={() => setShowMoreFilters(!showMoreFilters)}
            >
              <AdjustmentsHorizontalIcon className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="flex items-center justify-center h-4 w-4 rounded-full bg-primary text-primary-content text-[9px] font-black">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Clear all */}
            {activeFilterCount > 0 && (
              <button
                className="text-[11px] font-bold text-error/70 hover:text-error uppercase shrink-0 transition-colors"
                onClick={clearAllFilters}
              >
                Clear All
              </button>
            )}
          </div>

          {/* Row 2: Expandable filters panel */}
          <div
            ref={moreFiltersRef}
            className={`overflow-hidden transition-all duration-200 ease-in-out ${showMoreFilters ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 px-3 pb-3 pt-1 border-t border-base-200">
              {/* Status */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase opacity-40 shrink-0">Status</span>
                <select
                  className="select select-xs bg-base-200 border-0 rounded-sm font-bold text-xs focus:outline-primary min-w-[140px]"
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="hidden sm:block w-px h-5 bg-base-300" />

              {/* Sort */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase opacity-40 shrink-0">Sort</span>
                <select
                  className="select select-xs bg-base-200 border-0 rounded-sm font-bold text-xs focus:outline-primary min-w-[140px]"
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                >
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="amount-desc">Amount ↓</option>
                  <option value="amount-asc">Amount ↑</option>
                  <option value="status">By Status</option>
                </select>
              </div>

              <div className="hidden sm:block w-px h-5 bg-base-300" />

              {/* Date Range */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase opacity-40 shrink-0">Date</span>
                <input
                  type="date"
                  className="input input-xs bg-base-200 border-0 rounded-sm font-bold text-xs focus:outline-primary"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
                <span className="text-xs opacity-30">→</span>
                <input
                  type="date"
                  className="input input-xs bg-base-200 border-0 rounded-sm font-bold text-xs focus:outline-primary"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                />
                {(startDate || endDate) && (
                  <button
                    className="opacity-40 hover:opacity-100 transition-opacity"
                    onClick={() => {
                      setStartDate("");
                      setEndDate("");
                    }}
                  >
                    <XMarkIcon className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Results summary */}
        {!isLoading && orders.length > 0 && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold opacity-40">
              {filteredOrders.length} of {orders.length} order{orders.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <ArrowPathIcon className="h-12 w-12 animate-spin text-primary opacity-50" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="card bg-base-100 shadow-xl border border-base-content/10 p-20 text-center rounded-sm">
            <div className="flex justify-center mb-6">
              <CubeIcon className="h-16 w-16 opacity-10" />
            </div>
            <h2 className="text-2xl font-bold opacity-50">No orders found</h2>
            <p className="mt-2 opacity-40 text-lg">
              {connectedAddress
                ? "You are not involved in any escrow contracts yet."
                : "Please connect your wallet to view your orders."}
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link href="/create" className="btn btn-outline btn-primary px-8 rounded-sm">
                Create Your First Escrow
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredOrders.map(order => {
              const isExpired = order.status === 0 && Date.now() / 1000 > Number(order.createdAt) + 86400;

              return (
                <div
                  key={order.address}
                  onClick={() => router.push(`/orders/${order.address}`)}
                  className="card bg-base-100 shadow-sm border border-base-content/10 hover:border-primary hover:shadow-md transition-all cursor-pointer group rounded-sm overflow-hidden"
                >
                  <div className="card-body p-5">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/5 rounded-lg text-primary group-hover:bg-primary group-hover:text-primary-content transition-colors">
                          <CubeIcon className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold group-hover:text-primary transition-colors">
                              {order.item}
                            </h3>
                            <div
                              className={`badge ${order.status === 6 || order.status === 4 || order.status === 5 ? "badge-success" : order.status === 7 || order.status === 8 || isExpired ? "badge-error" : "badge-info"} badge-xs gap-1 py-2 px-2 text-[10px] uppercase font-black rounded-sm`}
                            >
                              {isExpired ? "Expired" : getStatusLabel(order.status)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] opacity-50 font-medium mt-1">
                            <Address address={order.address} size="xs" />
                            {targetNetwork.blockExplorers?.default.url && (
                              <a
                                href={`${targetNetwork.blockExplorers.default.url}/address/${order.address}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary hover:scale-110 transition-transform"
                                onClick={e => e.stopPropagation()}
                              >
                                <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-[10px] uppercase font-bold opacity-40 leading-none mb-1">
                            Total Value
                          </div>
                          <div className="text-xl font-black text-primary">{order.amount} MON</div>
                        </div>
                        <div className="p-2 rounded-full bg-base-200 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                          <ArrowRightIcon className="h-5 w-5" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-base-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
                        <div>
                          <span className="text-[10px] font-bold uppercase opacity-40 block mb-1">Buyer</span>
                          <Address address={order.buyer} size="sm" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase opacity-40 block mb-1">Seller</span>
                          <Address address={order.seller} size="sm" />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="btn btn-primary btn-sm rounded-sm px-6 font-bold text-xs">Manage Order</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewOrders;
