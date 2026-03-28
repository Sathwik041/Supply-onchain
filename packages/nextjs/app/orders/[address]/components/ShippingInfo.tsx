"use client";

import React from "react";
import { Order } from "./types";
import { ArrowPathIcon, DocumentCheckIcon, PaperClipIcon, TruckIcon } from "@heroicons/react/24/outline";

interface ShippingInfoProps {
  order: Order;
  isSeller: boolean;
  localProductionLogsLength: number;
  isActionLoading: boolean;
  shippingCid: string;
  isUploadingShipping: boolean;
  shippingFileName: string;
  onShippingFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onMarkShipped: () => void;
  getTrackingUrl: (provider: string, tracking: string) => string | null;
}

export function ShippingInfo({
  order,
  isSeller,
  localProductionLogsLength,
  isActionLoading,
  shippingCid,
  isUploadingShipping,
  shippingFileName,
  onShippingFileUpload,
  onMarkShipped,
  getTrackingUrl,
}: ShippingInfoProps) {
  return (
    <div className="space-y-6">
      {isSeller && !order.shipped && (
        <div className="bg-success/10 p-6 rounded-sm border border-success/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                <TruckIcon className="h-5 w-5" /> Ready for Shipment
              </h3>
              <p className="text-sm opacity-70">
                Production complete. Provide tracking details. All {localProductionLogsLength} pending updates will be
                committed to the blockchain now.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="form-control">
              <label className="label text-[10px] font-bold uppercase opacity-60">Carrier</label>
              <select id="provider" className="select select-bordered select-sm rounded-sm">
                <option value="FedEx">FedEx</option>
                <option value="UPS">UPS</option>
                <option value="DHL">DHL</option>
                <option value="Maersk">Maersk</option>
                <option value="Other">Other Global Carrier</option>
              </select>
            </div>
            <div className="form-control">
              <label className="label text-[10px] font-bold uppercase opacity-60">Tracking Number</label>
              <input id="tracking" placeholder="TRK123456789" className="input input-bordered input-sm rounded-sm" />
            </div>
          </div>

          <div className="form-control mb-6">
            <label className="label text-[10px] font-bold uppercase opacity-60">
              Final Shipping Proof (Bill of Lading)
            </label>
            <label
              className={`flex items-center justify-center gap-2 border-2 border-dashed rounded-sm p-4 transition-colors cursor-pointer bg-base-100 ${
                shippingCid ? "border-success" : "border-base-300"
              }`}
            >
              {isUploadingShipping ? (
                <ArrowPathIcon className="h-5 w-5 animate-spin" />
              ) : (
                <PaperClipIcon className="h-5 w-5 opacity-50" />
              )}
              <span className="text-sm font-medium">
                {isUploadingShipping
                  ? "Uploading to IPFS..."
                  : shippingCid
                    ? "Bill of Lading Secured!"
                    : shippingFileName || "Upload Bill of Lading (PDF/Image)"}
              </span>
              <input type="file" className="hidden" onChange={onShippingFileUpload} disabled={isUploadingShipping} />
            </label>
          </div>

          <button
            className={`btn btn-success w-full rounded-sm ${isActionLoading || !shippingCid ? "btn-disabled" : ""}`}
            onClick={onMarkShipped}
          >
            {isActionLoading ? "Publishing to Blockchain..." : "Confirm Shipment & Publish Logs"}
          </button>
        </div>
      )}

      {order.shipped && (
        <div className="bg-base-200 p-6 rounded-sm border border-base-300">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <TruckIcon className="h-5 w-5" /> Logistics Details
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-base-100 p-3 rounded-sm border border-base-200">
              <p className="text-[10px] uppercase font-bold opacity-50 mb-1">Carrier</p>
              <p className="font-bold text-sm">{order.shippingProvider}</p>
            </div>
            <div className="bg-base-100 p-3 rounded-sm border border-base-200 col-span-2">
              <p className="text-[10px] uppercase font-bold opacity-50 mb-1">Tracking Number</p>
              {getTrackingUrl(order.shippingProvider, order.trackingNumber) ? (
                <a
                  href={getTrackingUrl(order.shippingProvider, order.trackingNumber) as string}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-sm text-primary hover:underline"
                >
                  {order.trackingNumber} ↗
                </a>
              ) : (
                <p className="font-bold text-sm">{order.trackingNumber}</p>
              )}
            </div>
            <div className="bg-base-100 p-3 rounded-sm border border-base-200">
              <p className="text-[10px] uppercase font-bold opacity-50 mb-1">Documents</p>
              <a
                href={`https://gateway.pinata.cloud/ipfs/${order.shippingCid}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-xs btn-outline rounded-sm w-full gap-1"
              >
                <DocumentCheckIcon className="h-3 w-3" /> View Waybill
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
