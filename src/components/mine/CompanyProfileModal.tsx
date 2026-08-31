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
              <Building2 size={22} />
            </span>
            <div>
              <h3 className="text-base font-black text-white">Company Profile</h3>
              <p className="text-[11px] text-[#00D26A] font-semibold">JAMBASE Global Concert Group</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Logo & Headline */}
          <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-[#00D26A] text-black font-black text-xs">JB</span>
              <span className="font-extrabold text-white text-sm">JAMBASE Live Media Inc.</span>
            </div>
            <p className="text-neutral-300 leading-relaxed text-[11px]">
              JAMBASE is a premier international concert ticketing, live music syndication, and digital entertainment asset management enterprise.
            </p>
          </div>

          {/* 4 Pillars */}
          <div className="space-y-2">
            <div className="p-3 rounded-xl bg-black/50 border border-neutral-800/90 flex items-start gap-2.5">
              <ShieldCheck size={16} className="text-[#00D26A] shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-bold">100% Ticket-Backed Yields</strong>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Daily returns are financed through worldwide concert and stadium box-office sales.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black/50 border border-neutral-800/90 flex items-start gap-2.5">
              <Globe size={16} className="text-[#00D26A] shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-bold">Global Presence</strong>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Operating in North America, Europe, Asia Pacific, and the Middle East with 500k+ active ticket holders.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black/50 border border-neutral-800/90 flex items-start gap-2.5">
              <FileCheck size={16} className="text-[#00D26A] shrink-0 mt-0.5" />
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
            className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-bold text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
