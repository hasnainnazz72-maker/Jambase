import React, { useState, useEffect } from 'react';
import { Gift, Zap, Clock, Shield, Sparkles, CheckCircle2, AlertCircle, ChevronRight, Award, RefreshCw, Wallet, Coins } from 'lucide-react';
import confetti from 'canvas-confetti';
import { User, VIPTier } from '../../types';
import { api, IncomeResponse } from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';

interface GrabViewProps {
  user: User | null;
  incomeData: IncomeResponse | null;
  vipTiers?: VIPTier[];
  onRefresh: () => void;
  onNavigateTab: (tab: any) => void;
}

export const GrabView: React.FC<GrabViewProps> = ({
  user,
  vipTiers = [],
  onRefresh,
  onNavigateTab
}) => {
  const { t } = useLanguage();
  const [grabbing, setGrabbing] = useState(false);
  const [grabProgress, setGrabProgress] = useState(0);
  const [grabStatusText, setGrabStatusText] = useState('');
  const [utcCountdown, setUtcCountdown] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string; profit?: number } | null>(null);

  // Unified USD/USDT Balance
  const workingBalance = user?.balance ?? user?.usdBalance ?? 0;
  const minRequiredBalance = 30; // VIP 1 minimum qualifying amount ($30)
  const currencyUnit = 'USDT';
  const currentVipLevel = user?.vipLevel ?? 1;

  // USD VIP Daily Rate mapping:
  // VIP 1: 1.9%, VIP 2: 2.5%, VIP 3: 3.0%, VIP 4: 4.0%, VIP 5: 5.0%, VIP 6: 6.0%
  const rateMap: Record<number, number> = {
    1: 0.019,
    2: 0.025,
    3: 0.03,
    4: 0.04,
    5: 0.05,
    6: 0.06
  };
  const dailyRate = rateMap[currentVipLevel] || 0.019;
  const estimatedDailyProfit = Number((workingBalance * dailyRate).toFixed(2));

  const todayUtc = new Date().toISOString().slice(0, 10);
  const isClaimedToday = user?.lastProfitClaimDate === todayUtc;
  const todayProfit = user?.todayVipProfit ?? (isClaimedToday ? estimatedDailyProfit : 0);

  // Live UTC Countdown to next 00:00:00 UTC reset
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const nextUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
      const diffMs = nextUtc.getTime() - now.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diffMs % (1000 * 60)) / 1000);
      setUtcCountdown(`${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleStartGrab = async () => {
    if (grabbing) return;

    if (isClaimedToday) {
      setFeedback({
        type: 'error',
        message: `You have already completed today's Grab (UTC ${todayUtc}). Next Grab unlocks in ${utcCountdown} (at 00:00:00 UTC).`
      });
      return;
    }

    if (workingBalance < minRequiredBalance) {
      setFeedback({
        type: 'error',
        message: `Minimum balance required to perform Grab is $30.00 USDT (VIP 1). Please recharge your wallet.`
      });
      return;
    }

    setGrabbing(true);
    setGrabProgress(15);
    setGrabStatusText(`Connecting to live concert ${currencyUnit} revenue pool...`);
    setFeedback(null);

    // Step 1: Matching animation
    await new Promise(r => setTimeout(r, 450));
    setGrabProgress(45);
    setGrabStatusText(`Matching VIP ${currentVipLevel} revenue order (${(dailyRate * 100).toFixed(1)}%)...`);

    await new Promise(r => setTimeout(r, 450));
    setGrabProgress(80);
    setGrabStatusText(`Allocating daily compound yield to your ${currencyUnit} balance...`);

    try {
      const res = await api.grab(activeCurrency);
      setGrabProgress(100);
      setGrabStatusText('Grab completed successfully!');

      confetti({
        particleCount: 100,
        spread: 75,
        origin: { y: 0.6 },
        colors: isUsd ? ['#3B82F6', '#10B981', '#F59E0B', '#60A5FA'] : ['#DC2626', '#EF4444', '#F59E0B', '#EAB308', '#FFD700']
      });

      const profitEarned = res.totalProfit || estimatedDailyProfit;
      setFeedback({
        type: 'success',
        profit: profitEarned,
        message: `Grab Order Completed! Successfully earned +${profitEarned.toFixed(2)} ${currencyUnit} daily VIP ${currentVipLevel} income. Your ${currencyUnit} balance has been compounded!`
      });

      onRefresh();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to complete Grab. Please try again or check your connection.'
      });
    } finally {
      setGrabbing(false);
      setGrabProgress(0);
    }
  };

  const vipTable = [
    { level: 1, range: '$30 – $499 USDT', members: '0 required', rate: '1.9%' },
    { level: 2, range: '$500 – $1,999 USDT', members: '3 valid direct members', rate: '2.5%' },
    { level: 3, range: '$2,000 – $4,999 USDT', members: '5 valid direct members', rate: '3.0%' },
    { level: 4, range: '$5,000 – $20,000 USDT', members: '10 valid direct members', rate: '4.0%' },
    { level: 5, range: '$20,000 – $50,000 USDT', members: '20 valid direct members', rate: '5.0%' },
    { level: 6, range: '$50,000 – $500,000 USDT', members: '50 valid direct members', rate: '6.0%' }
  ];

  return (
    <div id="grab-view-container" className="pb-28 space-y-4">
      {/* 1. Top Header Banner - HBO JAMBASE MUSIC VIP GRAB */}
      <div className="relative overflow-hidden rounded-3xl border p-5 shadow-2xl transition-all bg-gradient-to-br from-[#1c0808] via-[#140b0f] to-[#0c0d12] border-amber-500/50 shadow-red-950/40">
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl border flex items-center justify-center shadow-lg bg-gradient-to-tr from-red-700 via-red-600 to-amber-600 border-amber-400/60 shadow-red-900/50">
              <Gift size={24} className="text-amber-200 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white tracking-wide">VIP EXCLUSIVE GRAB</h2>
                <span className="px-2 py-0.5 rounded-full bg-red-900/80 border border-amber-500/60 text-amber-300 text-[10px] font-extrabold uppercase">
                  VIP {currentVipLevel}
                </span>
              </div>
              <p className="text-xs text-amber-200/80 mt-0.5 font-medium">
                Exclusive daily member income system
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">Daily Rate</span>
            <span className="text-sm font-black text-amber-400">
              {(dailyRate * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Working Balance Display */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-left">
          <div className="p-3 rounded-2xl bg-black/60 border border-neutral-800/80">
            <span className="text-[10px] font-semibold text-neutral-400 block">
              Active USDT Working Balance
            </span>
            <span className="text-base font-black text-amber-300 mt-0.5 block">
              ${workingBalance.toFixed(2)} USDT
            </span>
            <span className="text-[9px] text-neutral-400 mt-0.5 block">
              Min. Required: $30.00 USDT (VIP 1)
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-black/60 border border-neutral-800/80">
            <span className="text-[10px] font-semibold text-neutral-400 block">Today's Grab Income</span>
            <span className={`text-base font-black mt-0.5 block ${todayProfit > 0 ? 'text-green-400' : 'text-neutral-400'}`}>
              {todayProfit > 0 ? `+$${todayProfit.toFixed(2)}` : '$0.00 USDT'}
            </span>
            <span className="text-[9px] text-neutral-400 mt-0.5 block">
              Compounded to USDT Balance
            </span>
          </div>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center gap-3 animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-red-950/70 border-amber-500/60 text-amber-200 shadow-lg shadow-red-950/50'
              : 'bg-red-950/80 border-red-500/60 text-red-200 shadow-lg shadow-red-950/50'
          }`}
        >
          {feedback.type === 'success' ? (
            <Sparkles size={20} className="text-amber-400 shrink-0" />
          ) : (
            <AlertCircle size={20} className="text-red-400 shrink-0" />
          )}
          <div className="flex-1">
            <p className="font-semibold leading-relaxed">{feedback.message}</p>
          </div>
        </div>
      )}

      {/* 2. Interactive Main Grab Core Card */}
      <div className="relative overflow-hidden rounded-3xl bg-[#121319] border border-neutral-800/90 p-6 text-center shadow-xl">
        <div className="max-w-xs mx-auto space-y-4">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-semibold text-neutral-300">
            <Clock size={13} className="text-amber-400" />
            <span>UTC Reset in: <strong className="font-mono text-amber-400">{utcCountdown}</strong></span>
          </div>

          {/* Grab Action Hub */}
          <div className="py-2 flex flex-col items-center justify-center">
            {isClaimedToday ? (
              <div className="relative">
                <div className="w-36 h-36 rounded-full bg-gradient-to-tr from-red-950 via-neutral-900 to-amber-950/40 border-2 border-amber-500/40 flex flex-col items-center justify-center p-4 text-center shadow-inner">
                  <CheckCircle2 size={40} className="text-amber-400 mb-1" />
                  <span className="text-xs font-black text-white">Grab Completed</span>
                  <span className="text-[10px] text-amber-300 font-semibold mt-0.5">
                    +${(todayProfit || estimatedDailyProfit).toFixed(2)} USDT
                  </span>
                </div>
                <div className="mt-3">
                  <span className="text-xs text-neutral-400 block font-medium">Daily Quota: 1/1 Completed</span>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Next daily Grab unlocks at 00:00:00 UTC ({utcCountdown})
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative flex flex-col items-center">
                {/* Glowing Grab Button */}
                <button
                  id="main-grab-action-btn"
                  onClick={handleStartGrab}
                  disabled={grabbing || workingBalance < minRequiredBalance}
                  className={`group relative w-36 h-36 rounded-full flex flex-col items-center justify-center transition-all duration-300 active:scale-95 shadow-2xl ${
                    workingBalance < minRequiredBalance
                      ? 'bg-neutral-800/80 border-2 border-neutral-700 opacity-80 cursor-not-allowed text-neutral-400'
                      : grabbing
                      ? 'bg-gradient-to-br from-red-800 to-amber-700 border-2 border-amber-400 animate-pulse text-white'
                      : 'bg-gradient-to-br from-[#DC2626] via-[#B91C1C] to-[#E5A93C] border-4 border-amber-400/90 hover:border-amber-300 hover:scale-105 shadow-red-900/60 text-white cursor-pointer'
                  }`}
                >
                  <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-red-600 to-amber-500 opacity-40 group-hover:opacity-75 blur-sm transition-opacity pointer-events-none" />

                  <div className="relative z-10 flex flex-col items-center">
                    {grabbing ? (
                      <>
                        <RefreshCw size={32} className="text-amber-200 animate-spin mb-1" />
                        <span className="text-xs font-extrabold text-white">GRABBING...</span>
                        <span className="text-[10px] font-bold text-amber-200">{grabProgress}%</span>
                      </>
                    ) : (
                      <>
                        <Gift size={36} className="text-amber-200 mb-1 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-black tracking-wider text-white">GRAB NOW</span>
                        <span className="text-[10px] font-bold text-amber-200/90 mt-0.5">
                          {(dailyRate * 100).toFixed(1)}% Return
                        </span>
                      </>
                    )}
                  </div>
                </button>

                {grabbing && grabStatusText && (
                  <p className="mt-3 text-xs text-amber-300 font-semibold animate-pulse">
                    {grabStatusText}
                  </p>
                )}

                {workingBalance < minRequiredBalance && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-red-400 font-semibold leading-snug">
                      USDT balance (${workingBalance.toFixed(2)}) is below the $30.00 USDT minimum requirement (VIP 1).
                    </p>
                    <button
                      onClick={() => onNavigateTab('finance')}
                      className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 text-white text-xs font-bold shadow-md flex items-center gap-1.5 mx-auto"
                    >
                      <Wallet size={13} />
                      Recharge USDT
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <p className="text-[11px] text-neutral-400 leading-relaxed">
            Grab is the only source of member income. Profit is calculated strictly on your active <strong>USDT</strong> balance according to your VIP rate and compounds daily.
          </p>
        </div>
      </div>

      {/* 3. VIP Earning Tiers Table */}
      <div className="rounded-3xl bg-[#121319] border border-neutral-800/90 p-4 space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Award size={16} className="text-amber-400" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">VIP Daily Rate Rules</h3>
          </div>
          <span className="text-[10px] text-neutral-400 font-semibold">Daily Compounding</span>
        </div>

        <div className="space-y-2">
          {vipTable.map((tier) => {
            const isCurrent = tier.level === currentVipLevel;
            return (
              <div
                key={tier.level}
                className={`p-3 rounded-2xl flex items-center justify-between transition-all ${
                  isCurrent
                    ? 'bg-gradient-to-r from-red-950/60 to-[#181116] border border-amber-500/60 shadow-md shadow-red-950/30'
                    : 'bg-neutral-900/60 border border-neutral-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black ${
                    isCurrent
                      ? 'bg-gradient-to-tr from-red-600 to-amber-600 text-white border border-amber-400'
                      : 'bg-neutral-800 text-neutral-300'
                  }`}>
                    {tier.level}
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">VIP {tier.level}</span>
                      {isCurrent && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-extrabold uppercase border border-amber-500/40">
                          Current Tier
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-neutral-400 block mt-0.5">
                      {tier.range} • {tier.members}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-black ${isCurrent ? 'text-amber-400' : 'text-neutral-300'}`}>
                    {tier.rate}
                  </span>
                  <span className="text-[9px] text-neutral-500 block">Daily</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Grab Platform Rules */}
      <div className="rounded-3xl bg-[#121319] border border-neutral-800/90 p-4 space-y-2.5 text-xs text-neutral-300">
        <div className="flex items-center gap-2 text-white font-bold pb-1 border-b border-neutral-800">
          <Shield size={15} className="text-amber-400" />
          <span>USD/USDT VIP Grab System Rules</span>
        </div>
        <ul className="space-y-1.5 text-[11px] text-neutral-400 leading-relaxed list-disc list-inside">
          <li><strong className="text-neutral-200">Exclusive Income:</strong> Grab is the ONLY source of member income.</li>
          <li><strong className="text-neutral-200">Crypto Operations:</strong> Deposits and withdrawals are processed exclusively via USDT (TRC20 / BEP20).</li>
          <li><strong className="text-neutral-200">VIP Thresholds:</strong> VIP 1 starts at $30 USDT (1.9% daily). Higher tiers require qualifying balance and valid direct members.</li>
          <li><strong className="text-neutral-200">Daily Cycle:</strong> 1 Grab task available per UTC day (resets 00:00:00 UTC).</li>
          <li><strong className="text-neutral-200">Compounding:</strong> Profit is calculated on active balance and credited directly each day.</li>
          <li><strong className="text-neutral-200">Team Commission:</strong> Uplines earn commissions from direct team Grab income (Tier 1: 16%, Tier 2: 8%, Tier 3: 4%).</li>
        </ul>
      </div>
    </div>
  );
};
