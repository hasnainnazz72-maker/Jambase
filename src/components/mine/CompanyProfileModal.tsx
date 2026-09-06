import React from 'react';
import { X, Building2, ShieldCheck, Globe, Award, CheckCircle2, FileCheck } from 'lucide-react';

interface CompanyProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CompanyProfileModal: React.FC<CompanyProfileModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm max-h-[85vh] rounded-3xl bg-[#160c0e] border border-[#DC2626]/40 overflow-hidden shadow-2xl text-white flex flex-col">
        {/* Header */}
        <div className="relative p-5 bg-gradient-to-br from-[#2a0e11] via-[#1a0c0f] to-[#0a0708] border-b border-[#3d181c] shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/50 text-neutral-400 hover:text-white"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#DC2626] to-[#EF4444] text-[#FDE047] flex items-center justify-center font-black shadow-lg shadow-[#DC2626]/30 border border-[#E5A93C]/40">
              <Building2 size={22} />
            </span>
            <div>
              <h3 className="text-base font-black text-white">Company Profile</h3>
              <p className="text-[11px] text-[#E5A93C] font-semibold">HBO JAMBASE MUSIC Group</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Logo & Headline */}
          <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-[#DC2626] text-white font-black text-xs border border-[#E5A93C]/40">HBO</span>
              <span className="font-extrabold text-white text-sm">HBO JAMBASE MUSIC</span>
            </div>
            <p className="text-neutral-300 leading-relaxed text-[11px]">
              HBO JAMBASE MUSIC is a premier international concert ticketing, live music syndication, and digital entertainment asset management enterprise.
            </p>
          </div>

          {/* Pillars */}
          <div className="space-y-2">
            <div className="p-3 rounded-xl bg-black/50 border border-neutral-800/90 flex items-start gap-2.5">
              <ShieldCheck size={16} className="text-[#E5A93C] shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-bold">Exclusive Daily Grab System</strong>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Daily member yields are powered exclusively via the high-frequency VIP Grab protocol.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black/50 border border-neutral-800/90 flex items-start gap-2.5">
              <Globe size={16} className="text-[#E5A93C] shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-bold">Global Presence</strong>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Operating in North America, Europe, Asia Pacific, and Africa with over 500k+ active concert members.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black/50 border border-neutral-800/90 flex items-start gap-2.5">
              <FileCheck size={16} className="text-[#E5A93C] shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-bold">Licensed & Audited</strong>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Compliant with digital entertainment asset protocols and institutional fund custody.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-950 border-t border-neutral-800 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#DC2626] to-[#B91C1C] hover:from-[#EF4444] hover:to-[#DC2626] text-white font-bold text-xs border border-[#E5A93C]/40"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
