import React, { useState } from 'react';
import {
  X,
  FileText,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  Ticket,
  CheckCircle2,
  Clock,
  XCircle,
  Filter
} from 'lucide-react';
import { Transaction } from '../../types';

interface TransactionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
}

export const TransactionHistoryModal: React.FC<TransactionHistoryModalProps> = ({
  isOpen,
  onClose,
  transactions = []
}) => {
  const [filter, setFilter] = useState<'all' | 'deposit' | 'withdrawal' | 'ticket_purchase' | 'vip_profit' | 'team_commission' | 'task_reward'>('all');

  if (!isOpen) return null;

  const safeTransactions = transactions || [];
  const filtered = safeTransactions.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'vip_profit') return t.type === 'vip_profit' || t.category === 'vip_profit' || t.type === 'daily_income';
    if (filter === 'team_commission') return t.type === 'team_commission' || t.category === 'team_commission' || t.type === 'referral_commission';
    return t.type === filter || t.category === filter;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        id="transaction-history-modal"
        className="w-full max-w-lg bg-[#0f1015] border border-neutral-800 rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800/80 flex items-center justify-between bg-neutral-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-neutral-800 border border-neutral-700 text-white flex items-center justify-center font-bold">
              <FileText size={16} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white">Transaction History</h2>
              <p className="text-[10px] text-neutral-400">All Account Balance Debits & Credits (Unique TX IDs)</p>
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
          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold scrollbar-none">
            {[
              { id: 'all', label: 'All' },
              { id: 'vip_profit', label: 'VIP Profit' },
              { id: 'team_commission', label: 'Team Commission' },
              { id: 'ticket_purchase', label: 'Purchases' },
              { id: 'deposit', label: 'Deposits' },
              { id: 'withdrawal', label: 'Withdrawals' },
              { id: 'task_reward', label: 'Rewards' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors ${
                  filter === f.id
                    ? 'bg-[#00D26A] text-black font-bold shadow'
                    : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="p-10 text-center text-xs text-neutral-500 bg-neutral-900/40 rounded-2xl border border-neutral-800">
              No transactions found.
            </div>
          ) : (
            <div className="space-y-2.5">
              {filtered.map((tx) => {
                const isCommission = tx.type === 'team_commission' || tx.category === 'team_commission';
                const isVipProfit = tx.type === 'vip_profit' || tx.category === 'vip_profit' || tx.type === 'daily_income';
                const isPositive = tx.type === 'deposit' || isVipProfit || tx.type === 'task_reward' || isCommission;

                return (
                  <div
                    key={tx.id}
                    className={`p-3.5 rounded-2xl bg-[#14161f] border flex items-center justify-between gap-3 text-xs ${
                      isCommission
                        ? 'border-amber-500/30'
                        : isVipProfit
                        ? 'border-[#00D26A]/30'
                        : 'border-neutral-800'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white truncate">{tx.title}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase ${
                            tx.status === 'completed'
                              ? isCommission
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-[#00D26A]/15 text-[#00D26A]'
                              : tx.status === 'pending'
                              ? 'bg-amber-500/15 text-amber-300'
                              : 'bg-red-500/15 text-red-400'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-0.5 truncate">{tx.description}</p>
                      <div className="flex items-center justify-between text-[10px] text-neutral-500 mt-1 font-mono">
                        <span>ID: {tx.id}</span>
                        <span>{new Date(tx.createdAt).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-2">
                      <span className={`text-sm font-extrabold ${
                        isCommission ? 'text-amber-400' : isPositive ? 'text-[#00D26A]' : 'text-neutral-200'
                      }`}>
                        {isPositive ? '+' : '-'}${tx.amount.toFixed(2)}
                      </span>
                    </div>
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
