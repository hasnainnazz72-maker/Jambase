import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Copy,
  Check,
  Wallet,
  User,
  Mail,
  Phone,
  Hash,
  ArrowDownLeft,
  ShieldCheck,
  Filter,
  Search,
  RefreshCw,
  Info,
  X,
  AlertTriangle,
  ExternalLink,
  FileText
} from 'lucide-react';
import { DepositRequest } from '../../types';
import { api } from '../../services/api';

interface RechargeApprovalQueueProps {
  deposits: DepositRequest[];
  onRefresh: () => void;
  onSetActionMsg: (msg: { text: string; isError?: boolean } | null) => void;
}

export const RechargeApprovalQueue: React.FC<RechargeApprovalQueueProps> = ({
  deposits,
  onRefresh,
  onSetActionMsg
}) => {
  const [filterStatus, setFilterStatus] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Approve Confirmation Modal state
  const [selectedForApproval, setSelectedForApproval] = useState<DepositRequest | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  // Reject Modal state
  const [selectedForRejection, setSelectedForRejection] = useState<DepositRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('Payment verification unconfirmed / Invalid TXID or UID');
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
      await api.processDeposit(selectedForApproval.id, 'Approve', undefined, approvalNotes);
      onSetActionMsg({
        text: `✓ Recharge request #${selectedForApproval.id} for ${selectedForApproval.amount.toLocaleString()} ETB has been APPROVED and credited to ${selectedForApproval.username}'s available balance!`
      });
      setSelectedForApproval(null);
      setApprovalNotes('');
      onRefresh();
      setTimeout(() => onSetActionMsg(null), 4000);
    } catch (err: any) {
      onSetActionMsg({ text: err.message || 'Failed to approve recharge request', isError: true });
    } finally {
      setProcessingAction(false);
    }
  };

  const handleConfirmRejection = async () => {
    if (!selectedForRejection) return;
    setProcessingAction(true);
    try {
      await api.processDeposit(selectedForRejection.id, 'Reject', rejectReason, rejectNotes);
      onSetActionMsg({
        text: `Recharge request #${selectedForRejection.id} has been REJECTED. Balance was not credited.`
      });
      setSelectedForRejection(null);
      setRejectReason('Payment verification unconfirmed / Invalid TXID or UID');
      setRejectNotes('');
      onRefresh();
      setTimeout(() => onSetActionMsg(null), 4000);
    } catch (err: any) {
      onSetActionMsg({ text: err.message || 'Failed to reject recharge request', isError: true });
    } finally {
      setProcessingAction(false);
    }
  };

  // Filter and search logic
  const filteredDeposits = deposits.filter((dep) => {
    // Status filter
    if (filterStatus !== 'All') {
      if (filterStatus === 'Approved') {
        if (dep.status !== 'Approved' && dep.status !== 'Completed') return false;
      } else if (dep.status !== filterStatus) {
        return false;
      }
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchId = dep.id.toLowerCase().includes(q);
      const matchUser = dep.username.toLowerCase().includes(q);
      const matchUserId = dep.userId?.toLowerCase().includes(q);
      const matchAddress = dep.walletAddress?.toLowerCase().includes(q);
      const matchTx = (dep.txHash || dep.txUid || '')?.toLowerCase().includes(q);
      const matchNetwork = dep.network?.toLowerCase().includes(q);
      return matchId || matchUser || matchUserId || matchAddress || matchTx || matchNetwork;
    }

    return true;
  });

  const pendingCount = deposits.filter((d) => d.status === 'Pending').length;
  const approvedCount = deposits.filter((d) => d.status === 'Approved' || d.status === 'Completed').length;
  const rejectedCount = deposits.filter((d) => d.status === 'Rejected').length;

  return (
    <div className="space-y-4">
      {/* Header & Metrics Summary Bar */}
      <div className="bg-[#11131a] rounded-2xl border border-neutral-800 p-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-850">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#00D26A]/20 flex items-center justify-center border border-[#00D26A]/40 text-[#00D26A]">
                <ArrowDownLeft size={18} />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                  <span>Pending Recharge / Deposit Queue</span>
                  {pendingCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                      {pendingCount} PENDING
                    </span>
                  )}
                </h2>
                <p className="text-xs text-neutral-400">
                  Review member recharge submissions, verify blockchain TXID / UID, and approve to credit Available Balance
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw size={13} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Status Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3">
          <div
            onClick={() => setFilterStatus('All')}
            className={`p-2.5 rounded-xl cursor-pointer transition-all border ${
              filterStatus === 'All'
                ? 'bg-neutral-800/80 border-neutral-600 text-white'
                : 'bg-neutral-900/50 border-neutral-850 text-neutral-400 hover:text-white'
            }`}
          >
            <span className="text-[10px] uppercase tracking-wider font-semibold block">Total Recharges</span>
            <span className="text-sm font-black text-white font-mono mt-0.5">{deposits.length}</span>
          </div>

          <div
            onClick={() => setFilterStatus('Pending')}
            className={`p-2.5 rounded-xl cursor-pointer transition-all border ${
              filterStatus === 'Pending'
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-200'
                : 'bg-neutral-900/50 border-neutral-850 text-neutral-400 hover:text-amber-300'
            }`}
          >
            <span className="text-[10px] uppercase tracking-wider font-semibold block flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              Pending Review
            </span>
            <span className="text-sm font-black text-amber-400 font-mono mt-0.5">{pendingCount}</span>
          </div>

          <div
            onClick={() => setFilterStatus('Approved')}
            className={`p-2.5 rounded-xl cursor-pointer transition-all border ${
              filterStatus === 'Approved'
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200'
                : 'bg-neutral-900/50 border-neutral-850 text-neutral-400 hover:text-emerald-300'
            }`}
          >
            <span className="text-[10px] uppercase tracking-wider font-semibold block">Approved / Credited</span>
            <span className="text-sm font-black text-[#00D26A] font-mono mt-0.5">{approvedCount}</span>
          </div>

          <div
            onClick={() => setFilterStatus('Rejected')}
            className={`p-2.5 rounded-xl cursor-pointer transition-all border ${
              filterStatus === 'Rejected'
                ? 'bg-red-500/20 border-red-500/50 text-red-200'
                : 'bg-neutral-900/50 border-neutral-850 text-neutral-400 hover:text-red-300'
            }`}
          >
            <span className="text-[10px] uppercase tracking-wider font-semibold block">Rejected</span>
            <span className="text-sm font-black text-red-400 font-mono mt-0.5">{rejectedCount}</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {(['All', 'Pending', 'Approved', 'Rejected'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
                filterStatus === st
                  ? st === 'Pending'
                    ? 'bg-amber-400 text-black shadow-md shadow-amber-500/20'
                    : st === 'Approved'
                    ? 'bg-[#00D26A] text-black shadow-md shadow-[#00D26A]/20'
                    : st === 'Rejected'
                    ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                    : 'bg-white text-black'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              {st === 'Pending' ? `Pending (${pendingCount})` : st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Member, ID, TXID / UID..."
            className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#00D26A]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Recharge Requests List */}
      {filteredDeposits.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#11131a] border border-neutral-800 text-neutral-400 space-y-2">
          <Info size={28} className="mx-auto text-neutral-500" />
          <p className="text-xs font-semibold">
            {searchQuery
              ? `No recharge records matching "${searchQuery}"`
              : `No ${filterStatus !== 'All' ? filterStatus.toLowerCase() : ''} recharge requests currently in the queue.`}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="px-3 py-1 rounded-lg bg-neutral-800 text-xs text-neutral-300 hover:text-white font-bold"
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredDeposits.map((dep) => {
            const txDisplay = dep.txHash || dep.txUid || 'N/A';
            const isPending = dep.status === 'Pending';
            const isApproved = dep.status === 'Approved' || dep.status === 'Completed';
            const isRejected = dep.status === 'Rejected';

            return (
              <div
                key={dep.id}
                className={`p-4 rounded-2xl bg-[#11131a] border transition-all space-y-3 shadow-md ${
                  isPending
                    ? 'border-amber-500/40 bg-gradient-to-b from-amber-500/5 to-[#11131a]'
                    : isApproved
                    ? 'border-emerald-500/30'
                    : 'border-neutral-800 opacity-90'
                }`}
              >
                {/* Card Header: Request ID, Status Badge, Amount */}
                <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-neutral-800">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs text-neutral-300 font-bold">{dep.id}</span>
                      <button
                        onClick={() => handleCopy(dep.id, `id-${dep.id}`)}
                        className="text-neutral-500 hover:text-neutral-300"
                        title="Copy Request ID"
                      >
                        {copiedKey === `id-${dep.id}` ? <Check size={11} className="text-[#00D26A]" /> : <Copy size={11} />}
                      </button>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 ${
                          isApproved
                            ? 'bg-emerald-500/20 text-[#00D26A] border border-emerald-500/30'
                            : isPending
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}
                      >
                        {isPending && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />}
                        {dep.status}
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-500 font-mono block">
                      Submitted: {new Date(dep.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-lg font-black text-white font-mono block">
                      {dep.amount.toLocaleString()} <span className="text-xs text-neutral-400">ETB</span>
                    </span>
                    <span
                      className="inline-block px-2 py-0.2 text-[10px] font-extrabold rounded-md mt-0.5 bg-blue-500/15 text-blue-300 border border-blue-500/30"
                    >
                      {dep.bankName || 'CBE Bank'}
                    </span>
                  </div>
                </div>

                {/* Member Profile & Balances */}
                <div className="p-2.5 rounded-xl bg-black/40 border border-neutral-850 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-neutral-200">
                      <User size={13} className="text-[#00D26A]" />
                      <strong className="text-white text-xs">{dep.username}</strong>
                      <span className="text-[10px] font-mono text-neutral-400">({dep.userId})</span>
                    </div>
                    <div className="text-[11px] font-mono">
                      <span className="text-neutral-400">Available: </span>
                      <strong className="text-[#00D26A]">{(dep.currentUserBalance ?? 0).toLocaleString()} ETB</strong>
                    </div>
                  </div>

                  {(dep.userEmail || dep.userPhone) && (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-neutral-400 pt-1 border-t border-neutral-900">
                      {dep.userEmail && (
                        <div className="flex items-center gap-1">
                          <Mail size={11} className="text-neutral-500" />
                          <span>{dep.userEmail}</span>
                        </div>
                      )}
                      {dep.userPhone && (
                        <div className="flex items-center gap-1">
                          <Phone size={11} className="text-neutral-500" />
                          <span>{dep.userPhone}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Payment Method & Bank Transfer Details */}
                <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800/80 space-y-2.5 text-xs">
                  {/* TRANSACTION REFERENCE NUMBER */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-neutral-400 font-bold flex items-center gap-1 text-amber-300">
                        <Hash size={12} />
                        <span>Transaction Reference Number:</span>
                      </span>
                      <button
                        onClick={() => handleCopy(dep.referenceNumber || txDisplay, `tx-${dep.id}`)}
                        className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500 text-amber-200 hover:text-black text-[10px] font-bold flex items-center gap-1 transition-colors"
                      >
                        {copiedKey === `tx-${dep.id}` ? <Check size={10} /> : <Copy size={10} />}
                        <span>{copiedKey === `tx-${dep.id}` ? 'Copied!' : 'Copy Reference'}</span>
                      </button>
                    </div>
                    <div className="p-2 rounded-lg bg-black border border-amber-500/30 font-mono text-[11px] text-amber-200 break-all select-all font-bold">
                      {dep.referenceNumber || txDisplay}
                    </div>
                  </div>

                  {/* Payment Slip Receipt Preview */}
                  {dep.paymentSlipUrl && (
                    <div className="space-y-1 pt-1 border-t border-neutral-900">
                      <span className="text-neutral-400 font-bold text-[11px] flex items-center gap-1 text-blue-300">
                        <FileText size={12} />
                        <span>Uploaded Payment Slip Receipt:</span>
                      </span>
                      <a
                        href={dep.paymentSlipUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-lg overflow-hidden border border-neutral-800 hover:border-blue-500 transition-colors max-h-36 bg-black flex items-center justify-center p-1"
                      >
                        <img
                          src={dep.paymentSlipUrl}
                          alt="Payment Slip Receipt"
                          className="max-h-32 object-contain"
                        />
                      </a>
                    </div>
                  )}
                </div>

                {/* Audit & Outcome info for Approved / Rejected */}
                {isApproved && (
                  <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <ShieldCheck size={13} />
                      <span>Approved & Credited</span>
                    </div>
                    <p className="text-[11px] text-neutral-400">
                      Approved by <strong className="text-neutral-200">{dep.approvedBy || 'Admin'}</strong> on{' '}
                      {dep.processedAt ? new Date(dep.processedAt).toLocaleString() : 'Recent'}. Amount +{dep.amount.toLocaleString()} ETB added to Available Balance.
                    </p>
                  </div>
                )}

                {isRejected && (
                  <div className="p-2.5 rounded-xl bg-red-950/20 border border-red-500/20 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-red-400 font-bold">
                      <XCircle size={13} />
                      <span>Recharge Rejected</span>
                    </div>
                    <p className="text-[11px] text-red-300">
                      <strong>Reason:</strong> {dep.rejectReason || 'Payment unconfirmed'}
                    </p>
                  </div>
                )}

                {/* Action Buttons for Pending Requests */}
                {isPending && (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => setSelectedForApproval(dep)}
                      className="flex-1 py-2.5 rounded-xl bg-[#00D26A] hover:bg-[#00e875] text-black font-extrabold text-xs shadow-md shadow-[#00D26A]/20 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
                    >
                      <CheckCircle2 size={14} />
                      <span>Review & Approve</span>
                    </button>
                    <button
                      onClick={() => setSelectedForRejection(dep)}
                      className="py-2.5 px-4 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-500/30 text-red-300 hover:text-white font-bold text-xs transition-colors flex items-center gap-1"
                    >
                      <XCircle size={14} />
                      <span>Reject</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 1. APPROVAL CONFIRMATION MODAL */}
      {selectedForApproval && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#11131a] border border-neutral-750 rounded-3xl p-5 space-y-4 shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2 text-white font-extrabold text-sm">
                <div className="w-7 h-7 rounded-xl bg-[#00D26A]/20 flex items-center justify-center text-[#00D26A] border border-[#00D26A]/40">
                  <ShieldCheck size={16} />
                </div>
                <span>Confirm Recharge Approval</span>
              </div>
              <button
                onClick={() => setSelectedForApproval(null)}
                className="w-7 h-7 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/60 border border-neutral-850 space-y-2.5 text-xs font-mono">
              <div className="flex justify-between items-center pb-2 border-b border-neutral-850">
                <span className="text-neutral-400 font-sans">Member Account:</span>
                <strong className="text-white font-bold">{selectedForApproval.username} ({selectedForApproval.userId})</strong>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-neutral-850">
                <span className="text-neutral-400 font-sans">Deposit Bank:</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-[#00D26A] font-bold">
                  {selectedForApproval.bankName || 'Commercial Bank of Ethiopia (CBE)'}
                </span>
              </div>

              <div className="space-y-1 pb-2 border-b border-neutral-850">
                <span className="text-neutral-400 font-sans block">Submitted Reference Number:</span>
                <div className="p-2 rounded-lg bg-black border border-neutral-800 text-[11px] text-amber-300 break-all select-all font-bold">
                  {selectedForApproval.referenceNumber || selectedForApproval.txHash || selectedForApproval.txUid || 'N/A'}
                </div>
              </div>

              {selectedForApproval.paymentSlipUrl && (
                <div className="space-y-1 pb-2 border-b border-neutral-850">
                  <span className="text-neutral-400 font-sans block">Uploaded Receipt Slip:</span>
                  <a
                    href={selectedForApproval.paymentSlipUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-lg overflow-hidden border border-neutral-800 max-h-40 bg-black flex items-center justify-center p-1"
                  >
                    <img
                      src={selectedForApproval.paymentSlipUrl}
                      alt="Payment Slip"
                      className="max-h-36 object-contain"
                    />
                  </a>
                </div>
              )}

              <div className="flex justify-between items-center pt-1">
                <span className="font-bold text-neutral-300 font-sans">AMOUNT TO CREDIT:</span>
                <span className="font-mono font-black text-[#00D26A] text-lg">
                  +{selectedForApproval.amount.toLocaleString()} ETB
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#00D26A]/10 border border-[#00D26A]/30 text-xs text-neutral-300 flex items-start gap-2">
              <Info size={15} className="text-[#00D26A] shrink-0 mt-0.5" />
              <span>
                Approving will immediately credit <strong className="text-white">+{selectedForApproval.amount.toLocaleString()} ETB</strong> into {selectedForApproval.username}&apos;s Available Balance for trading and ticket purchases.
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-400 mb-1 block">Admin Note (Optional)</label>
              <input
                type="text"
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="e.g. Verified transfer on CBE Portal / Slip confirmed"
                className="w-full px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white focus:outline-none focus:border-[#00D26A]"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedForApproval(null)}
                disabled={processingAction}
                className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApproval}
                disabled={processingAction}
                className="flex-1 py-2.5 rounded-xl bg-[#00D26A] hover:bg-[#00e875] text-black font-extrabold text-xs shadow-lg shadow-[#00D26A]/20 transition-all flex items-center justify-center gap-1.5"
              >
                {processingAction ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    <span>Confirm & Credit Balance</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. REJECTION MODAL */}
      {selectedForRejection && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#11131a] border border-neutral-750 rounded-3xl p-5 space-y-4 shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2 text-white font-extrabold text-sm">
                <div className="w-7 h-7 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400 border border-red-500/40">
                  <XCircle size={16} />
                </div>
                <span>Reject Recharge Request</span>
              </div>
              <button
                onClick={() => setSelectedForRejection(null)}
                className="w-7 h-7 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/60 border border-neutral-850 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-400">Request ID:</span>
                <span className="font-mono text-white font-bold">{selectedForRejection.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Member:</span>
                <span className="text-white font-bold">{selectedForRejection.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Amount:</span>
                <span className="font-mono text-white font-bold">{selectedForRejection.amount.toLocaleString()} ETB</span>
              </div>
              <div className="space-y-1 pt-1 border-t border-neutral-850">
                <span className="text-neutral-400">Submitted Reference:</span>
                <div className="p-1.5 rounded bg-black font-mono text-[10px] text-neutral-300 break-all">
                  {selectedForRejection.referenceNumber || selectedForRejection.txHash || selectedForRejection.txUid || 'N/A'}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-300 block">Rejection Reason (Visible to Admin & Member)</label>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white focus:outline-none focus:border-red-500"
              >
                <option value="Payment verification unconfirmed / Invalid reference number">Payment verification unconfirmed / Invalid reference number</option>
                <option value="Transaction reference not found in CBE bank records">Transaction reference not found in CBE bank records</option>
                <option value="Deposit amount mismatch with bank transfer slip">Deposit amount mismatch with bank transfer slip</option>
                <option value="Payment slip receipt unreadable or invalid">Payment slip receipt unreadable or invalid</option>
                <option value="Duplicate recharge submission">Duplicate recharge submission</option>
                <option value="Other administrative discrepancy">Other administrative discrepancy</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-400 mb-1 block">Custom Notes (Optional)</label>
              <textarea
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                placeholder="Additional audit details..."
                rows={2}
                className="w-full px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white focus:outline-none focus:border-red-500 resize-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedForRejection(null)}
                disabled={processingAction}
                className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRejection}
                disabled={processingAction}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs shadow-lg shadow-red-600/20 transition-all flex items-center justify-center gap-1.5"
              >
                {processingAction ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <XCircle size={14} />
                    <span>Reject Request</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
