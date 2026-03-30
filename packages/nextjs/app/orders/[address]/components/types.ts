export interface Order {
  address: string;
  buyer: string;
  seller: string;
  arbitrator: string;
  item: string;
  amount: string;
  status: number;
  poCid: string;
  sellerAccepted: boolean;
  shipped: boolean;
  shippingProvider: string;
  trackingNumber: string;
  delivered: boolean;
  deliveredAt: bigint;
  completed: boolean;
  disputed: boolean;
  disputeReason: string;
  shippingCid: string;
  productionLogs: string[];
  createdAt: bigint;
  deposited?: boolean;
  milestone1Pct?: number;
  milestone2Pct?: number;
  metadata?: any;
}
