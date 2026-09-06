import React from 'react';
import { Home, ClipboardList, Gift, Wallet, User } from 'lucide-react';
import { TabType } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

interface BottomNavProps {
  currentTab: TabType;
  onChangeTab: (tab: TabType) => void;
  pendingTasksCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onChangeTab,
  pendingTasksCount = 0
}) => {
  const { t } = useLanguage();

  const tabs = [
    { id: 'home' as TabType, label: t('nav.home', 'Home'), icon: Home },
    { id: 'task' as TabType, label: t('nav.task', 'Task'), icon: ClipboardList, badge: pendingTasksCount > 0 ? pendingTasksCount : undefined },
    { id: 'grab' as TabType, label: t('nav.grab', 'Grab'), icon: Gift, isCenter: true },
    { id: 'finance' as TabType, label: t('nav.finance', 'Finance'), icon: Wallet },
    { id: 'mine' as TabType, label: t('nav.mine', 'Mine'), icon: User }
  ];

  return (
    <nav
      id="bottom-navigation-bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0e]/95 backdrop-blur-lg border-t border-neutral-800/80 pb-safe"
    >
      <div className="max-w-md mx-auto grid grid-cols-5 h-16 relative">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          if (tab.isCenter) {
            return (
              <button
                key={tab.id}
                id={`tab-btn-${tab.id}`}
                onClick={() => onChangeTab(tab.id)}
                className="relative flex flex-col items-center justify-center -top-3 focus:outline-none group"
              >
                <div
                  className={`w-14 h-14 rounded-full flex flex-col items-center justify-center transition-all duration-200 active:scale-95 shadow-lg ${
                    isActive
                      ? 'bg-gradient-to-tr from-red-700 via-red-600 to-amber-600 ring-2 ring-amber-400 shadow-red-950/90 scale-105'
                      : 'bg-gradient-to-tr from-red-800 to-red-600 border-2 border-red-500/70 shadow-red-950/60 group-hover:brightness-110'
                  }`}
                >
                  <Icon size={22} className="text-amber-300" />
                  <span className="text-[10px] font-black text-amber-200 tracking-tight leading-none mt-0.5">
                    {tab.label}
                  </span>
                </div>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              id={`tab-btn-${tab.id}`}
              onClick={() => onChangeTab(tab.id)}
              className={`relative flex flex-col items-center justify-center gap-1 transition-all ${
                isActive
                  ? 'text-amber-400'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <div className="relative">
                <Icon size={20} className={`transition-transform duration-200 ${isActive ? 'scale-110 text-amber-400' : ''}`} />
                {tab.badge && (
                  <span className="absolute -top-1.5 -right-2 bg-red-600 text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-[#0a0a0e]">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[11px] font-medium tracking-tight ${isActive ? 'font-bold text-amber-400' : ''}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-4 h-0.5 rounded-full bg-gradient-to-r from-red-500 to-amber-400 shadow-[0_0_8px_#f59e0b]"></span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
