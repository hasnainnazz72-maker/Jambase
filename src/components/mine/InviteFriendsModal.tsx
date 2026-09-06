import React, { useState } from 'react';
import { X, UserPlus, Copy, Check, QrCode, Share2, Sparkles, ShieldCheck } from 'lucide-react';
import { User } from '../../types';

interface InviteFriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export const InviteFriendsModal: React.FC<InviteFriendsModalProps> = ({ isOpen, onClose, user }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const referralCode = user?.referralCode || 'JAM888';
  const referralLink = `${window.location.origin}?ref=${referralCode}`;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm max-h-[85vh] rounded-3xl bg-[#10121a] border border-[#DC2626]/40 overflow-hidden shadow-2xl text-white flex flex-col">
        {/* Header */}
        <div className="relative p-5 bg-gradient-to-br from-[#2a0808] via-[#1a0f12] to-[#0a0c10] border-b border-neutral-800 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/50 text-neutral-400 hover:text-white"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#DC2626] to-[#B91C1C] text-[#FDE047] flex items-center justify-center font-black shadow-lg shadow-[#DC2626]/30 border border-[#E5A93C]/40">
              <UserPlus size={22} />
            </span>
            <div>
              <h3 className="text-base font-black text-white">Invite Friends</h3>
              <p className="text-[11px] text-[#E5A93C] font-semibold">Earn 16% / 8% / 4% Team Rebates</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Referral Code Box */}
          <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 text-center space-y-3">
            <span className="text-xs text-neutral-400 font-semibold block">My Exclusive Invitation Code</span>
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl font-black font-mono tracking-widest text-[#E5A93C] bg-black/80 px-4 py-2 rounded-xl border border-[#DC2626]/40">
                {referralCode}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-2.5 rounded-xl bg-neutral-800 hover:bg-[#DC2626] hover:text-white text-neutral-300 transition-colors"
                title="Copy Code"
              >
                {copiedCode ? <Check size={18} className="text-[#E5A93C]" /> : <Copy size={18} />}
              </button>
            </div>

            {/* Referral Link Box */}
            <div className="pt-2">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-black/60 border border-neutral-800">
                <span className="text-[11px] text-neutral-400 truncate flex-1 font-mono">{referralLink}</span>
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#DC2626] to-[#B91C1C] hover:from-[#EF4444] hover:to-[#DC2626] text-white font-bold text-xs shrink-0 flex items-center gap-1 shadow-md shadow-[#DC2626]/20 border border-[#E5A93C]/40"
                >
                  {copiedLink ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3-Tier Commission Plan */}
          <div className="p-3.5 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-2">
            <h4 className="font-extrabold text-white text-xs">Subordinate Commission Rewards</h4>
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="p-2 rounded-xl bg-black/50 border border-neutral-800">
                <span className="text-[10px] text-neutral-400 block">Level 1 (Direct)</span>
                <strong className="text-sm font-black text-[#E5A93C]">16%</strong>
              </div>
              <div className="p-2 rounded-xl bg-black/50 border border-neutral-800">
                <span className="text-[10px] text-neutral-400 block">Level 2</span>
                <strong className="text-sm font-black text-[#E5A93C]">8%</strong>
              </div>
              <div className="p-2 rounded-xl bg-black/50 border border-neutral-800">
                <span className="text-[10px] text-neutral-400 block">Level 3</span>
                <strong className="text-sm font-black text-[#E5A93C]">4%</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-950 border-t border-neutral-800 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#DC2626] to-[#B91C1C] hover:from-[#EF4444] hover:to-[#DC2626] text-white font-extrabold text-xs shadow-md shadow-[#DC2626]/20 border border-[#E5A93C]/40"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
