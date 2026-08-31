import React from 'react';
import {
  X,
  Lock,
  Clock,
  ShieldCheck,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { User, WithdrawalRequest } from '../../types';

interface FrozenAssetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  withdrawals: WithdrawalRequest[];
}

export const FrozenAssetsModal: React.FC<FrozenAssetsModalProps> = ({
  isOpen,
  onClose,
  user,
  withdrawals = []
}) => {
  if (!isOpen) return null;

  const safeWithdrawals = withdrawals || [];
  const pendingWd = safeWithdrawals.filter(w => w.status === 'Pending');

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        id="frozen-assets-modal"
        className="w-full max-w-lg bg-[#0f1015] border border-neutral-800 rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800/80 flex items-center justify-between bg-neutral-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold">
              <Lock size={16} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white">Frozen Assets Breakdown</h2>
              <p className="text-[10px] text-neutral-400">Reserved balances & pending withdrawal audits</p>
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
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Main Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1b1712] to-[#12131a] border border-amber-500/30">
            <span className="text-[11px] text-neutral-400 block font-medium">Total Currently Frozen</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-amber-300">
                ${user?.frozenBalance.toFixed(2) || '0.00'}
              </span>
              <span className="text-xs text-neutral-400">USDT</span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-2 leading-relaxed">
              Frozen assets remain part of your <strong>Total Assets (${user?.totalAssets.toFixed(2)})</strong> and count towards your VIP Tier calculation and daily income yield generation until finalized.
            </p>
          </div>

          {/* Pending Queue Items */}
          <div className="space-y-2.5">
            <h4 className="font-extrabold text-white uppercase tracking-wider text-[11px]">Active Locks & Queues</h4>
            {pendingWd.length === 0 ? (
              <div className="p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800 text-neutral-400 text-center">
                No active pending withdrawals or locked orders.
              </div>
            ) : (
              pendingWd.map(w => (
                <div key={w.id} className="p-3.5 rounded-2xl bg-[#14161f] border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Withdrawal Hold (#{w.txId})</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      Pending Audit
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-400 text-[11px]">
                    <span>Hold Amount: <strong className="text-white">${w.amount.toFixed(2)}</strong></span>
                    <span>Net to Receive: <strong className="text-[#00D26A]">${w.netAmount.toFixed(2)}</strong></span>
                  </div>
                  <span className="text-[10px] text-neutral-500 block">Submitted: {new Date(w.createdAt).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
