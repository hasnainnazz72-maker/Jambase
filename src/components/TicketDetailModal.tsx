import React, { useState } from 'react';
import { X, Calendar, MapPin, Ticket as TicketIcon, Music, Plus, Minus, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Ticket, User } from '../types';
import { api } from '../services/api';

interface TicketDetailModalProps {
  ticket: Ticket | null;
  user: User | null;
  onClose: () => void;
  onPurchaseSuccess: (updatedUser: User, purchaseMsg: string) => void;
  onPlayTrack: (ticket: Ticket) => void;
  onNavigateTab?: (tab: any) => void;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  ticket,
  user,
  onClose,
  onPurchaseSuccess,
  onPlayTrack,
  onNavigateTab
}) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!ticket) return null;

  const unitPrice = ticket.price;
  const totalPrice = Number((unitPrice * quantity).toFixed(2));
  const currentBalance = user?.balance ?? 0;
  const hasEnoughBalance = currentBalance >= totalPrice;

  const handleIncrement = () => {
    if (quantity < (ticket.maxQuantity || 10)) {
      setQuantity(prev => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleBuy = async () => {
    setError(null);

    // ACTION-TRIGGERED NOTIFICATION: Account below minimum $30
    if (currentBalance < 30 && (user?.totalAssets || 0) < 30) {
      setError('Insufficient Balance — Your available balance is below $30. Please recharge your account to purchase tickets.');
      return;
    }

    if (currentBalance < totalPrice) {
      setError(`Insufficient available balance ($${currentBalance.toFixed(2)}). Please recharge $${(totalPrice - currentBalance).toFixed(2)} to complete this purchase.`);
      return;
    }

    setLoading(true);

    try {
      const res = await api.purchaseTicket(ticket.id, quantity);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 }
      });
      setSuccess(res.message);
      setTimeout(() => {
        // Fetch fresh user state
        api.getUser().then(freshUser => {
          onPurchaseSuccess(freshUser, res.message);
          onClose();
        });
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Purchase failed');
    } finally {
      setLoading(false);
    }
  };

  const vipDailyRate = user?.vipLevel === 1 ? 0.019 : user?.vipLevel === 2 ? 0.025 : user?.vipLevel === 3 ? 0.03 : user?.vipLevel === 4 ? 0.04 : user?.vipLevel === 5 ? 0.05 : 0.06;
  // STRICT RULE: Profit calculated strictly on the ticket investment amount
  const estimatedProfit = Number((totalPrice * vipDailyRate).toFixed(2));
  const remainingBalanceAfterBuy = Number(Math.max(0, currentBalance - totalPrice).toFixed(2));

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        id="ticket-purchase-modal"
        className="w-full max-w-md bg-[#12131a] border-t sm:border border-neutral-800 rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto p-5 pb-8 animate-in slide-in-from-bottom-6 duration-300"
      >
        {/* Header bar */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800/80">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-extrabold uppercase tracking-wider bg-[#00D26A]/15 text-[#00D26A] border border-[#00D26A]/30">
              {ticket.category}
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
              <p className="text-xs text-[#00D26A] font-semibold">{ticket.artist}</p>
              <h3 className="text-lg font-bold text-white leading-snug">{ticket.name}</h3>
            </div>
          </div>
          <button
            onClick={() => onPlayTrack(ticket)}
            className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-[#00D26A] hover:bg-[#00e875] text-black flex items-center justify-center shadow-lg shadow-[#00D26A]/40 transition-transform active:scale-95"
            title="Preview Music"
          >
            <Music size={18} />
          </button>
        </div>

        {/* Event Meta Details */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-neutral-300">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800">
            <Calendar size={15} className="text-[#00D26A] shrink-0" />
            <span className="truncate">{ticket.eventDate}</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800">
            <MapPin size={15} className="text-[#00D26A] shrink-0" />
            <span className="truncate">{ticket.venue}, {ticket.location}</span>
          </div>
        </div>

        {/* Description */}
        <p className="mt-3 text-xs text-neutral-400 leading-relaxed">
          {ticket.description}
        </p>

        {/* Multiple Ticket Quantity Selector */}
        <div className="mt-5 p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs font-semibold text-neutral-300">Select Quantity</span>
              <p className="text-[11px] text-neutral-500">Max {ticket.maxQuantity || 10} tickets per order</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDecrement}
                disabled={quantity <= 1}
                className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-neutral-200 flex items-center justify-center font-bold"
              >
                <Minus size={14} />
              </button>
              <span className="font-extrabold text-lg text-white w-6 text-center">{quantity}</span>
              <button
                onClick={handleIncrement}
                disabled={quantity >= (ticket.maxQuantity || 10)}
                className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-neutral-200 flex items-center justify-center font-bold"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Quick Quantity Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-neutral-800">
            {[1, 3, 5, 10].map((qty) => (
              <button
                key={qty}
                onClick={() => setQuantity(qty)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  quantity === qty
                    ? 'bg-[#00D26A] text-black'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                {qty}x
              </button>
            ))}
          </div>
        </div>

        {/* Price & Calculation Breakdown */}
        <div className="mt-4 p-3.5 rounded-2xl bg-[#0d0e12] border border-neutral-800 space-y-2 text-xs">
          <div className="flex justify-between text-neutral-400">
            <span>Ticket Price</span>
            <span className="font-semibold text-neutral-200">${unitPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-neutral-400">
            <span>Quantity Selected</span>
            <span className="font-semibold text-neutral-200">× {quantity}</span>
          </div>
          <div className="flex justify-between text-neutral-400">
            <span>VIP Rate (Your Level: VIP {user?.vipLevel || 1})</span>
            <span className="font-bold text-[#00D26A]">
              +{((user?.vipLevel === 1 ? 1.9 : user?.vipLevel === 2 ? 2.5 : user?.vipLevel === 3 ? 3.0 : user?.vipLevel === 4 ? 4.0 : user?.vipLevel === 5 ? 5.0 : 6.0)).toFixed(1)}% (on ${totalPrice.toFixed(2)})
            </span>
          </div>
          <div className="flex justify-between text-neutral-400">
            <span>VIP Profit on this Ticket</span>
            <span className="font-bold text-[#00D26A]">+${estimatedProfit.toFixed(2)} USDT</span>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-[11px] text-emerald-300 space-y-1">
            <span className="font-bold block text-[#00D26A]">⚡ 1-Minute Fast Settle Rule:</span>
            <p>
              In exactly <strong>1 minute</strong>, both your <strong>Investment (${totalPrice.toFixed(2)})</strong> and <strong>Ticket Profit (+${estimatedProfit.toFixed(2)} USDT)</strong> will automatically settle and return directly to your Available Balance!
            </p>
            <p className="text-emerald-400">
              Your remaining <strong>${remainingBalanceAfterBuy.toFixed(2)}</strong> balance remains fully usable to buy more tickets (e.g. $10, $20, $50, $100) anytime without daily limits.
            </p>
          </div>

          <div className="pt-2 border-t border-neutral-800 flex justify-between items-baseline">
            <div>
              <span className="text-sm font-bold text-white block">Order Total</span>
              <span className="text-[11px] text-neutral-400">
                Remaining Balance: <strong className="text-[#00D26A]">${remainingBalanceAfterBuy.toFixed(2)}</strong>
              </span>
            </div>
            <div className="text-right">
              <span className="text-xl font-extrabold text-[#00D26A]">${totalPrice.toFixed(2)}</span>
              <p className="text-[10px] text-neutral-500">
                Available: ${currentBalance.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Error / Success feedback */}
        {error && (
          <div className="mt-3 p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-200 space-y-2">
            <div className="flex items-start gap-2.5">
              <AlertCircle size={17} className="shrink-0 text-red-400 mt-0.5" />
              <span className="font-semibold leading-relaxed">{error}</span>
            </div>
            {onNavigateTab && currentBalance < 30 && (
              <div className="pt-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateTab('finance');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold text-[11px] shadow-sm transition-transform active:scale-95"
                >
                  Recharge Account
                </button>
              </div>
            )}
          </div>
        )}

        {success && (
          <div className="mt-3 p-3 rounded-xl bg-[#00D26A]/15 border border-[#00D26A]/30 flex items-center gap-2 text-xs text-[#00D26A]">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* 1-Click Purchase Action */}
        <div className="mt-5">
          <button
            id="modal-confirm-buy-btn"
            onClick={handleBuy}
            disabled={loading || !!success}
            className={`w-full py-3.5 rounded-xl font-extrabold text-sm tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 ${
              loading || success
                ? 'bg-neutral-700 text-neutral-400 cursor-not-allowed'
                : currentBalance < 30
                ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20 active:scale-[0.98]'
                : !hasEnoughBalance
                ? 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 cursor-pointer'
                : 'bg-[#00D26A] hover:bg-[#00e875] text-black shadow-[#00D26A]/25 active:scale-[0.98]'
            }`}
          >
            <TicketIcon size={18} />
            {loading
              ? 'Processing Secure Order...'
              : success
              ? 'Purchase Completed!'
              : currentBalance < 30
              ? 'Buy Ticket • $30 Min Balance'
              : !hasEnoughBalance
              ? 'Insufficient Balance (Recharge)'
              : `Purchase Now • $${totalPrice.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
};
