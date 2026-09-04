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

  const totalAssets = summary?.totalAssets ?? 0;
  const availableBalance = summary?.availableBalance ?? 0;
  const frozenAssets = summary?.frozenAssets ?? 0;

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
          text: '🎉 1-Minute Ticket Settled! Both Principal Investment and Ticket Profit have been returned to your Available Balance.'
        });
        onRefresh();
      }
    } catch {}
  }, [onRefresh]);

  // Live 1-second timer ticker for 2-min countdown and UTC countdown
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

  const handleClaimProfit = async () => {
    if (claiming) return;
    setClaiming(true);
    setClaimMsg(null);

    try {
      const res = await api.claimDailyTicketProfit();
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 }
      });
      setClaimMsg({
        text: res.message || `Successfully claimed ${res.totalProfit.toLocaleString()} ETB profit!`
      });
      onRefresh();
    } catch (err: any) {
      setClaimMsg({
        text: err.message || 'Failed to claim ticket profit',
        isError: true
      });
    } finally {
      setClaiming(false);
    }
  };

  const handleManualSettle = async () => {
    setClaiming(true);
    try {
      const res = await api.settleTickets();
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 }
      });
      setClaimMsg({
        text: 'Checked and updated ticket balances successfully!'
      });
      onRefresh();
    } catch (err: any) {
      setClaimMsg({
        text: err.message || 'Failed to settle tickets',
        isError: true
      });
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div id="my-income-view" className="pb-28 space-y-4">
      {/* 1. TOP GREEN HEADER BAR */}
      <div className="-mx-4 -mt-3 mb-2 bg-[#00D26A] text-black px-4 py-3.5 shadow-md flex items-center justify-between">
        <h1 className="text-base font-extrabold tracking-wide mx-auto">{t('income.title', 'My income')}</h1>
      </div>

      {/* 2. DAILY VIP COMPOUND PROFIT & UTC INCOME GENERATOR */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-[#0e2118] via-[#10141b] to-[#0d0e12] border-2 border-[#00D26A]/40 shadow-2xl relative overflow-hidden space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-[#00D26A] text-black flex items-center justify-center font-extrabold shadow-lg shadow-[#00D26A]/30">
              <Sparkles size={20} />
            </span>
            <div>
              <h3 className="text-sm font-extrabold text-white">Daily VIP Compound Profit</h3>
              <p className="text-[11px] text-emerald-400 font-medium">
                Earned once a day on Available Balance • VIP {user?.vipLevel || 1}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-neutral-400 block font-mono">UTC Reset in</span>
            <span className="text-xs font-mono font-bold text-[#00D26A] flex items-center gap-1 justify-end">
              <Clock size={11} /> {utcCountdown}
            </span>
          </div>
        </div>

        {/* Compound Profit Explanation Banner */}
        <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-800/40 text-xs text-emerald-300 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-[#00D26A]">
            <Zap size={14} />
            <span>Daily Compounding Rules:</span>
          </div>
          <ul className="text-[11px] text-neutral-300 space-y-1 list-disc list-inside leading-relaxed">
            <li>Profit is calculated strictly on your <strong>Available Balance ({availableBalance.toLocaleString()} ETB)</strong>.</li>
            <li>Earned once every 24 hours — cycle resets daily at <strong>00:00:00 UTC</strong>.</li>
            <li>As your balance grows every day, your daily profit compounds automatically!</li>
          </ul>
        </div>

        {/* Live Calculation Preview */}
        {(() => {
          const rate = user?.vipLevel === 2 ? 0.025 : user?.vipLevel === 3 ? 0.03 : user?.vipLevel === 4 ? 0.04 : user?.vipLevel === 5 ? 0.05 : user?.vipLevel === 6 ? 0.06 : 0.019;
          const expectedDailyProfit = Number((availableBalance * rate).toFixed(2));
          const compoundedNewBalance = Number((availableBalance + expectedDailyProfit).toFixed(2));

          return (
            <div className="p-3.5 rounded-2xl bg-black/40 border border-neutral-800/90 space-y-2.5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[11px] text-neutral-400 block">Available Balance:</span>
                  <span className="text-base font-extrabold text-white font-mono">{availableBalance.toLocaleString()} ETB</span>
                </div>
                <div>
                  <span className="text-[11px] text-neutral-400 block">VIP {user?.vipLevel || 1} Daily Yield:</span>
                  <span className="text-base font-extrabold text-[#00D26A] font-mono">
                    +{expectedDailyProfit.toLocaleString()} ETB <span className="text-xs text-emerald-400">({(rate * 100).toFixed(1)}%)</span>
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-800/70 flex justify-between items-center text-[11px] text-neutral-400">
                <span>Daily claim status:</span>
                {isClaimedToday ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 size={13} /> Claimed for UTC {todayUtc}
                  </span>
                ) : availableBalance < 30 ? (
                  <span className="text-amber-400 font-bold">Min $30.00 Balance Required</span>
                ) : (
                  <span className="text-[#00D26A] font-bold">Ready to Claim Today</span>
                )}
              </div>
            </div>
          );
        })()}

        {/* Action Button: Claim Once Per Day */}
        <div>
          {isClaimedToday ? (
            <div className="p-3.5 rounded-2xl bg-black/60 border border-emerald-900/60 text-center space-y-1">
              <div className="text-xs font-bold text-[#00D26A] flex items-center justify-center gap-1.5">
                <CheckCircle2 size={15} />
                <span>Today's VIP Profit Already Claimed!</span>
              </div>
              <p className="text-[10px] text-neutral-400">
                Next compound profit claim unlocks at <strong>00:00:00 UTC</strong> (in {utcCountdown}).
              </p>
            </div>
          ) : availableBalance < 30 ? (
            <div className="space-y-2">
              <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-800/40 text-xs text-amber-300 text-center">
                Available balance is below $30.00. Recharge to unlock daily VIP income.
              </div>
              <button
                onClick={() => onNavigateTab('finance')}
                className="w-full py-3 rounded-2xl bg-[#00D26A] hover:bg-[#00e875] text-black font-extrabold text-xs shadow-lg shadow-[#00D26A]/30 flex items-center justify-center gap-2"
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
              className="w-full py-3.5 rounded-2xl bg-[#00D26A] hover:bg-[#00e875] text-black font-extrabold text-sm shadow-lg shadow-[#00D26A]/30 flex items-center justify-center gap-2 transition-all active:scale-[0.99] animate-pulse"
            >
              <Sparkles size={17} className={claiming ? "animate-spin" : ""} />
              <span>
                {claiming ? 'Processing Compound Profit...' : `Claim Today's VIP Profit (+${((user?.vipLevel === 2 ? 0.025 : user?.vipLevel === 3 ? 0.03 : user?.vipLevel === 4 ? 0.04 : user?.vipLevel === 5 ? 0.05 : user?.vipLevel === 6 ? 0.06 : 0.019) * 100).toFixed(1)}%)`}
              </span>
            </button>
          )}
        </div>

        {/* Notice feedback */}
        {claimMsg && (
          <div
            className={`p-3 rounded-2xl text-xs flex items-center gap-2 ${
              claimMsg.isError
                ? 'bg-red-500/15 text-red-300 border border-red-500/30'
                : 'bg-[#00D26A]/15 text-[#00D26A] border border-[#00D26A]/30'
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
              <Sparkles size={12} className="text-[#00D26A]" /> Compounding Balance Projection
            </span>
            <span className="text-[10px] text-neutral-500">Based on ${(availableBalance || 100).toFixed(2)} Balance</span>
          </div>
          {(() => {
            const base = availableBalance > 0 ? availableBalance : 100;
            const rate = user?.vipLevel === 2 ? 0.025 : user?.vipLevel === 3 ? 0.03 : user?.vipLevel === 4 ? 0.04 : user?.vipLevel === 5 ? 0.05 : user?.vipLevel === 6 ? 0.06 : 0.019;
            const day1 = base * (1 + rate);
            const day3 = base * Math.pow(1 + rate, 3);
            const day7 = base * Math.pow(1 + rate, 7);
            const day30 = base * Math.pow(1 + rate, 30);

            return (
              <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
                <div className="p-2 rounded-xl bg-black/40 border border-neutral-800/80">
                  <span className="text-neutral-400 block text-[9px]">Day 1</span>
                  <span className="font-bold text-white block">${day1.toFixed(2)}</span>
                  <span className="text-[#00D26A] text-[9px]">+${(day1 - base).toFixed(2)}</span>
                </div>
                <div className="p-2 rounded-xl bg-black/40 border border-neutral-800/80">
                  <span className="text-neutral-400 block text-[9px]">Day 3</span>
                  <span className="font-bold text-white block">${day3.toFixed(2)}</span>
                  <span className="text-[#00D26A] text-[9px]">+${(day3 - base).toFixed(2)}</span>
                </div>
                <div className="p-2 rounded-xl bg-black/40 border border-neutral-800/80">
                  <span className="text-neutral-400 block text-[9px]">Day 7</span>
                  <span className="font-bold text-white block">${day7.toFixed(2)}</span>
                  <span className="text-[#00D26A] text-[9px]">+${(day7 - base).toFixed(2)}</span>
                </div>
                <div className="p-2 rounded-xl bg-black/40 border border-emerald-900/40 bg-emerald-950/20">
                  <span className="text-emerald-400 font-bold block text-[9px]">Day 30</span>
                  <span className="font-extrabold text-[#00D26A] block">${day30.toFixed(2)}</span>
                  <span className="text-emerald-300 text-[9px]">+${(day30 - base).toFixed(2)}</span>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* 3. DONUT CHART & ASSET SUMMARY */}
      <div className="bg-[#12131a] rounded-2xl border border-neutral-800 p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Donut Ring Visual */}
          <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="transparent"
                stroke="#262730"
                strokeWidth="12"
              />
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="transparent"
                stroke="#00D26A"
                strokeWidth="12"
                strokeDasharray={`${(availablePercent * 238) / 100} 238`}
                strokeLinecap="round"
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
              <span className="text-xl font-extrabold text-[#00D26A]">
                ${totalAssets.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between items-baseline">
              <span className="text-xs text-neutral-400">{t('income.availableSpendable', 'Available Balance:')}</span>
              <span className="text-sm font-bold text-white">
                ${availableBalance.toFixed(2)}
              </span>
            </div>

            {/* Spendable notice */}
            <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-[11px]">
              <span className="text-neutral-400">Withdrawable anytime</span>
              <button
                onClick={() => onNavigateTab('mine')}
                className="text-[#00D26A] font-bold hover:underline"
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
              ${(summary?.recordExpenditure ?? 0).toFixed(0)}
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5 leading-tight">
              {t('income.recordExpenditure', 'Record expenditure')}
            </div>
          </div>
          <div>
            <div className="text-base font-extrabold text-white">
              ${(summary?.concertExpenditure ?? 0).toFixed(0)}
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5 leading-tight">
              {t('income.concertExpenditure', 'Concert expenditure')}
            </div>
          </div>
          <div>
            <div className="text-base font-extrabold text-white">
              ${(summary?.financialExpenditure ?? 0).toFixed(0)}
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
          <span className="text-[10px] text-[#00D26A] font-bold">100% Additive & Independent</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* LEDGER 1: VIP PROFIT LEDGER */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#121c17] to-[#0e1218] border border-[#00D26A]/30 space-y-2.5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#00D26A]/20 text-[#00D26A] flex items-center justify-center font-black text-xs">
                  VIP
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-white">VIP Profit Ledger</h4>
                  <span className="text-[10px] text-neutral-400">
                    Tier VIP {user?.vipLevel || 1} • Rate: {((user?.vipLevel === 2 ? 0.025 : user?.vipLevel === 3 ? 0.03 : user?.vipLevel === 4 ? 0.04 : user?.vipLevel === 5 ? 0.05 : user?.vipLevel === 6 ? 0.06 : 0.019) * 100).toFixed(1)}% Daily
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#00D26A]/15 text-[#00D26A] border border-[#00D26A]/30">
                VIP {user?.vipLevel || 1}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-800/80 text-xs">
              <div>
                <span className="text-[10px] text-neutral-400 block">Today's VIP Yield:</span>
                <span className="font-extrabold text-[#00D26A]">
                  +{(user?.todayVipProfit ?? user?.todayTicketIncome ?? 0).toLocaleString()} ETB
                </span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block">Total VIP Profit:</span>
                <span className="font-extrabold text-white">
                  {(user?.totalVipProfit ?? 0).toLocaleString()} ETB
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
                  +{(user?.todayTeamCommission ?? 0).toLocaleString()} ETB
                </span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block">Total Commission:</span>
                <span className="font-extrabold text-white">
                  {(user?.totalTeamCommission ?? 0).toLocaleString()} ETB
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
            <div className="w-7 h-7 rounded-lg bg-[#00D26A]/15 border border-[#00D26A]/30 flex items-center justify-center text-[#00D26A]">
              <FileText size={15} />
            </div>
            <div>
              <span className="text-xs font-semibold text-neutral-200 block">Total Accumulated Earned Income:</span>
              <span className="text-[10px] text-neutral-400">Combined sum of all additive VIP yields + Team rebates</span>
            </div>
          </div>
          <span className="text-sm font-extrabold text-[#00D26A]">
            {(user?.totalEarnedIncome ?? summary?.totalIncome ?? 0).toLocaleString()} ETB
          </span>
        </div>
      </div>

      {/* 5. TICKET RECORD SECTION WITH LIVE 2-MINUTE TIMERS */}
      <div>
        <div className="flex items-center justify-between mb-3 px-0.5">
          <h3 className="text-sm font-extrabold text-white tracking-wide">{t('income.myRecord', 'My record')}</h3>
          <span
            onClick={() => onNavigateTab('home')}
            className="text-xs text-[#00D26A] font-semibold cursor-pointer hover:underline flex items-center gap-0.5"
          >
            Buy More
            <ChevronRight size={13} />
          </span>
        </div>

        {/* List of Held Record Cards */}
        {purchases.length === 0 ? (
          <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 text-center">
            <p className="text-xs text-neutral-400">No ticket purchases yet.</p>
            <button
              onClick={() => onNavigateTab('home')}
              className="mt-2.5 px-3 py-1.5 rounded-xl bg-[#00D26A] text-black text-xs font-bold"
            >
              Browse Ticket Market
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {purchases.map((pur) => {
              const isFrozen = pur.status === 'frozen' && pur.frozenUntil;
              const unfreezeTime = isFrozen ? new Date(pur.frozenUntil!).getTime() : 0;
              const remainingSec = Math.max(0, Math.ceil((unfreezeTime - nowTime) / 1000));
              const mins = Math.floor(remainingSec / 60);
              const secs = remainingSec % 60;
              const timerStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
              // 60 seconds total (1 minute)
              const progressPercent = isFrozen ? Math.min(100, Math.round(((60 - remainingSec) / 60) * 100)) : 100;

              return (
                <div
                  key={pur.id}
                  className="bg-[#121319] border border-neutral-800 rounded-2xl p-3.5 space-y-2.5"
                >
                  <div className="flex items-center gap-3.5">
                    <img
                      src={pur.image}
                      alt={pur.ticketName}
                      className="w-14 h-14 rounded-xl object-cover border border-neutral-700 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-white truncate">{pur.ticketName}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          pur.status === 'completed'
                            ? 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                            : 'bg-[#00D26A]/15 text-[#00D26A] border border-[#00D26A]/30 animate-pulse'
                        }`}>
                          {pur.status === 'completed' ? '✅ Settled to Balance' : `⏳ 1-Min Lock: ${timerStr}`}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 truncate mt-0.5">{pur.artist}</p>
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-neutral-400">
                        <span>Qty: {pur.quantity}</span>
                        <span>•</span>
                        <span>Invest: <strong className="text-white">${pur.totalAmount.toFixed(2)}</strong></span>
                        <span>•</span>
                        <span className="text-[#00D26A] font-bold">Profit: +${(pur.profitAmount || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* 1-Minute Progress Bar / Settle Status Banner */}
                  {isFrozen && remainingSec > 0 ? (
                    <div className="p-2.5 rounded-xl bg-black/60 border border-neutral-800/80 space-y-1.5">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <Timer size={12} /> Auto-settling to Available Balance in:
                        </span>
                        <span className="text-white font-mono font-bold">{timerStr}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-[#00D26A] rounded-full transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] text-neutral-400">
                        <span>Principal: {pur.totalAmount.toLocaleString()} ETB</span>
                        <span className="text-[#00D26A]">Yield: +{(pur.profitAmount || 0).toLocaleString()} ETB</span>
                        <span className="text-white font-bold">Total Credit: {(pur.totalAmount + (pur.profitAmount || 0)).toLocaleString()} ETB</span>
                      </div>
                    </div>
                  ) : pur.status === 'completed' ? (
                    <div className="p-2 rounded-xl bg-emerald-950/30 border border-emerald-800/30 flex items-center justify-between text-[10px] text-emerald-300">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 size={12} className="text-[#00D26A]" />
                        <span>Investment ({pur.totalAmount.toLocaleString()} ETB) + Profit (+{(pur.profitAmount || 0).toLocaleString()} ETB) credited to Balance</span>
                      </span>
                      <span className="font-bold text-white">{(pur.totalAmount + (pur.profitAmount || 0)).toLocaleString()} ETB</span>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        {/* Income Transaction History Table */}
        <div className="mt-4 pt-3 border-t border-neutral-800">
          <h4 className="text-xs font-bold text-neutral-300 mb-2">Yield Audit History (Ticket Logs)</h4>
          <div className="space-y-2">
            {records.slice(0, 4).map((rec) => (
              <div key={rec.id} className="p-2.5 rounded-xl bg-neutral-900/70 border border-neutral-800 text-[11px]">
                <div className="flex justify-between items-center text-neutral-300">
                  <span className="font-semibold text-white">{rec.ticketName}</span>
                  <span className="font-extrabold text-[#00D26A]">+{rec.incomeAmount.toLocaleString()} ETB</span>
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
