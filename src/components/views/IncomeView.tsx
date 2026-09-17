import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Sparkles, RefreshCw, AlertCircle, ChevronRight, CheckCircle2, DollarSign, Clock, Ticket, ArrowUpRight, Gift, Timer, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { IncomeResponse, api } from '../../services/api';
import { User, TicketPurchase } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';

interface IncomeViewProps {
  incomeData: IncomeResponse | null;
  purchases: TicketPurchase[];
  onRefresh: () => void;
  onNavigateTab: (tab: any) => void;
}

export const IncomeView: React.FC<IncomeViewProps> = ({
  incomeData,
  purchases,
  onRefresh,
  onNavigateTab
}) => {
  const { t } = useLanguage();
  const [claiming, setClaiming] = useState(false);
  const [claimMsg, setClaimMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const [utcCountdown, setUtcCountdown] = useState('');
  const [nowTime, setNowTime] = useState<number>(Date.now());

  const user = incomeData?.user;
  const summary = incomeData?.summary;
  const records = incomeData?.records || [];

  const totalAssets = summary?.totalAssets ?? ((user?.balance ?? 0) + (user?.frozenBalance ?? 0));
  const availableBalance = summary?.availableBalance ?? (user?.balance ?? 0);
  const frozenAssets = summary?.frozenAssets ?? (user?.frozenBalance ?? 0);

  const startingDailyBalance = incomeData?.dailyTicketStartingBalance ?? (availableBalance + (incomeData?.dailyTicketSpent || 0));
  const spentToday = incomeData?.dailyTicketSpent ?? (user?.dailyTicketSpent || 0);
  const remainingTicketBalance = Math.max(0, Number((startingDailyBalance - spentToday).toFixed(2)));
  const dailyUsagePercent = startingDailyBalance > 0 ? Math.min(100, Math.round((spentToday / startingDailyBalance) * 100)) : 0;

  // Percentage calculations for donut chart
  const availablePercent = totalAssets > 0 ? Math.round((availableBalance / totalAssets) * 100) : 100;

  // Active / Frozen ticket purchases
  const activePurchases = purchases.filter(p => p.status === 'active' || p.status === 'frozen');
  const todayPurchasedAmount = activePurchases.reduce((sum, p) => sum + p.totalAmount, 0);
  const todayTicketProfit = Number(activePurchases.reduce((sum, p) => sum + (p.profitAmount || 0), 0).toFixed(2));

  const todayUtc = new Date().toISOString().slice(0, 10);
  const isClaimedToday = user?.lastProfitClaimDate === todayUtc;

  // Auto-settle handler
  const handleAutoSettle = useCallback(async () => {
    try {
      const res = await api.settleTickets();
      if (res.settled) {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });
        setClaimMsg({
          text: '🎉 Order Settled! Principal returned to your Available Balance.'
        });
        onRefresh();
      }
    } catch {}
  }, [onRefresh]);

  // Live 1-second timer ticker for countdown
  useEffect(() => {
    const timer = setInterval(() => {
      const current = Date.now();
      setNowTime(current);

      // UTC Countdown
      const now = new Date();
      const nextUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
      const diffMs = nextUtc.getTime() - now.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diffMs % (1000 * 60)) / 1000);
      setUtcCountdown(`${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);

      // Check if any active/frozen ticket has reached 0
      const hasReadyTicket = activePurchases.some(p => {
        if (p.status === 'frozen' && p.frozenUntil) {
          return current >= new Date(p.frozenUntil).getTime();
        }
        return false;
      });

      if (hasReadyTicket) {
        handleAutoSettle();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [activePurchases, handleAutoSettle]);

  // VIP Daily Grab Claim
  const handleClaimProfit = async () => {
    if (claiming) return;
    setClaiming(true);
    setClaimMsg(null);

    try {
      const res = await api.claimDailyVipIncome();
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 }
      });
      setClaimMsg({
        text: res.message || `Successfully claimed $${res.totalProfit.toFixed(2)} USDT Grab income!`
      });
      onRefresh();
    } catch (err: any) {
      setClaimMsg({
        text: err.message || 'Failed to claim Grab income',
        isError: true
      });
    } finally {
      setClaiming(false);
    }
  };

  const getVipRate = (lvl: number = 1) => {
    switch (lvl) {
      case 2: return 0.025;
      case 3: return 0.030;
      case 4: return 0.040;
      case 5: return 0.050;
      case 6: return 0.060;
      default: return 0.019;
    }
  };

  const currentRate = getVipRate(user?.vipLevel || 1);

  return (
    <div id="income-view-container" className="space-y-4 pb-28">
      {/* 1. TOP HEADER & UTC CYCLE COUNTER */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#DC2626] to-[#B91C1C] flex items-center justify-center text-[#FDE047] font-black text-xs shadow-md shadow-[#DC2626]/20 border border-[#E5A93C]/40">
            <DollarSign size={16} />
          </div>
          <div>
            <h2 className="text-base font-black text-white">{t('income.title', 'Member Income Hub')}</h2>
            <p className="text-[10px] text-neutral-400">Exclusive VIP Daily Compound Earnings</p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* 2. EXCLUSIVE DAILY GRAB INCOME CONSOLE */}
      <div className="rounded-3xl p-4 sm:p-5 border bg-gradient-to-br from-[#1c080a] via-[#140b0e] to-[#0c0d12] border-amber-500/40 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#DC2626] to-[#B91C1C] text-[#FDE047] flex items-center justify-center shadow-lg shadow-[#DC2626]/30 border border-[#E5A93C]/50">
              <Gift size={18} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-sm">Daily Grab Yield System</h3>
                <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-[#DC2626] to-[#B91C1C] text-[#FDE047] text-[10px] font-black border border-[#E5A93C]/40">
                  VIP {user?.vipLevel || 1}
                </span>
              </div>
              <span className="text-[11px] text-neutral-400">
                Rate: <strong className="text-[#E5A93C]">{(currentRate * 100).toFixed(1)}% Daily Yield</strong>
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">Cycle Reset</span>
            <span className="text-xs font-mono font-extrabold text-amber-300">
              {utcCountdown || '00:00:00'}
            </span>
          </div>
        </div>

        {/* Grab Feature Exclusive Guidance */}
        <div className="p-3 rounded-2xl bg-[#2a0808]/50 border border-[#DC2626]/30 text-xs text-[#FDE047] space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-[#E5A93C]">
            <Zap size={14} />
            <span>Grab Income Rules:</span>
          </div>
          <ul className="text-[11px] text-neutral-300 space-y-1 list-disc list-inside leading-relaxed">
            <li>The <strong>Grab feature is the exclusive income system</strong> for all members.</li>
            <li>Yield is calculated on your <strong>Available Balance (${availableBalance.toFixed(2)} USDT)</strong>.</li>
            <li>Generates daily income every 24 hours — cycle resets at <strong>00:00:00 UTC</strong>.</li>
          </ul>
        </div>

        {/* Live Calculation Preview */}
        {(() => {
          const expectedDailyProfit = Number((availableBalance * currentRate).toFixed(2));

          return (
            <div className="p-3.5 rounded-2xl bg-black/40 border border-neutral-800/90 space-y-2.5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[11px] text-neutral-400 block">Available Balance:</span>
                  <span className="text-base font-extrabold text-white font-mono">${availableBalance.toFixed(2)} USDT</span>
                </div>
                <div>
                  <span className="text-[11px] text-neutral-400 block">VIP {user?.vipLevel || 1} Grab Yield:</span>
                  <span className="text-base font-extrabold text-[#E5A93C] font-mono">
                    +${expectedDailyProfit.toFixed(2)} USDT <span className="text-xs text-amber-300">({(currentRate * 100).toFixed(1)}%)</span>
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-800/70 flex justify-between items-center text-[11px] text-neutral-400">
                <span>Grab claim status:</span>
                {isClaimedToday ? (
                  <span className="text-[#E5A93C] font-bold flex items-center gap-1">
                    <CheckCircle2 size={13} /> Claimed for UTC {todayUtc}
                  </span>
                ) : availableBalance < 10 ? (
                  <span className="text-amber-400 font-bold">Min $10 USDT Balance Required</span>
                ) : (
                  <span className="text-[#E5A93C] font-bold">Ready to Claim Today</span>
                )}
              </div>
            </div>
          );
        })()}

        {/* Action Button: Claim Grab Income or Open Grab Console */}
        <div className="space-y-2">
          {isClaimedToday ? (
            <div className="p-3.5 rounded-2xl bg-black/60 border border-[#DC2626]/30 text-center space-y-1">
              <div className="text-xs font-bold text-[#E5A93C] flex items-center justify-center gap-1.5">
                <CheckCircle2 size={15} />
                <span>Today's Grab Income Already Claimed!</span>
              </div>
              <p className="text-[10px] text-neutral-400">
                Next Grab cycle unlocks at <strong>00:00:00 UTC</strong> (in {utcCountdown}).
              </p>
            </div>
          ) : availableBalance < 10 ? (
            <div className="space-y-2">
              <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-800/40 text-xs text-amber-300 text-center">
                Available balance is below $10.00 USDT. Maintain at least $10.00 USDT to qualify for VIP 1 Grab income.
              </div>
              <button
                onClick={() => onNavigateTab('finance')}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#DC2626] to-[#B91C1C] hover:from-[#EF4444] hover:to-[#DC2626] text-white font-extrabold text-xs shadow-lg shadow-[#DC2626]/30 flex items-center justify-center gap-2 border border-[#E5A93C]/40"
              >
                <span>Recharge Account</span>
                <ArrowUpRight size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleClaimProfit}
              disabled={claiming}
              id="btn-claim-daily-profit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#DC2626] to-[#B91C1C] hover:from-[#EF4444] hover:to-[#DC2626] text-white font-extrabold text-sm shadow-lg shadow-[#DC2626]/30 flex items-center justify-center gap-2 transition-all active:scale-[0.99] animate-pulse border border-[#E5A93C]/40"
            >
              <Sparkles size={17} className={claiming ? "animate-spin" : ""} />
              <span>{claiming ? "Auditing & Crediting..." : `Claim Daily Grab Yield (${(currentRate * 100).toFixed(1)}%)`}</span>
            </button>
          )}

          {/* Direct link to Interactive Grab Feature */}
          <button
            onClick={() => onNavigateTab('grab')}
            className="w-full py-2.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-neutral-800 transition-colors"
          >
            <span>Open VIP Grab Center</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Claim Feedback Banner */}
        {claimMsg && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              claimMsg.isError
                ? 'bg-red-500/15 text-red-300 border border-red-500/30'
                : 'bg-[#DC2626]/15 text-[#FDE047] border border-[#DC2626]/30'
            }`}
          >
            {claimMsg.isError ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
            <span>{claimMsg.text}</span>
          </div>
        )}

        {/* Compounding Growth Simulator Table */}
        <div className="pt-2 border-t border-neutral-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-neutral-300 flex items-center gap-1">
              <Sparkles size={12} className="text-[#E5A93C]" /> Compounding Balance Projection
            </span>
            <span className="text-[10px] text-neutral-500">Based on ${(availableBalance || 100).toFixed(2)} USDT Balance</span>
          </div>
          {(() => {
            const base = availableBalance > 0 ? availableBalance : 100;
            const rate = currentRate;
            const day1 = base * (1 + rate);
            const day3 = base * Math.pow(1 + rate, 3);
            const day7 = base * Math.pow(1 + rate, 7);
            const day30 = base * Math.pow(1 + rate, 30);

            return (
              <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
                <div className="p-2 rounded-xl bg-black/40 border border-neutral-800/80">
                  <span className="text-neutral-400 block text-[9px]">Day 1</span>
                  <span className="font-bold text-white block">${Math.round(day1).toLocaleString()}</span>
                  <span className="text-[#E5A93C] text-[9px]">+${Math.round(day1 - base).toLocaleString()} USDT</span>
                </div>
                <div className="p-2 rounded-xl bg-black/40 border border-neutral-800/80">
                  <span className="text-neutral-400 block text-[9px]">Day 3</span>
                  <span className="font-bold text-white block">${Math.round(day3).toLocaleString()}</span>
                  <span className="text-[#E5A93C] text-[9px]">+${Math.round(day3 - base).toLocaleString()} USDT</span>
                </div>
                <div className="p-2 rounded-xl bg-black/40 border border-neutral-800/80">
                  <span className="text-neutral-400 block text-[9px]">Day 7</span>
                  <span className="font-bold text-white block">${Math.round(day7).toLocaleString()}</span>
                  <span className="text-[#E5A93C] text-[9px]">+${Math.round(day7 - base).toLocaleString()} USDT</span>
                </div>
                <div className="p-2 rounded-xl bg-black/40 border border-[#DC2626]/40 bg-[#2a0808]/30">
                  <span className="text-[#FDE047] font-bold block text-[9px]">Day 30</span>
                  <span className="font-extrabold text-[#E5A93C] block">${Math.round(day30).toLocaleString()}</span>
                  <span className="text-[#FDE047] text-[9px]">+${Math.round(day30 - base).toLocaleString()} USDT</span>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* 3. DONUT CHART & ASSET SUMMARY */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#10121a] border border-neutral-800 shadow-md">
        <div className="flex items-center gap-4">
          {/* Left: Donut visualization */}
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-neutral-800"
                strokeWidth="4"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-[#DC2626]"
                strokeDasharray={`${availablePercent}, 100`}
                strokeWidth="4"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-inner">
              <span className="text-[11px] font-extrabold text-black">{availablePercent}%</span>
            </div>
          </div>

          {/* Right: Total assets & Available Balance */}
          <div className="flex-1 space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-neutral-300 font-medium">{t('income.totalAssets', 'Total assets:')}</span>
              <span className="text-xl font-extrabold text-[#E5A93C]">
                ${totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
              </span>
            </div>

            <div className="flex justify-between items-baseline">
              <span className="text-xs text-neutral-400">{t('income.availableSpendable', 'Available Balance:')}</span>
              <span className="text-sm font-bold text-white">
                ${availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
              </span>
            </div>

            {/* Spendable notice */}
            <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-[11px]">
              <span className="text-neutral-400">Withdrawable anytime</span>
              <button
                onClick={() => onNavigateTab('mine')}
                className="text-[#E5A93C] font-bold hover:underline"
              >
                Withdraw →
              </button>
            </div>
          </div>
        </div>

        {/* THREE EXPENDITURE STATS ROW */}
        <div className="mt-5 pt-4 border-t border-neutral-800/80 grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-base font-extrabold text-white">
              ${(summary?.recordExpenditure ?? 0).toLocaleString()} USDT
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5 leading-tight">
              {t('income.recordExpenditure', 'Record expenditure')}
            </div>
          </div>
          <div>
            <div className="text-base font-extrabold text-white">
              ${(summary?.concertExpenditure ?? 0).toLocaleString()} USDT
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5 leading-tight">
              Grab order expenditure
            </div>
          </div>
          <div>
            <div className="text-base font-extrabold text-white">
              ${(summary?.financialExpenditure ?? 0).toLocaleString()} USDT
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5 leading-tight">
              {t('income.financialExpenditure', 'Financial expenditure')}
            </div>
          </div>
        </div>
      </div>

      {/* 4. DEDICATED SEPARATED LEDGER ENTRIES: VIP PROFIT & TEAM COMMISSION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400">Account Earning Ledgers</h3>
          <span className="text-[10px] text-[#E5A93C] font-bold">100% Additive & Independent</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* LEDGER 1: VIP PROFIT LEDGER */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#2a0808] to-[#12080a] border border-[#DC2626]/40 space-y-2.5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#DC2626]/20 text-[#FDE047] border border-[#DC2626]/30 flex items-center justify-center font-black text-xs">
                  VIP
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-white">VIP Profit Ledger</h4>
                  <span className="text-[10px] text-neutral-400">
                    Tier VIP {user?.vipLevel || 1} • Rate: {(currentRate * 100).toFixed(1)}% Daily
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#DC2626]/15 text-[#FDE047] border border-[#DC2626]/30">
                VIP {user?.vipLevel || 1}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-800/80 text-xs">
              <div>
                <span className="text-[10px] text-neutral-400 block">Today's VIP Yield:</span>
                <span className="font-extrabold text-[#E5A93C]">
                  +${(user?.todayVipProfit ?? user?.todayTicketIncome ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                </span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block">Total VIP Profit:</span>
                <span className="font-extrabold text-white">
                  ${(user?.totalVipProfit ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                </span>
              </div>
            </div>
          </div>

          {/* LEDGER 2: TEAM COMMISSION LEDGER */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1b1a13] to-[#12120e] border border-amber-500/30 space-y-2.5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xs">
                  %
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-white">Team Commission Ledger</h4>
                  <span className="text-[10px] text-neutral-400">
                    Rebates: 16% (A) • 8% (B) • 4% (C)
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Multi-Tier
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-800/80 text-xs">
              <div>
                <span className="text-[10px] text-neutral-400 block">Today's Rebates:</span>
                <span className="font-extrabold text-amber-400">
                  +${(user?.todayTeamCommission ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                </span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block">Total Commission:</span>
                <span className="font-extrabold text-white">
                  ${(user?.totalTeamCommission ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. CUMULATIVE SUMMARY */}
      <div className="bg-[#12131a] rounded-2xl border border-neutral-800 divide-y divide-neutral-800/70 overflow-hidden">
        {/* Total Combined Income */}
        <div className="p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#DC2626]/15 border border-[#DC2626]/30 flex items-center justify-center text-[#FDE047]">
              <FileText size={15} />
            </div>
            <div>
              <span className="text-xs font-semibold text-neutral-200 block">Total Accumulated Earned Income:</span>
              <span className="text-[10px] text-neutral-400">Combined sum of all additive VIP yields + Team rebates</span>
            </div>
          </div>
          <span className="text-sm font-extrabold text-[#E5A93C]">
            ${(user?.totalEarnedIncome ?? summary?.totalIncome ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
          </span>
        </div>
      </div>

      {/* 6. ORDER RECORD SECTION WITH LIVE TIMERS */}
      <div>
        <div className="flex items-center justify-between mb-3 px-0.5">
          <h3 className="text-sm font-extrabold text-white tracking-wide">{t('income.myRecord', 'My record')}</h3>
          <span
            onClick={() => onNavigateTab('grab')}
            className="text-xs text-[#E5A93C] font-semibold cursor-pointer hover:underline flex items-center gap-0.5"
          >
            Go to Grab Hub
            <ChevronRight size={14} />
          </span>
        </div>

        {purchases.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-500 bg-[#12131a] rounded-2xl border border-neutral-800">
            No active grab order records found. Start grabbing orders in the Grab hub!
          </div>
        ) : (
          <div className="space-y-3">
            {purchases.map((pur) => {
              const isFrozen = pur.status === 'frozen';
              const targetMs = pur.frozenUntil ? new Date(pur.frozenUntil).getTime() : 0;
              const remainingSec = Math.max(0, Math.ceil((targetMs - nowTime) / 1000));
              const progressPercent = Math.min(100, Math.max(0, Math.round(((60 - remainingSec) / 60) * 100)));
              const timerMins = Math.floor(remainingSec / 60);
              const timerSecs = remainingSec % 60;
              const timerStr = `${String(timerMins).padStart(2, '0')}:${String(timerSecs).padStart(2, '0')}`;

              return (
                <div
                  key={pur.id}
                  className="p-3.5 sm:p-4 rounded-2xl bg-[#12131a] border border-neutral-800 space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={pur.ticketImage}
                      alt={pur.ticketName}
                      className="w-16 h-16 rounded-xl object-cover border border-neutral-700 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold text-white truncate">{pur.ticketName}</h4>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded font-extrabold uppercase shrink-0 ${
                            pur.status === 'completed'
                              ? 'bg-[#DC2626]/20 text-[#FDE047] border border-[#DC2626]/40'
                              : isFrozen
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                              : 'bg-neutral-800 text-neutral-400'
                          }`}
                        >
                          {isFrozen ? 'Settling (1m)' : pur.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 truncate mt-0.5">{pur.artist}</p>
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-neutral-400">
                        <span>Qty: {pur.quantity}</span>
                        <span>•</span>
                        <span>Invest: <strong className="text-white">${pur.totalAmount.toLocaleString()} USDT</strong></span>
                        <span>•</span>
                        <span className="text-[#E5A93C] font-bold">Profit: +${(pur.profitAmount || 0).toLocaleString()} USDT</span>
                      </div>
                    </div>
                  </div>

                  {/* 1-Minute Progress Bar / Settle Status Banner */}
                  {isFrozen && remainingSec > 0 ? (
                    <div className="p-2.5 rounded-xl bg-black/60 border border-neutral-800/80 space-y-1.5">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-[#E5A93C] font-semibold flex items-center gap-1">
                          <Timer size={12} /> Auto-settling to Available Balance in:
                        </span>
                        <span className="text-white font-mono font-bold">{timerStr}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#DC2626] to-[#EF4444] rounded-full transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] text-neutral-400">
                        <span>Principal: ${pur.totalAmount.toLocaleString()} USDT</span>
                        <span className="text-[#E5A93C]">Yield: +${(pur.profitAmount || 0).toLocaleString()} USDT</span>
                        <span className="text-white font-bold">Total Credit: ${(pur.totalAmount + (pur.profitAmount || 0)).toLocaleString()} USDT</span>
                      </div>
                    </div>
                  ) : pur.status === 'completed' ? (
                    <div className="p-2 rounded-xl bg-[#2a0808]/30 border border-[#DC2626]/30 flex items-center justify-between text-[10px] text-[#FDE047]">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 size={12} className="text-[#E5A93C]" />
                        <span>Investment (${pur.totalAmount.toLocaleString()} USDT) + Profit (+${(pur.profitAmount || 0).toLocaleString()} USDT) credited to Balance</span>
                      </span>
                      <span className="font-bold text-white">${(pur.totalAmount + (pur.profitAmount || 0)).toLocaleString()} USDT</span>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        {/* Income Transaction History Table */}
        <div className="mt-4 pt-3 border-t border-neutral-800">
          <h4 className="text-xs font-bold text-neutral-300 mb-2">Yield Audit History (Order Logs)</h4>
          <div className="space-y-2">
            {records.slice(0, 4).map((rec) => (
              <div key={rec.id} className="p-2.5 rounded-xl bg-neutral-900/70 border border-neutral-800 text-[11px]">
                <div className="flex justify-between items-center text-neutral-300">
                  <span className="font-semibold text-white">{rec.ticketName}</span>
                  <span className="font-extrabold text-[#E5A93C]">+${rec.incomeAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT</span>
                </div>
                <div className="mt-1 flex justify-between text-neutral-500 text-[10px]">
                  <span>TX: {rec.transactionId}</span>
                  <span>VIP {rec.vipLevel} ({(rec.dailyRate * 100).toFixed(1)}%)</span>
                  <span>{new Date(rec.timestamp).toUTCString().slice(0, 16)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
