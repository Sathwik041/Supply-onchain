"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ProductionLog } from "./ProductionLog";
import { ShippingInfo } from "./ShippingInfo";
import { Order } from "./types";
import { Address } from "@scaffold-ui/components";
import {
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentCheckIcon,
  DocumentMagnifyingGlassIcon,
  ExclamationTriangleIcon,
  IdentificationIcon,
  ShieldCheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface OrderActionPanelProps {
  order: Order;
  isBuyer: boolean;
  isSeller: boolean;
  isExpired: boolean;
  expiryTime: Date;
  isActionLoading: boolean;
  handleAction: (functionName: string, args?: any[], value?: bigint) => Promise<void>;
  milestone1: string;
  milestone2: string;
  milestone3: string;
  parseEther: (val: string) => bigint;
  // Production Log Props
  localProductionLogs: string[];
  isUploadingProduction: boolean;
  productionCid: string;
  productionFileName: string;
  onProductionFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onAddLocalLog: () => void;
  onFinishProduction: () => void;
  // Shipping Props
  shippingCid: string;
  isUploadingShipping: boolean;
  shippingFileName: string;
  onShippingFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onMarkShipped: () => void;
  getTrackingUrl: (provider: string, tracking: string) => string | null;
}

export function OrderActionPanel({
  order,
  isBuyer,
  isSeller,
  isExpired,
  expiryTime,
  isActionLoading,
  handleAction,
  milestone1,
  milestone2,
  milestone3,
  parseEther,
  localProductionLogs,
  isUploadingProduction,
  productionCid,
  productionFileName,
  onProductionFileUpload,
  onAddLocalLog,
  onFinishProduction,
  shippingCid,
  isUploadingShipping,
  shippingFileName,
  onShippingFileUpload,
  onMarkShipped,
  getTrackingUrl,
}: OrderActionPanelProps) {
  const router = useRouter();

  return (
    <>
      {/* STATUS 0: CREATED */}
      {order.status === 0 && (
        <div
          className={`${
            isExpired ? "bg-error/10 border-error/20" : "bg-warning/10 border-warning/20"
          } p-6 rounded-sm border`}
        >
          <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
            {isExpired ? <XMarkIcon className="h-5 w-5 text-error" /> : <ClockIcon className="h-5 w-5" />}
            {isExpired ? "Offer Expired" : "Waiting for Seller"}
          </h3>
          <p className="text-sm mb-4">
            {isExpired
              ? "This contract offer was not accepted within the 24-hour window and is now void."
              : `The seller has until ${expiryTime.toLocaleString()} to review and accept these terms.`}
          </p>
          <div className="flex flex-col gap-3">
            {isSeller && !isExpired && (
              <>
                <button
                  className="btn btn-warning rounded-sm shadow-md px-10"
                  onClick={() => handleAction("acceptContract")}
                  disabled={isActionLoading}
                >
                  {isActionLoading && <span className="loading loading-spinner loading-sm"></span>}
                  {isActionLoading ? "Accepting..." : "Accept Terms & Contract"}
                </button>
                <p className="text-[10px] opacity-50 italic mt-1">
                  Note: This offer is time-sensitive and will automatically expire on {expiryTime.toLocaleString()} if
                  not accepted.
                </p>
              </>
            )}
            {isBuyer && (
              <button
                className="btn btn-error btn-outline rounded-sm"
                onClick={() => handleAction("cancelContract")}
                disabled={isActionLoading}
              >
                {isActionLoading && <span className="loading loading-spinner loading-sm"></span>}
                {isExpired ? "Clear from Dashboard" : "Withdraw Order"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* STATUS 1: ACCEPTED */}
      {order.status === 1 && (
        <>
          {isBuyer ? (
            <div className="bg-primary/10 p-6 rounded-sm border border-primary/20">
              <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                <CurrencyDollarIcon className="h-5 w-5" /> Secure Escrow Funding
              </h3>
              <p className="text-sm mb-4">
                Terms accepted. Please fund the contract to initiate production and secure the trade.
              </p>

              <div className="bg-primary/20 p-4 rounded-sm border border-primary/30 mb-6">
                <p className="text-sm font-bold text-primary mb-0 flex items-center gap-2">
                  <ShieldCheckIcon className="h-5 w-5" />
                  Depositing Total {order.amount} MON and Auto Release {milestone1} MON ({order.milestone1Pct || 30}%)
                  for seller to start production.
                </p>
              </div>

              <button
                className="btn btn-primary rounded-sm shadow-lg px-8"
                onClick={() => handleAction("depositAndStartProduction", [], parseEther(order.amount))}
                disabled={isActionLoading}
              >
                {isActionLoading && <span className="loading loading-spinner loading-sm"></span>}
                {isActionLoading ? "Depositing..." : "Deposit and Auto Release"}
              </button>
            </div>
          ) : isSeller ? (
            <div className="bg-base-200 p-6 rounded-sm border border-base-300">
              <h3 className="font-bold text-lg mb-2 flex items-center gap-2 text-base-content/70">
                <ClockIcon className="h-5 w-5" /> Awaiting Initial Deposit
              </h3>
              <p className="text-sm mb-1">Contract terms accepted. Waiting for the buyer to fund the escrow.</p>
              <p className="text-xs opacity-50 italic">
                Production should commence immediately after the initial {order.milestone1Pct || 30}% ({milestone1} MON)
                is released.
              </p>
            </div>
          ) : null}
        </>
      )}

      {/* STATUS 2: IN PRODUCTION */}
      {order.status === 2 && (
        <div className="space-y-6">
          {isBuyer && (
            <div className="bg-primary/10 p-6 rounded-sm border border-primary/20">
              <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                <ClockIcon className="h-5 w-5" /> Production in Progress
              </h3>
              <p className="text-sm">
                The seller is currently manufacturing your item. Once the item ships, the full production audit trail
                will be available here.
              </p>
            </div>
          )}
          <ProductionLog
            order={order}
            isSeller={isSeller}
            localProductionLogs={localProductionLogs}
            isUploadingProduction={isUploadingProduction}
            productionCid={productionCid}
            productionFileName={productionFileName}
            onFileUpload={onProductionFileUpload}
            onAddLocalLog={onAddLocalLog}
            isActionLoading={isActionLoading}
            onFinishProduction={onFinishProduction}
          />
        </div>
      )}

      {/* STATUS 3: PRODUCTION COMPLETED */}
      {order.status === 3 && (
        <div className="space-y-6">
          {isBuyer && (
            <div className="bg-success/10 p-6 rounded-sm border border-success/20">
              <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                <CheckCircleIcon className="h-5 w-5" /> Production Completed
              </h3>
              <p className="text-sm">
                Manufacturing is finished. The seller is currently preparing your order for shipment. You will be
                notified as soon as a tracking number is provided.
              </p>
            </div>
          )}
          <ShippingInfo
            order={order}
            isSeller={isSeller}
            localProductionLogsLength={localProductionLogs.length}
            isActionLoading={isActionLoading}
            shippingCid={shippingCid}
            isUploadingShipping={isUploadingShipping}
            shippingFileName={shippingFileName}
            onShippingFileUpload={onShippingFileUpload}
            onMarkShipped={onMarkShipped}
            getTrackingUrl={getTrackingUrl}
          />
        </div>
      )}

      {/* STATUS 4: SHIPPED */}
      {order.status === 4 && (
        <div className="space-y-6">
          <ShippingInfo
            order={order}
            isSeller={isSeller}
            localProductionLogsLength={localProductionLogs.length}
            isActionLoading={isActionLoading}
            shippingCid={shippingCid}
            isUploadingShipping={isUploadingShipping}
            shippingFileName={shippingFileName}
            onShippingFileUpload={onShippingFileUpload}
            onMarkShipped={onMarkShipped}
            getTrackingUrl={getTrackingUrl}
          />

          {isBuyer && (
            <div className="relative group overflow-hidden bg-base-100 rounded-sm border border-base-content/10 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-1000">
              {/* Decorative Background Blob */}
              <div className="absolute -top-24 -right-24 h-64 w-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-1000" />

              <div className="relative p-8 sm:p-12 text-center z-10">
                <div className="inline-flex relative mb-8">
                  <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-20" />
                  <div className="relative p-4 bg-primary/10 rounded-full">
                    <CheckCircleIcon className="h-10 w-10 text-primary" />
                  </div>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black mb-4 tracking-tight">Confirm Secure Delivery</h3>
                <p className="text-sm sm:text-base opacity-70 mb-10 max-w-sm mx-auto leading-relaxed">
                  Physically inspected the shipment? Confirming will release the next milestone payment to the seller.
                </p>

                {/* Release Preview Card */}
                <div className="flex flex-col items-center justify-center p-6 bg-base-200/50 backdrop-blur-md rounded-sm border border-base-content/5 mb-10 w-full max-w-sm mx-auto group/stats hover:border-primary/30 transition-all duration-500">
                  <span className="text-[10px] uppercase font-black tracking-[0.2em] opacity-40 mb-2">
                    Milestone 2 Release
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-primary">{milestone2}</span>
                    <span className="text-sm font-bold opacity-40">MON</span>
                  </div>
                  <div className="mt-2 px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase rounded-full">
                    {order.milestone2Pct || 50}% of Total
                  </div>
                </div>

                <button
                  className="btn btn-primary btn-lg px-12 h-16 rounded-sm shadow-[0_0_40px_-10px_rgba(var(--p),0.4)] hover:shadow-[0_0_60px_-10px_rgba(var(--p),0.6)] transition-all duration-500 group/btn"
                  onClick={() => handleAction("confirmDelivery")}
                  disabled={isActionLoading}
                >
                  {isActionLoading ? (
                    <span className="loading loading-spinner loading-md"></span>
                  ) : (
                    <>
                      <ShieldCheckIcon className="h-6 w-6 mr-2 group-hover/btn:scale-110 transition-transform" />
                      Complete Delivery Receipt
                    </>
                  )}
                </button>

                <p className="mt-6 text-[11px] font-medium opacity-40 uppercase tracking-widest leading-none">
                  SECURED BY SMART CONTRACT ESCROW
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STATUS 5: DELIVERED */}
      {order.status === 5 && (
        <div className="space-y-6">
          <ShippingInfo
            order={order}
            isSeller={isSeller}
            localProductionLogsLength={localProductionLogs.length}
            isActionLoading={isActionLoading}
            shippingCid={shippingCid}
            isUploadingShipping={isUploadingShipping}
            shippingFileName={shippingFileName}
            onShippingFileUpload={onShippingFileUpload}
            onMarkShipped={onMarkShipped}
            getTrackingUrl={getTrackingUrl}
          />

          <div className="bg-success/10 p-6 rounded-sm border border-success/20 text-center">
            <h3 className="font-bold text-xl mb-2">Final Inspection Phase</h3>
            {isBuyer ? (
              <>
                <p className="text-sm opacity-80 mb-6 max-w-sm mx-auto">
                  You have 14 days to complete final installation and quality checks. Once everything is verified,
                  complete the contract to release the final{" "}
                  {100 - (order.milestone1Pct || 30) - (order.milestone2Pct || 50)}% ({milestone3} MON) and receive your
                  Machine Passport.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <button
                    className="btn btn-error btn-outline rounded-sm"
                    onClick={() => document.getElementById("dispute-btn")?.click()}
                  >
                    Report Issue/Defect
                  </button>
                  <button
                    className="btn btn-success rounded-sm shadow-xl"
                    onClick={() => handleAction("buyerCompletecontract")}
                    disabled={isActionLoading}
                  >
                    {isActionLoading && <span className="loading loading-spinner loading-sm"></span>}
                    {isActionLoading ? "Completing..." : "All Clear! Complete Contract"}
                  </button>
                </div>
              </>
            ) : isSeller ? (
              <>
                <p className="text-sm opacity-80 mb-6 max-w-sm mx-auto">
                  The buyer is evaluating the machine. If they do not approve or raise a dispute within 14 days, you can
                  automatically claim the final payment.
                </p>
                <button
                  className="btn btn-success rounded-sm shadow-xl"
                  onClick={() => handleAction("sellerClaimFinalPayment")}
                  disabled={isActionLoading}
                >
                  {isActionLoading && <span className="loading loading-spinner loading-sm"></span>}
                  {isActionLoading ? "Claiming..." : `Claim Final ${milestone3} MON`}
                </button>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* STATUS 6: COMPLETED */}
      {order.status === 6 && (
        <div className="bg-success/10 p-8 rounded-sm border border-success/20">
          <div className="flex flex-col items-center text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <ShieldCheckIcon className="h-20 w-20 text-success opacity-20" />
                <div className="absolute bottom-0 right-0 bg-base-100 rounded-full p-1 border border-success/20">
                  <CheckCircleIcon className="h-8 w-8 text-success" />
                </div>
              </div>
            </div>
            <h3 className="text-3xl font-black mb-2">100% Payment Released</h3>
            <p className="text-sm opacity-70 mb-6 mx-auto max-w-md">
              This escrow has been successfully finalized. All funds have been transferred to the seller, and the
              machine&apos;s provenance has been secured.
            </p>

            {/* Payment Summary */}
            <div className="grid grid-cols-3 gap-2 w-full max-w-lg mb-8">
              <div className="bg-base-100 p-3 rounded-sm border border-success/20">
                <p className="text-[10px] uppercase opacity-50 font-bold">Production</p>
                <p className="font-bold text-xs">{order.milestone1Pct || 30}% ✅</p>
              </div>
              <div className="bg-base-100 p-3 rounded-sm border border-success/20">
                <p className="text-[10px] uppercase opacity-50 font-bold">Delivery</p>
                <p className="font-bold text-xs">{order.milestone2Pct || 50}% ✅</p>
              </div>
              <div className="bg-base-100 p-3 rounded-sm border border-success/20">
                <p className="text-[10px] uppercase opacity-50 font-bold">Final</p>
                <p className="font-bold text-xs">
                  {100 - (order.milestone1Pct || 30) - (order.milestone2Pct || 50)}% ✅
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row w-full max-w-lg gap-4">
              <button
                onClick={() => router.push("/machine-passports")}
                className="btn btn-secondary btn-wide rounded-sm shadow-md gap-2"
              >
                <IdentificationIcon className="h-5 w-5" />
                View Machine Passport
              </button>
              <a
                href={`https://gateway.pinata.cloud/ipfs/${order.metadata?.properties?.po_cid || order.poCid}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline btn-wide rounded-sm gap-2"
              >
                <DocumentCheckIcon className="h-5 w-5" />
                Audit Specs (PO)
              </a>
            </div>
          </div>
        </div>
      )}

      {/* STATUS 7: DISPUTED */}
      {order.status === 7 && (
        <div className="bg-error/10 p-8 rounded-sm border border-error/20 text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-error mx-auto mb-4" />
          <h3 className="text-2xl font-black text-error mb-2">Order Under Dispute</h3>
          <p className="text-sm opacity-70 mb-6 max-w-md mx-auto">
            All logistics and payments for this contract have been frozen. The Arbitrator is currently reviewing the
            evidence and statement provided.
          </p>
          {order.disputeReason && (
            <div className="bg-base-100 p-4 rounded-sm border border-error/20 text-left mb-6 max-w-xl mx-auto shadow-sm">
              <p className="text-[10px] uppercase font-black opacity-40 mb-2 flex items-center gap-2">
                <DocumentCheckIcon className="h-3 w-3" /> Filed Statement
              </p>
              <a
                href={`https://gateway.pinata.cloud/ipfs/${order.disputeReason}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-error btn-outline btn-sm rounded-sm w-full gap-2"
              >
                <DocumentMagnifyingGlassIcon className="h-4 w-4" /> View Verified Claim (IPFS)
              </a>
            </div>
          )}
          <div className="p-4 bg-base-200/50 rounded-sm inline-block">
            <p className="text-xs font-bold flex items-center gap-2">
              <ShieldCheckIcon className="h-4 w-4 text-primary" />
              Resolution Authority: <Address address={order.arbitrator} size="xs" />
            </p>
          </div>
        </div>
      )}
    </>
  );
}
