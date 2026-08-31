import React from 'react';
import { Home, Music2, ClipboardList, CircleDot, Settings } from 'lucide-react';
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
    { id: 'income' as TabType, label: t('nav.income', 'Income'), icon: Music2 },
    { id: 'task' as TabType, label: t('nav.task', 'Task'), icon: ClipboardList, badge: pendingTasksCount > 0 ? pendingTasksCount : undefined },
    { id: 'finance' as TabType, label: t('nav.finance', 'Finance'), icon: CircleDot },
    { id: 'mine' as TabType, label: t('nav.mine', 'Mine'), icon: Settings }
  ];

  return (
    <nav
      id="bottom-navigation-bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#0e0f14]/95 backdrop-blur-lg border-t border-neutral-800/80 pb-safe"
    >
      <div className="max-w-md mx-auto grid grid-cols-5 h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`tab-btn-${tab.id}`}
              onClick={() => onChangeTab(tab.id)}
              className={`relative flex flex-col items-center justify-center gap-1 transition-all ${
                isActive
                  ? 'text-[#00D26A]'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <div className="relative">
                <Icon size={20} className={`transition-transform duration-200 ${isActive ? 'scale-110 text-[#00D26A]' : ''}`} />
                {tab.badge && (
                  <span className="absolute -top-1.5 -right-2 bg-[#00D26A] text-black text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-[#0e0f14]">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[11px] font-medium tracking-tight ${isActive ? 'font-bold text-[#00D26A]' : ''}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-4 h-0.5 rounded-full bg-[#00D26A] shadow-[0_0_8px_#00D26A]"></span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
