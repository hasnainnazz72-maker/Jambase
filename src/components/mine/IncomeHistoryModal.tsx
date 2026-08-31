import React, { useState } from 'react';
import {
  X,
  TrendingUp,
  Calendar,
  Sparkles,
  CheckCircle2,
  Filter,
  DollarSign,
  Users,
  Award
} from 'lucide-react';
import { IncomeRecord, User } from '../../types';

interface IncomeHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: IncomeRecord[];
  user: User | null;
}

export const IncomeHistoryModal: React.FC<IncomeHistoryModalProps> = ({
  isOpen,
  onClose,
  records = [],
  user
}) => {
  const [filter, setFilter] = useState<'all' | 'vip_profit' | 'team_commission'>('all');

  if (!isOpen) return null;

  const safeRecords = records || [];
  const filtered = safeRecords.filter(r => {
    if (filter === 'all') return true;
    if (filter === 'vip_profit') return r.categoryType === 'vip_profit' || r.categoryType === 'ticket';
    if (filter === 'team_commission') return r.categoryType === 'team_commission';
    return true;
  });

  const vipProfitTotal = safeRecords
    .filter(r => r.categoryType === 'vip_profit' || r.categoryType === 'ticket')
    .reduce((sum, r) => sum + (r.incomeAmount || 0), 0);

  const teamCommissionTotal = safeRecords
    .filter(r => r.categoryType === 'team_commission')
    .reduce((sum, r) => sum + (r.incomeAmount || 0), 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        id="income-history-modal"
        className="w-full max-w-lg bg-[#0f1015] border border-neutral-800 rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800/80 flex items-center justify-between bg-neutral-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#00D26A]/20 border border-[#00D26A]/40 text-[#00D26A] flex items-center justify-center font-bold">
              <TrendingUp size={16} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white">Earning Ledgers & Income History</h2>
              <p className="text-[10px] text-neutral-400">Additive VIP Profits, Team Rebates & Unique TX IDs</p>
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
          {/* Summary Box with Separate Totals */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#121c17] to-[#0e1218] border border-[#00D26A]/30 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] text-neutral-400 block font-medium">Total Earned Income</span>
                <span className="text-2xl font-extrabold text-[#00D26A]">
                  ${(user?.totalEarnedIncome ?? 84.50).toFixed(2)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-neutral-400 block font-medium">Current VIP Tier</span>
                <span className="text-xs font-black text-white px-2 py-0.5 rounded bg-[#00D26A]/20 text-[#00D26A] border border-[#00D26A]/30">
                  VIP {user?.vipLevel || 1}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-neutral-800/80 text-xs">
              <div className="p-2.5 rounded-xl bg-black/40 border border-neutral-800">
                <span className="text-[10px] text-neutral-400 block">VIP Profit Ledger:</span>
                <span className="font-extrabold text-[#00D26A]">
                  ${(user?.totalVipProfit ?? vipProfitTotal ?? 54.50).toFixed(2)} USDT
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/40 border border-neutral-800">
                <span className="text-[10px] text-neutral-400 block">Team Commission Ledger:</span>
                <span className="font-extrabold text-amber-400">
                  ${(user?.totalTeamCommission ?? teamCommissionTotal ?? 30.00).toFixed(2)} USDT
                </span>
              </div>
            </div>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold scrollbar-none">
            {[
              { id: 'all', label: 'All Ledgers' },
              { id: 'vip_profit', label: 'VIP Profit Yields' },
              { id: 'team_commission', label: 'Team Commissions' }
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
              No income records found for this category.
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((record) => {
                const isCommission = record.categoryType === 'team_commission';
                return (
                  <div
                    key={record.id}
                    className={`p-4 rounded-2xl bg-[#14161f] border space-y-2.5 text-xs ${
                      isCommission ? 'border-amber-500/30' : 'border-[#00D26A]/25'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-white leading-tight">{record.ticketName}</h4>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase ${
                              isCommission
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-[#00D26A]/20 text-[#00D26A] border border-[#00D26A]/30'
                            }`}
                          >
                            {isCommission ? `Tier ${record.commissionTier || 1} Rebate` : `VIP ${record.vipLevel} Yield`}
                          </span>
                        </div>
                        <span className="text-[10px] text-neutral-400 mt-0.5 block">
                          Rate: {(record.dailyRate * 100).toFixed(1)}% {isCommission ? 'Rebate Dividend' : 'Configured VIP Yield'}
                        </span>
                      </div>
                      <span className={`text-base font-extrabold ${isCommission ? 'text-amber-400' : 'text-[#00D26A]'}`}>
                        +${record.incomeAmount.toFixed(2)}
                      </span>
                    </div>

                    {record.notes && (
                      <p className="text-[11px] text-neutral-300 bg-black/30 p-2 rounded-xl border border-neutral-800/80">
                        {record.notes}
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-400 pt-2 border-t border-neutral-800/80">
                      <div>
                        Previous Balance: <strong className="text-neutral-300">${record.previousBalance.toFixed(2)}</strong>
                      </div>
                      <div>
                        New Balance: <strong className="text-[#00D26A]">${record.newBalance.toFixed(2)}</strong>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-neutral-500 pt-1 border-t border-neutral-800/60 font-mono">
                      <span>TX: {record.transactionId}</span>
                      <span>{new Date(record.timestamp).toLocaleDateString()} {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC</span>
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
