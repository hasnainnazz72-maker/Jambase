import React, { useState } from 'react';
import {
  X,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle,
  Filter,
  Copy,
  Check,
  AlertTriangle
} from 'lucide-react';
import { WithdrawalRequest, User } from '../../types';

interface WithdrawalHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  withdrawals: WithdrawalRequest[];
  user: User | null;
}

export const WithdrawalHistoryModal: React.FC<WithdrawalHistoryModalProps> = ({
  isOpen,
  onClose,
  withdrawals = [],
  user
}) => {
  const [filter, setFilter] = useState<'all' | 'Pending' | 'Completed' | 'Rejected'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const safeWithdrawals = withdrawals || [];
  const filtered = safeWithdrawals.filter(w => filter === 'all' || w.status === filter);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        id="withdrawal-history-modal"
        className="w-full max-w-lg bg-[#0f1015] border border-neutral-800 rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800/80 flex items-center justify-between bg-neutral-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-neutral-800 border border-neutral-700 text-white flex items-center justify-center font-bold">
              <ArrowUpRight size={16} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white">Withdrawal History</h2>
              <p className="text-[10px] text-neutral-400">Status, Net Payouts & Transaction IDs</p>
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
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {/* Status Filter Chips */}
          <div className="flex items-center gap-1.5 p-1 bg-neutral-900 rounded-xl border border-neutral-800 text-xs font-semibold">
            {(['all', 'Pending', 'Completed', 'Rejected'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 py-1.5 rounded-lg capitalize transition-colors ${
                  filter === f ? 'bg-[#00D26A] text-black font-bold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="p-10 text-center text-xs text-neutral-500 bg-neutral-900/40 rounded-2xl border border-neutral-800">
              No withdrawal records found.
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((wd) => {
                const isPending = wd.status === 'Pending';
                const isCompleted = wd.status === 'Completed' || wd.status === 'Approved';
                const isRejected = wd.status === 'Rejected';

                return (
                  <div
                    key={wd.id}
                    className="p-4 rounded-2xl bg-[#14161f] border border-neutral-800 space-y-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white text-sm">
                          ${wd.amount.toFixed(2)} USDT
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">
                          {wd.network}
                        </span>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 ${
                          isCompleted
                            ? 'bg-[#00D26A]/15 text-[#00D26A] border border-[#00D26A]/30'
                            : isPending
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            : 'bg-red-500/15 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {isCompleted && <CheckCircle2 size={11} />}
                        {isPending && <Clock size={11} />}
                        {isRejected && <XCircle size={11} />}
                        {wd.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-400 pt-1 border-t border-neutral-800/80">
                      <div>
                        Platform Fee (15%): <strong className="text-neutral-200">${wd.fee.toFixed(2)}</strong>
                      </div>
                      <div>
                        Net Payout: <strong className="text-[#00D26A] font-bold">${wd.netAmount.toFixed(2)}</strong>
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-black/60 border border-neutral-800/80 flex items-center justify-between text-[10px] font-mono text-neutral-400">
                      <span className="truncate max-w-[240px]">Addr: {wd.walletAddress}</span>
                      <button
                        onClick={() => handleCopy(wd.walletAddress, wd.id)}
                        className="text-neutral-400 hover:text-white shrink-0 ml-1"
                        title="Copy Address"
                      >
                        {copiedId === wd.id ? <Check size={11} className="text-[#00D26A]" /> : <Copy size={11} />}
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-neutral-500">
                      <span>TXID: {wd.txId}</span>
                      <span>{new Date(wd.createdAt).toLocaleString()}</span>
                    </div>

                    {wd.rejectReason && (
                      <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-[10px]">
                        Reason: {wd.rejectReason}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
