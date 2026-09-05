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
  FileText,
  Image as ImageIcon,
  ShieldCheck,
  Info
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

export const FinanceView: React.FC<FinanceViewProps> = ({ financeData, onRefresh }) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'deposit' | 'withdraw' | 'history'>('overview');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'deposits' | 'withdrawals' | 'tickets'>('all');

  // Deposit state (ETB-only via Commercial Bank of Ethiopia)
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

  // Handle Payment Slip Upload (with automatic high-res optimization for fast, error-free upload)
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

      // Optimize image for rapid, fail-safe transfer (maximum 1280px dimension, high-definition JPEG)
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
    if (isNaN(amt) || amt < 2000) {
      setDepositMsg({ text: 'Minimum recharge amount is 2,000 ETB', isError: true });
      return;
    }

    if (!referenceNumber.trim()) {
      setDepositMsg({ text: 'Please enter the transaction reference / confirmation number from your CBE transfer', isError: true });
      return;
    }

    if (!paymentSlipUrl.trim()) {
      setDepositMsg({ text: 'Please upload your payment slip receipt image before submitting', isError: true });
      return;
    }

    setDepositLoading(true);
    setDepositMsg(null);

    try {
      const res = await api.deposit({
        amount: amt,
        referenceNumber: referenceNumber.trim(),
        paymentSlipUrl: paymentSlipUrl.trim(),
        bankName: CBE_BANK_INFO.bankName,
        accountHolder: CBE_BANK_INFO.accountHolder,
        accountNumber: CBE_BANK_INFO.accountNumber
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
    if (isNaN(amt) || amt < 500) {
      setWithdrawMsg({ text: 'Minimum withdrawal is 500 ETB', isError: true });
      return;
    }

    if (!user || user.balance < amt) {
      setWithdrawMsg({ text: `Insufficient available balance (${user?.balance.toLocaleString() || '0'} ETB)`, isError: true });
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

    setWithdrawLoading(true);
    setWithdrawMsg(null);

    try {
      const res = await api.withdraw({
        amount: amt,
        bankName: withdrawBankName,
        accountHolder: withdrawAccountHolder.trim(),
        accountNumber: withdrawAccountNumber.trim()
      });
      setWithdrawMsg({ text: res.message });
      onRefresh();
    } catch (err: any) {
      setWithdrawMsg({ text: err.message || 'Withdrawal request failed', isError: true });
    } finally {
      setWithdrawLoading(false);
    }
  };

  const calcWdFee = (parseFloat(withdrawAmount) || 0) * 0.07;
  const calcWdNet = Math.max(0, (parseFloat(withdrawAmount) || 0) - calcWdFee);
  const remainingIfWd = (user?.balance || 0) - (parseFloat(withdrawAmount) || 0);

  return (
    <div id="finance-view-container" className="pb-28 space-y-4">
      {/* Sub Tabs Navigation */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-neutral-900/90 rounded-2xl border border-neutral-800 text-xs font-bold">
        {[
          { id: 'overview', label: 'Wallet' },
          { id: 'deposit', label: 'Recharge' },
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
                <span className="font-semibold text-neutral-300">Total Assets (ETB)</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#00D26A]/15 text-[#00D26A] text-[10px] font-extrabold border border-[#00D26A]/30">
                VIP {user?.vipLevel || 1}
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-white">
                {user ? user.totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
              </span>
              <span className="text-sm text-[#00D26A] font-bold">ETB</span>
            </div>

            {/* Balances Grid */}
            <div className="mt-4 pt-4 border-t border-neutral-800/80 grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-neutral-900/60 border border-neutral-800">
                <span className="text-[11px] text-neutral-400 block">Available Balance</span>
                <span className="text-base font-extrabold text-[#00D26A] mt-0.5 block">
                  {user ? user.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'} ETB
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-neutral-900/60 border border-neutral-800">
                <span className="text-[11px] text-neutral-400 block">Frozen Balance</span>
                <span className="text-base font-extrabold text-neutral-300 mt-0.5 block">
                  {user ? (user.frozenBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'} ETB
                </span>
              </div>
            </div>

            {/* Fast Action Buttons */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={() => setActiveSubTab('deposit')}
                className="py-3 rounded-xl bg-[#00D26A] hover:bg-[#00e875] text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#00D26A]/20 transition-transform active:scale-95"
              >
                <ArrowDownLeft size={16} /> Recharge (CBE)
              </button>
              <button
                onClick={() => setActiveSubTab('withdraw')}
                className="py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                <ArrowUpRight size={16} /> Withdraw ETB
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
                <span>{deposits.find(d => d.status === 'Pending')?.amount.toLocaleString()} ETB</span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-1 font-mono">
                Ref: {deposits.find(d => d.status === 'Pending')?.referenceNumber || deposits.find(d => d.status === 'Pending')?.id} • Bank: Commercial Bank of Ethiopia • Status: <span className="text-amber-400 font-bold">Pending Admin Verification</span>
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
                <span>{withdrawals[0].amount.toLocaleString()} ETB</span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-1">
                Ref: {withdrawals[0].id} • Destination: {withdrawals[0].bankName || 'CBE Bank'} ({withdrawals[0].accountNumber}) • Status: <span className="text-amber-400 font-semibold">Pending Admin Review</span>
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
              {transactions.slice(0, 4).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-neutral-900/50">
                  <div className="min-w-0 flex-1 pr-2">
                    <span className="font-semibold text-white block truncate">{tx.title}</span>
                    <span className="text-[10px] text-neutral-500">{new Date(tx.createdAt).toLocaleDateString()}</span>
                  </div>
                  <span className={`font-extrabold ${tx.type === 'deposit' || tx.type === 'daily_income' || tx.type === 'task_reward' ? 'text-[#00D26A]' : 'text-neutral-300'}`}>
                    {tx.type === 'deposit' || tx.type === 'daily_income' || tx.type === 'task_reward' ? '+' : '-'}{tx.amount.toLocaleString()} ETB
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. RECHARGE / DEPOSIT TAB (ETB-ONLY CBE BANK TRANSFER) */}
      {activeSubTab === 'deposit' && (
        <div className="space-y-4 bg-[#12131a] rounded-3xl border border-neutral-800 p-5">
          <div>
            <h3 className="text-sm font-extrabold text-white">Recharge Account (ETB)</h3>
            <p className="text-[11px] text-neutral-400">Transfer funds via Commercial Bank of Ethiopia (CBE) and submit your receipt</p>
          </div>

          {/* OFFICIAL CBE BANK DETAILS DISPLAY CARD */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1b1e2e] via-[#141724] to-[#0f111a] border border-blue-500/30 space-y-3 shadow-lg">
            <div className="flex items-center justify-between border-b border-blue-500/20 pb-2.5">
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-blue-400" />
                <span className="text-xs font-extrabold text-white">Official Deposit Bank</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Verified Account
              </span>
            </div>

            {/* Bank Name */}
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400">Bank Name</span>
              <p className="text-xs font-bold text-white">{CBE_BANK_INFO.bankName}</p>
            </div>

            {/* Account Holder */}
            <div className="flex items-center justify-between pt-1 border-t border-neutral-800/80">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400 block">Account Holder</span>
                <p className="text-xs font-extrabold text-[#00D26A]">{CBE_BANK_INFO.accountHolder}</p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(CBE_BANK_INFO.accountHolder, 'holder')}
                className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[10px] font-bold flex items-center gap-1 transition-colors"
              >
                {copiedKey === 'holder' ? <Check size={12} className="text-[#00D26A]" /> : <Copy size={12} />}
                <span>{copiedKey === 'holder' ? 'Copied' : 'Copy Name'}</span>
              </button>
            </div>

            {/* Account Number */}
            <div className="flex items-center justify-between pt-1 border-t border-neutral-800/80">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400 block">Account Number</span>
                <p className="text-sm font-black font-mono text-white tracking-wider">{CBE_BANK_INFO.accountNumber}</p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(CBE_BANK_INFO.accountNumber, 'acc-num')}
                className="px-3 py-1.5 rounded-lg bg-[#00D26A] hover:bg-[#00e875] text-black text-[11px] font-extrabold flex items-center gap-1 shadow-sm transition-transform active:scale-95"
              >
                {copiedKey === 'acc-num' ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedKey === 'acc-num' ? 'Copied' : 'Copy Number'}</span>
              </button>
            </div>
          </div>

          {/* Preset Top-Up Amounts (ETB) */}
          <div>
            <label className="text-xs font-semibold text-neutral-300 mb-1.5 block">Select Amount (ETB) — Minimum 2,000 ETB</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {['2000', '3000', '5000', '8000', '10000', '20000'].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setDepositAmount(amt)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    depositAmount === amt
                      ? 'bg-[#00D26A] text-black shadow-md shadow-[#00D26A]/20'
                      : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  {Number(amt).toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount Input */}
          <div>
            <label className="text-xs font-semibold text-neutral-300 mb-1 block">Custom Recharge Amount (ETB)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-xs">ETB</span>
              <input
                type="number"
                min="2000"
                step="100"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm font-bold focus:outline-none focus:border-[#00D26A]"
              />
            </div>
            <span className="text-[10px] text-neutral-400 mt-1 block">Minimum deposit is 2,000 ETB</span>
          </div>

          {/* Transaction / Reference Number Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-amber-300">Transaction Reference Number *</label>
              <span className="text-[10px] text-neutral-400 font-mono">Mandatory</span>
            </div>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g. CBE123456789 or Bank Confirmation Ref"
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 font-mono focus:outline-none focus:border-[#00D26A]"
            />
            <p className="text-[11px] text-neutral-400 mt-1">
              Enter the transaction reference or receipt number from your CBE transfer.
            </p>
          </div>

          {/* Mandatory Payment Slip Upload */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-amber-300">Upload Payment Slip / Receipt *</label>
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
                  <UploadCloud size={32} className="text-[#00D26A] mb-2" />
                  <span className="text-xs font-bold text-white">Click to upload payment receipt</span>
                  <span className="text-[11px] text-neutral-400 mt-0.5">Supports PNG, JPG, JPEG (Max 5MB)</span>
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
                      Change Receipt
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200/90 space-y-1">
            <p className="font-semibold text-amber-300 flex items-center gap-1">
              <Clock size={12} />
              Recharge Manual Verification Policy:
            </p>
            <p className="text-neutral-300">
              Recharge requests enter the <strong className="text-white">Admin Pending Queue</strong> immediately. Once our financial administrator matches your reference number and payment slip against our Commercial Bank of Ethiopia account records, your balance will be credited promptly.
            </p>
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
            className="w-full py-3.5 rounded-xl bg-[#00D26A] hover:bg-[#00e875] text-black font-extrabold text-sm shadow-lg shadow-[#00D26A]/20 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {depositLoading ? 'Submitting Recharge Request...' : `Submit Recharge Request (${Number(depositAmount || 0).toLocaleString()} ETB)`}
          </button>
        </div>
      )}

      {/* 3. WITHDRAWAL TAB (ETB-ONLY BANK PAYOUT) */}
      {activeSubTab === 'withdraw' && (
        <div className="space-y-4 bg-[#12131a] rounded-3xl border border-neutral-800 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-white">Withdraw Funds (ETB)</h3>
            <span className="text-xs font-bold text-neutral-400">
              Available: <span className="text-[#00D26A]">{user ? user.balance.toLocaleString() : '0'} ETB</span>
            </span>
          </div>

          {/* Bank Selection */}
          <div>
            <label className="text-xs font-semibold text-neutral-300 mb-1 block">Payout Bank</label>
            <select
              value={withdrawBankName}
              onChange={(e) => setWithdrawBankName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white font-semibold focus:outline-none focus:border-[#00D26A]"
            >
              <option value="Commercial Bank of Ethiopia (CBE)">Commercial Bank of Ethiopia (CBE)</option>
              <option value="Awash Bank">Awash Bank</option>
              <option value="Dashen Bank">Dashen Bank</option>
              <option value="Bank of Abyssinia">Bank of Abyssinia</option>
              <option value="Cooperative Bank of Oromia">Cooperative Bank of Oromia</option>
              <option value="Telebirr">Telebirr Wallet</option>
            </select>
          </div>

          {/* Account Holder Full Name */}
          <div>
            <label className="text-xs font-semibold text-neutral-300 mb-1 block">Account Holder Full Name</label>
            <input
              type="text"
              value={withdrawAccountHolder}
              onChange={(e) => setWithdrawAccountHolder(e.target.value)}
              placeholder="e.g. Abebe Bikila"
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 font-semibold focus:outline-none focus:border-[#00D26A]"
            />
          </div>

          {/* Account Number */}
          <div>
            <label className="text-xs font-semibold text-neutral-300 mb-1 block">Bank Account Number / Phone (Telebirr)</label>
            <input
              type="text"
              value={withdrawAccountNumber}
              onChange={(e) => setWithdrawAccountNumber(e.target.value)}
              placeholder="e.g. 1000123456789"
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 font-mono focus:outline-none focus:border-[#00D26A]"
            />
          </div>

          {/* Quick Preset Withdrawal Amounts */}
          <div>
            <label className="text-xs font-semibold text-neutral-300 mb-1.5 block">Quick Select Amount (Min 500 ETB)</label>
            <div className="grid grid-cols-5 gap-1.5">
              {['500', '1000', '2000', '5000', '10000'].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setWithdrawAmount(amt)}
                  className={`py-1.5 rounded-xl text-xs font-bold transition-all ${
                    withdrawAmount === amt
                      ? 'bg-[#00D26A] text-black shadow-md shadow-[#00D26A]/20'
                      : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  {Number(amt).toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Withdrawal Amount Input */}
          <div>
            <label className="text-xs font-semibold text-neutral-300 mb-1 block">Withdrawal Amount (ETB)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-xs">ETB</span>
              <input
                type="number"
                min="500"
                step="50"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="w-full pl-12 pr-16 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm font-bold focus:outline-none focus:border-[#00D26A]"
              />
              <button
                type="button"
                onClick={() => setWithdrawAmount(String(Math.floor(user?.balance || 0)))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-extrabold text-[#00D26A] hover:underline"
              >
                MAX
              </button>
            </div>
          </div>

          {/* Calculation & Fee Breakdown */}
          <div className="p-3.5 rounded-2xl bg-[#0c0d12] border border-neutral-800 space-y-2 text-xs">
            <div className="flex justify-between text-neutral-400">
              <span>Withdrawal Amount</span>
              <span className="font-semibold text-neutral-200">{(parseFloat(withdrawAmount) || 0).toLocaleString()} ETB</span>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>Platform Service Fee (7%)</span>
              <span className="font-semibold text-neutral-200">-{calcWdFee.toFixed(2)} ETB</span>
            </div>
            <div className="pt-2 border-t border-neutral-800 flex justify-between font-bold">
              <span className="text-white">Net Payout Transferred</span>
              <span className="text-base text-[#00D26A]">{calcWdNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB</span>
            </div>
          </div>

          {/* Minimum Balance 500 ETB Warning */}
          {remainingIfWd < 500 && (
            <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
              <AlertTriangle size={16} className="shrink-0 text-amber-400 mt-0.5" />
              <div>
                <span className="font-extrabold block">Warning: Income Pause Trigger</span>
                <p className="mt-0.5 text-neutral-400">
                  After this withdrawal, your remaining balance will be {Math.max(0, remainingIfWd).toLocaleString()} ETB. If your balance drops below 500 ETB, daily VIP ticket tasks will pause until your account is topped up.
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
            className="w-full py-3.5 rounded-xl bg-neutral-800 hover:bg-[#00D26A] hover:text-black text-white font-extrabold text-sm transition-all disabled:opacity-40 shadow-lg"
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
                      {tx.type === 'deposit' || tx.type === 'daily_income' || tx.type === 'task_reward' ? '+' : '-'}{tx.amount.toLocaleString()} ETB
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
