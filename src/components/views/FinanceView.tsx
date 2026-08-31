import React, { useState } from 'react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  Check,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  QrCode,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { FinanceResponse, api } from '../../services/api';
import { User, Transaction, WithdrawalRequest, DepositRequest } from '../../types';

interface FinanceViewProps {
  financeData: FinanceResponse | null;
  onRefresh: () => void;
}

export const PAYMENT_ADDRESSES = {
  TRC20: 'TETttTRj6ZX5gAm79RgDgDm6WHeMrnDjdy',
  BEP20: '0xbd63907b714a667f5052c432cdc4ad3dc0d73658'
};

export const FinanceView: React.FC<FinanceViewProps> = ({ financeData, onRefresh }) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'deposit' | 'withdraw' | 'history'>('overview');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'deposits' | 'withdrawals' | 'tickets'>('all');

  // Deposit state
  const [depositAmount, setDepositAmount] = useState<string>('100');
  const [depositNetwork, setDepositNetwork] = useState<'TRC20' | 'BEP20'>('TRC20');
  const [txHashInput, setTxHashInput] = useState<string>('');
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositMsg, setDepositMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  // Withdrawal state
  const [withdrawAmount, setWithdrawAmount] = useState<string>('50');
  const [withdrawAddress, setWithdrawAddress] = useState<string>('');
  const [withdrawNetwork, setWithdrawNetwork] = useState<'TRC20' | 'BEP20'>('TRC20');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  // Copy helper
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const user = financeData?.user;
  const transactions = financeData?.transactions || [];
  const withdrawals = financeData?.withdrawals || [];
  const deposits = financeData?.deposits || [];

  const handleCopy = (text: string, key = 'default') => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Execute Deposit
  const handleExecuteDeposit = async () => {
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt < 10) {
      setDepositMsg({ text: 'Minimum deposit is $10.00', isError: true });
      return;
    }

    setDepositLoading(true);
    setDepositMsg(null);

    try {
      const res = await api.deposit(amt, depositNetwork, txHashInput);
      confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 } });
      setDepositMsg({ text: res.message });
      setTxHashInput('');
      onRefresh();
    } catch (err: any) {
      setDepositMsg({ text: err.message || 'Deposit failed', isError: true });
    } finally {
      setDepositLoading(false);
    }
  };

  // Execute Withdrawal
  const handleExecuteWithdrawal = async () => {
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt < 8) {
      setWithdrawMsg({ text: 'Minimum withdrawal is $8.00', isError: true });
      return;
    }

    if (!user || user.balance < amt) {
      setWithdrawMsg({ text: `Insufficient available balance ($${user?.balance.toFixed(2) || '0.00'})`, isError: true });
      return;
    }

    setWithdrawLoading(true);
    setWithdrawMsg(null);

    try {
      const targetAddress = withdrawAddress || user?.walletAddress || PAYMENT_ADDRESSES[withdrawNetwork];
      const res = await api.withdraw(amt, targetAddress, withdrawNetwork);
      setWithdrawMsg({ text: res.message });
      onRefresh();
    } catch (err: any) {
      setWithdrawMsg({ text: err.message || 'Withdrawal request failed', isError: true });
    } finally {
      setWithdrawLoading(false);
    }
  };

  const calcWdFee = (parseFloat(withdrawAmount) || 0) * 0.08;
  const calcWdNet = Math.max(0, (parseFloat(withdrawAmount) || 0) - calcWdFee);
  const remainingIfWd = (user?.balance || 0) - (parseFloat(withdrawAmount) || 0);

  return (
    <div id="finance-view-container" className="pb-28 space-y-4">
      {/* Sub Tabs Navigation */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-neutral-900/90 rounded-2xl border border-neutral-800 text-xs font-bold">
        {[
          { id: 'overview', label: 'Wallet' },
          { id: 'deposit', label: 'Deposit' },
          { id: 'withdraw', label: 'Withdraw' },
          { id: 'history', label: 'History' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`py-2 rounded-xl transition-all ${
              activeSubTab === tab.id
                ? 'bg-[#00D26A] text-black shadow-md'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. OVERVIEW TAB: BALANCE CARDS & QUICK ACTIONS */}
      {activeSubTab === 'overview' && (
        <div className="space-y-4">
          {/* Main Wallet Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#121b16] via-[#10141a] to-[#0d0e12] border border-[#00D26A]/30 p-5 shadow-2xl shadow-black/80">
            <div className="flex items-center justify-between text-neutral-400 text-xs">
              <div className="flex items-center gap-1.5">
                <Wallet size={15} className="text-[#00D26A]" />
                <span className="font-semibold text-neutral-300">Total Assets (USDT)</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#00D26A]/15 text-[#00D26A] text-[10px] font-extrabold border border-[#00D26A]/30">
                VIP {user?.vipLevel || 1}
              </span>
            </div>

            <div className="mt-3">
              <span className="text-3xl font-extrabold tracking-tight text-white">
                ${user ? user.totalAssets.toFixed(2) : '0.00'}
              </span>
              <span className="text-xs text-neutral-400 ml-1.5 font-semibold">USD</span>
            </div>

            {/* Balances Grid */}
            <div className="mt-4 pt-4 border-t border-neutral-800/80 grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-neutral-900/60 border border-neutral-800">
                <span className="text-[11px] text-neutral-400 block">Available Balance</span>
                <span className="text-base font-extrabold text-[#00D26A] mt-0.5 block">
                  ${user ? user.balance.toFixed(2) : '0.00'}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-neutral-900/60 border border-neutral-800">
                <span className="text-[11px] text-neutral-400 block">Frozen Balance</span>
                <span className="text-base font-extrabold text-neutral-300 mt-0.5 block">
                  ${user ? user.frozenBalance.toFixed(2) : '0.00'}
                </span>
              </div>
            </div>

            {/* Fast Action Buttons */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={() => setActiveSubTab('deposit')}
                className="py-3 rounded-xl bg-[#00D26A] hover:bg-[#00e875] text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#00D26A]/20 transition-transform active:scale-95"
              >
                <ArrowDownLeft size={16} /> Deposit / Recharge
              </button>
              <button
                onClick={() => setActiveSubTab('withdraw')}
                className="py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                <ArrowUpRight size={16} /> Withdrawal
              </button>
            </div>
          </div>

          {/* Pending Withdrawals Watcher */}
          {withdrawals.filter(w => w.status === 'Pending').length > 0 && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                <span className="flex items-center gap-1.5">
                  <Clock size={14} /> Pending Withdrawal in Queue
                </span>
                <span>${withdrawals[0].amount.toFixed(2)} USDT</span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-1">
                TXID: {withdrawals[0].txId} • Status: <span className="text-amber-400 font-semibold">Pending Admin Review</span>
              </p>
            </div>
          )}

          {/* Quick Recent Transactions */}
          <div className="bg-[#12131a] rounded-2xl border border-neutral-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-neutral-300">Recent Activity</h3>
              <button
                onClick={() => setActiveSubTab('history')}
                className="text-xs text-[#00D26A] font-semibold hover:underline"
              >
                View All
              </button>
            </div>
            <div className="space-y-2.5">
              {transactions.slice(0, 3).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between text-xs p-2 rounded-xl bg-neutral-900/50">
                  <div className="min-w-0 flex-1 pr-2">
                    <span className="font-semibold text-white block truncate">{tx.title}</span>
                    <span className="text-[10px] text-neutral-500">{new Date(tx.createdAt).toLocaleDateString()}</span>
                  </div>
                  <span className={`font-extrabold ${tx.type === 'deposit' || tx.type === 'daily_income' ? 'text-[#00D26A]' : 'text-neutral-300'}`}>
                    {tx.type === 'deposit' || tx.type === 'daily_income' ? '+' : '-'}${tx.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. DEPOSIT TAB */}
      {activeSubTab === 'deposit' && (
        <div className="space-y-4 bg-[#12131a] rounded-3xl border border-neutral-800 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-white">Deposit USDT</h3>
              <p className="text-[11px] text-neutral-400">Select payment network and transfer funds</p>
            </div>
            <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl text-[11px] font-bold border border-neutral-800">
              {(['TRC20', 'BEP20'] as const).map((net) => (
                <button
                  key={net}
                  onClick={() => setDepositNetwork(net)}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    depositNetwork === net
                      ? 'bg-[#00D26A] text-black font-extrabold shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {net}
                </button>
              ))}
            </div>
          </div>

          {/* Active Network QR Code & Deposit Address Display */}
          <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 flex flex-col items-center text-center space-y-3">
            <div className="w-32 h-32 bg-white rounded-2xl p-2.5 flex items-center justify-center shadow-lg">
              <QrCode size={110} className="text-black" />
            </div>

            <div>
              <span className="text-xs text-neutral-400 block font-medium">
                Active Deposit Network: <strong className="text-white">USDT ({depositNetwork})</strong>
              </span>
              <div className="mt-1.5 flex items-center gap-2 max-w-full px-3.5 py-2 rounded-xl bg-black border border-neutral-800">
                <span className="text-[11px] font-mono text-emerald-400 font-bold truncate">
                  {PAYMENT_ADDRESSES[depositNetwork]}
                </span>
                <button
                  onClick={() => handleCopy(PAYMENT_ADDRESSES[depositNetwork], `active-${depositNetwork}`)}
                  className="shrink-0 px-2 py-1 rounded-md bg-[#00D26A]/20 hover:bg-[#00D26A] text-[#00D26A] hover:text-black font-bold text-[10px] flex items-center gap-1 transition-colors"
                  title="Copy Address"
                >
                  {copiedKey === `active-${depositNetwork}` ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedKey === `active-${depositNetwork}` ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* OFFICIAL DUAL PAYMENT ADDRESSES DISPLAY CARDS */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-extrabold text-neutral-300">Official Payment Addresses</span>
              <span className="text-[10px] text-neutral-500">TRC20 & BEP20 Supported</span>
            </div>

            {/* 1. BEP20 Payment Address Card */}
            <div className={`p-3.5 rounded-2xl border transition-all ${
              depositNetwork === 'BEP20'
                ? 'bg-gradient-to-r from-amber-500/15 via-neutral-900 to-[#12131a] border-amber-500/50 shadow-md shadow-amber-500/5'
                : 'bg-neutral-900/70 border-neutral-800 hover:border-neutral-700'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 font-extrabold text-[10px] border border-amber-400/40">
                    BEP20 (BSC)
                  </span>
                  <span className="text-xs font-bold text-white">BEP20 Payment Address</span>
                </div>
                <button
                  onClick={() => {
                    setDepositNetwork('BEP20');
                    handleCopy(PAYMENT_ADDRESSES.BEP20, 'card-bep20');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-400 text-amber-200 hover:text-black font-extrabold text-[11px] flex items-center gap-1 transition-colors"
                >
                  {copiedKey === 'card-bep20' ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedKey === 'card-bep20' ? 'Copied' : 'Copy BEP20'}</span>
                </button>
              </div>
              <div className="p-2 rounded-xl bg-black/70 border border-neutral-800 flex items-center justify-between">
                <span className="text-[11px] font-mono text-neutral-200 select-all break-all">
                  {PAYMENT_ADDRESSES.BEP20}
                </span>
              </div>
            </div>

            {/* 2. TRC20 Payment Address Card */}
            <div className={`p-3.5 rounded-2xl border transition-all ${
              depositNetwork === 'TRC20'
                ? 'bg-gradient-to-r from-[#00D26A]/15 via-neutral-900 to-[#12131a] border-[#00D26A]/50 shadow-md shadow-[#00D26A]/5'
                : 'bg-neutral-900/70 border-neutral-800 hover:border-neutral-700'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-[#00D26A]/20 text-[#00D26A] font-extrabold text-[10px] border border-[#00D26A]/40">
                    TRC20 (TRON)
                  </span>
                  <span className="text-xs font-bold text-white">TRC20 Payment Address</span>
                </div>
                <button
                  onClick={() => {
                    setDepositNetwork('TRC20');
                    handleCopy(PAYMENT_ADDRESSES.TRC20, 'card-trc20');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#00D26A]/20 hover:bg-[#00D26A] text-[#00D26A] hover:text-black font-extrabold text-[11px] flex items-center gap-1 transition-colors"
                >
                  {copiedKey === 'card-trc20' ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedKey === 'card-trc20' ? 'Copied' : 'Copy TRC20'}</span>
                </button>
              </div>
              <div className="p-2 rounded-xl bg-black/70 border border-neutral-800 flex items-center justify-between">
                <span className="text-[11px] font-mono text-neutral-200 select-all break-all">
                  {PAYMENT_ADDRESSES.TRC20}
                </span>
              </div>
            </div>
          </div>

          {/* Preset Top-Up Amounts */}
          <div>
            <label className="text-xs font-semibold text-neutral-300 mb-1.5 block">Select Amount (USD)</label>
            <div className="grid grid-cols-4 gap-2">
              {['30', '50', '100', '500', '1000', '2000', '5000', '10000'].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setDepositAmount(amt)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    depositAmount === amt
                      ? 'bg-[#00D26A] text-black shadow-md shadow-[#00D26A]/20'
                      : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  ${amt}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount Input */}
          <div>
            <label className="text-xs font-semibold text-neutral-300 mb-1 block">Custom Amount</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">$</span>
              <input
                type="number"
                min="10"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm font-bold focus:outline-none focus:border-[#00D26A]"
              />
            </div>
          </div>

          {/* Optional Tx Hash */}
          <div>
            <label className="text-xs font-semibold text-neutral-400 mb-1 block">Transaction Hash (Optional)</label>
            <input
              type="text"
              value={txHashInput}
              onChange={(e) => setTxHashInput(e.target.value)}
              placeholder="e.g. 0x892a490..."
              className="w-full px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 focus:outline-none focus:border-[#00D26A]"
            />
          </div>

          {depositMsg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                depositMsg.isError ? 'bg-red-500/15 text-red-300 border border-red-500/30' : 'bg-[#00D26A]/15 text-[#00D26A] border border-[#00D26A]/30'
              }`}
            >
              {depositMsg.isError ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />}
              <span>{depositMsg.text}</span>
            </div>
          )}

          {/* Execute Deposit Button */}
          <button
            id="confirm-deposit-btn"
            onClick={handleExecuteDeposit}
            disabled={depositLoading}
            className="w-full py-3.5 rounded-xl bg-[#00D26A] hover:bg-[#00e875] text-black font-extrabold text-sm shadow-lg shadow-[#00D26A]/20 transition-all active:scale-[0.98]"
          >
            {depositLoading ? 'Verifying Blockchain Recharge...' : `Confirm Deposit $${depositAmount || '0.00'}`}
          </button>
        </div>
      )}

      {/* 3. WITHDRAWAL TAB */}
      {activeSubTab === 'withdraw' && (
        <div className="space-y-4 bg-[#12131a] rounded-3xl border border-neutral-800 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-white">Withdraw Funds</h3>
            <span className="text-xs font-bold text-neutral-400">
              Available: <span className="text-[#00D26A]">${user?.balance.toFixed(2) || '0.00'}</span>
            </span>
          </div>

          {/* Network Selection */}
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-neutral-300">Payout Network</label>
            <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl text-[11px] font-bold border border-neutral-800">
              {(['TRC20', 'BEP20'] as const).map((net) => (
                <button
                  key={net}
                  onClick={() => setWithdrawNetwork(net)}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    withdrawNetwork === net
                      ? 'bg-[#00D26A] text-black font-extrabold shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {net}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Preset Withdrawal Amounts */}
          <div>
            <label className="text-xs font-semibold text-neutral-300 mb-1.5 block">Quick Select Amount (Min $8.00)</label>
            <div className="grid grid-cols-5 gap-1.5">
              {['8', '20', '50', '100', '500'].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setWithdrawAmount(amt)}
                  className={`py-1.5 rounded-xl text-xs font-bold transition-all ${
                    withdrawAmount === amt
                      ? 'bg-[#00D26A] text-black shadow-md shadow-[#00D26A]/20'
                      : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  ${amt}
                </button>
              ))}
            </div>
          </div>

          {/* Withdrawal Amount Input */}
          <div>
            <label className="text-xs font-semibold text-neutral-300 mb-1 block">Withdrawal Amount (USD)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">$</span>
              <input
                type="number"
                min="8"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="w-full pl-8 pr-16 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm font-bold focus:outline-none focus:border-[#00D26A]"
              />
              <button
                onClick={() => setWithdrawAmount(String(Math.floor(user?.balance || 0)))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-extrabold text-[#00D26A] hover:underline"
              >
                MAX
              </button>
            </div>
          </div>

          {/* Destination Address */}
          <div>
            <label className="text-xs font-semibold text-neutral-300 mb-1 block">
              USDT ({withdrawNetwork}) Destination Address
            </label>
            <input
              type="text"
              value={withdrawAddress}
              onChange={(e) => setWithdrawAddress(e.target.value)}
              placeholder={`Enter destination ${withdrawNetwork} wallet address`}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 font-mono focus:outline-none focus:border-[#00D26A]"
            />
          </div>

          {/* Calculation & Fee Breakdown */}
          <div className="p-3.5 rounded-2xl bg-[#0c0d12] border border-neutral-800 space-y-2 text-xs">
            <div className="flex justify-between text-neutral-400">
              <span>Withdrawal Amount</span>
              <span className="font-semibold text-neutral-200">${(parseFloat(withdrawAmount) || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>Platform Service Fee (8%)</span>
              <span className="font-semibold text-neutral-200">-${calcWdFee.toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-neutral-800 flex justify-between font-bold">
              <span className="text-white">Net Payout Received</span>
              <span className="text-base text-[#00D26A]">${calcWdNet.toFixed(2)} USDT</span>
            </div>
          </div>

          {/* Minimum Balance $30 Warning */}
          {remainingIfWd < 30 && (
            <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
              <AlertTriangle size={16} className="shrink-0 text-amber-400 mt-0.5" />
              <div>
                <span className="font-extrabold block">Warning: Income Pause Trigger</span>
                <p className="mt-0.5 text-neutral-400">
                  After this withdrawal, your remaining balance will be ${Math.max(0, remainingIfWd).toFixed(2)}. If total assets fall below $30, daily VIP income will automatically pause.
                </p>
              </div>
            </div>
          )}

          {withdrawMsg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                withdrawMsg.isError ? 'bg-red-500/15 text-red-300 border border-red-500/30' : 'bg-[#00D26A]/15 text-[#00D26A] border border-[#00D26A]/30'
              }`}
            >
              {withdrawMsg.isError ? <XCircle size={15} /> : <CheckCircle2 size={15} />}
              <span>{withdrawMsg.text}</span>
            </div>
          )}

          {/* Submit Withdrawal Button */}
          <button
            id="confirm-withdraw-btn"
            onClick={handleExecuteWithdrawal}
            disabled={withdrawLoading || !user || user.balance < (parseFloat(withdrawAmount) || 0)}
            className="w-full py-3.5 rounded-xl bg-neutral-800 hover:bg-[#00D26A] hover:text-black text-white font-extrabold text-sm transition-all disabled:opacity-40"
          >
            {withdrawLoading ? 'Freezing Funds & Creating Request...' : 'Submit Withdrawal Request'}
          </button>
        </div>
      )}

      {/* 4. HISTORY TAB */}
      {activeSubTab === 'history' && (
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 p-1 bg-neutral-900 rounded-xl border border-neutral-800 text-[11px] font-semibold">
            {(['all', 'deposits', 'withdrawals', 'tickets'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setHistoryFilter(filter)}
                className={`flex-1 py-1 rounded-lg capitalize transition-colors ${
                  historyFilter === filter ? 'bg-[#00D26A] text-black font-bold' : 'text-neutral-400'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="space-y-2.5">
            {transactions
              .filter(t => {
                if (historyFilter === 'deposits') return t.type === 'deposit';
                if (historyFilter === 'withdrawals') return t.type === 'withdrawal';
                if (historyFilter === 'tickets') return t.type === 'ticket_purchase';
                return true;
              })
              .map((tx) => (
                <div
                  key={tx.id}
                  className="p-3.5 rounded-2xl bg-[#12131a] border border-neutral-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white truncate">{tx.title}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase ${
                          tx.status === 'completed'
                            ? 'bg-[#00D26A]/15 text-[#00D26A]'
                            : tx.status === 'pending'
                            ? 'bg-amber-500/15 text-amber-300'
                            : 'bg-red-500/15 text-red-400'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-0.5 truncate">{tx.description}</p>
                    <span className="text-[10px] text-neutral-500 mt-1 block">
                      {new Date(tx.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`text-sm font-extrabold ${
                        tx.type === 'deposit' || tx.type === 'daily_income' || tx.type === 'task_reward'
                          ? 'text-[#00D26A]'
                          : 'text-neutral-200'
                      }`}
                    >
                      {tx.type === 'deposit' || tx.type === 'daily_income' || tx.type === 'task_reward' ? '+' : '-'}${tx.amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
