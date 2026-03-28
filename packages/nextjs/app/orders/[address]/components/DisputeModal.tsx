"use client";

import React from "react";
import { DocumentCheckIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  disputeReasonText: string;
  setDisputeReasonText: (text: string) => void;
  onSubmit: () => void;
  isDisputing: boolean;
}

export function DisputeModal({
  isOpen,
  onClose,
  disputeReasonText,
  setDisputeReasonText,
  onSubmit,
  isDisputing,
}: DisputeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-base-100 w-full max-w-lg rounded-sm shadow-2xl border border-error/20 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-error/10 p-6 border-b border-error/20">
          <h3 className="font-black text-2xl flex items-center gap-2 text-error">
            <ExclamationTriangleIcon className="h-8 w-8" />
            Raise Dispute Issue
          </h3>
          <p className="text-sm opacity-80 mt-2">
            This action will immediately freeze the contract and block all payments. The assigned Arbitrator will be
            notified to review the case.
          </p>
        </div>

        <div className="p-6">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-bold">Statement of Dispute</span>
            </label>
            <textarea
              className="textarea textarea-bordered h-32 focus:textarea-error rounded-sm text-sm"
              placeholder="Provide a detailed explanation of the issue (e.g., defective item, missing components, severe delay). This statement will be pinned to IPFS and visible to the Arbitrator."
              value={disputeReasonText}
              onChange={e => setDisputeReasonText(e.target.value)}
            ></textarea>
          </div>
          <div className="flex gap-2 items-start mt-4 bg-base-200 p-3 rounded-sm text-xs opacity-70">
            <DocumentCheckIcon className="h-4 w-4 shrink-0 mt-0.5" />
            <p>
              Your statement will be permanently recorded. Be objective and describe the specific terms that were
              violated.
            </p>
          </div>
        </div>

        <div className="bg-base-200/50 p-4 border-t flex justify-end gap-3">
          <button className="btn btn-ghost rounded-sm" onClick={onClose} disabled={isDisputing}>
            Cancel
          </button>
          <button
            className="btn btn-error rounded-sm px-8"
            onClick={onSubmit}
            disabled={isDisputing || !disputeReasonText.trim()}
          >
            {isDisputing && <span className="loading loading-spinner loading-sm"></span>}
            {isDisputing ? "Filing on IPFS..." : "Submit Dispute Request"}
          </button>
        </div>
      </div>
    </div>
  );
}
