"use client";

import React from "react";
import { Address } from "@scaffold-ui/components";

interface ParticipantInfoProps {
  buyer: string;
  seller: string;
  arbitrator: string;
}

export function ParticipantInfo({ buyer, seller, arbitrator }: ParticipantInfoProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border-t border-base-200 mt-2 p-6 bg-base-100">
      <div className="p-4 bg-base-200/50 rounded-sm border border-base-200 flex flex-col items-center text-center">
        <span className="text-[10px] font-black uppercase opacity-50 mb-2">Buyer (Fund Source)</span>
        <Address address={buyer} />
      </div>
      <div className="p-4 bg-base-200/50 rounded-sm border border-base-200 flex flex-col items-center text-center">
        <span className="text-[10px] font-black uppercase opacity-50 mb-2">Seller (Manufacturer)</span>
        <Address address={seller} />
      </div>
      <div className="p-4 bg-base-200/50 rounded-sm border border-base-200 flex flex-col items-center text-center md:col-span-2 lg:col-span-1">
        <span className="text-[10px] font-black uppercase opacity-50 mb-2 text-primary">Arbitrator (Oracle)</span>
        <Address address={arbitrator} />
      </div>
    </div>
  );
}
