"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Address } from "@scaffold-ui/components";
import type { NextPage } from "next";
import { formatEther } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import {
  ArrowPathIcon,
  ArrowRightIcon,
  ArrowTopRightOnSquareIcon,
  CubeIcon,
  MagnifyingGlassIcon,
  ShoppingBagIcon,
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
        setOrders(fetchedOrders);
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
          const endTimestamp = new Date(endDate).getTime() / 1000 + 86400; // include full end day
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
      <div className="max-w-7xl w-full mx-auto px-4 mt-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
            <ShoppingBagIcon className="h-8 w-8" />
            My Escrow Orders
          </h1>
          <Link href="/create" className="btn btn-primary rounded-sm shadow-md">
            New Contract
          </Link>
        </div>

        {/* Tabs and Controls */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start mb-8">
          <div className="tabs tabs-boxed bg-base-100 max-w-[280px] rounded-sm p-1 border border-secondary/20">
            <button
              className={`tab font-bold rounded-sm px-4 ${activeTab === "active" ? "tab-active bg-primary text-primary-content" : ""}`}
              onClick={() => setActiveTab("active")}
            >
              Active
            </button>
            <button
              className={`tab font-bold rounded-sm px-4 ${activeTab === "completed" ? "tab-active bg-primary text-primary-content" : ""}`}
              onClick={() => setActiveTab("completed")}
            >
              Completed
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-3 w-full lg:w-auto">
            {/* Search */}
            <div className="relative w-full lg:w-auto min-w-[250px]">
              <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 opacity-50" />
              <input
                type="text"
                placeholder="Search Item or Contract..."
                className="input input-sm input-bordered w-full pl-9 rounded-sm border-secondary/20 focus:outline-primary"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2 w-full lg:w-auto">
              {/* Date Filters */}
              <div className="flex items-center gap-1 w-full sm:w-auto">
                <input
                  type="date"
                  className="input input-sm input-bordered rounded-sm border-secondary/20 focus:outline-primary font-bold text-xs"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  title="Start Date"
                />
                <span className="opacity-50 text-xs">-</span>
                <input
                  type="date"
                  className="input input-sm input-bordered rounded-sm border-secondary/20 focus:outline-primary font-bold text-xs"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  title="End Date"
                />
              </div>

              {/* Filters */}
              <select
                className="select select-sm select-bordered rounded-sm border-secondary/20 focus:outline-primary font-bold min-w-[130px]"
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="buyer">As Buyer</option>
                <option value="seller">As Seller</option>
              </select>

              <select
                className="select select-sm select-bordered rounded-sm border-secondary/20 focus:outline-primary font-bold min-w-[140px]"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="0">Created</option>
                <option value="1">Accepted</option>
                <option value="2">In Production</option>
                <option value="3">Production Completed</option>
                <option value="4">Shipped</option>
                <option value="5">Delivered</option>
                <option value="7">Disputed</option>
              </select>

              {/* Sort */}
              <select
                className="select select-sm select-bordered rounded-sm border-secondary/20 focus:outline-primary font-bold min-w-[150px]"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="amount-desc">Amount: High-Low</option>
                <option value="amount-asc">Amount: Low-High</option>
                <option value="status">Status Order</option>
              </select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <ArrowPathIcon className="h-12 w-12 animate-spin text-primary opacity-50" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="card bg-base-100 shadow-xl border border-secondary/20 p-20 text-center rounded-sm">
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
                  className="card bg-base-100 shadow-sm border border-secondary/20 hover:border-primary hover:shadow-md transition-all cursor-pointer group rounded-sm overflow-hidden"
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

                    <div className="mt-4 pt-4 border-t border-base-200 flex flex-col md:flex-row justify-between items-center gap-4">
                      <div className="flex gap-8">
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
