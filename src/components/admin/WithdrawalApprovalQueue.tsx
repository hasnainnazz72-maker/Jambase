import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  DollarSign,
  Copy,
  Check,
  Wallet,
  User,
  Mail,
  Phone,
  Hash,
  ArrowUpRight,
  ShieldCheck,
  Filter,
  Search,
  RefreshCw,
  Info,
  X,
  AlertTriangle,
  Building2
} from 'lucide-react';
import { WithdrawalRequest } from '../../types';
import { api } from '../../services/api';

interface WithdrawalApprovalQueueProps {
  withdrawals: WithdrawalRequest[];
  onRefresh: () => void;
  onSetActionMsg: (msg: { text: string; isError?: boolean } | null) => void;
}

export const WithdrawalApprovalQueue: React.FC<WithdrawalApprovalQueueProps> = ({
  withdrawals,
  onRefresh,
  onSetActionMsg
}) => {
  const [filterStatus, setFilterStatus] = useState<'All' | 'Pending' | 'Approved' | 'Completed' | 'Rejected'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Approve / Complete Confirmation Modal state
  const [selectedForApproval, setSelectedForApproval] = useState<WithdrawalRequest | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  // Reject Modal state
  const [selectedForRejection, setSelectedForRejection] = useState<WithdrawalRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('Payment verification unconfirmed / Security check required');
  const [rejectNotes, setRejectNotes] = useState('');

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const handleConfirmApproval = async () => {
    if (!selectedForApproval) return;
    setProcessingAction(true);
    try {
      await api.processWithdrawal(selectedForApproval.id, 'Complete', undefined, approvalNotes);
      onSetActionMsg({
        text: `✓ Withdrawal #${selectedForApproval.id} for ${selectedForApproval.amount.toLocaleString()} ETB has been APPROVED and finalized!`
      });
      setSelectedForApproval(null);
      setApprovalNotes('');
      onRefresh();
      setTimeout(() => onSetActionMsg(null), 4000);
    } catch (err: any) {
      onSetActionMsg({ text: err.message || 'Failed to approve withdrawal', isError: true });
    } finally {
      setProcessingAction(false);
    }
  };

  const handleConfirmRejection = async () => {
    if (!selectedForRejection) return;
    setProcessingAction(true);
    try {
      await api.processWithdrawal(selectedForRejection.id, 'Reject', rejectReason, rejectNotes);
      onSetActionMsg({
        text: `Withdrawal #${selectedForRejection.id} rejected. Reserved funds (${selectedForRejection.amount.toLocaleString()} ETB) have been refunded to member's Available Balance.`
      });
      setSelectedForRejection(null);
      setRejectReason('Payment verification unconfirmed / Security check required');
      setRejectNotes('');
      onRefresh();
      setTimeout(() => onSetActionMsg(null), 4000);
    } catch (err: any) {
      onSetActionMsg({ text: err.message || 'Failed to reject withdrawal', isError: true });
    } finally {
      setProcessingAction(false);
    }
  };

  // Filter and search logic
  const filteredWithdrawals = withdrawals.filter((wd) => {
    const matchesStatus =
      filterStatus === 'All'
        ? true
        : filterStatus === 'Completed'
        ? wd.status === 'Completed' || wd.status === 'Approved'
        : wd.status === filterStatus;

    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesStatus;

    const matchesQuery =
      wd.id.toLowerCase().includes(query) ||
      wd.username.toLowerCase().includes(query) ||
      wd.userId.toLowerCase().includes(query) ||
      (wd.walletAddress && wd.walletAddress.toLowerCase().includes(query)) ||
      (wd.userEmail && wd.userEmail.toLowerCase().includes(query)) ||
      (wd.userPhone && wd.userPhone.toLowerCase().includes(query)) ||
      (wd.txId && wd.txId.toLowerCase().includes(query)) ||
      (wd.txHash && wd.txHash.toLowerCase().includes(query));

    return matchesStatus && matchesQuery;
  });

  const pendingCount = withdrawals.filter((w) => w.status === 'Pending').length;
  const approvedCount = withdrawals.filter((w) => w.status === 'Approved' || w.status === 'Completed').length;
  const rejectedCount = withdrawals.filter((w) => w.status === 'Rejected').length;

  return (
    <div className="space-y-5">
      {/* Header & Metric summary pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#11131a] p-4 sm:p-5 rounded-2xl border border-neutral-800/80 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-white tracking-wide">WITHDRAWAL APPROVAL QUEUE</h2>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-mono font-bold">
              {pendingCount} PENDING
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Real-time payout auditing, complete blockchain wallet verification, and balance management.
          </p>
        </div>

        {/* Quick summary numbers */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="px-3 py-1.5 rounded-xl bg-black/60 border border-neutral-800 text-center">
            <span className="text-[10px] text-neutral-400 block font-medium">Total Requests</span>
            <span className="text-xs font-black text-white font-mono">{withdrawals.length}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-center">
            <span className="text-[10px] text-emerald-400 block font-medium">Completed</span>
            <span className="text-xs font-black text-[#00D26A] font-mono">{approvedCount}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-red-950/40 border border-red-800/40 text-center">
            <span className="text-[10px] text-red-400 block font-medium">Rejected</span>
            <span className="text-xs font-black text-red-300 font-mono">{rejectedCount}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-black/40 p-3 rounded-2xl border border-neutral-850">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          <Filter size={14} className="text-neutral-400 mr-1 hidden sm:inline-block" />
          {(['All', 'Pending', 'Completed', 'Rejected'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterStatus === st
                  ? st === 'Pending'
                    ? 'bg-amber-400 text-black shadow-md shadow-amber-500/20'
                    : st === 'Completed'
                    ? 'bg-[#00D26A] text-black shadow-md shadow-[#00D26A]/20'
                    : st === 'Rejected'
                    ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                    : 'bg-white text-black'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              {st}
              {st === 'Pending' && pendingCount > 0 && ` (${pendingCount})`}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Search ID, member, wallet..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#00D26A]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Withdrawal Cards Grid */}
      {filteredWithdrawals.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-neutral-900/30 border border-neutral-800 text-neutral-400 space-y-2">
          <Clock size={32} className="mx-auto text-neutral-600 mb-2" />
          <h3 className="text-sm font-bold text-neutral-200">No Withdrawal Requests Found</h3>
          <p className="text-xs text-neutral-500">
            {searchQuery
              ? `No requests match "${searchQuery}". Try clearing your search query.`
              : `No ${filterStatus.toLowerCase()} withdrawal requests currently in the queue.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredWithdrawals.map((wd) => {
            const isPending = wd.status === 'Pending';
            const isApproved = wd.status === 'Approved' || wd.status === 'Completed';
            const isRejected = wd.status === 'Rejected';
            const dateFormatted = new Date(wd.createdAt).toLocaleString('en-US', {
              year: 'numeric',
              month: 'short',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true
            });

            const userBalAtReq = wd.userBalanceAtRequest ?? wd.currentUserBalance ?? 0;

            return (
              <div
                key={wd.id}
                className={`p-4 sm:p-5 rounded-2xl bg-[#11131a] border transition-all space-y-4 shadow-lg ${
                  isPending
                    ? 'border-amber-500/40 hover:border-amber-500/70 bg-gradient-to-b from-[#161822] to-[#11131a]'
                    : isApproved
                    ? 'border-emerald-500/30 hover:border-emerald-500/50'
                    : 'border-red-500/20 hover:border-red-500/40'
                }`}
              >
                {/* Header Row: ID, Status Badge & Gross Amount */}
                <div className="flex items-start justify-between gap-3 border-b border-neutral-800/80 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">REQUEST #</span>
                      <div className="flex items-center gap-1.5 bg-black/60 px-2.5 py-1 rounded-lg border border-neutral-800">
                        <span className="font-mono text-xs font-black text-amber-300">{wd.id}</span>
                        <button
                          onClick={() => handleCopy(wd.id, `id-${wd.id}`)}
                          title="Copy Withdrawal ID"
                          className="text-neutral-400 hover:text-white transition-colors p-0.5"
                        >
                          {copiedKey === `id-${wd.id}` ? (
                            <Check size={13} className="text-[#00D26A]" />
                          ) : (
                            <Copy size={13} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                      <Clock size={12} className="text-neutral-500" />
                      <span>{dateFormatted}</span>
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                        isApproved
                          ? 'bg-emerald-500/20 text-[#00D26A] border border-emerald-500/30'
                          : isPending
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                          : 'bg-red-500/20 text-red-300 border border-red-500/30'
                      }`}
                    >
                      {isApproved ? <CheckCircle2 size={12} /> : isPending ? <Clock size={12} /> : <XCircle size={12} />}
                      <span>{wd.status}</span>
                    </span>
                    <div className="text-lg font-black text-white tracking-tight">
                      {wd.amount.toLocaleString()} <span className="text-xs font-bold text-neutral-400">ETB</span>
                    </div>
                  </div>
                </div>

                {/* Member Profile Details Box */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-black/50 p-3 rounded-xl border border-neutral-850 text-xs font-mono">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-neutral-400 font-sans block flex items-center gap-1">
                      <User size={10} className="text-emerald-400" /> Member Username
                    </span>
                    <span className="font-bold text-white truncate block">{wd.username}</span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] text-neutral-400 font-sans block flex items-center gap-1">
                      <Hash size={10} className="text-neutral-500" /> Member ID
                    </span>
                    <span className="text-neutral-300 truncate block font-mono">{wd.userId}</span>
                  </div>

                  <div className="space-y-0.5 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-neutral-400 font-sans block flex items-center gap-1">
                      <DollarSign size={10} className="text-[#00D26A]" /> Avail. Balance
                    </span>
                    <span className="text-emerald-400 font-bold block">{userBalAtReq.toLocaleString()} ETB</span>
                  </div>

                  {wd.userEmail && (
                    <div className="space-y-0.5 col-span-2 sm:col-span-2">
                      <span className="text-[10px] text-neutral-400 font-sans block flex items-center gap-1">
                        <Mail size={10} className="text-blue-400" /> Member Email
                      </span>
                      <span className="text-neutral-300 truncate block">{wd.userEmail}</span>
                    </div>
                  )}

                  {wd.userPhone && (
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-neutral-400 font-sans block flex items-center gap-1">
                        <Phone size={10} className="text-purple-400" /> Contact Phone
                      </span>
                      <span className="text-neutral-300 truncate block">{wd.userPhone}</span>
                    </div>
                  )}
                </div>

                {/* FULL UNTRUNCATED BANK ACCOUNT SECTION */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-neutral-300 flex items-center gap-1.5">
                      <Building2 size={14} className="text-[#00D26A]" />
                      <span>Destination Bank Account (CBE)</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-emerald-500/20 text-[#00D26A] border border-emerald-500/30">
                      {wd.bankName || 'Commercial Bank of Ethiopia'}
                    </span>
                  </div>

                  {/* Complete, fully visible bank account details with 1-tap copy */}
                  <div className="relative group bg-[#090b10] border border-emerald-500/30 hover:border-emerald-500/60 transition-colors p-3 rounded-xl">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-mono text-xs text-white font-semibold break-all leading-relaxed select-all">
                        {wd.accountHolder && <div className="text-[11px] text-amber-300 mb-0.5">Holder: {wd.accountHolder}</div>}
                        Account: {wd.accountNumber || wd.walletAddress}
                      </div>

                      <button
                        onClick={() => handleCopy(wd.walletAddress, `wallet-${wd.id}`)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 transition-all ${
                          copiedKey === `wallet-${wd.id}`
                            ? 'bg-[#00D26A] text-black shadow-md shadow-[#00D26A]/30'
                            : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white border border-neutral-700'
                        }`}
                        title="Copy full wallet address"
                      >
                        {copiedKey === `wallet-${wd.id}` ? (
                          <>
                            <Check size={13} />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={13} />
                            <span>Copy Address</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Financial Calculation Breakdown (Gross Amount, Fee, Net Payout) */}
                <div className="grid grid-cols-3 gap-2 bg-black/40 p-3 rounded-xl border border-neutral-850 text-xs">
                  <div>
                    <span className="text-[10px] text-neutral-400 block font-medium">Gross Amount</span>
                    <span className="font-mono font-bold text-white">{wd.amount.toLocaleString()} ETB</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 block font-medium">Platform Fee (7%)</span>
                    <span className="font-mono font-bold text-red-400">-{(wd.fee || wd.amount * 0.07).toLocaleString()} ETB</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-400 block font-bold">Net Member Payout</span>
                    <span className="font-mono font-black text-[#00D26A] text-sm">
                      {(wd.netAmount || wd.amount - (wd.fee || wd.amount * 0.07)).toLocaleString()} ETB
                    </span>
                  </div>
                </div>

                {/* Transaction / Reference / Hash ID if available */}
                {(wd.txId || wd.txHash) && (
                  <div className="p-2.5 rounded-xl bg-black/30 border border-neutral-850 text-[11px] font-mono flex items-center justify-between gap-2">
                    <div className="truncate flex items-center gap-1.5 text-neutral-400">
                      <Hash size={12} className="text-neutral-500 shrink-0" />
                      <span className="text-neutral-500">TxRef:</span>
                      <span className="text-neutral-300 font-bold truncate">{wd.txId || wd.txHash}</span>
                    </div>

                    <button
                      onClick={() => handleCopy(wd.txId || wd.txHash || '', `tx-${wd.id}`)}
                      className="text-neutral-400 hover:text-white p-1 shrink-0"
                      title="Copy Transaction Reference"
                    >
                      {copiedKey === `tx-${wd.id}` ? (
                        <Check size={12} className="text-[#00D26A]" />
                      ) : (
                        <Copy size={12} />
                      )}
                    </button>
                  </div>
                )}

                {/* Rejection / Note display if processed */}
                {wd.rejectReason && (
                  <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300 space-y-1">
                    <span className="font-bold flex items-center gap-1">
                      <AlertCircle size={13} /> Rejection Reason:
                    </span>
                    <p className="text-[11px] text-red-200">{wd.rejectReason}</p>
                    {wd.rejectedBy && (
                      <span className="text-[10px] text-neutral-400 block">Operator: {wd.rejectedBy}</span>
                    )}
                  </div>
                )}

                {wd.adminNotes && !wd.rejectReason && (
                  <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800 text-[11px] text-neutral-400">
                    <strong className="text-neutral-300">Admin Audit Note:</strong> {wd.adminNotes}
                  </div>
                )}

                {/* ACTION BUTTONS (For Pending Requests) */}
                {isPending && (
                  <div className="flex items-center gap-2 pt-2 border-t border-neutral-800">
                    <button
                      onClick={() => setSelectedForApproval(wd)}
                      className="flex-1 py-2.5 rounded-xl bg-[#00D26A] hover:bg-[#00e875] text-black font-extrabold text-xs shadow-md shadow-[#00D26A]/20 transition-all flex items-center justify-center gap-1.5 active:scale-98"
                    >
                      <CheckCircle2 size={15} />
                      <span>Review & Approve Payout</span>
                    </button>

                    <button
                      onClick={() => setSelectedForRejection(wd)}
                      className="py-2.5 px-4 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-500/40 text-red-300 font-bold text-xs transition-colors flex items-center gap-1"
                    >
                      <XCircle size={14} />
                      <span>Reject & Refund</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* APPROVE & COMPLETE CONFIRMATION MODAL (Strict Audit & Complete Details) */}
      {/* ========================================================================= */}
      {selectedForApproval && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#11131a] border border-emerald-500/40 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl shadow-emerald-950/50 space-y-5 text-neutral-100 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-[#00D26A]">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white tracking-wide">CONFIRM WITHDRAWAL PAYOUT</h3>
                  <p className="text-[11px] text-neutral-400">Verify destination bank and account details before dispatching ETB funds</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedForApproval(null)}
                disabled={processingAction}
                className="p-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Comprehensive Detail Summary Card */}
            <div className="space-y-3 bg-black/60 p-4 rounded-2xl border border-neutral-800 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-neutral-850">
                <span className="text-neutral-400">Withdrawal Request ID:</span>
                <span className="font-mono font-bold text-amber-300">{selectedForApproval.id}</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-neutral-850">
                <span className="text-neutral-400">Member:</span>
                <span className="font-bold text-white">
                  {selectedForApproval.username}{' '}
                  <span className="text-neutral-500 font-mono text-[10px]">({selectedForApproval.userId})</span>
                </span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-neutral-850">
                <span className="text-neutral-400">Withdrawal Amount (Gross):</span>
                <span className="font-mono font-bold text-white text-sm">{selectedForApproval.amount.toLocaleString()} ETB</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-neutral-850">
                <span className="text-neutral-400">Payout Bank:</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-[#00D26A] font-bold font-mono text-[11px]">
                  {selectedForApproval.bankName || 'Commercial Bank of Ethiopia'}
                </span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-neutral-850">
                <span className="text-neutral-400">Account Holder:</span>
                <span className="font-bold text-white">
                  {selectedForApproval.accountHolder || selectedForApproval.username}
                </span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-neutral-850">
                <span className="text-neutral-400">Platform Service Fee (7%):</span>
                <span className="font-mono font-bold text-red-400">
                  -{(selectedForApproval.fee || selectedForApproval.amount * 0.07).toLocaleString()} ETB
                </span>
              </div>

              <div className="flex justify-between items-center pt-1 bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-500/30">
                <span className="font-bold text-emerald-300">NET MEMBER PAYOUT:</span>
                <span className="font-mono font-black text-[#00D26A] text-base">
                  {(selectedForApproval.netAmount || selectedForApproval.amount - (selectedForApproval.fee || selectedForApproval.amount * 0.07)).toLocaleString()} ETB
                </span>
              </div>
            </div>

            {/* FULL UNTRUNCATED WALLET / ACCOUNT NUMBER VERIFICATION */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Building2 size={14} className="text-[#00D26A]" /> Destination Bank Account Number:
                </span>
                <button
                  onClick={() => handleCopy(selectedForApproval.accountNumber || selectedForApproval.walletAddress, 'modal-wallet')}
                  className="text-xs text-neutral-400 hover:text-white flex items-center gap-1"
                >
                  {copiedKey === 'modal-wallet' ? (
                    <span className="text-[#00D26A] font-bold">✓ Copied</span>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-black border-2 border-[#00D26A]/60 text-white font-mono text-sm break-all select-all font-semibold leading-relaxed">
                {selectedForApproval.accountNumber || selectedForApproval.walletAddress}
              </div>
            </div>

            {/* Admin Audit Operator Notes */}
            <div className="space-y-1.5 text-xs">
              <label className="text-neutral-400 block font-semibold">Admin Verification Note (Optional):</label>
              <input
                type="text"
                placeholder="e.g. Verified transfer via CBE mobile banking / Ref #12345"
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                className="w-full px-3 py-2 bg-black border border-neutral-800 rounded-xl text-white text-xs placeholder-neutral-500 focus:outline-none focus:border-[#00D26A]"
              />
            </div>

            {/* Warning notice */}
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-300 flex items-start gap-2">
              <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-400" />
              <span>
                By confirming, the frozen balance of <strong>{selectedForApproval.amount.toLocaleString()} ETB</strong> will be finalized and marked as completed in the member ledger.
              </span>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedForApproval(null)}
                disabled={processingAction}
                className="flex-1 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-bold text-xs transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmApproval}
                disabled={processingAction}
                className="flex-2 py-3 rounded-xl bg-[#00D26A] hover:bg-[#00e875] text-black font-extrabold text-xs shadow-lg shadow-[#00D26A]/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98"
              >
                {processingAction ? <RefreshCw size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                <span>{processingAction ? 'Processing Payout...' : 'Confirm & Complete Withdrawal'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REJECT & REFUND MODAL */}
      {/* ========================================================================= */}
      {selectedForRejection && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#11131a] border border-red-500/40 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl shadow-red-950/50 space-y-4 text-neutral-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
                  <XCircle size={22} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white tracking-wide">REJECT WITHDRAWAL REQUEST</h3>
                  <p className="text-[11px] text-neutral-400">Funds will be immediately refunded to member's Available Balance</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedForRejection(null)}
                disabled={processingAction}
                className="p-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="bg-black/50 p-3.5 rounded-xl border border-neutral-850 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-neutral-400">Request:</span>
                <span className="font-mono font-bold text-white">#{selectedForRejection.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Member:</span>
                <span className="font-bold text-white">{selectedForRejection.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Amount to Refund:</span>
                <span className="font-mono font-black text-emerald-400 text-sm">
                  +{selectedForRejection.amount.toLocaleString()} ETB
                </span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="text-neutral-300 block font-semibold">Rejection Reason (Visible to Member):</label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="State clearly why this payout was rejected..."
                className="w-full p-3 bg-black border border-neutral-800 rounded-xl text-white text-xs placeholder-neutral-500 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="text-neutral-400 block font-semibold">Internal Admin Note (Optional):</label>
              <input
                type="text"
                placeholder="e.g. Member requested cancellation / Invalid address"
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                className="w-full px-3 py-2 bg-black border border-neutral-800 rounded-xl text-white text-xs placeholder-neutral-500 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedForRejection(null)}
                disabled={processingAction}
                className="flex-1 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-bold text-xs transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmRejection}
                disabled={processingAction}
                className="flex-2 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98"
              >
                {processingAction ? <RefreshCw size={15} className="animate-spin" /> : <XCircle size={15} />}
                <span>{processingAction ? 'Refunding...' : 'Confirm Rejection & Refund Funds'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
