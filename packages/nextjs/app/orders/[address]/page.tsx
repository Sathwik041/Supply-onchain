"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DisputeModal } from "./components/DisputeModal";
import { OrderActionPanel } from "./components/OrderActionPanel";
import { OrderHeader } from "./components/OrderHeader";
import { ParticipantInfo } from "./components/ParticipantInfo";
import { PaymentBreakdown } from "./components/PaymentBreakdown";
import { Order } from "./components/types";
import type { NextPage } from "next";
import { toast } from "react-hot-toast";
import { formatEther, parseEther } from "viem";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import LogisticsTimeline, { EscrowStatus } from "~~/components/LogisticsTimeline";
import deployedContracts from "~~/contracts/deployedContracts";
import { useTransactor } from "~~/hooks/scaffold-eth";

const OrderManagement: NextPage = () => {
  const params = useParams();
  const contractAddress = params.address as string;
  const { address: connectedAddress } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const writeTx = useTransactor();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  // Dispute States
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [disputeReasonText, setDisputeReasonText] = useState("");
  const [isDisputing, setIsDisputing] = useState(false);

  const [shippingCid, setShippingCid] = useState<string>("");
  const [isUploadingShipping, setIsUploadingShipping] = useState<boolean>(false);
  const [shippingFileName, setShippingFileName] = useState<string>("");

  const [productionCid, setProductionCid] = useState<string>("");
  const [isUploadingProduction, setIsUploadingProduction] = useState<boolean>(false);
  const [productionFileName, setProductionFileName] = useState<string>("");

  const [localProductionLogs, setLocalProductionLogs] = useState<string[]>([]);

  const fetchOrderDetails = useCallback(async () => {
    if (!publicClient || !contractAddress) return;

    const chainId = publicClient.chain.id;
    const escrowAbi = (deployedContracts as any)[chainId].SupplyChainEscrow.abi;

    setLoading(true);
    try {
      const addr = contractAddress as `0x${string}`;
      const contract = { address: addr, abi: escrowAbi } as const;

      const results = await publicClient.multicall({
        contracts: [
          { ...contract, functionName: "buyer", args: [] },
          { ...contract, functionName: "seller", args: [] },
          { ...contract, functionName: "arbitrator", args: [] },
          { ...contract, functionName: "itemName", args: [] },
          { ...contract, functionName: "totalAmount", args: [] },
          { ...contract, functionName: "status", args: [] },
          { ...contract, functionName: "poCid", args: [] },
          { ...contract, functionName: "sellerAccepted", args: [] },
          { ...contract, functionName: "shipped", args: [] },
          { ...contract, functionName: "shippingProvider", args: [] },
          { ...contract, functionName: "trackingNumber", args: [] },
          { ...contract, functionName: "delivered", args: [] },
          { ...contract, functionName: "deliveredAt", args: [] },
          { ...contract, functionName: "completed", args: [] },
          { ...contract, functionName: "disputed", args: [] },
          { ...contract, functionName: "shippingCid", args: [] },
          { ...contract, functionName: "getProductionLogs", args: [] },
          { ...contract, functionName: "createdAt", args: [] },
          { ...contract, functionName: "disputeReason", args: [] },
          { ...contract, functionName: "deposited", args: [] },
          { ...contract, functionName: "milestone1Pct", args: [] },
          { ...contract, functionName: "milestone2Pct", args: [] },
        ],
      });

      const [
        buyer,
        seller,
        arbitrator,
        itemName,
        totalAmount,
        status,
        poCid,
        sellerAccepted,
        shipped,
        shippingProvider,
        trackingNumber,
        delivered,
        deliveredAt,
        completed,
        disputed,
        shippingCidFromContract,
        productionLogsFromContract,
        createdAtFromContract,
        disputeReasonFromContract,
        depositedFromContract,
        milestone1PctFromContract,
        milestone2PctFromContract,
      ] = results.map(r => r.result);

      let metadata = null;
      try {
        const metaRes = await fetch(`https://gateway.pinata.cloud/ipfs/${poCid}`);
        const text = await metaRes.text();
        try {
          metadata = JSON.parse(text);
        } catch {
          // Not JSON, ignore
        }
      } catch (e) {
        console.warn("Could not fetch metadata", e);
      }

      setOrder({
        address: contractAddress,
        buyer: buyer as string,
        seller: seller as string,
        arbitrator: arbitrator as string,
        item: itemName as string,
        amount: formatEther(totalAmount as bigint),
        status: Number(status),
        poCid: poCid as string,
        sellerAccepted: sellerAccepted as boolean,
        shipped: shipped as boolean,
        shippingProvider: shippingProvider as string,
        trackingNumber: trackingNumber as string,
        delivered: delivered as boolean,
        deliveredAt: deliveredAt as bigint,
        completed: completed as boolean,
        disputed: disputed as boolean,
        shippingCid: shippingCidFromContract as string,
        productionLogs: productionLogsFromContract as string[],
        createdAt: createdAtFromContract as bigint,
        disputeReason: disputeReasonFromContract as string,
        deposited: depositedFromContract as boolean,
        milestone1Pct: milestone1PctFromContract ? Number(milestone1PctFromContract) : undefined,
        milestone2Pct: milestone2PctFromContract ? Number(milestone2PctFromContract) : undefined,
        metadata: metadata,
      });
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast.error("Failed to fetch order from blockchain.");
    } finally {
      setLoading(false);
    }
  }, [contractAddress, publicClient]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  const handleShippingFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setShippingFileName(file.name);
    setIsUploadingShipping(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const metadata = JSON.stringify({
        name: `ShippingDocs_${file.name}_${Date.now()}`,
      });
      formData.append("pinataMetadata", metadata);

      const res = await fetch("/api/pinata/file", {
        method: "POST",
        body: formData,
      });

      const resData = await res.json();
      if (resData.IpfsHash) {
        setShippingCid(resData.IpfsHash);
        toast.success("Shipping proof uploaded to IPFS successfully!");
      } else {
        throw new Error(resData.error || "Upload failed");
      }
    } catch (error) {
      console.error("Error uploading shipping docs:", error);
      toast.error("Failed to upload shipping proof to IPFS.");
    } finally {
      setIsUploadingShipping(false);
    }
  };

  const handleProductionFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setProductionFileName(file.name);
    setIsUploadingProduction(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const metadata = JSON.stringify({
        name: `ProductionWIP_${file.name}_${Date.now()}`,
      });
      formData.append("pinataMetadata", metadata);

      const res = await fetch("/api/pinata/file", {
        method: "POST",
        body: formData,
      });

      const resData = await res.json();
      if (resData.IpfsHash) {
        setProductionCid(resData.IpfsHash);
        toast.success("Production update uploaded to IPFS!");
      } else {
        throw new Error(resData.error || "Upload failed");
      }
    } catch (error) {
      console.error("Error uploading production WIP:", error);
      toast.error("Failed to upload production update.");
    } finally {
      setIsUploadingProduction(false);
    }
  };

  const handleAction = async (functionName: string, args: any[] = [], value?: bigint) => {
    setIsActionLoading(true);
    try {
      if (!publicClient) throw new Error("Public client not found");
      const chainId = publicClient.chain.id;
      const escrowAbi = (deployedContracts as any)[chainId].SupplyChainEscrow.abi;

      await writeTx(() =>
        writeContractAsync({
          address: contractAddress as `0x${string}`,
          abi: escrowAbi,
          functionName: functionName as any,
          args: args as any,
          value: value,
        }),
      );
      toast.success(`Action ${functionName} successful!`);
      // Re-fetch to update UI
      fetchOrderDetails();
      // Clear local states if necessary
      if (functionName === "markShipped") {
        setLocalProductionLogs([]);
        setShippingCid("");
        setShippingFileName("");
      }
    } catch (e) {
      console.error(`Error in ${functionName}:`, e);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRaiseDispute = async () => {
    if (!disputeReasonText.trim()) return toast.error("Please provide a reason for the dispute.");
    setIsDisputing(true);

    try {
      const metadataRes = await fetch("/api/pinata/json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pinataContent: { reason: disputeReasonText },
          pinataMetadata: { name: `Dispute_${contractAddress}_${Date.now()}` },
        }),
      });

      const resData = await metadataRes.json();
      if (!resData.IpfsHash) throw new Error("Failed to pin dispute reason to IPFS");

      await handleAction("raiseDispute", [resData.IpfsHash]);

      setIsDisputeModalOpen(false);
      setDisputeReasonText("");
    } catch (error) {
      console.error("Dispute error:", error);
      toast.error("Failed to raise dispute.");
    } finally {
      setIsDisputing(false);
    }
  };

  if (loading || !order) {
    return (
      <div className="flex flex-col items-center justify-center grow bg-base-200">
        <div className="loading loading-spinner loading-lg text-primary"></div>
        <p className="mt-4 text-lg font-medium">Fetching Contract State...</p>
      </div>
    );
  }

  const isBuyer = connectedAddress?.toLowerCase() === order.buyer.toLowerCase();
  const isSeller = connectedAddress?.toLowerCase() === order.seller.toLowerCase();

  const isExpired = order.status === 0 && Date.now() / 1000 > Number(order.createdAt) + 86400;
  const expiryTime = new Date((Number(order.createdAt) + 86400) * 1000);

  // CREATED=0, ACCEPTED=1, IN_PRODUCTION=2, PRODUCTION_COMPLETED=3, SHIPPED=4, DELIVERED=5, COMPLETED=6, DISPUTED=7, REFUNDED=8
  const timelineStatus = isExpired
    ? EscrowStatus.CANCELLED
    : order.status === 0
      ? EscrowStatus.CREATED
      : order.status === 1
        ? EscrowStatus.ACCEPTED
        : order.status === 2
          ? EscrowStatus.PRODUCTION
          : order.status === 3
            ? EscrowStatus.PRODUCTION_COMPLETED
            : order.status === 4
              ? EscrowStatus.SHIPPED
              : order.status === 5
                ? EscrowStatus.DELIVERED
                : order.status === 6
                  ? EscrowStatus.COMPLETED
                  : order.status === 7
                    ? EscrowStatus.DISPUTED
                    : order.status === 8
                      ? EscrowStatus.CANCELLED
                      : EscrowStatus.CREATED;

  const m1Pct = order.milestone1Pct || 30;
  const m2Pct = order.milestone2Pct || 50;
  const m3Pct = 100 - m1Pct - m2Pct;
  const milestone1 = ((parseFloat(order.amount) * m1Pct) / 100).toFixed(4);
  const milestone2 = ((parseFloat(order.amount) * m2Pct) / 100).toFixed(4);
  const milestone3 = ((parseFloat(order.amount) * m3Pct) / 100).toFixed(4);

  const getTrackingUrl = (provider: string, tracking: string) => {
    const p = provider.toLowerCase();
    if (p.includes("fedex")) return `https://www.fedex.com/fedextrack/?trknbr=${tracking}`;
    if (p.includes("ups")) return `https://www.ups.com/track?tracknum=${tracking}`;
    if (p.includes("dhl")) return `https://www.dhl.com/en/express/tracking.html?AWB=${tracking}&brand=DHL`;
    return null;
  };

  const handleMarkShipped = () => {
    const providerEle = document.getElementById("provider") as HTMLSelectElement;
    const trackingEle = document.getElementById("tracking") as HTMLInputElement;
    if (!providerEle || !trackingEle?.value) return toast.error("Provide Carrier and Tracking Number.");

    handleAction("markShipped", [providerEle.value, trackingEle.value, shippingCid, localProductionLogs]);
  };

  return (
    <div className="flex flex-col grow bg-base-200 pb-10">
      <div className="max-w-7xl w-full mx-auto px-4 mt-2">
        <div className="mb-2">
          <LogisticsTimeline currentStatus={timelineStatus} isPaused={order.disputed} m1Pct={m1Pct} m2Pct={m2Pct} />
        </div>

        <div className="card bg-base-100 shadow-xl border border-secondary/20 rounded-sm overflow-hidden">
          <div className="card-body p-0">
            <OrderHeader
              order={order}
              contractAddress={contractAddress}
              isExpired={isExpired}
              isBuyer={isBuyer}
              isSeller={isSeller}
              onOpenDispute={() => setIsDisputeModalOpen(true)}
            />

            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="col-span-2 space-y-8">
                <OrderActionPanel
                  order={order}
                  isBuyer={isBuyer}
                  isSeller={isSeller}
                  isExpired={isExpired}
                  expiryTime={expiryTime}
                  isActionLoading={isActionLoading}
                  handleAction={handleAction}
                  milestone1={milestone1}
                  milestone2={milestone2}
                  milestone3={milestone3}
                  parseEther={parseEther}
                  localProductionLogs={localProductionLogs}
                  isUploadingProduction={isUploadingProduction}
                  productionCid={productionCid}
                  productionFileName={productionFileName}
                  onProductionFileUpload={handleProductionFileUpload}
                  onAddLocalLog={() => {
                    setLocalProductionLogs([...localProductionLogs, productionCid]);
                    toast.success("Progress update added to local manifest!");
                    setProductionCid("");
                    setProductionFileName("");
                  }}
                  onFinishProduction={() => handleAction("finishProduction")}
                  shippingCid={shippingCid}
                  isUploadingShipping={isUploadingShipping}
                  shippingFileName={shippingFileName}
                  onShippingFileUpload={handleShippingFileUpload}
                  onMarkShipped={handleMarkShipped}
                  getTrackingUrl={getTrackingUrl}
                />

                {/* DETAILS STATS (Bottom of left col) */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="stat bg-base-100 border border-base-300 rounded-sm p-4">
                    <div className="stat-title text-[10px] uppercase font-bold opacity-50">Total Value</div>
                    <div className="stat-value text-2xl font-black text-primary">{order.amount} MON</div>
                  </div>
                  <div className="stat bg-base-100 border border-base-300 rounded-sm p-4">
                    <div className="stat-title text-[10px] uppercase font-bold opacity-50">Remaining</div>
                    <div className="stat-value text-2xl font-black text-success">
                      {order.status >= 6
                        ? "0.00"
                        : order.status >= 5
                          ? milestone3
                          : order.status >= 2
                            ? ((parseFloat(order.amount) * (100 - m1Pct)) / 100).toFixed(4)
                            : order.amount}{" "}
                      MON
                    </div>
                  </div>
                </div>

                <ParticipantInfo buyer={order.buyer} seller={order.seller} arbitrator={order.arbitrator} />
              </div>

              {/* RIGHT SIDEBAR */}
              <div className="col-span-1">
                <div className="sticky top-8 space-y-4">
                  <PaymentBreakdown
                    order={order}
                    milestone1={milestone1}
                    milestone2={milestone2}
                    milestone3={milestone3}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DisputeModal
        isOpen={isDisputeModalOpen}
        onClose={() => setIsDisputeModalOpen(false)}
        disputeReasonText={disputeReasonText}
        setDisputeReasonText={setDisputeReasonText}
        onSubmit={handleRaiseDispute}
        isDisputing={isDisputing}
      />
    </div>
  );
};

export default OrderManagement;
