"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { NextPage } from "next";
import {
  ArrowRightIcon,
  BanknotesIcon,
  BellAlertIcon,
  CheckCircleIcon,
  ClockIcon,
  CubeIcon,
  CurrencyDollarIcon,
  DocumentCheckIcon,
  DocumentMagnifyingGlassIcon,
  ExclamationTriangleIcon,
  IdentificationIcon,
  LockClosedIcon,
  PaperClipIcon,
  QrCodeIcon,
  ScaleIcon,
  ShieldCheckIcon,
  TruckIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";

// ─── Animated Counter Hook ────────────────────────────────────────────
function useCountUp(target: number, duration = 1800) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasRun = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasRun.current) {
          hasRun.current = true;
          let start = 0;
          const step = target / (duration / 16);
          const interval = setInterval(() => {
            start += step;
            if (start >= target) {
              setCount(target);
              clearInterval(interval);
            } else {
              setCount(Math.floor(start));
            }
          }, 16);
        }
      },
      { threshold: 0.5 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return { count, ref };
}

// ─── Section Wrapper with fade-in ─────────────────────────────────────
function FadeInSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setVisible(true), {
      threshold: 0.1,
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}
    >
      {children}
    </div>
  );
}

// ─── Feature Card ─────────────────────────────────────────────────────
function FeatureCard({
  icon: Icon,
  title,
  description,
  accent = "text-primary",
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  accent?: string;
}) {
  return (
    <div className="card bg-base-100 shadow-lg border border-base-content/10 hover:border-primary/30 hover:shadow-xl transition-all duration-300 group rounded-sm overflow-hidden">
      <div className="card-body p-6">
        <div
          className={`p-3 rounded-lg bg-primary/5 ${accent} w-fit group-hover:bg-primary group-hover:text-primary-content transition-colors duration-300`}
        >
          <Icon className="h-7 w-7" />
        </div>
        <h3 className="card-title text-lg font-bold mt-3">{title}</h3>
        <p className="text-sm opacity-70 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

// ─── Workflow Step ─────────────────────────────────────────────────────
function WorkflowStep({
  step,
  title,
  description,
  icon: Icon,
  accent,
  isLast,
}: {
  step: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  isLast?: boolean;
}) {
  return (
    <div className="flex gap-4 sm:gap-6">
      <div className="flex flex-col items-center">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center border-[3px] ${accent} bg-base-100 shadow-md shrink-0`}
        >
          <Icon className="h-5 w-5" />
        </div>
        {!isLast && <div className="w-0.5 grow bg-base-300 mt-2" />}
      </div>
      <div className={`pb-8 ${isLast ? "" : ""}`}>
        <span className="text-[10px] font-black uppercase opacity-40 tracking-widest">Step {step}</span>
        <h4 className="text-lg font-bold mt-1">{title}</h4>
        <p className="text-sm opacity-70 leading-relaxed mt-1 max-w-md">{description}</p>
      </div>
    </div>
  );
}

// ─── Role Card ────────────────────────────────────────────────────────
function RoleCard({
  emoji,
  title,
  features,
  accent,
}: {
  emoji: string;
  title: string;
  features: string[];
  accent: string;
}) {
  return (
    <div
      className={`card bg-base-100 shadow-xl border-t-4 ${accent} rounded-sm overflow-hidden hover:shadow-2xl transition-all duration-300`}
    >
      <div className="card-body p-6">
        <div className="text-4xl mb-2">{emoji}</div>
        <h3 className="card-title text-xl font-black">{title}</h3>
        <ul className="space-y-2 mt-3">
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <CheckCircleIcon className="h-4 w-4 text-success shrink-0 mt-0.5" />
              <span className="opacity-80">{f}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── FAQ Item ─────────────────────────────────────────────────────────
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-base-content/10 rounded-sm overflow-hidden">
      <button
        className="w-full flex justify-between items-center p-4 sm:p-5 text-left hover:bg-base-200/50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="font-bold text-sm sm:text-base pr-4">{question}</span>
        <span
          className={`text-primary transition-transform duration-300 shrink-0 text-xl ${open ? "rotate-45" : "rotate-0"}`}
        >
          +
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
      >
        <p className="p-4 sm:p-5 pt-0 text-sm opacity-70 leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════════════════════════════════════

const AboutPage: NextPage = () => {
  const stat1 = useCountUp(3, 1500);
  const stat2 = useCountUp(9, 1500);
  const stat3 = useCountUp(14, 1500);

  return (
    <div className="flex flex-col grow bg-base-200 pb-20">
      {/* ═══════ HERO ═══════ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-16 sm:pb-24 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest mb-6 border border-primary/20">
            <ShieldCheckIcon className="h-4 w-4" />
            Blockchain-Powered Supply Chain
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight mb-6">
            Securing Industrial Trade
            <span className="text-primary block mt-2">with On-Chain Escrow</span>
          </h1>
          <p className="text-lg sm:text-xl opacity-70 max-w-2xl mx-auto leading-relaxed mb-10">
            Supply-OnChain is a smart-contract-driven protocol that eliminates counterparty risk in global manufacturing
            and logistics for industrial assets — from factory floor to final delivery.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/dashboard"
              className="btn btn-primary btn-lg px-10 text-lg shadow-lg hover:scale-105 transition-transform rounded-sm"
            >
              Launch App
              <ArrowRightIcon className="h-5 w-5 ml-1" />
            </Link>
            <Link href="/create" className="btn btn-outline btn-lg px-10 text-lg hover:bg-primary/10 rounded-sm">
              Create Escrow
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════ KEY STATS ═══════ */}
      <FadeInSection>
        <section className="max-w-5xl mx-auto px-4 sm:px-6 -mt-8 sm:-mt-12 relative z-20 mb-16 sm:mb-24">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="card bg-base-100 shadow-xl border border-base-content/10 rounded-sm" ref={stat1.ref}>
              <div className="card-body items-center text-center p-6">
                <LockClosedIcon className="h-8 w-8 text-primary opacity-60 mb-2" />
                <p className="text-4xl font-black text-primary">{stat1.count}</p>
                <p className="text-xs font-bold uppercase opacity-50 tracking-wider">Smart Contracts</p>
                <p className="text-[11px] opacity-40 mt-1">EscrowFactory, SupplyChainEscrow, MachinePassport</p>
              </div>
            </div>
            <div className="card bg-base-100 shadow-xl border border-base-content/10 rounded-sm" ref={stat2.ref}>
              <div className="card-body items-center text-center p-6">
                <CubeIcon className="h-8 w-8 text-primary opacity-60 mb-2" />
                <p className="text-4xl font-black text-primary">{stat2.count}</p>
                <p className="text-xs font-bold uppercase opacity-50 tracking-wider">Order Lifecycle Stages</p>
                <p className="text-[11px] opacity-40 mt-1">Created → Accepted → Production → Shipped → Completed</p>
              </div>
            </div>
            <div className="card bg-base-100 shadow-xl border border-base-content/10 rounded-sm" ref={stat3.ref}>
              <div className="card-body items-center text-center p-6">
                <ClockIcon className="h-8 w-8 text-primary opacity-60 mb-2" />
                <p className="text-4xl font-black text-primary">{stat3.count}-day</p>
                <p className="text-xs font-bold uppercase opacity-50 tracking-wider">Inspection Window</p>
                <p className="text-[11px] opacity-40 mt-1">Post-delivery quality assurance period for buyers</p>
              </div>
            </div>
          </div>
        </section>
      </FadeInSection>

      {/* ═══════ WHAT IS SUPPLY-ONCHAIN ═══════ */}
      <FadeInSection>
        <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-16 sm:mb-24">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-4xl font-black mb-4">What is Supply-OnChain?</h2>
            <p className="text-base sm:text-lg opacity-60 max-w-3xl mx-auto leading-relaxed">
              A decentralized escrow protocol purpose-built for industrial supply chains. It locks buyer funds in a
              smart contract and releases them across configurable milestones — production, delivery, and final
              inspection — ensuring both parties are protected at every step.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={CurrencyDollarIcon}
              title="Flexible Payment Milestones"
              description="Split payments across three configurable milestones: Production, Delivery, and Final Inspection. Choose from preset schedules (Standard 30/50/20, Low-Risk 10/70/20, etc.) or customize your own split."
            />
            <FeatureCard
              icon={TruckIcon}
              title="Verified Logistics Tracking"
              description="Real-time logistics timeline tracks every stage from contract acceptance to final delivery. Sellers submit carrier details (FedEx, UPS, DHL, Maersk) and tracking numbers recorded on-chain."
            />
            <FeatureCard
              icon={IdentificationIcon}
              title="Machine Passport (NFT)"
              description="Upon order completion, an ERC-721 NFT is automatically minted as a digital twin for the asset. It records provenance, specifications, and purchase order — a permanent, verifiable identity on the blockchain."
            />
            <FeatureCard
              icon={ScaleIcon}
              title="On-Chain Dispute Resolution"
              description="Either party can raise a dispute at any time before completion. All payments and logistics freeze, and the assigned arbitrator reviews evidence pinned to IPFS before rendering a final judgment."
            />
            <FeatureCard
              icon={PaperClipIcon}
              title="IPFS Document Storage"
              description="Critical documents — Purchase Orders, Bill of Lading, Production Evidence, and Dispute Statements — are pinned to IPFS via Pinata, ensuring tamper-proof, decentralized document management."
            />
            <FeatureCard
              icon={BellAlertIcon}
              title="Real-Time Notifications"
              description="Automatic status-change notifications keep all participants informed. The notification bell tracks transitions (e.g. 'Shipped ← In Production') with timestamps and direct contract links."
            />
          </div>
        </section>
      </FadeInSection>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <FadeInSection>
        <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-16 sm:mb-24">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-4xl font-black mb-4">How It Works</h2>
            <p className="text-base sm:text-lg opacity-60 max-w-2xl mx-auto">
              A complete escrow lifecycle — from contract creation to machine passport minting.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
            {/* Left: Workflow Steps */}
            <div>
              <WorkflowStep
                step={1}
                title="Create Escrow Contract"
                description="The buyer fills out the contract form: seller address, arbitrator, item name, quantity, total amount, delivery deadline, and payment milestone split. A Purchase Order (PO) document is uploaded and pinned to IPFS. QR code verification is available to confirm counterparty addresses."
                icon={DocumentCheckIcon}
                accent="border-primary text-primary"
              />
              <WorkflowStep
                step={2}
                title="Seller Accepts Terms"
                description="The seller reviews the contract terms and the PO document. They have a 24-hour window to accept. If the offer expires, the buyer can withdraw the contract at no cost."
                icon={ClockIcon}
                accent="border-info text-info"
              />
              <WorkflowStep
                step={3}
                title="Buyer Funds & Production Begins"
                description="The buyer deposits the full contract value into escrow. The first milestone (e.g., 30%) is immediately released to the seller to cover production costs. Status becomes 'In Production'."
                icon={CurrencyDollarIcon}
                accent="border-warning text-warning"
              />
              <WorkflowStep
                step={4}
                title="Production Tracking & Shipment"
                description="The seller posts production evidence photos/reports to IPFS as audit logs. Once manufacturing is complete, they submit carrier details and a Bill of Lading. All production logs are batch-committed to the blockchain at the moment of shipment."
                icon={TruckIcon}
                accent="border-accent text-accent"
              />
              <WorkflowStep
                step={5}
                title="Delivery Confirmation"
                description="When the shipment arrives, the buyer confirms delivery. The second milestone (e.g., 50%) is released to the seller. The buyer now enters a 14-day inspection period."
                icon={CheckCircleIcon}
                accent="border-success text-success"
              />
              <WorkflowStep
                step={6}
                title="Final Inspection & Completion"
                description="The buyer has 14 days to run quality checks. If everything passes, they complete the contract to release the final milestone and receive the Machine Passport NFT. If the buyer does not respond, the seller can auto-claim after the 14-day period."
                icon={ShieldCheckIcon}
                accent="border-success text-success"
                isLast
              />
            </div>

            {/* Right: Visual Diagram */}
            <div className="flex flex-col justify-center">
              <div className="card bg-base-100 shadow-xl border border-base-content/10 rounded-sm overflow-hidden">
                <div className="bg-primary/10 p-5 border-b border-primary/20">
                  <h3 className="font-black text-lg flex items-center gap-2">
                    <BanknotesIcon className="h-6 w-6 text-primary" />
                    Payment Flow Example
                  </h3>
                  <p className="text-xs opacity-50 mt-1">Standard Schedule: 30% / 50% / 20%</p>
                </div>
                <div className="p-6 space-y-5">
                  {/* Milestone 1 */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold uppercase opacity-60">🏭 Milestone 1 — Production</span>
                      <span className="text-sm font-black text-primary">30%</span>
                    </div>
                    <progress className="progress progress-primary w-full h-3" value={30} max={100} />
                    <p className="text-[10px] opacity-40 mt-1">Released immediately when buyer deposits.</p>
                  </div>
                  {/* Milestone 2 */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold uppercase opacity-60">📦 Milestone 2 — Delivery</span>
                      <span className="text-sm font-black text-info">50%</span>
                    </div>
                    <progress className="progress progress-info w-full h-3" value={50} max={100} />
                    <p className="text-[10px] opacity-40 mt-1">Released when buyer confirms physical delivery.</p>
                  </div>
                  {/* Milestone 3 */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold uppercase opacity-60">✅ Milestone 3 — Inspection</span>
                      <span className="text-sm font-black text-success">20%</span>
                    </div>
                    <progress className="progress progress-success w-full h-3" value={20} max={100} />
                    <p className="text-[10px] opacity-40 mt-1">
                      Released after final quality check (or auto-claimed in 14 days).
                    </p>
                  </div>

                  <div className="divider my-2" />

                  {/* Preset Schedules */}
                  <div>
                    <p className="text-xs font-bold uppercase opacity-50 mb-3">Available Preset Schedules</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-base-200 p-3 rounded-sm text-center border border-base-300">
                        <p className="text-xs font-bold">🏭 Standard</p>
                        <p className="text-lg font-black text-primary">30/50/20</p>
                      </div>
                      <div className="bg-base-200 p-3 rounded-sm text-center border border-base-300">
                        <p className="text-xs font-bold">🛡️ Low-Risk</p>
                        <p className="text-lg font-black text-primary">10/70/20</p>
                      </div>
                      <div className="bg-base-200 p-3 rounded-sm text-center border border-base-300">
                        <p className="text-xs font-bold">⚙️ High-Upfront</p>
                        <p className="text-lg font-black text-primary">40/40/20</p>
                      </div>
                      <div className="bg-base-200 p-3 rounded-sm text-center border border-base-300">
                        <p className="text-xs font-bold">🔧 Equipment</p>
                        <p className="text-lg font-black text-primary">20/20/60</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Safety Mechanisms */}
              <div className="card bg-base-100 shadow-lg border border-base-content/10 rounded-sm mt-6 overflow-hidden">
                <div className="card-body p-6">
                  <h3 className="font-bold text-sm uppercase opacity-50 mb-4 flex items-center gap-2">
                    <ShieldCheckIcon className="h-4 w-4" />
                    Built-In Safety Mechanisms
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 rounded-full bg-warning/10 text-warning shrink-0 mt-0.5">
                        <ClockIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">24-Hour Acceptance Window</p>
                        <p className="text-xs opacity-50">
                          Offers auto-expire if the seller doesn&apos;t accept in time.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 rounded-full bg-error/10 text-error shrink-0 mt-0.5">
                        <ExclamationTriangleIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Buyer Deadline Claim</p>
                        <p className="text-xs opacity-50">
                          If the seller misses the delivery deadline, the buyer reclaims remaining funds.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 rounded-full bg-success/10 text-success shrink-0 mt-0.5">
                        <BanknotesIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Seller Auto-Claim</p>
                        <p className="text-xs opacity-50">
                          If the buyer does not respond after delivery or inspection, the seller can claim after the
                          deadline/14-day period.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 rounded-full bg-info/10 text-info shrink-0 mt-0.5">
                        <LockClosedIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Reentrancy Protection</p>
                        <p className="text-xs opacity-50">
                          All fund transfers are guarded by OpenZeppelin&apos;s ReentrancyGuard.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </FadeInSection>

      {/* ═══════ USER ROLES ═══════ */}
      <FadeInSection>
        <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-16 sm:mb-24">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-4xl font-black mb-4">Who Is This For?</h2>
            <p className="text-base sm:text-lg opacity-60 max-w-2xl mx-auto">
              Three distinct roles, one transparent protocol.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <RoleCard
              emoji="📦"
              title="Buyers"
              accent="border-t-primary"
              features={[
                "Create escrow contracts with custom payment schedules",
                "Upload and pin Purchase Orders to IPFS",
                "Verify seller & arbitrator addresses via QR code scan",
                "Track real-time production and logistics status",
                "Confirm delivery to release milestone payments",
                "14-day inspection window before final payment",
                "Receive Machine Passport NFT upon completion",
                "Raise disputes with IPFS-pinned evidence if issues arise",
                "Auto-reclaim funds if delivery deadline is missed",
              ]}
            />
            <RoleCard
              emoji="⚙️"
              title="Sellers"
              accent="border-t-warning"
              features={[
                "Review and accept contract terms within 24 hours",
                "Receive upfront production payment immediately on funding",
                "Post production evidence and progress updates (pinned to IPFS)",
                "Mark production as finished when manufacturing completes",
                "Submit shipping carrier and tracking number on-chain",
                "Upload Bill of Lading as shipping proof",
                "Receive delivery milestone upon buyer confirmation",
                "Auto-claim final payment after 14-day inspection period",
                "All production logs batch-committed to blockchain on shipment",
              ]}
            />
            <RoleCard
              emoji="⚖️"
              title="Arbitrators"
              accent="border-t-error"
              features={[
                "Designated as a neutral third party at contract creation",
                "Access dedicated Arbitration Dashboard",
                "Review all dispute details: buyer, seller, PO documents",
                "Examine IPFS-pinned dispute statements and evidence",
                "Render final judgment: release to seller or refund to buyer",
                "Judgment is on-chain, final, and releases all remaining funds",
                "View disputed amount and full contract context",
              ]}
            />
          </div>
        </section>
      </FadeInSection>

      {/* ═══════ TECH STACK ═══════ */}
      <FadeInSection>
        <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-16 sm:mb-24">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-4xl font-black mb-4">Technical Architecture</h2>
            <p className="text-base sm:text-lg opacity-60 max-w-2xl mx-auto">
              Built on battle-tested Web3 infrastructure, designed for industrial-grade reliability.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Smart Contracts */}
            <div className="card bg-base-100 shadow-xl border border-base-content/10 rounded-sm overflow-hidden">
              <div className="bg-primary/10 p-5 border-b border-primary/20">
                <h3 className="font-black text-lg flex items-center gap-2">
                  <WrenchScrewdriverIcon className="h-6 w-6 text-primary" />
                  Smart Contracts (Solidity ^0.8.20)
                </h3>
              </div>
              <div className="card-body p-6 space-y-4">
                <div className="bg-base-200 p-4 rounded-sm border border-base-300">
                  <h4 className="font-bold text-sm flex items-center gap-2 mb-2">
                    <CubeIcon className="h-4 w-4 text-primary" />
                    EscrowFactory.sol
                  </h4>
                  <p className="text-xs opacity-60 leading-relaxed">
                    Factory contract that deploys SupplyChainEscrow instances via OpenZeppelin Clones (minimal proxy
                    pattern) for gas-efficient deployment. Tracks all escrows, maps buyer/seller addresses, and
                    orchestrates Machine Passport NFT minting.
                  </p>
                </div>
                <div className="bg-base-200 p-4 rounded-sm border border-base-300">
                  <h4 className="font-bold text-sm flex items-center gap-2 mb-2">
                    <ShieldCheckIcon className="h-4 w-4 text-primary" />
                    SupplyChainEscrow.sol
                  </h4>
                  <p className="text-xs opacity-60 leading-relaxed">
                    Core escrow logic: milestone-based payment releases, production lifecycle (accept → produce → ship →
                    deliver → complete), deadline-based claims, dispute raising/resolution, and Reentrancy Guard
                    protection. Uses Initializable pattern for proxy compatibility.
                  </p>
                </div>
                <div className="bg-base-200 p-4 rounded-sm border border-base-300">
                  <h4 className="font-bold text-sm flex items-center gap-2 mb-2">
                    <IdentificationIcon className="h-4 w-4 text-primary" />
                    MachinePassport.sol
                  </h4>
                  <p className="text-xs opacity-60 leading-relaxed">
                    ERC-721 NFT contract (extends ERC721URIStorage + ERC721Enumerable). Minted automatically on escrow
                    completion. Stores metadata URI linking to IPFS-pinned provenance data: item specs, manufacturer,
                    creation date, and PO reference.
                  </p>
                </div>
              </div>
            </div>

            {/* Frontend & Infra */}
            <div className="space-y-6">
              <div className="card bg-base-100 shadow-xl border border-base-content/10 rounded-sm overflow-hidden">
                <div className="bg-secondary/10 p-5 border-b border-secondary/20">
                  <h3 className="font-black text-lg flex items-center gap-2">
                    <DocumentMagnifyingGlassIcon className="h-6 w-6 text-secondary" />
                    Frontend & Infrastructure
                  </h3>
                </div>
                <div className="card-body p-6">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Framework", value: "Next.js" },
                      { label: "Blockchain", value: "Monad (EVM)" },
                      { label: "Scaffold", value: "Scaffold-ETH 2" },
                      { label: "Wallet", value: "RainbowKit + wagmi" },
                      { label: "Storage", value: "IPFS (Pinata)" },
                      { label: "Styling", value: "Tailwind + DaisyUI" },
                      { label: "Contracts", value: "Hardhat" },
                      { label: "NFT Standard", value: "ERC-721" },
                    ].map((item, i) => (
                      <div key={i} className="bg-base-200 p-3 rounded-sm border border-base-300">
                        <p className="text-[10px] uppercase font-bold opacity-40">{item.label}</p>
                        <p className="text-sm font-bold mt-0.5">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="card bg-base-100 shadow-xl border border-base-content/10 rounded-sm overflow-hidden">
                <div className="card-body p-6">
                  <h3 className="font-bold text-sm uppercase opacity-50 mb-3 flex items-center gap-2">
                    <QrCodeIcon className="h-4 w-4" />
                    Additional Features
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircleIcon className="h-4 w-4 text-success shrink-0 mt-0.5" />
                      <p className="text-sm opacity-70">
                        <span className="font-bold">QR Code Verification</span> — Scan wallet QR codes to verify or
                        auto-fill seller/arbitrator addresses during contract creation.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircleIcon className="h-4 w-4 text-success shrink-0 mt-0.5" />
                      <p className="text-sm opacity-70">
                        <span className="font-bold">Analytics Dashboard</span> — Real-time stats: total escrows, volume,
                        pending actions, completion times, order activity bar charts, and status breakdowns with donut
                        charts.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircleIcon className="h-4 w-4 text-success shrink-0 mt-0.5" />
                      <p className="text-sm opacity-70">
                        <span className="font-bold">Advanced Order Filtering</span> — Search, filter by status/role/date
                        range, sort by amount or date, with active/completed tabs.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircleIcon className="h-4 w-4 text-success shrink-0 mt-0.5" />
                      <p className="text-sm opacity-70">
                        <span className="font-bold">Carrier Integration</span> — Direct tracking links for FedEx, UPS,
                        DHL, and Maersk shipments.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircleIcon className="h-4 w-4 text-success shrink-0 mt-0.5" />
                      <p className="text-sm opacity-70">
                        <span className="font-bold">Cancellation Support</span> — Either party can cancel before
                        funding. Buyer can withdraw expired offers.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </FadeInSection>

      {/* ═══════ FAQ ═══════ */}
      <FadeInSection>
        <section className="max-w-3xl mx-auto px-4 sm:px-6 mb-16 sm:mb-24">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-4xl font-black mb-4">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-3">
            <FAQItem
              question="What happens if the seller doesn't accept the contract?"
              answer="The seller has a 24-hour window to accept the contract terms. If the window expires, the offer becomes void. The buyer can cancel the expired contract at zero cost, and no funds are at risk since the deposit hasn't been made yet."
            />
            <FAQItem
              question="How are milestone percentages configured?"
              answer="When creating a contract, the buyer selects from four preset payment schedules: Standard (30/50/20), Low-Risk (10/70/20), High-Upfront (40/40/20), or Equipment (20/20/60). The first number is the production milestone, the second is the delivery milestone, and the third is the final inspection milestone. Milestone 1 must be between 10-50%, Milestone 2 between 10-70%, and the sum of the first two cannot exceed 90%."
            />
            <FAQItem
              question="What is a Machine Passport?"
              answer="A Machine Passport is an ERC-721 NFT (non-fungible token) automatically minted when an escrow contract is completed. It acts as a digital twin for the industrial asset, storing metadata on IPFS including the item name, quantity, manufacturer address, creation date, and a link to the original Purchase Order. It provides permanent, on-chain provenance for the asset."
            />
            <FAQItem
              question="How does the dispute resolution process work?"
              answer="Either the buyer or seller can raise a dispute at any point before the contract is completed. They provide a written statement which is pinned to IPFS. Once a dispute is raised, all payments and logistics are frozen. The pre-assigned arbitrator reviews the evidence through the Arbitration Dashboard and renders a final judgment — either releasing all remaining funds to the seller or refunding them to the buyer."
            />
            <FAQItem
              question="What if the buyer doesn't confirm delivery or complete the contract?"
              answer="Two safety mechanisms protect the seller: (1) If the buyer doesn't respond after shipping and the delivery deadline passes, the seller can claim the remaining funds. (2) If the buyer confirms delivery but doesn't complete the final inspection within 14 days, the seller can auto-claim the final payment. In both cases, a Machine Passport NFT is minted for the buyer."
            />
            <FAQItem
              question="What if the seller doesn't deliver by the deadline?"
              answer="If the seller hasn't shipped the item and the delivery deadline has passed, the buyer can reclaim all remaining funds in the escrow via the BuyerclaimAfterDeadline function. The production payment already released to the seller is not recoverable through this mechanism."
            />
            <FAQItem
              question="What documents are stored on IPFS?"
              answer="Four types of documents are stored on IPFS: (1) Purchase Orders uploaded during contract creation, (2) Production evidence photos/reports uploaded by the seller during manufacturing, (3) Bill of Lading/shipping documents uploaded before marking as shipped, and (4) Dispute statements filed by either party. All documents are pinned via Pinata for persistent availability."
            />
            <FAQItem
              question="What blockchain network does Supply-OnChain run on?"
              answer="Supply-OnChain is deployed on the Monad network, an EVM-compatible blockchain. The native token MON is used for all escrow transactions. Wallet connectivity is provided through RainbowKit, supporting MetaMask and other popular Web3 wallets."
            />
          </div>
        </section>
      </FadeInSection>

      {/* ═══════ CTA ═══════ */}
      <FadeInSection>
        <section className="max-w-4xl mx-auto px-4 sm:px-6 mb-8">
          <div className="card bg-gradient-to-br from-primary/20 to-secondary/20 shadow-2xl border border-primary/20 rounded-sm overflow-hidden">
            <div className="card-body p-8 sm:p-12 text-center">
              <h2 className="text-2xl sm:text-4xl font-black mb-4">Ready to Secure Your Supply Chain?</h2>
              <p className="text-base sm:text-lg opacity-60 max-w-xl mx-auto mb-8">
                Connect your wallet and deploy your first escrow contract in minutes. No intermediaries, no trust
                assumptions — just transparent, programmable trade.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link
                  href="/create"
                  className="btn btn-primary btn-lg px-10 text-lg shadow-lg hover:scale-105 transition-transform rounded-sm"
                >
                  Create Escrow
                  <ArrowRightIcon className="h-5 w-5 ml-1" />
                </Link>
                <Link href="/dashboard" className="btn btn-outline btn-lg px-10 text-lg rounded-sm">
                  View Dashboard
                </Link>
              </div>
            </div>
          </div>
        </section>
      </FadeInSection>
    </div>
  );
};

export default AboutPage;
