"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { BellAlertIcon, BellIcon, CheckIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useOutsideClick } from "~~/hooks/scaffold-eth";
import { useEscrowNotifications } from "~~/hooks/scaffold-eth/useEscrowNotifications";

// Inject the swing keyframe once into the document head
const SWING_STYLE_ID = "notification-bell-swing";
function ensureSwingStyle() {
  if (typeof document === "undefined") return;
  if (document.getElementById(SWING_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = SWING_STYLE_ID;
  style.textContent = `
    @keyframes notif-swing {
      0%, 100% { transform: rotate(0deg); }
      20% { transform: rotate(12deg); }
      40% { transform: rotate(-8deg); }
      60% { transform: rotate(5deg); }
      80% { transform: rotate(-3deg); }
    }
    .notif-bell-swing { animation: notif-swing 0.6s ease-in-out 3; }
  `;
  document.head.appendChild(style);
}

const STATUS_LABELS: Record<number, string> = {
  0: "Created",
  1: "Accepted",
  2: "In Production",
  3: "Production Completed",
  4: "Shipped",
  5: "Delivered",
  6: "Completed",
  7: "Disputed",
  8: "Cancelled",
};

const STATUS_COLORS: Record<number, string> = {
  1: "text-info",
  2: "text-warning",
  3: "text-success",
  4: "text-info",
  5: "text-success",
  6: "text-success",
  7: "text-error",
  8: "text-error",
};

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Inner component that only renders when wallet is connected
const NotificationBellInner = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useEscrowNotifications();

  useEffect(() => {
    ensureSwingStyle();
  }, []);

  useOutsideClick(dropdownRef, () => setIsOpen(false));

  const handleNotificationClick = (notification: (typeof notifications)[0]) => {
    markAsRead(notification.id);
    setIsOpen(false);
    router.push(`/orders/${notification.escrowAddress}`);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        className="btn btn-ghost btn-circle btn-sm relative"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        {unreadCount > 0 ? (
          <BellAlertIcon className="h-5 w-5 notif-bell-swing" />
        ) : (
          <BellIcon className="h-5 w-5 opacity-70" />
        )}

        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-error text-white text-[10px] font-black shadow-lg">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-base-100 border border-secondary/20 rounded-lg shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-base-200 bg-base-100/95 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <span className="badge badge-error badge-xs py-2 px-1.5 text-[9px] font-black">{unreadCount} NEW</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {notifications.length > 0 && (
                <>
                  <button
                    className="btn btn-ghost btn-xs gap-1 text-[10px] uppercase font-bold opacity-60 hover:opacity-100"
                    onClick={markAllAsRead}
                    title="Mark all as read"
                  >
                    <CheckIcon className="h-3 w-3" /> Read All
                  </button>
                  <button
                    className="btn btn-ghost btn-xs gap-1 text-[10px] uppercase font-bold opacity-60 hover:opacity-100 hover:text-error"
                    onClick={clearAll}
                    title="Clear all"
                  >
                    <TrashIcon className="h-3 w-3" /> Clear
                  </button>
                </>
              )}
              <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setIsOpen(false)}>
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <BellIcon className="h-10 w-10 opacity-10 mb-3" />
                <p className="text-sm font-medium opacity-40">No notifications yet</p>
                <p className="text-[10px] opacity-30 mt-1">Status changes will appear here automatically</p>
              </div>
            ) : (
              <div className="divide-y divide-base-200">
                {notifications.map(n => (
                  <button
                    key={n.id}
                    className={`w-full text-left px-4 py-3 hover:bg-base-200/60 transition-colors cursor-pointer group ${
                      !n.read ? "bg-primary/5 border-l-2 border-l-primary" : ""
                    }`}
                    onClick={() => handleNotificationClick(n)}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex-shrink-0 p-1.5 rounded-full ${
                          !n.read ? "bg-primary/10 text-primary" : "bg-base-200 opacity-50"
                        }`}
                      >
                        <BellAlertIcon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-xs font-bold truncate ${!n.read ? "text-base-content" : "opacity-60"}`}>
                            {n.itemName}
                          </p>
                          <span className="text-[9px] opacity-40 flex-shrink-0 font-medium">
                            {timeAgo(n.timestamp)}
                          </span>
                        </div>
                        <p className="text-[11px] mt-0.5 opacity-70">
                          <span className={`font-semibold ${STATUS_COLORS[n.newStatus] || ""}`}>
                            {STATUS_LABELS[n.newStatus] || "Unknown"}
                          </span>
                          <span className="opacity-50"> ← {STATUS_LABELS[n.oldStatus] || "Unknown"}</span>
                        </p>
                        <p className="text-[10px] font-mono mt-1 opacity-30 truncate group-hover:opacity-50 transition-opacity">
                          {n.escrowAddress.slice(0, 8)}...{n.escrowAddress.slice(-6)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const NotificationBell = () => {
  const { address } = useAccount();
  if (!address) return null;
  return <NotificationBellInner />;
};
