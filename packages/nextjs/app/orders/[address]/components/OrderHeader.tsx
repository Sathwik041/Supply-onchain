"use client";

import React from "react";
import { Order } from "./types";
import { Address } from "@scaffold-ui/components";
import { CheckCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

interface OrderHeaderProps {
  order: Order;
  contractAddress: string;
  isExpired: boolean;
  isBuyer: boolean;
  isSeller: boolean;
  onOpenDispute: () => void;
}

export function OrderHeader({ order, contractAddress, isExpired, isBuyer, isSeller, onOpenDispute }: OrderHeaderProps) {
  return (
    <div className="bg-primary/5 p-8 border-b border-primary/10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary mb-2">
            <CheckCircleIcon className="h-6 w-6" />
            <span className="font-bold uppercase tracking-wider text-sm">Escrow #{contractAddress.slice(-4)}</span>
          </div>
          <h2 className="text-4xl font-black text-base-content mb-2">{order.item}</h2>
          <Address address={order.address} />
        </div>
        <div className="text-right flex flex-col items-end">
          <div className="text-xs uppercase opacity-50 font-bold mb-1">Status</div>
          <div
            className={`badge ${
              order.status === 7 || isExpired ? "badge-error" : "badge-primary"
            } p-4 rounded-sm font-bold text-lg uppercase tracking-tighter`}
          >
            {isExpired
              ? "Expired"
              : [
                  "Created",
                  "Accepted",
                  "In Production",
                  "Production Ready",
                  "Shipped",
                  "Delivered",
                  "Completed",
                  "Disputed",
                  "Cancelled",
                ][order.status]}
          </div>

          {/* DISPUTE ACTION */}
          {(isBuyer || isSeller) && !isExpired && order.status > 0 && order.status < 6 && order.status !== 7 && (
            <button
              className="btn btn-error btn-outline btn-xs mt-3 w-full border-error/50 hover:bg-error/20 hover:text-error"
              onClick={onOpenDispute}
            >
              <ExclamationTriangleIcon className="h-3 w-3" /> Raise Dispute
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
