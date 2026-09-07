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
  Building2,
  UploadCloud,
  QrCode,
  DollarSign,
  Coins,
  ShieldCheck,
  RefreshCw,
  Zap,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { FinanceResponse, api } from '../../services/api';
import { User, Transaction, WithdrawalRequest, DepositRequest } from '../../types';

interface FinanceViewProps {
  financeData: FinanceResponse | null;
  onRefresh: () => void;
}

export const CBE_BANK_INFO = {
  bankName: 'Commercial Bank of Ethiopia (CBE)',
  accountHolder: 'Riyad Adem',
  accountNumber: '1000707299577'
};

export const CRYPTO_DEPOSIT_INFO = {
  BEP20: {
    network: 'BNB Smart Chain (BEP20)',
    currency: 'USDT',
    address: '0xbd63907b714a667f5052c432cdc4ad3dc0d73658',
    minDeposit: 10,
    qrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=0xbd63907b714a667f5052c432cdc4ad3dc0d73658'
  },
  TRC20: {
    network: 'Tron (TRC20)',
    currency: 'USDT',
    address: 'TETttTRj6ZX5gAm79RgDgDm6WHeMrnDjdy',
    minDeposit: 10,
    qrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TETttTRj6ZX5gAm79RgDgDm6WHeMrnDjdy'
  }
};

export const FinanceView: React.FC<FinanceViewProps> = ({ financeData, onRefresh }) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'deposit' | 'withdraw' | 'history'>('overview');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'deposits' | 'withdrawals'>('all');

  // Currency selection states
  const [depositCurrencyMode, setDepositCurrencyMode] = useState<'ETB' | 'BEP20' | 'TRC20'>('ETB');
  const [withdrawCurrencyMode, setWithdrawCurrencyMode] = useState<'ETB' | 'BEP20' | 'TRC20'>('ETB');

  // Deposit state
  const [depositAmount, setDepositAmount] = useState<string>('2000');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [paymentSlipUrl, setPaymentSlipUrl] = useState<string>('');
  const [slipFileName, setSlipFileName] = useState<string>('');
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositMsg, setDepositMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  // Withdrawal state (ETB Bank Transfer)
  const [withdrawAmount, setWithdrawAmount] = useState<string>('1000');
  const [withdrawBankName, setWithdrawBankName] = useState<string>('Commercial Bank of Ethiopia (CBE)');
  const [withdrawAccountHolder, setWithdrawAccountHolder] = useState<string>('');
  const [withdrawAccountNumber, setWithdrawAccountNumber] = useState<string>('');
  const [withdrawCryptoAddress, setWithdrawCryptoAddress] = useState<string>('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  // Switching active working currency
  const [switchingCurrency, setSwitchingCurrency] = useState(false);

  // Copy helper
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const user = financeData?.user;
  const transactions = financeData?.transactions || [];
  const withdrawals = financeData?.withdrawals || [];
  const deposits = financeData?.deposits || [];

  const etbAvailable = user?.etbBalance ?? 0;
  const etbFrozen = user?.etbFrozenBalance ?? 0;
  const usdAvailable = user?.usdBalance ?? 0;
  const usdFrozen = user?.usdFrozenBalance ?? 0;
  const activeCurrency = user?.activeCurrency || 'ETB';

  const handleCopy = (text: string, key = 'default') => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Switch between working in ETB vs USD
  const handleSwitchCurrency = async (newCurrency: 'ETB' | 'USD') => {
    if (activeCurrency === newCurrency || switchingCurrency) return;
    setSwitchingCurrency(true);
    try {
      await api.switchCurrency(newCurrency);
      onRefresh();
    } catch (err: any) {
      console.error(err);
    } finally {
      setSwitchingCurrency(false);
    }
  };

  // Handle Payment Slip Upload
  const handleSlipFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setDepositMsg({ text: 'Please upload an image file (PNG, JPG, or JPEG)', isError: true });
      return;
    }

    if (file.size > 64 * 1024 * 1024) {
      setDepositMsg({ text: 'The selected image file is too large (exceeds 64MB limit). Please select a compressed image or smaller photo.', isError: true });
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
        const MAX_DIM = 1280;
        let width = img.width;
        let height = img.height;

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setPaymentSlipUrl(optimizedDataUrl);
        } else {
          setPaymentSlipUrl(rawResult);
        }
      };
      img.onerror = () => {
        setPaymentSlipUrl(rawResult);
      };
      img.src = rawResult;
    };
    reader.onerror = () => {
      setDepositMsg({ text: 'Failed to read image file. Please try again or select another image.', isError: true });
    };
    reader.readAsDataURL(file);
  };

  // Execute Deposit
  const handleExecuteDeposit = async () => {
    const amt = parseFloat(depositAmount);

    if (depositCurrencyMode === 'ETB') {
      if (isNaN(amt) || amt < 2000) {
        setDepositMsg({ text: 'Minimum recharge amount is 2,000 ETB', isError: true });
        return;
      }
    } else {
      if (isNaN(amt) || amt < 10) {
        setDepositMsg({ text: 'Minimum recharge amount is $10.00 USDT', isError: true });
        return;
      }
    }

    if (!referenceNumber.trim()) {
      setDepositMsg({
        text: depositCurrencyMode === 'ETB'
          ? 'Please enter the transaction reference / confirmation number from your CBE transfer'
          : 'Please enter the blockchain Transaction Hash (TxID) of your USDT transfer',
        isError: true
      });
      return;
    }

    if (!paymentSlipUrl.trim()) {
      setDepositMsg({ text: 'Please upload your payment slip receipt screenshot before submitting', isError: true });
      return;
    }

    setDepositLoading(true);
    setDepositMsg(null);

    try {
      const isEtb = depositCurrencyMode === 'ETB';
      const res = await api.deposit({
        amount: amt,
        referenceNumber: referenceNumber.trim(),
        paymentSlipUrl: paymentSlipUrl.trim(),
        currency: isEtb ? 'ETB' : 'USD',
        network: isEtb ? 'CBE' : depositCurrencyMode,
        bankName: isEtb ? CBE_BANK_INFO.bankName : `USDT (${depositCurrencyMode})`,
        accountHolder: isEtb ? CBE_BANK_INFO.accountHolder : 'Crypto Member',
        accountNumber: isEtb ? CBE_BANK_INFO.accountNumber : CRYPTO_DEPOSIT_INFO[depositCurrencyMode as 'BEP20' | 'TRC20'].address,
        txHash: isEtb ? undefined : referenceNumber.trim()
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

  // Execute Withdrawal
  const handleExecuteWithdrawal = async () => {
    const amt = parseFloat(withdrawAmount);
    const isEtb = withdrawCurrencyMode === 'ETB';

    if (isEtb) {
      if (isNaN(amt) || amt < 500) {
        setWithdrawMsg({ text: 'Minimum withdrawal is 500 ETB', isError: true });
        return;
      }
      if (etbAvailable < amt) {
        setWithdrawMsg({ text: `Insufficient ETB balance (${etbAvailable.toLocaleString()} ETB available)`, isError: true });
        return;
      }
      if (!withdrawAccountHolder.trim()) {
        setWithdrawMsg({ text: 'Account holder full name is required', isError: true });
        return;
      }
      if (!withdrawAccountNumber.trim()) {
        setWithdrawMsg({ text: 'Bank account number is required', isError: true });
        return;
      }
    } else {
      if (isNaN(amt) || amt < 10) {
        setWithdrawMsg({ text: 'Minimum withdrawal is $10.00 USDT', isError: true });
        return;
      }
      if (usdAvailable < amt) {
        setWithdrawMsg({ text: `Insufficient USD balance ($${usdAvailable.toFixed(2)} USDT available)`, isError: true });
        return;
      }
      if (!withdrawCryptoAddress.trim()) {
        setWithdrawMsg({ text: `Please provide your ${withdrawCurrencyMode} USDT destination wallet address`, isError: true });
        return;
      }
      if (withdrawCurrencyMode === 'BEP20' && !withdrawCryptoAddress.startsWith('0x')) {
        setWithdrawMsg({ text: 'BEP20 address must begin with "0x"', isError: true });
        return;
      }
      if (withdrawCurrencyMode === 'TRC20' && !withdrawCryptoAddress.startsWith('T')) {
        setWithdrawMsg({ text: 'TRC20 address must begin with "T"', isError: true });
        return;
      }
    }

    setWithdrawLoading(true);
    setWithdrawMsg(null);

    try {
      const res = await api.withdraw({
        amount: amt,
        currency: isEtb ? 'ETB' : 'USD',
        network: isEtb ? 'ETB' : withdrawCurrencyMode,
        bankName: isEtb ? withdrawBankName : `USDT (${withdrawCurrencyMode})`,
        accountHolder: isEtb ? withdrawAccountHolder.trim() : 'Crypto Wallet',
        accountNumber: isEtb ? withdrawAccountNumber.trim() : withdrawCryptoAddress.trim(),
        walletAddress: isEtb ? undefined : withdrawCryptoAddress.trim()
      });
      setWithdrawMsg({ text: res.message });
      onRefresh();
    } catch (err: any) {
      setWithdrawMsg({ text: err.message || 'Withdrawal request failed', isError: true });
    } finally {
      setWithdrawLoading(false);
    }
  };

  const isWdEtb = withdrawCurrencyMode === 'ETB';
  const currentWdBalance = isWdEtb ? etbAvailable : usdAvailable;
  const currentWdMin = isWdEtb ? 500 : 10;
  const wdUnit = isWdEtb ? 'ETB' : 'USDT';
  const calcWdFee = (parseFloat(withdrawAmount) || 0) * 0.07;
  const calcWdNet = Math.max(0, (parseFloat(withdrawAmount) || 0) - calcWdFee);
  const remainingIfWd = currentWdBalance - (parseFloat(withdrawAmount) || 0);
  const minGrabRequired = isWdEtb ? 2000 : 10;

  return (
    <div id="finance-view-container" className="pb-28 space-y-4">
      {/* Sub Tabs Navigation */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-neutral-900/90 rounded-2xl border border-neutral-800 text-xs font-bold">
        {[
          { id: 'overview', label: 'Wallets' },
          { id: 'deposit', label: 'Recharge' },
          { id: 'withdraw', label: 'Withdraw' },
          { id: 'history', label: 'History' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`py-2 rounded-xl transition-all ${
              activeSubTab === tab.id
                ? 'bg-gradient-to-r from-[#DC2626] to-[#B91C1C] text-white shadow-md border border-[#E5A93C]/40'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. OVERVIEW TAB: SEPARATE DUAL WALLET CARDS */}
      {activeSubTab === 'overview' && (
        <div className="space-y-4">
          {/* Active Work Mode Switcher Banner */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#20080a] to-[#120a14] border border-[#DC2626]/30 flex items-center justify-between shadow-md">
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">Active Grab / Work Wallet</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm font-black text-white">
                  {activeCurrency === 'USD' ? 'USD (USDT) Wallet' : 'ETB (Ethiopian Birr) Wallet'}
                </span>
                <span className="px-2 py-0.2 rounded text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  ACTIVE
                </span>
              </div>
            </div>
            <button
              onClick={() => handleSwitchCurrency(activeCurrency === 'USD' ? 'ETB' : 'USD')}
              disabled={switchingCurrency}
              className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-bold text-[#E5A93C] flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
            >
              <RefreshCw size={13} className={switchingCurrency ? 'animate-spin' : ''} />
              <span>Switch to {activeCurrency === 'USD' ? 'ETB' : 'USD'}</span>
            </button>
          </div>

          {/* DUAL WALLETS SIDE-BY-SIDE / STACKED */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* ETB WALLET CARD */}
            <div className={`relative overflow-hidden rounded-3xl p-5 border transition-all shadow-xl ${
              activeCurrency === 'ETB'
                ? 'bg-gradient-to-br from-[#2a0808] via-[#1a0f12] to-[#0d0e12] border-[#DC2626]/60 ring-1 ring-[#DC2626]/40'
                : 'bg-[#121319] border-neutral-800 opacity-90'
            }`}>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black text-xs">
                    ETB
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-sm">ETB Wallet</h3>
                    <span className="text-[10px] text-neutral-400">Commercial Bank of Ethiopia</span>
                  </div>
                </div>
                {activeCurrency === 'ETB' ? (
                  <span className="px-2 py-0.5 rounded-full bg-[#DC2626]/20 text-[#FDE047] text-[10px] font-extrabold border border-[#DC2626]/40">
                    Active Work
                  </span>
                ) : (
                  <button
                    onClick={() => handleSwitchCurrency('ETB')}
                    className="text-[10px] font-bold text-neutral-400 hover:text-white underline"
                  >
                    Set as Work
                  </button>
                )}
              </div>

              <div className="mt-4">
                <span className="text-[10px] uppercase font-semibold text-neutral-400 block">Available Balance</span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-black text-white">
                    {etbAvailable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs font-bold text-[#E5A93C]">ETB</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400">
                <span>Frozen Assets:</span>
                <span className="font-semibold text-neutral-300">{etbFrozen.toLocaleString()} ETB</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] text-neutral-400">
                <span>Min. Work Balance:</span>
                <span className="font-bold text-amber-400">2,000 ETB</span>
              </div>

              {/* Fast Action Buttons */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setDepositCurrencyMode('ETB');
                    setActiveSubTab('deposit');
                  }}
                  className="py-2.5 rounded-xl bg-gradient-to-r from-[#DC2626] to-[#B91C1C] hover:from-[#EF4444] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md border border-[#E5A93C]/40"
                >
                  <ArrowDownLeft size={14} /> Deposit ETB
                </button>
                <button
                  onClick={() => {
                    setWithdrawCurrencyMode('ETB');
                    setActiveSubTab('withdraw');
                  }}
                  className="py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5"
                >
                  <ArrowUpRight size={14} /> Withdraw ETB
                </button>
              </div>
            </div>

            {/* USD (USDT) WALLET CARD */}
            <div className={`relative overflow-hidden rounded-3xl p-5 border transition-all shadow-xl ${
              activeCurrency === 'USD'
                ? 'bg-gradient-to-br from-[#121c2e] via-[#0e1624] to-[#0a0f19] border-blue-500/60 ring-1 ring-blue-500/40'
                : 'bg-[#121319] border-neutral-800 opacity-90'
            }`}>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-green-500/20 text-green-400 border border-green-500/30 flex items-center justify-center font-black text-xs">
                    $
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-sm">USD Wallet (USDT)</h3>
                    <span className="text-[10px] text-neutral-400">BEP20 & TRC20 Supported</span>
                  </div>
                </div>
                {activeCurrency === 'USD' ? (
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-extrabold border border-blue-500/40">
                    Active Work
                  </span>
                ) : (
                  <button
                    onClick={() => handleSwitchCurrency('USD')}
                    className="text-[10px] font-bold text-neutral-400 hover:text-white underline"
                  >
                    Set as Work
                  </button>
                )}
              </div>

              <div className="mt-4">
                <span className="text-[10px] uppercase font-semibold text-neutral-400 block">Available Balance</span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-black text-white">
                    ${usdAvailable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs font-bold text-green-400">USDT</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400">
                <span>Frozen Assets:</span>
                <span className="font-semibold text-neutral-300">${usdFrozen.toFixed(2)} USDT</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] text-neutral-400">
                <span>Min. Work Balance:</span>
                <span className="font-bold text-green-400">$10.00 USDT</span>
              </div>

              {/* Fast Action Buttons */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setDepositCurrencyMode('BEP20');
                    setActiveSubTab('deposit');
                  }}
                  className="py-2.5 rounded-xl bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md border border-blue-400/40"
                >
                  <ArrowDownLeft size={14} /> Deposit USDT
                </button>
                <button
                  onClick={() => {
                    setWithdrawCurrencyMode('BEP20');
                    setActiveSubTab('withdraw');
                  }}
                  className="py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5"
                >
                  <ArrowUpRight size={14} /> Withdraw USDT
                </button>
              </div>
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
                  {deposits.find(d => d.status === 'Pending')?.currency === 'USD'
                    ? `$${deposits.find(d => d.status === 'Pending')?.amount.toLocaleString()} USDT`
                    : `${deposits.find(d => d.status === 'Pending')?.amount.toLocaleString()} ETB`}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-1 font-mono">
                Ref: {deposits.find(d => d.status === 'Pending')?.referenceNumber || deposits.find(d => d.status === 'Pending')?.id} • Channel: {deposits.find(d => d.status === 'Pending')?.network || 'CBE'} • Status: <span className="text-amber-400 font-bold">Pending Admin Verification</span>
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
                  {withdrawals[0].currency === 'USD'
                    ? `$${withdrawals[0].amount.toLocaleString()} USDT`
                    : `${withdrawals[0].amount.toLocaleString()} ETB`}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-1">
                Ref: {withdrawals[0].id} • Destination: {withdrawals[0].bankName || withdrawals[0].network} ({withdrawals[0].accountNumber}) • Status: <span className="text-amber-400 font-semibold">Pending Admin Review</span>
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
              {transactions.slice(0, 4).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-neutral-900/50">
                  <div className="min-w-0 flex-1 pr-2">
                    <span className="font-semibold text-white block truncate">{tx.title}</span>
                    <span className="text-[10px] text-neutral-500">{new Date(tx.createdAt).toLocaleDateString()}</span>
                  </div>
                  <span className={`font-extrabold ${tx.type === 'deposit' || tx.type === 'daily_income' || tx.type === 'task_reward' ? 'text-[#E5A93C]' : 'text-neutral-300'}`}>
                    {tx.type === 'deposit' || tx.type === 'daily_income' || tx.type === 'task_reward' ? '+' : '-'}{tx.amount.toLocaleString()} {tx.currency || 'ETB'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. RECHARGE / DEPOSIT TAB (ETB, BEP20, TRC20) */}
      {activeSubTab === 'deposit' && (
        <div className="space-y-4 bg-[#12131a] rounded-3xl border border-neutral-800 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-white">Recharge / Deposit Funds</h3>
              <p className="text-[11px] text-neutral-400">Select payment currency & official deposit channel</p>
            </div>
          </div>

          {/* Payment Method Tabs */}
          <div>
            <label className="text-xs font-semibold text-neutral-300 mb-1.5 block">Select Deposit Channel</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setDepositCurrencyMode('ETB');
                  setDepositAmount('2000');
                  setDepositMsg(null);
                }}
                className={`py-2.5 px-2 rounded-xl text-xs font-extrabold transition-all text-center flex flex-col items-center gap-0.5 ${
                  depositCurrencyMode === 'ETB'
                    ? 'bg-gradient-to-r from-[#DC2626] to-[#B91C1C] text-white border border-[#E5A93C]/40 shadow-md'
                    : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:border-neutral-700'
                }`}
              >
                <span>ETB (CBE Bank)</span>
                <span className="text-[9px] font-normal opacity-80">Min 2,000 ETB</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDepositCurrencyMode('BEP20');
                  setDepositAmount('10');
                  setDepositMsg(null);
                }}
                className={`py-2.5 px-2 rounded-xl text-xs font-extrabold transition-all text-center flex flex-col items-center gap-0.5 ${
                  depositCurrencyMode === 'BEP20'
                    ? 'bg-gradient-to-r from-blue-700 to-blue-600 text-white border border-blue-400/40 shadow-md'
                    : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:border-neutral-700'
                }`}
              >
                <span>BEP20 (USDT)</span>
                <span className="text-[9px] font-normal opacity-80">Min $10 USDT</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDepositCurrencyMode('TRC20');
                  setDepositAmount('10');
                  setDepositMsg(null);
                }}
                className={`py-2.5 px-2 rounded-xl text-xs font-extrabold transition-all text-center flex flex-col items-center gap-0.5 ${
                  depositCurrencyMode === 'TRC20'
                    ? 'bg-gradient-to-r from-green-700 to-green-600 text-white border border-green-400/40 shadow-md'
                    : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:border-neutral-700'
                }`}
              >
                <span>TRC20 (USDT)</span>
                <span className="text-[9px] font-normal opacity-80">Min $10 USDT</span>
              </button>
            </div>
          </div>

          {/* Wallet Destination Notice */}
          <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 text-xs flex items-center justify-between">
            <span className="text-neutral-400">Depositing to Wallet:</span>
            <span className="font-extrabold text-white flex items-center gap-1.5">
              {depositCurrencyMode === 'ETB' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span className="text-amber-300">ETB Wallet (No auto-conversion)</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-green-400"></span>
                  <span className="text-green-300">USD Wallet (USDT - No auto-conversion)</span>
                </>
              )}
            </span>
          </div>

          {/* CHANNEL 1: ETB (CBE BANK DETAILS) */}
          {depositCurrencyMode === 'ETB' && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1b1e2e] via-[#141724] to-[#0f111a] border border-blue-500/30 space-y-3 shadow-lg">
              <div className="flex items-center justify-between border-b border-blue-500/20 pb-2.5">
                <div className="flex items-center gap-2">
                  <Building2 size={18} className="text-blue-400" />
                  <span className="text-xs font-extrabold text-white">Commercial Bank of Ethiopia (CBE)</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Verified Account
                </span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400">Bank Name</span>
                <p className="text-xs font-bold text-white">{CBE_BANK_INFO.bankName}</p>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-neutral-800/80">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400 block">Account Holder</span>
                  <p className="text-xs font-extrabold text-[#E5A93C]">{CBE_BANK_INFO.accountHolder}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(CBE_BANK_INFO.accountHolder, 'holder')}
                  className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[10px] font-bold flex items-center gap-1 transition-colors"
                >
                  {copiedKey === 'holder' ? <Check size={12} className="text-[#E5A93C]" /> : <Copy size={12} />}
                  <span>{copiedKey === 'holder' ? 'Copied' : 'Copy Name'}</span>
                </button>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-neutral-800/80">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400 block">Account Number</span>
                  <p className="text-sm font-black font-mono text-white tracking-wider">{CBE_BANK_INFO.accountNumber}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(CBE_BANK_INFO.accountNumber, 'acc-num')}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#DC2626] to-[#B91C1C] hover:from-[#EF4444] text-white text-[11px] font-extrabold flex items-center gap-1 shadow-sm transition-transform active:scale-95 border border-[#E5A93C]/40"
                >
                  {copiedKey === 'acc-num' ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedKey === 'acc-num' ? 'Copied' : 'Copy Number'}</span>
                </button>
              </div>
            </div>
          )}

          {/* CHANNEL 2 & 3: USDT (BEP20 or TRC20) */}
          {(depositCurrencyMode === 'BEP20' || depositCurrencyMode === 'TRC20') && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#121c2e] via-[#0d1624] to-[#080d16] border border-green-500/30 space-y-3.5 shadow-lg">
              <div className="flex items-center justify-between border-b border-green-500/20 pb-2.5">
                <div className="flex items-center gap-2">
                  <Coins size={18} className="text-green-400" />
                  <span className="text-xs font-extrabold text-white">
                    Official {CRYPTO_DEPOSIT_INFO[depositCurrencyMode].network} Deposit
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/20 text-green-300 border border-green-500/30">
                  {depositCurrencyMode} USDT
                </span>
              </div>

              {/* QR Code & Address Display */}
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-black/50 p-3 rounded-2xl border border-neutral-800">
                <div className="w-32 h-32 bg-white p-2 rounded-xl shrink-0 flex items-center justify-center">
                  <img
                    src={CRYPTO_DEPOSIT_INFO[depositCurrencyMode].qrUrl}
                    alt={`${depositCurrencyMode} QR`}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider block">
                    Deposit Address ({depositCurrencyMode})
                  </span>
                  <p className="text-xs font-mono font-bold text-white break-all leading-relaxed select-all">
                    {CRYPTO_DEPOSIT_INFO[depositCurrencyMode].address}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleCopy(CRYPTO_DEPOSIT_INFO[depositCurrencyMode].address, 'crypto-addr')}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                  >
                    {copiedKey === 'crypto-addr' ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedKey === 'crypto-addr' ? 'Address Copied!' : 'Copy Deposit Address'}</span>
                  </button>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <AlertTriangle size={13} /> Important Network Notice:
                </p>
                <p className="text-neutral-300">
                  Send only <strong className="text-white">USDT</strong> on the <strong className="text-white">{CRYPTO_DEPOSIT_INFO[depositCurrencyMode].network}</strong> network. Minimum deposit is $10 USDT.
                </p>
              </div>
            </div>
          )}

          {/* Amount Presets */}
          <div>
            <label className="text-xs font-semibold text-neutral-300 mb-1.5 block">
              Select Amount ({depositCurrencyMode === 'ETB' ? 'ETB' : 'USDT'})
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {(depositCurrencyMode === 'ETB'
                ? ['2000', '3000', '5000', '10000', '25000', '50000']
                : ['10', '25', '50', '100', '250', '500']
              ).map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setDepositAmount(amt)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    depositAmount === amt
                      ? depositCurrencyMode === 'ETB'
                        ? 'bg-gradient-to-r from-[#DC2626] to-[#B91C1C] text-white shadow-md border border-[#E5A93C]/40'
                        : 'bg-gradient-to-r from-green-700 to-green-600 text-white shadow-md border border-green-400/40'
                      : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  {depositCurrencyMode === 'ETB' ? Number(amt).toLocaleString() : `$${amt}`}
                </button>
              ))}
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="text-xs font-semibold text-neutral-300 mb-1 block">
              Custom Amount ({depositCurrencyMode === 'ETB' ? 'ETB' : 'USDT'})
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-xs">
                {depositCurrencyMode === 'ETB' ? 'ETB' : 'USDT'}
              </span>
              <input
                type="number"
                min={depositCurrencyMode === 'ETB' ? '2000' : '10'}
                step={depositCurrencyMode === 'ETB' ? '100' : '1'}
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full pl-14 pr-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm font-bold focus:outline-none focus:border-[#E5A93C]"
              />
            </div>
            <span className="text-[10px] text-neutral-400 mt-1 block">
              Minimum deposit is {depositCurrencyMode === 'ETB' ? '2,000 ETB' : '$10.00 USDT'}
            </span>
          </div>

          {/* Reference / TxID Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-amber-300">
                {depositCurrencyMode === 'ETB' ? 'Transaction Reference Number *' : 'Blockchain Transaction Hash (TxID) *'}
              </label>
              <span className="text-[10px] text-neutral-400 font-mono">Mandatory</span>
            </div>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder={depositCurrencyMode === 'ETB' ? 'e.g. CBE123456789 or Bank Ref' : 'e.g. 0x... or Tron Tx Hash'}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 font-mono focus:outline-none focus:border-[#E5A93C]"
            />
            <p className="text-[11px] text-neutral-400 mt-1">
              {depositCurrencyMode === 'ETB'
                ? 'Enter the transaction reference from your Commercial Bank of Ethiopia transfer.'
                : 'Enter the transaction hash (TxID) generated from your crypto wallet transfer.'}
            </p>
          </div>

          {/* Payment Slip Upload */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-amber-300">Upload Payment Slip / Transfer Screenshot *</label>
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
                      {slipFileName || 'payment_receipt.jpg'}
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

          {/* Policy Note */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200/90 space-y-1">
            <p className="font-semibold text-amber-300 flex items-center gap-1">
              <Clock size={12} />
              Recharge Verification:
            </p>
            <p className="text-neutral-300">
              Recharges enter the Admin Verification Queue. Upon verification, funds are credited strictly to your <strong className="text-white">{depositCurrencyMode === 'ETB' ? 'ETB Wallet' : 'USD Wallet'}</strong>. No conversion is performed.
            </p>
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
            {depositLoading
              ? 'Submitting Recharge Request...'
              : `Submit Recharge Request (${depositCurrencyMode === 'ETB' ? `${Number(depositAmount || 0).toLocaleString()} ETB` : `$${depositAmount || 0} USDT`})`}
          </button>
        </div>
      )}

      {/* 3. WITHDRAWAL TAB (ETB, BEP20, TRC20) */}
      {activeSubTab === 'withdraw' && (
        <div className="space-y-4 bg-[#12131a] rounded-3xl border border-neutral-800 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-white">Withdraw Funds</h3>
            <span className="text-xs font-bold text-neutral-400">
              Available: <span className="text-[#E5A93C]">
                {isWdEtb ? `${etbAvailable.toLocaleString()} ETB` : `$${usdAvailable.toFixed(2)} USDT`}
              </span>
            </span>
          </div>

          {/* Payout Currency Method Selector */}
          <div>
            <label className="text-xs font-semibold text-neutral-300 mb-1.5 block">Select Payout Channel</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setWithdrawCurrencyMode('ETB');
                  setWithdrawAmount('1000');
                  setWithdrawMsg(null);
                }}
                className={`py-2 px-2 rounded-xl text-xs font-extrabold transition-all text-center ${
                  withdrawCurrencyMode === 'ETB'
                    ? 'bg-gradient-to-r from-[#DC2626] to-[#B91C1C] text-white border border-[#E5A93C]/40 shadow-md'
                    : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:border-neutral-700'
                }`}
              >
                ETB (Bank)
              </button>
              <button
                type="button"
                onClick={() => {
                  setWithdrawCurrencyMode('BEP20');
                  setWithdrawAmount('10');
                  setWithdrawMsg(null);
                }}
                className={`py-2 px-2 rounded-xl text-xs font-extrabold transition-all text-center ${
                  withdrawCurrencyMode === 'BEP20'
                    ? 'bg-gradient-to-r from-blue-700 to-blue-600 text-white border border-blue-400/40 shadow-md'
                    : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:border-neutral-700'
                }`}
              >
                BEP20 (USDT)
              </button>
              <button
                type="button"
                onClick={() => {
                  setWithdrawCurrencyMode('TRC20');
                  setWithdrawAmount('10');
                  setWithdrawMsg(null);
                }}
                className={`py-2 px-2 rounded-xl text-xs font-extrabold transition-all text-center ${
                  withdrawCurrencyMode === 'TRC20'
                    ? 'bg-gradient-to-r from-green-700 to-green-600 text-white border border-green-400/40 shadow-md'
                    : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:border-neutral-700'
                }`}
              >
                TRC20 (USDT)
              </button>
            </div>
          </div>

          {/* ETB Payout Fields */}
          {isWdEtb ? (
            <>
              <div>
                <label className="text-xs font-semibold text-neutral-300 mb-1 block">Payout Bank</label>
                <select
                  value={withdrawBankName}
                  onChange={(e) => setWithdrawBankName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white font-semibold focus:outline-none focus:border-[#E5A93C]"
                >
                  <option value="Commercial Bank of Ethiopia (CBE)">Commercial Bank of Ethiopia (CBE)</option>
                  <option value="Awash Bank">Awash Bank</option>
                  <option value="Dashen Bank">Dashen Bank</option>
                  <option value="Bank of Abyssinia">Bank of Abyssinia</option>
                  <option value="Cooperative Bank of Oromia">Cooperative Bank of Oromia</option>
                  <option value="Telebirr">Telebirr Wallet</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 mb-1 block">Account Holder Full Name</label>
                <input
                  type="text"
                  value={withdrawAccountHolder}
                  onChange={(e) => setWithdrawAccountHolder(e.target.value)}
                  placeholder="e.g. Abebe Bikila"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 font-semibold focus:outline-none focus:border-[#E5A93C]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 mb-1 block">Bank Account Number / Phone (Telebirr)</label>
                <input
                  type="text"
                  value={withdrawAccountNumber}
                  onChange={(e) => setWithdrawAccountNumber(e.target.value)}
                  placeholder="e.g. 1000123456789"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 font-mono focus:outline-none focus:border-[#E5A93C]"
                />
              </div>
            </>
          ) : (
            /* USDT Crypto Payout Fields */
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-neutral-300 mb-1 block">
                  {withdrawCurrencyMode} Destination Wallet Address
                </label>
                <input
                  type="text"
                  value={withdrawCryptoAddress}
                  onChange={(e) => setWithdrawCryptoAddress(e.target.value)}
                  placeholder={withdrawCurrencyMode === 'BEP20' ? 'e.g. 0x... (BNB Smart Chain BEP20)' : 'e.g. T... (Tron TRC20)'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 font-mono focus:outline-none focus:border-[#E5A93C]"
                />
                <span className="text-[10px] text-neutral-400 mt-1 block">
                  Funds will be sent as USDT via {withdrawCurrencyMode === 'BEP20' ? 'BNB Smart Chain (BEP20)' : 'Tron Network (TRC20)'}.
                </span>
              </div>
            </div>
          )}

          {/* Quick Select Presets */}
          <div>
            <label className="text-xs font-semibold text-neutral-300 mb-1.5 block">
              Quick Select Amount (Min {isWdEtb ? '500 ETB' : '$10 USDT'})
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {(isWdEtb
                ? ['500', '1000', '2000', '5000', '10000']
                : ['10', '25', '50', '100', '500']
              ).map((amt) => (
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
                  {isWdEtb ? Number(amt).toLocaleString() : `$${amt}`}
                </button>
              ))}
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="text-xs font-semibold text-neutral-300 mb-1 block">
              Withdrawal Amount ({wdUnit})
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-xs">{wdUnit}</span>
              <input
                type="number"
                min={currentWdMin}
                step={isWdEtb ? '50' : '1'}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="w-full pl-14 pr-16 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm font-bold focus:outline-none focus:border-[#E5A93C]"
              />
              <button
                type="button"
                onClick={() => setWithdrawAmount(String(Math.floor(currentWdBalance)))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-extrabold text-[#E5A93C] hover:underline"
              >
                MAX
              </button>
            </div>
          </div>

          {/* Fee & Net Calculation */}
          <div className="p-3.5 rounded-2xl bg-[#0c0d12] border border-neutral-800 space-y-2 text-xs">
            <div className="flex justify-between text-neutral-400">
              <span>Withdrawal Amount</span>
              <span className="font-semibold text-neutral-200">
                {isWdEtb
                  ? `${(parseFloat(withdrawAmount) || 0).toLocaleString()} ETB`
                  : `$${(parseFloat(withdrawAmount) || 0).toFixed(2)} USDT`}
              </span>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>Platform Service Fee (7%)</span>
              <span className="font-semibold text-neutral-200">
                -{calcWdFee.toFixed(2)} {wdUnit}
              </span>
            </div>
            <div className="pt-2 border-t border-neutral-800 flex justify-between font-bold">
              <span className="text-white">Net Payout Transferred</span>
              <span className="text-base text-[#E5A93C]">
                {calcWdNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {wdUnit}
              </span>
            </div>
          </div>

          {/* Minimum Work Balance Trigger Warning */}
          {remainingIfWd < minGrabRequired && (
            <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
              <AlertTriangle size={16} className="shrink-0 text-amber-400 mt-0.5" />
              <div>
                <span className="font-extrabold block">Notice: Minimum Work Threshold</span>
                <p className="mt-0.5 text-neutral-400">
                  After this withdrawal, your remaining {wdUnit} balance will be {Math.max(0, remainingIfWd).toLocaleString()} {wdUnit}. Grab tasks require at least {isWdEtb ? '2,000 ETB' : '$10 USDT'} to execute.
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
            disabled={withdrawLoading || currentWdBalance < (parseFloat(withdrawAmount) || 0)}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#DC2626] to-[#B91C1C] hover:from-[#EF4444] text-white font-extrabold text-sm transition-all disabled:opacity-40 shadow-lg shadow-[#DC2626]/20 border border-[#E5A93C]/40"
          >
            {withdrawLoading ? 'Freezing Funds & Creating Request...' : `Submit Withdrawal Request (${isWdEtb ? `${Number(withdrawAmount || 0).toLocaleString()} ETB` : `$${withdrawAmount || 0} USDT`})`}
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
                      {tx.amount.toLocaleString()} {tx.currency || 'ETB'}
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
