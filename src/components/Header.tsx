import React, { useState, useEffect } from 'react';
import { Bell, ShieldAlert, SlidersHorizontal, Clock, Globe, Headphones } from 'lucide-react';
import { User, TabType } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

interface HeaderProps {
  user: User | null;
  currentTab: TabType;
  onOpenNotifications: () => void;
  onOpenVIPModal?: () => void;
  onOpenLanguageModal: () => void;
  onOpenCustomerService?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  currentTab,
  onOpenNotifications,
  onOpenVIPModal,
  onOpenLanguageModal,
  onOpenCustomerService
}) => {
  const [utcTime, setUtcTime] = useState('');
  const { t, currentLanguageOption } = useLanguage();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const mins = String(now.getUTCMinutes()).padStart(2, '0');
      const secs = String(now.getUTCSeconds()).padStart(2, '0');
      setUtcTime(`${hours}:${mins}:${secs} UTC`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isHomePage = currentTab === 'home';

  const getTabTitle = () => {
    switch (currentTab) {
      case 'grab':
        return 'VIP Exclusive Grab';
      case 'task':
        return t('task.title', 'Task Center');
      case 'finance':
        return t('finance.title', 'Financial Management');
      case 'mine':
        return t('mine.title', 'Personal Center');
      default:
        return '';
    }
  };

  return (
    <header id="app-header" className="sticky top-0 z-30 bg-[#0a0a0e]/95 backdrop-blur-md border-b border-neutral-800/80 px-4 py-2.5">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Left Side: Brand Logo ONLY on Home Page */}
        {isHomePage ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-700 to-amber-900 border border-amber-500/60 flex items-center justify-center shadow-lg shadow-red-950/40">
              <span className="font-extrabold text-amber-300 text-sm tracking-tighter">JB</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <div className="flex items-baseline">
                  <span className="font-black text-sm sm:text-base text-red-600 tracking-tight">HBO</span>
                  <span className="font-extrabold text-sm sm:text-base text-amber-400 tracking-wider ml-1">JAMBASE</span>
                  <span className="font-bold text-[9px] text-amber-300 tracking-widest ml-1">MUSIC</span>
                </div>
                <span className="text-[9px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded bg-red-950/70 text-amber-300 border border-amber-500/40">
                  VIP {user?.vipLevel || 1}
                </span>
              </div>
              {utcTime && (
                <div className="flex items-center gap-1 text-[10px] font-mono text-neutral-400">
                  <Clock size={10} className="text-amber-400" />
                  <span>{utcTime}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Non-Home Pages: Shows Tab Title */
          <div className="flex items-center gap-2">
            <div className="text-left">
              <h2 className="text-sm font-extrabold text-white tracking-wide">{getTabTitle()}</h2>
              {utcTime && (
                <div className="flex items-center gap-1 text-[10px] font-mono text-neutral-400">
                  <Clock size={9} className="text-amber-400" />
                  <span>{utcTime}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right Side: Language Switcher, Quick Balance, Support & Notifications */}
        <div className="flex items-center gap-1.5">
          {/* Language Selector Button */}
          <button
            id="language-selector-btn"
            onClick={onOpenLanguageModal}
            title="Switch Language"
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-neutral-900 border border-neutral-700/70 hover:border-amber-400/50 text-xs font-semibold text-neutral-200 transition-colors"
          >
            <span className="text-sm">{currentLanguageOption.flag}</span>
            <span className="text-[10px] uppercase font-bold text-neutral-300">
              {currentLanguageOption.code}
            </span>
          </button>

          {/* Quick Balance Pill */}
          <div
            onClick={onOpenVIPModal}
            className="cursor-pointer flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-700/60 text-xs font-semibold text-neutral-200 hover:border-amber-400/50 transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="text-amber-400 font-bold">
              {user ? Math.floor(user.balance).toLocaleString() : '0'}
            </span>
            <span className="text-[10px] text-amber-300 font-extrabold">ETB</span>
          </div>

          {/* 24/7 VIP Customer Support Button */}
          {onOpenCustomerService && (
            <button
              id="customer-support-header-btn"
              onClick={onOpenCustomerService}
              title="24/7 VIP Customer Support"
              className="relative w-7 h-7 rounded-full bg-neutral-800/80 hover:bg-red-950/40 border border-neutral-700 hover:border-amber-400/50 flex items-center justify-center text-neutral-300 hover:text-amber-300 transition-colors"
            >
              <Headphones size={13} />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
            </button>
          )}

          {/* Notifications Bell */}
          <button
            id="notification-bell-btn"
            onClick={onOpenNotifications}
            className="relative w-7 h-7 rounded-full bg-neutral-800/80 hover:bg-neutral-700 border border-neutral-700 flex items-center justify-center text-neutral-300 hover:text-white transition-colors"
          >
            <Bell size={14} />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500"></span>
          </button>
        </div>
      </div>
    </header>
  );
};
