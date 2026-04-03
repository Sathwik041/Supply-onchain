"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { NextPage } from "next";
import {
  ArrowPathIcon,
  BanknotesIcon,
  ChartBarIcon,
  ClockIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  ListBulletIcon,
  PlusCircleIcon,
  ShieldCheckIcon,
  WalletIcon,
} from "@heroicons/react/24/outline";
import { useDashboardData } from "~~/hooks/scaffold-eth/useDashboardData";

// ─── Status helpers ────────────────────────────────────────────────────

const STATUS_LABELS: Record<number, string> = {
  0: "Created",
  1: "Accepted",
  2: "In Production",
  3: "Production Done",
  4: "Shipped",
  5: "Delivered",
  6: "Completed",
  7: "Disputed",
  8: "Cancelled",
};

const STATUS_BADGE: Record<number, string> = {
  0: "badge-info",
  1: "badge-info",
  2: "badge-warning",
  3: "badge-warning",
  4: "badge-accent",
  5: "badge-success",
  6: "badge-success",
  7: "badge-error",
  8: "badge-ghost",
};

const STATUS_PROGRESS_COLOR: Record<number, string> = {
  0: "progress-info",
  1: "progress-info",
  2: "progress-warning",
  3: "progress-warning",
  4: "progress-accent",
  5: "progress-success",
  6: "progress-success",
  7: "progress-error",
  8: "progress-primary",
};

function timeAgo(unixSeconds: number): string {
  const seconds = Math.floor(Date.now() / 1000 - unixSeconds);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ─── Stat Card Component ────────────────────────────────────────────────

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: string;
}) => (
  <div className="stat bg-base-100 shadow-sm border border-secondary/10 rounded-sm">
    <div className={`stat-figure ${accent || "text-primary"}`}>
      <Icon className="h-7 w-7 opacity-60" />
    </div>
    <div className="stat-title text-xs font-bold uppercase opacity-50">{title}</div>
    <div className={`stat-value text-2xl ${accent || "text-primary"}`}>{value}</div>
    {subtitle && <div className="stat-desc text-xs mt-1 opacity-50">{subtitle}</div>}
  </div>
);

// ─── CSS Bar Chart Component ────────────────────────────────────────────

const CSSBarChart = ({ data }: { data: { date: string; count: number; volume: number }[] }) => {
  const maxCount = Math.max(...data.map(d => d.count), 1);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative flex items-end gap-1.5 h-48 px-2 mt-4">
      {/* Background Grid Lines */}
      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="w-full border-b border-base-content h-0" />
        ))}
      </div>

      {data.map((point, i) => {
        const heightPercent = mounted ? Math.max((point.count / maxCount) * 100, 4) : 0;

        return (
          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-2 group z-10">
            <div className="relative w-full flex justify-center h-full items-end">
              <div
                className="tooltip tooltip-top tooltip-primary"
                data-tip={`${point.count} orders · ${point.volume} MON`}
              >
                <div
                  className="w-full min-w-[12px] max-w-[40px] bg-primary/40 hover:bg-primary border border-primary/20 rounded-t-sm transition-all duration-700 ease-out cursor-pointer"
                  style={{ height: `${heightPercent}%`, minHeight: mounted ? "4px" : "0px" }}
                />
              </div>
            </div>
            <span className="text-[9px] opacity-40 font-medium truncate w-full text-center group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {point.date}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ─── CSS Donut Chart Component ──────────────────────────────────────────

const CSSDonutChart = ({ data }: { data: { label: string; count: number; color: string }[] }) => {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  if (total === 0) return null;

  // Build conic-gradient stops
  let accumulated = 0;
  const stops = data.map(d => {
    const start = accumulated;
    const end = accumulated + (d.count / total) * 100;
    accumulated = end;
    return `${d.color} ${start}% ${end}%`;
  });

  return (
    <div className="flex flex-col items-center gap-4 group">
      <div
        className="w-32 h-32 rounded-full relative transition-transform duration-500 hover:scale-105 shadow-inner"
        style={{
          background: `conic-gradient(${stops.join(", ")})`,
        }}
      >
        {/* Inner circle for donut effect */}
        <div className="absolute inset-4 rounded-full bg-base-100 flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
          <div className="text-center">
            <span className="text-xl font-black text-primary block leading-none">{total}</span>
            <span className="text-[9px] font-bold uppercase opacity-40">Orders</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Dashboard ────────────────────────────────────────────────────

const Dashboard: NextPage = () => {
  const router = useRouter();
  const { isLoading, stats, timelineData, statusBreakdown, recentActivity, connectedAddress } = useDashboardData();

  // ── Not connected ──
  if (!connectedAddress) {
    return (
      <div className="flex flex-col items-center justify-center grow bg-base-200 pb-20">
        <div className="card bg-base-100 shadow-xl border border-secondary/20 p-16 text-center rounded-sm max-w-lg">
          <WalletIcon className="h-16 w-16 mx-auto opacity-10 mb-6" />
          <h2 className="text-2xl font-bold opacity-60">Connect Your Wallet</h2>
          <p className="mt-3 opacity-40">Connect your wallet to view your analytics dashboard.</p>
        </div>
      </div>
    );
  }

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center grow bg-base-200 pb-20">
        <ArrowPathIcon className="h-12 w-12 animate-spin text-primary opacity-40" />
        <p className="mt-4 opacity-40 text-sm font-medium">Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col grow bg-base-200 pb-20">
      <div className="max-w-7xl w-full mx-auto px-2 sm:px-4 mt-4 sm:mt-8">
        {/* ── Header ── */}
        <div className="flex items-center gap-3 mb-8">
          <ChartBarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-primary">Analytics Dashboard</h1>
            <p className="text-sm opacity-50 mt-1">Real-time overview of your supply chain activity</p>
          </div>
        </div>

        {/* ── Hero Stats ── */}
        <div className="stats stats-vertical lg:stats-horizontal w-full shadow-sm border border-secondary/10 rounded-sm mb-6">
          <StatCard
            title="Total Escrows"
            value={stats.totalEscrows}
            subtitle={`${stats.activeOrders} active · ${stats.completedOrders} completed`}
            icon={CubeIcon}
          />
          <StatCard
            title="Total Volume"
            value={`${stats.totalVolume.toFixed(2)} MON`}
            subtitle="Across all contracts"
            icon={BanknotesIcon}
          />
          <StatCard
            title="Pending Actions"
            value={stats.pendingActions}
            subtitle="Contracts awaiting your action"
            icon={ExclamationTriangleIcon}
            accent={stats.pendingActions > 0 ? "text-warning" : "text-primary"}
          />
          <StatCard
            title="Avg Completion"
            value={stats.avgCompletionDays > 0 ? `${stats.avgCompletionDays.toFixed(1)}d` : "—"}
            subtitle="From creation to delivery"
            icon={ClockIcon}
          />
        </div>

        {/* ── Quick Actions (Prominent Row) ── */}
        <div className="card bg-base-100 shadow-sm border border-secondary/10 rounded-sm mb-8">
          <div className="card-body p-3 sm:p-4 md:p-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              <Link
                href="/create"
                className="btn btn-primary flex-1 hover:scale-[1.02] transition-transform flex gap-2 rounded-sm h-14"
              >
                <PlusCircleIcon className="h-6 w-6 opacity-80" />
                <div className="flex flex-col items-start gap-0.5 mt-0.5">
                  <span className="leading-none text-sm">New Contract</span>
                  <span className="text-[10px] opacity-70 font-normal normal-case leading-none">Create escrow</span>
                </div>
              </Link>
              <Link
                href="/orders"
                className="btn btn-secondary flex-1 hover:scale-[1.02] transition-transform flex gap-2 rounded-sm h-14"
              >
                <ListBulletIcon className="h-6 w-6 opacity-80" />
                <div className="flex flex-col items-start gap-0.5 mt-0.5">
                  <span className="leading-none text-sm">All Orders</span>
                  <span className="text-[10px] opacity-70 font-normal normal-case leading-none">View details</span>
                </div>
              </Link>
              <Link
                href="/machine-passports"
                className="btn btn-accent flex-1 hover:scale-[1.02] transition-transform flex gap-2 rounded-sm h-14"
              >
                <ShieldCheckIcon className="h-6 w-6 opacity-80" />
                <div className="flex flex-col items-start gap-0.5 mt-0.5">
                  <span className="leading-none text-sm">Passports</span>
                  <span className="text-[10px] opacity-70 font-normal normal-case leading-none">Verify parts</span>
                </div>
              </Link>
              <Link
                href="/dispute-orders"
                className="btn btn-warning flex-1 hover:scale-[1.02] transition-transform flex gap-2 rounded-sm h-14"
              >
                <ExclamationTriangleIcon className="h-6 w-6 opacity-80" />
                <div className="flex flex-col items-start gap-0.5 mt-0.5">
                  <span className="leading-none text-sm">Disputes</span>
                  <span className="text-[10px] opacity-70 font-normal normal-case leading-none">Manage issues</span>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* ── Charts Row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Order Activity — CSS Bar Chart */}
          <div className="lg:col-span-2 card bg-base-100 shadow-sm border border-secondary/10 rounded-sm">
            <div className="card-body p-5">
              <h2 className="card-title text-sm font-bold uppercase opacity-50">Order Activity</h2>
              {timelineData.length > 0 ? (
                <div className="mt-4">
                  <CSSBarChart data={timelineData} />
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 opacity-30">
                  <p className="text-sm">No order data yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Status Breakdown — CSS Donut + Progress Bars */}
          <div className="card bg-base-100 shadow-sm border border-secondary/10 rounded-sm">
            <div className="card-body p-5">
              <h2 className="card-title text-sm font-bold uppercase opacity-50">Status Breakdown</h2>
              {statusBreakdown.length > 0 ? (
                <div className="mt-4 space-y-4">
                  <CSSDonutChart data={statusBreakdown} />
                  <div className="space-y-2">
                    {statusBreakdown.map(s => (
                      <div key={s.status} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                        <span className="text-xs opacity-60 flex-1">{s.label}</span>
                        <span className="text-xs font-bold">{s.count}</span>
                        <progress
                          className={`progress ${STATUS_PROGRESS_COLOR[s.status] || "progress-primary"} w-16 h-1.5`}
                          value={s.count}
                          max={stats.totalEscrows}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 opacity-30">
                  <p className="text-sm">No data yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Financial Summary + Recent Activity ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Financial Summary */}
          <div className="card bg-base-100 shadow-sm border border-secondary/10 rounded-sm">
            <div className="card-body p-5">
              <h2 className="card-title text-sm font-bold uppercase opacity-50">Financial Summary</h2>
              <div className="mt-4 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm opacity-60">Your Total Spend</span>
                  <span className="font-bold text-primary">{stats.yourSpend.toFixed(4)} MON</span>
                </div>
                <div className="divider my-0" />
                <div className="flex justify-between items-center">
                  <span className="text-sm opacity-60">Your Total Earned</span>
                  <span className="font-bold text-success">{stats.yourEarned.toFixed(4)} MON</span>
                </div>
                <div className="divider my-0" />
                <div className="flex justify-between items-center">
                  <span className="text-sm opacity-60">Disputed</span>
                  <span className={`font-bold ${stats.disputedOrders > 0 ? "text-error" : "opacity-40"}`}>
                    {stats.disputedOrders}
                  </span>
                </div>
                <div className="divider my-0" />
                <div className="flex justify-between items-center">
                  <span className="text-sm opacity-60">Active Orders</span>
                  <span className="font-bold">{stats.activeOrders}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className="lg:col-span-2 card bg-base-100 shadow-sm border border-secondary/10 rounded-sm">
            <div className="card-body p-5">
              <h2 className="card-title text-sm font-bold uppercase opacity-50">Recent Activity</h2>
              {recentActivity.length > 0 ? (
                <div className="divide-y divide-base-200 mt-2">
                  {recentActivity.map(order => (
                    <button
                      key={order.address}
                      className="w-full flex items-center justify-between py-3 px-2 hover:bg-base-200/60 transition-colors cursor-pointer rounded-sm"
                      onClick={() => router.push(`/orders/${order.address}`)}
                    >
                      <div className="flex items-center gap-3">
                        <CubeIcon className="h-5 w-5 opacity-30" />
                        <div className="text-left">
                          <p className="text-sm font-bold">{order.itemName}</p>
                          <p className="text-xs opacity-40">
                            {order.totalAmountMON} MON · Qty: {order.quantity}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`badge ${STATUS_BADGE[order.status] || "badge-ghost"} badge-sm text-[10px] uppercase font-bold rounded-sm`}
                        >
                          {STATUS_LABELS[order.status] || "Unknown"}
                        </span>
                        <span className="text-[10px] opacity-30 w-16 text-right">{timeAgo(order.createdAt)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 opacity-30">
                  <p className="text-sm">No activity yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
