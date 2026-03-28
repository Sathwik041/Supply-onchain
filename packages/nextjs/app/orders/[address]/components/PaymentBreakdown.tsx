"use client";

import React from "react";
import { Order } from "./types";
import { CurrencyDollarIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

interface PaymentBreakdownProps {
  order: Order;
  milestone1: string;
  milestone2: string;
  milestone3: string;
}

export function PaymentBreakdown({ order, milestone1, milestone2, milestone3 }: PaymentBreakdownProps) {
  return (
    <div className="card bg-primary text-primary-content shadow-2xl overflow-hidden rounded-sm">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <CurrencyDollarIcon className="h-24 w-24" />
      </div>
      <div className="card-body relative z-10">
        <h3 className="card-title text-sm uppercase tracking-widest opacity-80 flex items-center gap-2">
          Payment Breakdown
        </h3>
        <div className="mt-4 space-y-4">
          <div className="flex justify-between items-center border-b border-primary-content/20 pb-2">
            <span className="text-sm font-medium">Total Volume</span>
            <span className="text-xl font-bold">{order.amount || "0.00"} MON</span>
          </div>
          <div className="space-y-4 pt-2">
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase opacity-70">Production</span>
                <span className="text-[10px] opacity-60">Initial (30%)</span>
              </div>
              <span className="font-mono font-bold">{milestone1} MON</span>
            </div>
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase opacity-70">Delivery</span>
                <span className="text-[10px] opacity-60">Verified (50%)</span>
              </div>
              <span className="font-mono font-bold">{milestone2} MON</span>
            </div>
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase opacity-70">Inspection</span>
                <span className="text-[10px] opacity-60">Final (20%)</span>
              </div>
              <span className="font-mono font-bold">{milestone3} MON</span>
            </div>
          </div>
          <div className="bg-white/10 p-3 rounded-sm mt-4 text-xs">
            <p className="font-semibold mb-1 flex items-center gap-1">
              <ShieldCheckIcon className="h-3 w-3" /> Escrow Protocol:
            </p>
            <p className="opacity-80">Security provided by industrial-grade smart contract escrow.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
