import React, { useState } from 'react';
import {
  X,
  Users,
  CheckCircle2,
  AlertCircle,
  Search,
  ChevronRight,
  TrendingUp,
  Award,
  Crown,
  DollarSign,
  Copy,
  Check,
  ShieldCheck,
  Filter
} from 'lucide-react';
import { ReferralMember, User, VIPTier } from '../../types';
import { TeamResponse } from '../../services/api';
import { VIP_TIERS } from '../../data/seedData';

interface TeamReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  teamData: TeamResponse | null;
}

export const TeamReportModal: React.FC<TeamReportModalProps> = ({
  isOpen,
  onClose,
  user,
  teamData
}) => {
  const [filterTier, setFilterTier] = useState<'all' | '1' | '2' | '3' | 'valid'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const referralCode = user?.referralCode || 'JAM888';
  const referralLink = `${window.location.origin}?ref=${referralCode}`;

  const referrals = teamData?.referrals || [];
  const validDirectCount = user?.validDirectMembersCount || 0;
  const directTotalCount = referrals.filter(r => r.level === 1).length;
  const level2Count = referrals.filter(r => r.level === 2).length;
  const level3Count = referrals.filter(r => r.level === 3).length;
  const totalDeposit = teamData?.summary.totalTeamDeposit || referrals.reduce((sum, r) => sum + r.totalDeposit, 0);

  // VIP Next tier progress
  const currentLevel = user?.vipLevel || 1;
  const currentTier = VIP_TIERS.find(t => t.level === currentLevel) || VIP_TIERS[0];
  const nextTier = VIP_TIERS.find(t => t.level === currentLevel + 1);

  const filteredReferrals = referrals.filter(r => {
    if (filterTier === '1' && r.level !== 1) return false;
    if (filterTier === '2' && r.level !== 2) return false;
    if (filterTier === '3' && r.level !== 3) return false;
    if (filterTier === 'valid' && !r.isValid) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return r.username.toLowerCase().includes(q) || r.email.toLowerCase().includes(q);
    }
    return true;
  });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        id="team-report-view-modal"
        className="w-full max-w-lg bg-[#0f1015] border border-neutral-800 rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800/80 flex items-center justify-between bg-neutral-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#00D26A]/20 border border-[#00D26A]/40 text-[#00D26A] flex items-center justify-center font-bold">
              <Users size={16} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white">Team Performance Report</h2>
              <p className="text-[10px] text-neutral-400">Direct Members, Sub-tiers & Rebates</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800/80 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Quick Stat Cards Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3.5 rounded-2xl bg-[#14161f] border border-neutral-800">
              <span className="text-[11px] text-neutral-400 font-medium block">Total Team Members</span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-xl font-extrabold text-white">{referrals.length}</span>
                <span className="text-[10px] text-neutral-500">accounts</span>
              </div>
              <span className="text-[10px] text-neutral-400 mt-1 block">
                Direct: <strong className="text-neutral-200">{directTotalCount}</strong> • Sub-tier: <strong className="text-neutral-200">{level2Count + level3Count}</strong>
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#14161f] border border-neutral-800">
              <span className="text-[11px] text-neutral-400 font-medium block">Valid Direct Investors</span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-xl font-extrabold text-[#00D26A]">{validDirectCount}</span>
                <span className="text-[10px] text-[#00D26A]/80 font-bold">qualified (≥2,000 ETB)</span>
              </div>
              <span className="text-[10px] text-neutral-400 mt-1 block">
                VIP Tier Multiplier Active
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#14161f] border border-neutral-800">
              <span className="text-[11px] text-neutral-400 font-medium block">Total Team Deposit</span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-xl font-extrabold text-white">{totalDeposit.toLocaleString()}</span>
                <span className="text-[10px] text-neutral-500">ETB</span>
              </div>
              <span className="text-[10px] text-neutral-400 mt-1 block">
                Total combined team assets
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#14161f] border border-neutral-800">
              <span className="text-[11px] text-neutral-400 font-medium block">Multi-Tier Rebates</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-sm font-extrabold text-[#00D26A]">16%</span>
                <span className="text-[10px] text-neutral-500">/ 8% / 4%</span>
              </div>
              <span className="text-[10px] text-neutral-400 mt-1 block">
                Daily subordinate yield dividend
              </span>
            </div>
          </div>

          {/* VIP Qualification Progress Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#121c17] to-[#0e1218] border border-[#00D26A]/30 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-white flex items-center gap-1.5">
                <Crown size={14} className="text-[#00D26A]" /> VIP Qualification Status
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#00D26A] text-black text-[10px] font-black uppercase">
                VIP {currentLevel} ACTIVE
              </span>
            </div>

            {nextTier ? (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-neutral-400">Next Target: <strong className="text-emerald-400 font-bold">{nextTier.name}</strong></span>
                  <span className="text-[#00D26A] font-bold">{(nextTier.dailyRate * 100).toFixed(1)}% Daily Rate</span>
                </div>

                {/* Balance Progress */}
                <div>
                  <div className="flex justify-between text-[10px] text-neutral-400 mb-1">
                    <span>Balance Requirement:</span>
                    <span>{(user?.totalAssets || 0).toLocaleString()} / {nextTier.minBalance.toLocaleString()} ETB</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                    <div
                      className="h-full bg-[#00D26A] rounded-full"
                      style={{ width: `${Math.min(100, ((user?.totalAssets || 0) / nextTier.minBalance) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Direct Members Progress */}
                <div>
                  <div className="flex justify-between text-[10px] text-neutral-400 mb-1">
                    <span>Valid Direct Members (≥2,000 ETB):</span>
                    <span>{validDirectCount} / {nextTier.minDirectMembers}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full"
                      style={{ width: `${Math.min(100, (validDirectCount / (nextTier.minDirectMembers || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#00D26A] font-bold">You have attained the maximum VIP 6 Royal Diamond Tier!</p>
            )}
          </div>

          {/* Referral Link & Code Quick Box */}
          <div className="p-3.5 rounded-2xl bg-[#14161f] border border-neutral-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-neutral-300">Invitation Link</span>
              <span className="text-[11px] font-mono text-neutral-400">Code: <strong className="text-white">{referralCode}</strong></span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-black border border-neutral-800">
              <span className="text-xs font-mono text-neutral-300 truncate flex-1">{referralLink}</span>
              <button
                onClick={handleCopyLink}
                className="px-2.5 py-1 rounded-lg bg-[#00D26A] text-black text-xs font-bold shrink-0 flex items-center gap-1"
              >
                {copiedLink ? <Check size={12} /> : <Copy size={12} />}
                {copiedLink ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Member Search & Tier Filter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Member List</h3>
              <span className="text-[10px] text-neutral-400">{filteredReferrals.length} members shown</span>
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
              {[
                { id: 'all', label: 'All Tiers' },
                { id: '1', label: 'Tier 1 (Direct)' },
                { id: '2', label: 'Tier 2' },
                { id: '3', label: 'Tier 3' },
                { id: 'valid', label: 'Valid Only' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterTier(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors ${
                    filterTier === f.id
                      ? 'bg-[#00D26A] text-black shadow'
                      : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by username or email..."
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#00D26A]"
              />
            </div>
          </div>

          {/* Member Cards List */}
          <div className="space-y-2.5">
            {filteredReferrals.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-500 bg-neutral-900/40 rounded-2xl border border-neutral-800">
                No members found matching your filters.
              </div>
            ) : (
              filteredReferrals.map((member) => (
                <div
                  key={member.id}
                  className="p-3.5 rounded-2xl bg-[#14161f] border border-neutral-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={member.avatar}
                      alt={member.username}
                      className="w-10 h-10 rounded-full object-cover border border-neutral-700 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white truncate">{member.username}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 font-bold">
                          Tier {member.level}
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-400 block mt-0.5">
                        Deposit: <strong className="text-white">{member.totalDeposit.toLocaleString()} ETB</strong> • Balance: {member.balance.toLocaleString()} ETB
                      </span>
                      <span className="text-[9px] text-neutral-500 mt-0.5 block">
                        Joined: {new Date(member.registeredAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {member.isValid ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#00D26A]/15 text-[#00D26A] border border-[#00D26A]/30 flex items-center gap-1">
                        <CheckCircle2 size={10} /> Valid
                      </span>
                    ) : (
                      <span
                        title={member.disqualifiedReason || 'Deposit/Investment under 2,000 ETB'}
                        className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1 cursor-help"
                      >
                        <AlertCircle size={10} /> Under 2,000 ETB
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
