"use client";

import React from "react";
import { Order } from "./types";
import { ArrowPathIcon, DocumentMagnifyingGlassIcon, ListBulletIcon, PaperClipIcon } from "@heroicons/react/24/outline";

interface ProductionLogProps {
  order: Order;
  isSeller: boolean;
  localProductionLogs: string[];
  isUploadingProduction: boolean;
  productionCid: string;
  productionFileName: string;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onAddLocalLog: () => void;
  isActionLoading: boolean;
  onFinishProduction: () => void;
}

export function ProductionLog({
  order,
  isSeller,
  localProductionLogs,
  isUploadingProduction,
  productionCid,
  productionFileName,
  onFileUpload,
  onAddLocalLog,
  isActionLoading,
  onFinishProduction,
}: ProductionLogProps) {
  return (
    <div className="space-y-6">
      {isSeller && (
        <div className="bg-success/10 p-6 rounded-sm border border-success/20">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                <ArrowPathIcon className="h-5 w-5" /> Post Production Update
              </h3>
              <p className="text-sm opacity-70">
                Keep the buyer informed. These updates will be permanently recorded on-chain when you ship.
              </p>
            </div>
            <button
              className="btn btn-sm btn-outline btn-success rounded-sm"
              onClick={onFinishProduction}
              disabled={isActionLoading}
            >
              {isActionLoading && <span className="loading loading-spinner loading-xs"></span>}
              Mark Production as Finished
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <label
              className={`flex-1 flex items-center justify-center gap-2 border-2 border-dashed rounded-sm p-2 transition-colors cursor-pointer bg-base-100 ${
                productionCid ? "border-success" : "border-base-300"
              }`}
            >
              {isUploadingProduction ? (
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
              ) : (
                <PaperClipIcon className="h-4 w-4 opacity-50" />
              )}
              <span className="text-xs font-medium truncate max-w-[200px]">
                {isUploadingProduction
                  ? "Uploading..."
                  : productionCid
                    ? "Update Ready"
                    : productionFileName || "Evidence Photo/Report"}
              </span>
              <input type="file" className="hidden" onChange={onFileUpload} disabled={isUploadingProduction} />
            </label>
            <button
              className={`btn btn-success rounded-sm ${isActionLoading || !productionCid ? "btn-disabled" : ""}`}
              onClick={onAddLocalLog}
            >
              Add to Shipping Manifest
            </button>
          </div>
        </div>
      )}

      {/* Production Log Timeline - Shows on-chain logs + local pending logs for seller */}
      <div className="card bg-base-100 border border-base-300 rounded-sm">
        <div className="card-body p-6">
          <h4 className="text-xs font-black uppercase opacity-50 mb-4 flex items-center gap-2">
            <ListBulletIcon className="h-4 w-4" /> Production Audit Log (
            {order.productionLogs.length + (isSeller ? localProductionLogs.length : 0)})
          </h4>
          {order.productionLogs.length === 0 && localProductionLogs.length === 0 ? (
            <p className="text-center py-8 opacity-30 italic text-sm">No production updates yet.</p>
          ) : (
            <div className="space-y-4">
              {/* On-Chain Logs */}
              {order.productionLogs.map((log, index) => (
                <div
                  key={`onchain-${index}`}
                  className="flex items-center justify-between p-3 bg-base-200 rounded-sm group hover:bg-base-300 transition-colors border-l-4 border-success"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-success/10 text-success p-2 rounded-full font-bold text-[10px]">On-Chain</div>
                    <span className="text-xs font-bold">Verified Production Evidence</span>
                  </div>
                  <a
                    href={`https://gateway.pinata.cloud/ipfs/${log}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-ghost btn-xs gap-1 group-hover:text-primary"
                  >
                    <DocumentMagnifyingGlassIcon className="h-4 w-4" /> View
                  </a>
                </div>
              ))}
              {/* Seller's Local Pending Logs */}
              {isSeller &&
                localProductionLogs.map((log, index) => (
                  <div
                    key={`local-${index}`}
                    className="flex items-center justify-between p-3 bg-base-200 rounded-sm group border-l-4 border-warning italic opacity-80"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-warning/10 text-warning p-2 rounded-full font-bold text-[10px]">Pending</div>
                      <span className="text-xs font-bold">WIP Update (Will sync on ship)</span>
                    </div>
                    <a
                      href={`https://gateway.pinata.cloud/ipfs/${log}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-ghost btn-xs gap-1"
                    >
                      <DocumentMagnifyingGlassIcon className="h-4 w-4" /> Preview
                    </a>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
