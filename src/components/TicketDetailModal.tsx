import React from 'react';
import { X, Calendar, MapPin, Music, ShieldCheck, Gift, Info, ArrowRight } from 'lucide-react';
import { Ticket, User } from '../types';

interface TicketDetailModalProps {
  ticket: Ticket | null;
  user: User | null;
  onClose: () => void;
  onPurchaseSuccess?: (updatedUser: User, purchaseMsg: string) => void;
  onPlayTrack: (ticket: Ticket) => void;
  onNavigateTab?: (tab: any) => void;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  ticket,
  user,
  onClose,
  onPlayTrack,
  onNavigateTab
}) => {
  if (!ticket) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        id="ticket-detail-modal"
        className="w-full max-w-md bg-[#160c0e] border-t sm:border border-[#3d181c] rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto p-5 pb-8 animate-in slide-in-from-bottom-6 duration-300"
      >
        {/* Header bar */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800/80">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-extrabold uppercase tracking-wider bg-[#DC2626]/20 text-[#FCA5A5] border border-[#DC2626]/40">
              {ticket.category}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-800 text-neutral-300">
              Event Information
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Cover Image & Play Action */}
        <div className="relative mt-4 rounded-2xl overflow-hidden aspect-[16/10] border border-neutral-800 group">
          <img
            src={ticket.image}
            alt={ticket.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
            <div>
              <p className="text-xs text-[#E5A93C] font-semibold">{ticket.artist}</p>
              <h3 className="text-lg font-bold text-white leading-snug">{ticket.name}</h3>
            </div>
          </div>
          <button
            onClick={() => onPlayTrack(ticket)}
            className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-gradient-to-tr from-[#DC2626] to-[#EF4444] text-[#FDE047] flex items-center justify-center shadow-lg shadow-black/60 transition-transform active:scale-95 border border-[#E5A93C]/30"
            title="Preview Music"
          >
            <Music size={18} />
          </button>
        </div>

        {/* Event Meta Details */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-neutral-300">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800">
            <Calendar size={15} className="text-[#E5A93C] shrink-0" />
            <span className="truncate">{ticket.eventDate}</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800">
            <MapPin size={15} className="text-[#E5A93C] shrink-0" />
            <span className="truncate">{ticket.venue}, {ticket.location}</span>
          </div>
        </div>

        {/* Description */}
        <p className="mt-3 text-xs text-neutral-400 leading-relaxed">
          {ticket.description}
        </p>

        {/* Event Pass & Information Card (Viewing Only - No Purchase Option) */}
        <div className="mt-4 p-4 rounded-2xl bg-[#0d0708] border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400">Official Pass Valuation</span>
            <span className="text-base font-extrabold text-[#E5A93C]">{ticket.price.toLocaleString()} ETB</span>
          </div>

          <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 text-xs text-neutral-300 space-y-1.5">
            <span className="font-bold flex items-center gap-1.5 text-[#E5A93C]">
              <ShieldCheck size={14} /> Official Concert Access Pass
            </span>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Live concert and tour showcase by HBO JAMBASE MUSIC. Ticket purchase option is closed.
            </p>
          </div>

          {/* Exclusive Grab Income Notice */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-red-950/40 to-amber-950/30 border border-red-800/40 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-300">
              <Gift size={14} className="text-red-400" />
              <span>Exclusive Member Income via Grab</span>
            </div>
            <p className="text-[11px] text-neutral-300 leading-relaxed">
              Ticket purchases are not available. Members earn daily income exclusively through the <strong>Grab</strong> feature based on available balance and VIP tier.
            </p>
          </div>
        </div>

        {/* Action: Direct Member to Earn via Grab */}
        <div className="mt-5 space-y-2">
          {onNavigateTab && (
            <button
              id="modal-goto-grab-btn"
              onClick={() => {
                onClose();
                onNavigateTab('grab');
              }}
              className="w-full py-3.5 rounded-xl font-extrabold text-sm tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 bg-gradient-to-r from-[#DC2626] to-[#B91C1C] hover:from-[#EF4444] hover:to-[#DC2626] text-white shadow-[#DC2626]/30 active:scale-[0.98] border border-[#E5A93C]/40"
            >
              <Gift size={18} className="text-[#FDE047]" />
              <span>Go to Daily Grab to Earn Income</span>
              <ArrowRight size={16} />
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors"
          >
            Close Event Details
          </button>
        </div>
      </div>
    </div>
  );
};
