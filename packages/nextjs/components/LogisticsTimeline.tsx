"use client";

import React from "react";
import {
  CheckCircleIcon,
  CubeIcon,
  CurrencyDollarIcon,
  DocumentCheckIcon,
  TruckIcon,
} from "@heroicons/react/24/outline";

export enum EscrowStatus {
  CREATED,
  ACCEPTED,
  PRODUCTION,
  PRODUCTION_COMPLETED,
  SHIPPED,
  DELIVERED,
  COMPLETED,
  DISPUTED,
  CANCELLED,
}

interface LogisticsTimelineProps {
  currentStatus: EscrowStatus;
  isPaused?: boolean;
  isDraft?: boolean;
  m1Pct?: number;
  m2Pct?: number;
}

const LogisticsTimeline: React.FC<LogisticsTimelineProps> = ({ currentStatus, isPaused, isDraft, m1Pct, m2Pct }) => {
  const milestone1 = m1Pct || 30;
  const milestone2 = m2Pct || 50;
  const milestone3 = 100 - milestone1 - milestone2;

  const steps = [
    { name: "Contract", status: EscrowStatus.ACCEPTED, icon: DocumentCheckIcon, description: "Accepted" },
    {
      name: "Funding",
      status: EscrowStatus.PRODUCTION,
      icon: CurrencyDollarIcon,
      description: `${milestone1}% Released`,
      percentage: `${milestone1}%`,
    },
    { name: "Production", status: EscrowStatus.PRODUCTION_COMPLETED, icon: CubeIcon, description: "Manufacturing" },
    { name: "Shipped", status: EscrowStatus.SHIPPED, icon: TruckIcon, description: "In transit" },
    {
      name: "Delivered",
      status: EscrowStatus.DELIVERED,
      icon: CheckCircleIcon,
      description: `${milestone2}% Released`,
      percentage: `${milestone2}%`,
    },
    {
      name: "Completed",
      status: EscrowStatus.COMPLETED,
      icon: CheckCircleIcon,
      description: `${milestone3}% Released`,
      percentage: `${milestone3}%`,
    },
  ];

  const getLabelClass = (stepStatus: EscrowStatus) => {
    if (currentStatus === EscrowStatus.CANCELLED) {
      if (stepStatus <= currentStatus) return "text-error font-bold";
      return "text-base-content/40 font-medium";
    }
    if (isPaused && stepStatus === currentStatus) return "text-warning font-bold";
    if (isDraft && stepStatus === EscrowStatus.CREATED) return "text-primary font-bold";
    if (currentStatus >= stepStatus) return "text-success font-bold";

    const currentIndexInSteps = steps.findIndex(s => s.status === currentStatus);
    const stepIndex = steps.findIndex(s => s.status === stepStatus);
    if (!isDraft && !isPaused && stepIndex === currentIndexInSteps + 1 && currentStatus < EscrowStatus.COMPLETED) {
      return "text-primary font-bold";
    }

    return "text-base-content/40 font-medium";
  };

  return (
    <div className="w-full py-1 px-2 sm:px-4 bg-base-100 rounded-sm shadow-md border border-secondary/10 relative overflow-hidden">
      {isPaused && (
        <div className="absolute top-2 right-2 flex items-center gap-2 px-3 py-1 bg-warning/20 text-warning rounded-full border border-warning/30 z-20">
          <div className="w-2 h-2 bg-warning rounded-full animate-ping"></div>
          <span className="text-[10px] font-black uppercase tracking-tighter">Logistics Paused</span>
        </div>
      )}
      <div className="flex justify-between items-center mb-6 px-2">
        <h2 className="text-lg font-bold flex items-center gap-2 mt-4">
          <TruckIcon className="h-5 w-5 text-success" />
          Logistics Status
        </h2>
        {currentStatus === EscrowStatus.COMPLETED && (
          <div className="badge badge-success gap-2 py-3 rounded-sm font-bold">
            <CheckCircleIcon className="h-4 w-4" /> Order Finalized
          </div>
        )}
      </div>

      <div className="relative w-full mt-4 mb-8">
        {/* Background Track Line */}
        <div className="absolute top-[32px] left-[10%] right-[10%] h-1 bg-base-300 rounded-full z-0 hidden lg:block"></div>

        {/* Dynamic Foreground 'Glowing' Line */}
        <div
          className="absolute top-[32px] left-[10%] h-1 bg-primary rounded-full z-0 transition-all duration-1000 ease-in-out hidden lg:block shadow-[0_0_10px_rgba(var(--primary))]"
          style={{
            width: `${Math.min(100, Math.max(0, (steps.findIndex(s => currentStatus >= s.status) / (steps.length - 1)) * 80))}%`,
          }}
        ></div>

        <ul className="flex flex-col lg:flex-row justify-between w-full relative z-10 gap-4 sm:gap-6 lg:gap-0">
          {steps.map((step, index) => {
            const currentIndex = steps.findIndex(s => s.status === currentStatus);

            // Special logic for the first step (Contract):
            const isReached = isDraft
              ? false
              : step.name === "Contract"
                ? currentStatus >= EscrowStatus.ACCEPTED
                : currentStatus >= step.status;

            // Special logic for the next active step
            const isActive =
              (isDraft && step.name === "Contract") ||
              (!isDraft &&
                !isPaused &&
                !isReached &&
                ((step.name === "Contract" && currentStatus === EscrowStatus.CREATED) ||
                  (step.name === "Funding" && currentStatus === EscrowStatus.ACCEPTED) ||
                  (index === currentIndex + 1 &&
                    currentStatus >= EscrowStatus.PRODUCTION &&
                    currentStatus < EscrowStatus.COMPLETED)));

            return (
              <li
                key={step.name}
                className={`flex-1 flex flex-row lg:flex-col items-center lg:items-center transition-all duration-500`}
              >
                <div className="flex flex-row lg:flex-col items-center lg:items-center group relative w-full gap-3 lg:gap-0">
                  {/* Vertical Line for Mobile (hidden on LG) */}
                  {index !== steps.length - 1 && <div className="hidden lg:hidden"></div>}

                  {/* Percentage Tooltip */}
                  {step.percentage && (
                    <div
                      className={`absolute -top-8 px-2.5 py-0.5 rounded-full text-[10px] font-black border opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-md whitespace-nowrap ${
                        isReached
                          ? "bg-success text-success-content border-success"
                          : isActive
                            ? "bg-primary text-primary-content border-primary"
                            : "bg-base-200 text-base-content/40 border-base-300"
                      }`}
                    >
                      {step.percentage}
                    </div>
                  )}

                  {/* Icon Node Container */}
                  <div
                    className={`relative w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-full flex items-center justify-center border-[3px] lg:border-4 mb-0 lg:mb-3 transition-all duration-500 bg-base-100 shrink-0
                      ${isReached ? "border-success text-success scale-100" : ""}
                      ${isActive ? "border-primary text-primary ring-4 ring-primary/20 animate-pulse scale-110" : ""}
                      ${!isReached && !isActive ? "border-base-300 text-base-content/30 scale-90" : ""}
                    `}
                  >
                    <step.icon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-7 lg:w-7" />

                    {/* Status Badge overlay on the Icon */}
                    {isReached && (
                      <div className="absolute -bottom-1 -right-1 bg-success text-success-content rounded-full p-1 border-2 border-base-100">
                        <CheckCircleIcon className="w-3 h-3" strokeWidth={3} />
                      </div>
                    )}
                  </div>

                  {/* Label & Description */}
                  <div className="text-left lg:text-center w-full px-1 lg:px-2">
                    <span className={`block font-bold text-xs sm:text-sm tracking-tight ${getLabelClass(step.status)}`}>
                      {step.name}
                    </span>
                    <span className="block text-[9px] sm:text-[10px] uppercase font-bold text-base-content/40 mt-0.5 lg:mt-1 tracking-wider">
                      {isReached ? "Completed" : isActive ? "Action Required" : "Pending"}
                    </span>
                    <span className="hidden lg:block text-xs mt-1 text-base-content/60 font-medium max-w-[120px] mx-auto leading-tight">
                      {step.description}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {isPaused && (
        <div className="mt-8 alert alert-warning shadow-lg rounded-sm mx-4 w-auto text-warning-content">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span>Dispute Raised! Logistics and payments are frozen until resolution.</span>
        </div>
      )}

      {currentStatus === EscrowStatus.CANCELLED && (
        <div className="mt-8 alert alert-error shadow-lg rounded-sm mx-4 w-auto text-error-content">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>This contract has been Declined/Cancelled.</span>
        </div>
      )}
    </div>
  );
};

export default LogisticsTimeline;
