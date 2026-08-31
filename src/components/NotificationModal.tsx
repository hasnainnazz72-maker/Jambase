import React from 'react';
import { X, Bell, Award, Sparkles, Shield, Info } from 'lucide-react';
import { PlatformNotice } from '../types';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notices: PlatformNotice[];
}

export const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose, notices }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        id="notification-modal"
        className="w-full max-w-md bg-[#12131a] border-t sm:border border-neutral-800 rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col p-5 pb-8 animate-in slide-in-from-bottom-6 duration-300"
      >
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-[#00D26A]" />
            <h3 className="text-sm font-extrabold text-white">JAMBASE Official Notices</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-4 space-y-3 overflow-y-auto">
          {notices.map((notice) => (
            <div
              key={notice.id}
              className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-1.5 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-white flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00D26A]"></span>
                  {notice.title}
                </span>
                <span className="text-[10px] text-neutral-500">{notice.date}</span>
              </div>
              <p className="text-neutral-400 text-[11px] leading-relaxed">
                {notice.content}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
