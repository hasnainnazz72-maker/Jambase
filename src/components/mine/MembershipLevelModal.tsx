import React from 'react';
import { X, Crown, CheckCircle2, ChevronRight, ShieldCheck, Zap } from 'lucide-react';
import { User, VIPTier } from '../../types';
import { VIP_TIERS } from '../../data/seedData';

interface MembershipLevelModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  vipTiers?: VIPTier[];
  onNavigateTab: (tab: any) => void;
}

export const MembershipLevelModal: React.FC<MembershipLevelModalProps> = ({
  isOpen,
  onClose,
  user,
  vipTiers = VIP_TIERS,
  onNavigateTab
}) => {
  if (!isOpen) return null;

  const currentLevel = user?.vipLevel || 1;
  const currentTier = vipTiers.find(t => t.level === currentLevel) || vipTiers[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm max-h-[85vh] rounded-3xl bg-[#10121a] border border-[#00D26A]/40 overflow-hidden shadow-2xl text-white flex flex-col">
        {/* Header */}
        <div className="relative p-5 bg-gradient-to-br from-[#0c261b] via-[#0e161f] to-[#0a0c10] border-b border-neutral-800 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/50 text-neutral-400 hover:text-white"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-[#00D26A] text-black flex items-center justify-center font-black shadow-lg shadow-[#00D26A]/30">
              <Crown size={22} />
            </span>
            <div>
              <h3 className="text-base font-black text-white">Membership Level</h3>
              <p className="text-[11px] text-[#00D26A] font-semibold">
                Current: VIP {currentLevel} ({currentTier.name})
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          {/* User Status Card */}
          <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">Personal Balance:</span>
              <span className="font-extrabold text-[#00D26A]">${user?.balance.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">Valid Direct Investors:</span>
              <span className="font-extrabold text-white">{user?.validDirectMembersCount || 0} Members</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">Daily Ticket Yield Rate:</span>
              <span className="font-extrabold text-[#00D26A]">{(currentTier.dailyRate * 100).toFixed(1)}% / day</span>
            </div>
          </div>

          <h4 className="text-xs font-black uppercase tracking-wider text-neutral-300 px-1 pt-1">
            VIP Tier Privileges
          </h4>

          {/* Tiers List */}
          <div className="space-y-2.5">
            {vipTiers.map((tier) => {
              const isCurrent = tier.level === currentLevel;
              const isUnlocked = currentLevel >= tier.level;

              return (
                <div
                  key={tier.level}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'bg-gradient-to-r from-[#0c2419] to-neutral-900 border-[#00D26A] shadow-md shadow-[#00D26A]/20'
                      : 'bg-neutral-900/80 border-neutral-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-black ${
                        isCurrent ? 'bg-[#00D26A] text-black' : 'bg-neutral-800 text-neutral-300'
                      }`}>
                        VIP {tier.level}
                      </span>
                      <span className="text-xs font-bold text-white">{tier.name}</span>
                    </div>
                    <span className="text-xs font-extrabold text-[#00D26A]">
                      {(tier.dailyRate * 100).toFixed(1)}% Daily
                    </span>
                  </div>

                  <div className="mt-2 text-[11px] text-neutral-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Qualifying Balance:</span>
                      <span className="text-neutral-200 font-semibold">${tier.minBalance} - ${tier.maxBalance}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Required Direct Members:</span>
                      <span className="text-neutral-200 font-semibold">{tier.minDirectMembers} members (≥$30)</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex gap-2">
          <button
            onClick={() => {
              onClose();
              onNavigateTab('finance');
            }}
            className="flex-1 py-2.5 rounded-xl bg-[#00D26A] text-black font-extrabold text-xs shadow-md shadow-[#00D26A]/20"
          >
            Upgrade via Recharge
          </button>
        </div>
      </div>
    </div>
  );
};
