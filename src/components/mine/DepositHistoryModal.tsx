import React, { useState } from 'react';
import {
  X,
  ArrowDownLeft,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  QrCode
} from 'lucide-react';
import { DepositRequest } from '../../types';

interface DepositHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  deposits: DepositRequest[];
}

export const DepositHistoryModal: React.FC<DepositHistoryModalProps> = ({
  isOpen,
  onClose,
  deposits
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        id="deposit-history-modal"
        className="w-full max-w-lg bg-[#0f1015] border border-neutral-800 rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800/80 flex items-center justify-between bg-neutral-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#00D26A]/20 border border-[#00D26A]/40 text-[#00D26A] flex items-center justify-center font-bold">
              <ArrowDownLeft size={16} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white">Deposit History</h2>
              <p className="text-[10px] text-neutral-400">Recharges, Networks & Blockchain Hashes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800/80 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {deposits.length === 0 ? (
            <div className="p-10 text-center text-xs text-neutral-500 bg-neutral-900/40 rounded-2xl border border-neutral-800">
              No deposit records found.
            </div>
          ) : (
            deposits.map((dep) => (
              <div
                key={dep.id}
                className="p-4 rounded-2xl bg-[#14161f] border border-neutral-800 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-[#00D26A] text-sm">
                      +{dep.amount.toLocaleString()} ETB
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">
                      {dep.bankName || 'CBE Bank'}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#00D26A]/15 text-[#00D26A] border border-[#00D26A]/30 flex items-center gap-1">
                    <CheckCircle2 size={10} /> {dep.status}
                  </span>
                </div>

                {(dep.referenceNumber || dep.txHash) && (
                  <div className="p-2 rounded-xl bg-black/60 border border-neutral-800/80 flex items-center justify-between text-[10px] font-mono text-neutral-400">
                    <span className="truncate max-w-[240px]">Ref: {dep.referenceNumber || dep.txHash}</span>
                    <button
                      onClick={() => handleCopy((dep.referenceNumber || dep.txHash)!, dep.id)}
                      className="text-neutral-400 hover:text-white shrink-0 ml-1"
                    >
                      {copiedId === dep.id ? <Check size={11} className="text-[#00D26A]" /> : <Copy size={11} />}
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between text-[10px] text-neutral-500 pt-1 border-t border-neutral-800/60">
                  <span>ID: {dep.id}</span>
                  <span>{new Date(dep.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
