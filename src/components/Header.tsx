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
      case 'income':
        return t('income.title', 'My income');
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
    <header id="app-header" className="sticky top-0 z-30 bg-[#0d0e12]/95 backdrop-blur-md border-b border-neutral-800/60 px-4 py-3">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Left Side: JamBase Logo ONLY on Home Page */}
        {isHomePage ? (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#00D26A] to-[#22c55e] flex items-center justify-center shadow-lg shadow-[#00D26A]/20">
              <span className="font-extrabold text-black text-lg tracking-tighter">JB</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-wider text-white">JAMBASE</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-[#00D26A]/15 text-[#00D26A] border border-[#00D26A]/30">
                  VIP {user?.vipLevel || 1}
                </span>
              </div>
              {utcTime && (
                <div className="flex items-center gap-1 text-[10px] font-mono text-neutral-400">
                  <Clock size={10} className="text-[#00D26A]" />
                  <span>{utcTime}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Non-Home Pages: NO JamBase Logo as strictly requested */
          <div className="flex items-center gap-2">
            <div className="text-left">
              <h2 className="text-sm font-extrabold text-white tracking-wide">{getTabTitle()}</h2>
              {utcTime && (
                <div className="flex items-center gap-1 text-[10px] font-mono text-neutral-400">
                  <Clock size={9} className="text-[#00D26A]" />
                  <span>{utcTime}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right Side: Language Switcher, Quick Balance, Admin & Notifications */}
        <div className="flex items-center gap-1.5">
          {/* Language Selector Button */}
          <button
            id="language-selector-btn"
            onClick={onOpenLanguageModal}
            title="Switch Language"
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-neutral-900 border border-neutral-700/70 hover:border-[#00D26A]/50 text-xs font-semibold text-neutral-200 transition-colors"
          >
            <span className="text-sm">{currentLanguageOption.flag}</span>
            <span className="text-[10px] uppercase font-bold text-neutral-300">
              {currentLanguageOption.code}
            </span>
          </button>

          {/* Quick Balance Pill */}
          <div
            onClick={onOpenVIPModal}
            className="cursor-pointer flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-700/60 text-xs font-semibold text-neutral-200 hover:border-[#00D26A]/50 transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-[#00D26A] animate-pulse"></span>
            <span className="text-neutral-400">$</span>
            <span className="text-[#00D26A] font-bold">
              {user ? user.balance.toFixed(2) : '0.00'}
            </span>
          </div>

          {/* 24/7 VIP Customer Support Button */}
          {onOpenCustomerService && (
            <button
              id="customer-support-header-btn"
              onClick={onOpenCustomerService}
              title="24/7 VIP Customer Support"
              className="relative w-7 h-7 rounded-full bg-neutral-800/80 hover:bg-[#0088cc]/20 border border-neutral-700 hover:border-[#0088cc]/50 flex items-center justify-center text-neutral-300 hover:text-[#0088cc] transition-colors"
            >
              <Headphones size={13} />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#0088cc] animate-pulse"></span>
            </button>
          )}

          {/* Notifications Bell */}
          <button
            id="notification-bell-btn"
            onClick={onOpenNotifications}
            className="relative w-7 h-7 rounded-full bg-neutral-800/80 hover:bg-neutral-700 border border-neutral-700 flex items-center justify-center text-neutral-300 hover:text-white transition-colors"
          >
            <Bell size={14} />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#00D26A]"></span>
          </button>
        </div>
      </div>
    </header>
  );
};
