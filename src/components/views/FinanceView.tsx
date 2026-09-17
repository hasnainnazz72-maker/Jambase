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
  UploadCloud,
  QrCode,
  DollarSign,
  Coins,
  ShieldCheck,
  RefreshCw,
  Zap,
  ArrowRight,
  Sparkles,
  Info,
  Shield
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { FinanceResponse, api } from '../../services/api';
import { User, Transaction, WithdrawalRequest, DepositRequest } from '../../types';

interface FinanceViewProps {
  financeData: FinanceResponse | null;
  onRefresh: () => void;
}

export const CRYPTO_DEPOSIT_INFO = {
  BEP20: {
    network: 'BNB Smart Chain (BEP20)',
    currency: 'USDT',
    address: '0xbd63907b714a667f5052c432cdc4ad3dc0d73658',
    minDeposit: 30,
    qrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=0xbd63907b714a667f5052c432cdc4ad3dc0d73658'
  },
  TRC20: {
    network: 'Tron (TRC20)',
    currency: 'USDT',
    address: 'TETttTRj6ZX5gAm79RgDgDm6WHeMrnDjdy',
    minDeposit: 30,
    qrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TETttTRj6ZX5gAm79RgDgDm6WHeMrnDjdy'
  }
};

export const FinanceView: React.FC<FinanceViewProps> = ({ financeData, onRefresh }) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'deposit' | 'withdraw' | 'history'>('overview');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'deposits' | 'withdrawals'>('all');

  // Crypto network mode: BEP20 or TRC20
  const [depositNetwork, setDepositNetwork] = useState<'BEP20' | 'TRC20'>('BEP20');
  const [withdrawNetwork, setWithdrawNetwork] = useState<'BEP20' | 'TRC20'>('TRC20');

  // Deposit state
  const [depositAmount, setDepositAmount] = useState<string>('10');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [paymentSlipUrl, setPaymentSlipUrl] = useState<string>('');
  const [slipFileName, setSlipFileName] = useState<string>('');
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositMsg, setDepositMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  // Withdrawal state
  const [withdrawAmount, setWithdrawAmount] = useState<string>('30');
  const [withdrawCryptoAddress, setWithdrawCryptoAddress] = useState<string>('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  // Copy helper
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const user = financeData?.user;
  const transactions = financeData?.transactions || [];
  const withdrawals = financeData?.withdrawals || [];
  const deposits = financeData?.deposits || [];

  const availableBalance = user?.balance ?? user?.usdBalance ?? 0;
  const frozenBalance = user?.frozenBalance ?? user?.usdFrozenBalance ?? 0;
  const totalAssets = user?.totalAssets ?? (availableBalance + frozenBalance);

  const handleCopy = (text: string, key = 'default') => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Handle Payment Slip Upload with client-side image compression
  const handleSlipFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setDepositMsg({ text: 'Please upload an image file (PNG, JPG, or JPEG)', isError: true });
      return;
    }

    if (file.size > 64 * 1024 * 1024) {
      setDepositMsg({ text: 'The selected image file is too large (exceeds 64MB limit). Please select a smaller photo.', isError: true });
      return;
    }

    setSlipFileName(file.name);
    setDepositMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawResult = event.target?.result as string;
      if (!rawResult) return;

      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 1280;
          let w = img.width;
          let h = img.height;

          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }

          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            const compressed = canvas.toDataURL('image/jpeg', 0.82);
            setPaymentSlipUrl(compressed);
          } else {
            setPaymentSlipUrl(rawResult);
          }
        } catch {
          setPaymentSlipUrl(rawResult);
        }
      };
      img.onerror = () => {
        setPaymentSlipUrl(rawResult);
      };
      img.src = rawResult;
    };
    reader.readAsDataURL(file);
  };

  // Execute Deposit Request
  const handleExecuteDeposit = async () => {
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt < 10) {
      setDepositMsg({ text: 'Minimum recharge amount is $10.00 USDT (VIP 1 qualifying requirement)', isError: true });
      return;
    }

    if (!referenceNumber.trim()) {
      setDepositMsg({
        text: `Please enter your blockchain transaction hash (TxID) from your ${depositNetwork} transfer`,
        isError: true
      });
      return;
    }

    if (!paymentSlipUrl.trim()) {
      setDepositMsg({ text: 'Please upload your transfer screenshot or payment receipt before submitting', isError: true });
      return;
    }

    setDepositLoading(true);
    setDepositMsg(null);

    try {
      const res = await api.deposit({
        amount: amt,
        referenceNumber: referenceNumber.trim(),
        paymentSlipUrl: paymentSlipUrl.trim(),
        currency: 'USD',
        network: depositNetwork,
        bankName: `USDT (${depositNetwork})`,
        accountHolder: 'Crypto Member',
        accountNumber: CRYPTO_DEPOSIT_INFO[depositNetwork].address,
        txHash: referenceNumber.trim()
      });
      confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 } });
      setDepositMsg({ text: res.message });
      setReferenceNumber('');
      setPaymentSlipUrl('');
      setSlipFileName('');
      onRefresh();
    } catch (err: any) {
      setDepositMsg({ text: err.message || 'Recharge request submission failed', isError: true });
    } finally {
      setDepositLoading(false);
    }
  };

  // Execute Withdrawal Request (5% platform fee)
  const handleExecuteWithdrawal = async () => {
    const amt = parseFloat(withdrawAmount);

    if (isNaN(amt) || amt < 10) {
      setWithdrawMsg({ text: 'Minimum withdrawal is $10.00 USDT', isError: true });
      return;
    }

    if (availableBalance < amt) {
      setWithdrawMsg({ text: `Insufficient balance ($${availableBalance.toFixed(2)} USDT available)`, isError: true });
      return;
    }

    if (!withdrawCryptoAddress.trim()) {
      setWithdrawMsg({ text: `Please enter your ${withdrawNetwork} USDT destination wallet address`, isError: true });
      return;
    }

    if (withdrawNetwork === 'BEP20' && !withdrawCryptoAddress.startsWith('0x')) {
      setWithdrawMsg({ text: 'BEP20 address must begin with "0x"', isError: true });
      return;
    }

    if (withdrawNetwork === 'TRC20' && !withdrawCryptoAddress.startsWith('T')) {
      setWithdrawMsg({ text: 'TRC20 address must begin with "T"', isError: true });
      return;
    }

    setWithdrawLoading(true);
    setWithdrawMsg(null);

    try {
      const res = await api.withdraw({
        amount: amt,
        currency: 'USD',
        network: withdrawNetwork,
        bankName: `USDT (${withdrawNetwork})`,
        accountHolder: 'Crypto Wallet',
        accountNumber: withdrawCryptoAddress.trim(),
        walletAddress: withdrawCryptoAddress.trim()
      });
      setWithdrawMsg({ text: res.message });
      onRefresh();
    } catch (err: any) {
      setWithdrawMsg({ text: err.message || 'Withdrawal request failed', isError: true });
    } finally {
      setWithdrawLoading(false);
    }
  };

  const calcWdFee = (parseFloat(withdrawAmount) || 0) * 0.05;
  const calcWdNet = Math.max(0, (parseFloat(withdrawAmount) || 0) - calcWdFee);
  const remainingIfWd = availableBalance - (parseFloat(withdrawAmount) || 0);

  return (
    <div id="finance-view-container" className="pb-28 space-y-4">
      {/* Sub Tabs Navigation */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-neutral-900/90 rounded-2xl border border-neutral-800 text-xs font-bold">
        {[
          { id: 'overview', label: 'Wallets' },
          { id: 'deposit', label: 'Recharge' },
          { id: 'withdraw', label: 'Withdraw' },
          { id: 'history', label: 'Records' }
        ].map((tab) => (
          <button
            key={tab.id}
            id={`finance-subtab-${tab.id}`}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`py-2 rounded-xl transition-all ${
              activeSubTab === tab.id
                ? 'bg-gradient-to-r from-[#DC2626] to-[#B91C1C] text-white shadow-md shadow-[#DC2626]/20 border border-[#E5A93C]/40'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. OVERVIEW TAB */}
      {activeSubTab === 'overview' && (
        <div className="space-y-4">
          {/* Unified USD/USDT Wallet Card */}
          <div className="relative overflow-hidden rounded-3xl p-5 border bg-gradient-to-br from-[#1b0808] via-[#140a0f] to-[#0c0d12] border-amber-500/50 shadow-2xl shadow-red-950/40">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/30 to-red-600/30 text-amber-400 border border-amber-500/40 flex items-center justify-center font-black text-sm shadow-inner">
                  <DollarSign size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-black text-white text-base">USD / USDT Wallet</h3>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold border border-amber-500/40">
                      VIP {user?.vipLevel ?? 1}
                    </span>
                  </div>
                  <span className="text-[11px] text-neutral-400">BEP20 & TRC20 Supported</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">Status</span>
                <span className="text-xs font-bold text-green-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Active
                </span>
              </div>
            </div>

            {/* Available Balance */}
            <div className="mt-5">
              <span className="text-[11px] uppercase font-bold text-neutral-400 tracking-wider block">
                Available Withdrawable Balance
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-white tracking-tight">
                  ${availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-sm font-extrabold text-amber-400">USDT</span>
              </div>
            </div>

            {/* Details Row */}
            <div className="mt-4 pt-3 border-t border-neutral-800/80 grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-black/40 border border-neutral-800/60">
                <span className="text-[10px] text-neutral-400 block">Frozen In Transit</span>
                <span className="text-sm font-bold text-neutral-200 mt-0.5 block">
                  ${frozenBalance.toFixed(2)} USDT
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/40 border border-neutral-800/60">
                <span className="text-[10px] text-neutral-400 block">Total Account Assets</span>
                <span className="text-sm font-bold text-green-400 mt-0.5 block">
                  ${totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setActiveSubTab('deposit')}
                className="py-3 rounded-2xl bg-gradient-to-r from-[#DC2626] to-[#B91C1C] hover:from-[#EF4444] text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#DC2626]/25 border border-[#E5A93C]/40 active:scale-95 transition-all"
              >
                <ArrowDownLeft size={16} /> Recharge USDT
              </button>
              <button
                onClick={() => setActiveSubTab('withdraw')}
                className="py-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <ArrowUpRight size={16} /> Withdraw USDT
              </button>
            </div>
          </div>

          {/* Pending Recharges Watcher */}
          {deposits.filter(d => d.status === 'Pending').length > 0 && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                <span className="flex items-center gap-1.5">
                  <Clock size={14} className="animate-spin" /> Pending Recharge in Queue ({deposits.filter(d => d.status === 'Pending').length})
                </span>
                <span>
                  ${deposits.find(d => d.status === 'Pending')?.amount.toLocaleString()} USDT
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-1 font-mono">
                Ref: {deposits.find(d => d.status === 'Pending')?.referenceNumber || deposits.find(d => d.status === 'Pending')?.id} • Network: {deposits.find(d => d.status === 'Pending')?.network} • Status: <span className="text-amber-400 font-bold">Pending Admin Audit</span>
              </p>
            </div>
          )}

          {/* Pending Withdrawals Watcher */}
          {withdrawals.filter(w => w.status === 'Pending').length > 0 && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                <span className="flex items-center gap-1.5">
                  <Clock size={14} /> Pending Withdrawal in Queue
                </span>
                <span>
                  ${withdrawals[0].amount.toLocaleString()} USDT
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-1">
                Ref: {withdrawals[0].id} • Address: {withdrawals[0].walletAddress || withdrawals[0].accountNumber} • Status: <span className="text-amber-400 font-semibold">Pending Admin Audit</span>
              </p>
            </div>
          )}

          {/* Quick Recent Transactions */}
          <div className="bg-[#12131a] rounded-2xl border border-neutral-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-neutral-300">Recent Activity</h3>
              <button
                onClick={() => setActiveSubTab('history')}
                className="text-xs text-[#E5A93C] font-semibold hover:underline"
              >
                View All
              </button>
            </div>
            <div className="space-y-2.5">
              {transactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-neutral-900/50">
                  <div className="min-w-0 flex-1 pr-2">
                    <span className="font-semibold text-white block truncate">{tx.title}</span>
                    <span className="text-[10px] text-neutral-500">{new Date(tx.createdAt).toLocaleDateString()}</span>
                  </div>
                  <span className={`font-extrabold ${tx.type === 'deposit' || tx.type === 'daily_income' || tx.type === 'task_reward' ? 'text-[#E5A93C]' : 'text-neutral-300'}`}>
                    {tx.type === 'deposit' || tx.type === 'daily_income' || tx.type === 'task_reward' ? '+' : '-'}${tx.amount.toLocaleString()} USDT
                  </span>
                </div>
              ))}
              {transactions.length === 0 && (
                <p className="text-center text-neutral-500 text-xs py-4">No recent transactions</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. RECHARGE TAB */}
      {activeSubTab === 'deposit' && (
        <div className="space-y-4">
          {/* Network Selection Tabs */}
          <div>
            <label className="text-xs font-bold text-neutral-300 mb-1.5 block">Select Recharge Network</label>
            <div className="grid grid-cols-2 gap-2">
              {(['BEP20', 'TRC20'] as const).map((net) => (
                <button
                  key={net}
                  onClick={() => setDepositNetwork(net)}
                  className={`py-3 px-3 rounded-2xl text-xs font-extrabold flex flex-col items-center gap-1 transition-all border ${
                    depositNetwork === net
                      ? 'bg-gradient-to-r from-[#DC2626] to-[#B91C1C] text-white border-[#E5A93C]/40 shadow-lg shadow-[#DC2626]/20'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <span className="text-sm font-black">USDT ({net})</span>
                  <span className="text-[10px] font-normal opacity-80">{CRYPTO_DEPOSIT_INFO[net].network}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Crypto Deposit Info Card */}
          <div className="rounded-3xl bg-[#121319] border border-neutral-800/90 p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <div>
                <h4 className="text-xs font-black text-white">Official {CRYPTO_DEPOSIT_INFO[depositNetwork].network} Deposit</h4>
                <p className="text-[10px] text-amber-300">Min. Deposit: $10.00 USDT (VIP 1)</p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 text-[10px] font-extrabold border border-green-500/30">
                Verified Address
              </span>
            </div>

            {/* QR Code & Address Display */}
            <div className="flex flex-col items-center justify-center pt-1 pb-2">
              <div className="p-3 bg-white rounded-2xl shadow-xl border-2 border-amber-400/40">
                <img
                  src={CRYPTO_DEPOSIT_INFO[depositNetwork].qrUrl}
                  alt={`${depositNetwork} QR Code`}
                  className="w-40 h-40 object-contain rounded-lg"
                />
              </div>
              <span className="text-[10px] text-neutral-400 mt-2 font-mono">Scan QR code or copy deposit address below</span>
            </div>

            {/* Address Box */}
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                Your Unique {depositNetwork} Deposit Address
              </span>
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-black/60 border border-neutral-800 font-mono text-xs">
                <span className="flex-1 break-all text-white font-bold select-all">
                  {CRYPTO_DEPOSIT_INFO[depositNetwork].address}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(CRYPTO_DEPOSIT_INFO[depositNetwork].address, 'crypto-addr')}
                  className="p-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 shrink-0 transition-colors"
                >
                  {copiedKey === 'crypto-addr' ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200 space-y-1">
              <p className="font-semibold flex items-center gap-1 text-amber-300">
                <Info size={12} /> Important Warning:
              </p>
              <p>
                Send only <strong>USDT</strong> via <strong>{CRYPTO_DEPOSIT_INFO[depositNetwork].network}</strong>. Sending any other asset or using the wrong network may result in permanent loss.
              </p>
            </div>
          </div>

          {/* Amount Presets */}
          <div>
            <label className="text-xs font-bold text-neutral-300 mb-1.5 block">Select Amount (USDT)</label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
              {['10', '30', '50', '100', '500', '2000', '5000'].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setDepositAmount(amt)}
                  className={`py-2 rounded-xl text-xs font-black transition-all ${
                    depositAmount === amt
                      ? 'bg-gradient-to-r from-[#DC2626] to-[#B91C1C] text-white shadow-md border border-[#E5A93C]/40'
                      : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  ${Number(amt).toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount Input */}
          <div>
            <label className="text-xs font-bold text-neutral-300 mb-1 block">Custom Amount (USDT)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-xs">
                USDT $
              </span>
              <input
                type="number"
                min="10"
                step="1"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full pl-20 pr-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm font-bold focus:outline-none focus:border-[#E5A93C]"
              />
            </div>
            <span className="text-[10px] text-neutral-400 mt-1 block">
              Minimum recharge is $10.00 USDT (qualifies for VIP 1 daily earnings)
            </span>
          </div>

          {/* TxID Hash Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-amber-300">
                Blockchain Transaction Hash (TxID) *
              </label>
              <span className="text-[10px] text-neutral-400 font-mono">Mandatory</span>
            </div>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g. 0x... (BEP20) or Tron TxID (TRC20)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 font-mono focus:outline-none focus:border-[#E5A93C]"
            />
            <p className="text-[11px] text-neutral-400 mt-1">
              Enter the transaction hash (TxID) generated from your crypto transfer.
            </p>
          </div>

          {/* Payment Slip Upload */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-amber-300">Upload Transfer Screenshot *</label>
              <span className="text-[10px] text-neutral-400 font-mono">Mandatory</span>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 border-dashed hover:border-neutral-700 transition-colors">
              <input
                type="file"
                id="slip-upload-input"
                accept="image/*"
                onChange={handleSlipFileUpload}
                className="hidden"
              />

              {!paymentSlipUrl ? (
                <label
                  htmlFor="slip-upload-input"
                  className="flex flex-col items-center justify-center cursor-pointer py-3 text-center"
                >
                  <UploadCloud size={32} className="text-[#E5A93C] mb-2" />
                  <span className="text-xs font-bold text-white">Click to upload payment screenshot</span>
                  <span className="text-[11px] text-neutral-400 mt-0.5">Supports PNG, JPG, JPEG (Max 64MB)</span>
                </label>
              ) : (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden max-h-48 border border-neutral-700 bg-black flex items-center justify-center">
                    <img
                      src={paymentSlipUrl}
                      alt="Payment Slip Preview"
                      className="max-h-48 object-contain"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-300 truncate max-w-[200px]">
                      {slipFileName || 'transfer_receipt.jpg'}
                    </span>
                    <label
                      htmlFor="slip-upload-input"
                      className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] font-bold cursor-pointer"
                    >
                      Change Screenshot
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          {depositMsg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                depositMsg.isError ? 'bg-red-500/15 text-red-300 border border-red-500/30' : 'bg-[#DC2626]/15 text-[#FDE047] border border-[#DC2626]/30'
              }`}
            >
              {depositMsg.isError ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />}
              <span>{depositMsg.text}</span>
            </div>
          )}

          {/* Submit Deposit Button */}
          <button
            id="confirm-deposit-btn"
            onClick={handleExecuteDeposit}
            disabled={depositLoading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#DC2626] to-[#B91C1C] hover:from-[#EF4444] text-white font-extrabold text-sm shadow-lg shadow-[#DC2626]/20 transition-all active:scale-[0.98] disabled:opacity-50 border border-[#E5A93C]/40"
          >
            {depositLoading ? 'Submitting Recharge Request...' : `Submit Recharge Request ($${depositAmount || 0} USDT)`}
          </button>
        </div>
      )}

      {/* 3. WITHDRAWAL TAB */}
      {activeSubTab === 'withdraw' && (
        <div className="space-y-4">
          {/* Balance Preview Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-red-950/30 border border-amber-500/30 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-semibold text-neutral-400 block">Available for Withdrawal</span>
              <span className="text-xl font-black text-[#E5A93C]">
                ${availableBalance.toFixed(2)} USDT
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-semibold text-neutral-400 block">Service Fee</span>
              <span className="text-xs font-extrabold text-amber-300">5% Platform Fee</span>
            </div>
          </div>

          {/* Withdrawal Network Selection */}
          <div>
            <label className="text-xs font-bold text-neutral-300 mb-1.5 block">Select Payout Network</label>
            <div className="grid grid-cols-2 gap-2">
              {(['TRC20', 'BEP20'] as const).map((net) => (
                <button
                  key={net}
                  onClick={() => setWithdrawNetwork(net)}
                  className={`py-3 px-3 rounded-2xl text-xs font-extrabold flex flex-col items-center gap-1 transition-all border ${
                    withdrawNetwork === net
                      ? 'bg-gradient-to-r from-[#DC2626] to-[#B91C1C] text-white border-[#E5A93C]/40 shadow-lg shadow-[#DC2626]/20'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <span className="text-sm font-black">USDT ({net})</span>
                  <span className="text-[10px] font-normal opacity-80">{net === 'TRC20' ? 'Tron Network' : 'BNB Chain'}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Destination Wallet Address */}
          <div>
            <label className="text-xs font-bold text-neutral-300 mb-1 block">
              Recipient {withdrawNetwork} USDT Wallet Address *
            </label>
            <input
              type="text"
              value={withdrawCryptoAddress}
              onChange={(e) => setWithdrawCryptoAddress(e.target.value)}
              placeholder={withdrawNetwork === 'BEP20' ? 'e.g. 0x...' : 'e.g. T...'}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 font-mono focus:outline-none focus:border-[#E5A93C]"
            />
            <span className="text-[10px] text-neutral-400 mt-1 block">
              Ensure this is a valid {withdrawNetwork} USDT wallet address under your ownership.
            </span>
          </div>

          {/* Amount Presets */}
          <div>
            <label className="text-xs font-semibold text-neutral-300 mb-1.5 block">
              Quick Select Amount (Min $10 USDT)
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {['10', '30', '50', '100', '500'].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setWithdrawAmount(amt)}
                  className={`py-1.5 rounded-xl text-xs font-bold transition-all ${
                    withdrawAmount === amt
                      ? 'bg-gradient-to-r from-[#DC2626] to-[#B91C1C] text-white shadow-md border border-[#E5A93C]/40'
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
            <label className="text-xs font-semibold text-neutral-300 mb-1 block">
              Withdrawal Amount (USDT)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-xs">USDT</span>
              <input
                type="number"
                min="10"
                step="1"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="w-full pl-16 pr-16 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm font-bold focus:outline-none focus:border-[#E5A93C]"
              />
              <button
                type="button"
                onClick={() => setWithdrawAmount(String(Math.floor(availableBalance)))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-extrabold text-[#E5A93C] hover:underline"
              >
                MAX
              </button>
            </div>
          </div>

          {/* Fee & Net Calculation (5% Fee) */}
          <div className="p-3.5 rounded-2xl bg-[#0c0d12] border border-neutral-800 space-y-2 text-xs">
            <div className="flex justify-between text-neutral-400">
              <span>Withdrawal Amount</span>
              <span className="font-semibold text-neutral-200">
                ${(parseFloat(withdrawAmount) || 0).toFixed(2)} USDT
              </span>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>Platform Service Fee (5%)</span>
              <span className="font-semibold text-neutral-200">
                -${calcWdFee.toFixed(2)} USDT
              </span>
            </div>
            <div className="pt-2 border-t border-neutral-800 flex justify-between font-bold">
              <span className="text-white">Net Payout Received</span>
              <span className="text-base text-[#E5A93C]">
                ${calcWdNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
              </span>
            </div>
          </div>

          {/* Warning if remaining balance drops below VIP 1 */}
          {remainingIfWd < 10 && (
            <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
              <AlertTriangle size={16} className="shrink-0 text-amber-400 mt-0.5" />
              <div>
                <span className="font-extrabold block">Notice: VIP 1 Balance Threshold</span>
                <p className="mt-0.5 text-neutral-400">
                  After this withdrawal, your remaining balance will be ${Math.max(0, remainingIfWd).toFixed(2)} USDT. Daily Grab earnings require at least $10.00 USDT.
                </p>
              </div>
            </div>
          )}

          {withdrawMsg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                withdrawMsg.isError ? 'bg-red-500/15 text-red-300 border border-red-500/30' : 'bg-[#DC2626]/15 text-[#FDE047] border border-[#DC2626]/30'
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
            disabled={withdrawLoading || availableBalance < (parseFloat(withdrawAmount) || 0)}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#DC2626] to-[#B91C1C] hover:from-[#EF4444] text-white font-extrabold text-sm transition-all disabled:opacity-40 shadow-lg shadow-[#DC2626]/20 border border-[#E5A93C]/40"
          >
            {withdrawLoading ? 'Processing Withdrawal...' : `Submit Withdrawal Request ($${withdrawAmount || 0} USDT)`}
          </button>
        </div>
      )}

      {/* 4. HISTORY TAB */}
      {activeSubTab === 'history' && (
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 p-1 bg-neutral-900 rounded-xl border border-neutral-800 text-[11px] font-semibold">
            {(['all', 'deposits', 'withdrawals'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setHistoryFilter(filter)}
                className={`flex-1 py-1 rounded-lg capitalize transition-colors ${
                  historyFilter === filter ? 'bg-gradient-to-r from-[#DC2626] to-[#B91C1C] text-white font-bold border border-[#E5A93C]/40' : 'text-neutral-400'
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
                            ? 'bg-[#DC2626]/15 text-[#FDE047] border border-[#DC2626]/30'
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
                          ? 'text-[#E5A93C]'
                          : 'text-neutral-200'
                      }`}
                    >
                      {tx.type === 'deposit' || tx.type === 'daily_income' || tx.type === 'task_reward' ? '+' : '-'}
                      ${tx.amount.toLocaleString()} USDT
                    </span>
                  </div>
                </div>
              ))}
            {transactions.length === 0 && (
              <p className="text-center text-neutral-500 text-xs py-8">No records found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
