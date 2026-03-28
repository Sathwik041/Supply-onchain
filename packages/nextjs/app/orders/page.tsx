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
        // Status 6 (Completed) and 8 (Refunded/Cancelled) go to Completed tab
        const isCompleted = order.status === 6 || order.status === 8;
        return activeTab === "completed" ? isCompleted : !isCompleted;
      })
      .sort((a, b) => Number(b.createdAt) - Number(a.createdAt));
  }, [orders, activeTab]);

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

        {/* Tabs */}
        <div className="tabs tabs-boxed bg-base-100 mb-8 max-w-sm rounded-sm p-1 border border-secondary/20">
          <button
            className={`tab flex-1 font-bold rounded-sm ${activeTab === "active" ? "tab-active bg-primary text-primary-content" : ""}`}
            onClick={() => setActiveTab("active")}
          >
            Active Orders
          </button>
          <button
            className={`tab flex-1 font-bold rounded-sm ${activeTab === "completed" ? "tab-active bg-primary text-primary-content" : ""}`}
            onClick={() => setActiveTab("completed")}
          >
            Completed
          </button>
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
