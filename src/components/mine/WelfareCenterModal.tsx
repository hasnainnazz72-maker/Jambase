import React, { useState } from 'react';
import { X, Gift, CheckCircle2, Calendar, Sparkles, Shield, AlertCircle, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { User } from '../../types';
import { api } from '../../services/api';

interface WelfareCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onRefresh: () => void;
}

export const WelfareCenterModal: React.FC<WelfareCenterModalProps> = ({
  isOpen,
  onClose,
  user,
  onRefresh
}) => {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().slice(0, 10);
  const alreadyClaimedToday = user?.lastAttendanceClaimDate === todayStr;
  const streak = user?.attendanceStreak || 0;

  const handleClaimAttendance = async () => {
    if (alreadyClaimedToday) return;
    setLoading(true);
    setMsg(null);

    try {
      const res = await api.claimAttendance();
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 }
      });
      setMsg({ text: res.message });
      onRefresh();
    } catch (err: any) {
      setMsg({ text: err.message || 'Failed to claim daily attendance', isError: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-[#10121a] border border-[#00D26A]/40 overflow-hidden shadow-2xl text-white">
        {/* Header Banner */}
        <div className="relative p-5 bg-gradient-to-br from-[#0c261b] via-[#0e161f] to-[#0a0c10] border-b border-neutral-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/50 text-neutral-400 hover:text-white"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-[#00D26A] text-black flex items-center justify-center font-black shadow-lg shadow-[#00D26A]/30">
              <Gift size={22} />
            </span>
            <div>
              <h3 className="text-base font-black text-white">Welfare Center</h3>
              <p className="text-[11px] text-[#00D26A] font-semibold">Daily Attendance & Member Privileges</p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Main Attendance Card */}
          <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-[#00D26A]" />
                <span className="text-xs font-bold text-white">Daily Attendance Reward</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#00D26A]/15 text-[#00D26A] text-[11px] font-black">
                +$0.10 USDT / Day
              </span>
            </div>

            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Check in daily to claim your guaranteed <strong>$0.10 USDT</strong> attendance credit directly to your Available Balance.
            </p>

            {/* Streak Counter */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/60 border border-neutral-800/80">
              <span className="text-[11px] text-neutral-400">Current Check-in Streak:</span>
              <span className="text-xs font-black text-[#00D26A]">{streak} Consecutive Days</span>
            </div>

            {/* Claim Action Button */}
            <button
              onClick={handleClaimAttendance}
              disabled={loading || alreadyClaimedToday}
              className={`w-full py-3 rounded-xl font-extrabold text-xs shadow-lg transition-all flex items-center justify-center gap-2 ${
                alreadyClaimedToday
                  ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700/50'
                  : 'bg-[#00D26A] hover:bg-[#00e875] text-black shadow-[#00D26A]/30 active:scale-98'
              }`}
            >
              {alreadyClaimedToday ? (
                <>
                  <CheckCircle2 size={16} className="text-[#00D26A]" />
                  <span>Claimed for Today ($0.10)</span>
                </>
              ) : loading ? (
                <span>Processing...</span>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Claim Today's $0.10 USDT</span>
                </>
              )}
            </button>
          </div>

          {/* Feedback Message */}
          {msg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                msg.isError
                  ? 'bg-red-500/15 text-red-300 border border-red-500/30'
                  : 'bg-[#00D26A]/15 text-[#00D26A] border border-[#00D26A]/30'
              }`}
            >
              {msg.isError ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
              <span>{msg.text}</span>
            </div>
          )}

          {/* Rules & Policy Note */}
          <div className="p-3 rounded-2xl bg-black/40 border border-neutral-800/80 space-y-1.5 text-[11px] text-neutral-400">
            <div className="flex items-center gap-1.5 font-bold text-neutral-300">
              <Shield size={13} className="text-[#00D26A]" />
              <span>Welfare Regulations</span>
            </div>
            <ul className="list-disc pl-4 space-y-1 text-neutral-400">
              <li>1 check-in available every 24 hours per verified account.</li>
              <li>Attendance rewards add +$0.10 instantly to withdrawable balance.</li>
              <li>All primary daily income is derived from active concert ticket holdings.</li>
            </ul>
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
