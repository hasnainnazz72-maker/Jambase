import React, { useState } from 'react';
import {
  ChevronRight,
  Headphones,
  Users,
  Building2,
  Clock,
  UserPlus,
  CircleDot,
  Globe
} from 'lucide-react';
import { User, VIPTier, PlatformNotice } from '../../types';
import { TeamResponse, FinanceResponse, IncomeResponse } from '../../services/api';
import { VIP_TIERS } from '../../data/seedData';
import { TeamReportModal } from '../mine/TeamReportModal';
import { TransactionHistoryModal } from '../mine/TransactionHistoryModal';
import { SupportModal } from '../mine/SupportModals';
import { WelfareCenterModal } from '../mine/WelfareCenterModal';
import { MembershipLevelModal } from '../mine/MembershipLevelModal';
import { CompanyProfileModal } from '../mine/CompanyProfileModal';
import { InviteFriendsModal } from '../mine/InviteFriendsModal';
import { AuthModal } from '../auth/AuthModal';
import { LanguageSelectorModal } from '../LanguageSelectorModal';
import { useLanguage } from '../../i18n/LanguageContext';

interface MineViewProps {
  user: User | null;
  teamData: TeamResponse | null;
  financeData: FinanceResponse | null;
  incomeData: IncomeResponse | null;
  vipTiers: VIPTier[];
  notices: PlatformNotice[];
  onRefresh: () => void;
  onNavigateTab: (tab: any) => void;
  onOpenAuthModal?: (mode?: 'login' | 'register') => void;
}

export const MineView: React.FC<MineViewProps> = ({
  user,
  teamData,
  financeData,
  incomeData,
  vipTiers = VIP_TIERS,
  notices,
  onRefresh,
  onNavigateTab,
  onOpenAuthModal
}) => {
  const { t, currentLanguageOption } = useLanguage();

  // Modal states
  const [showWelfareModal, setShowWelfareModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showAccountChangeModal, setShowAccountChangeModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showCustomerServiceModal, setShowCustomerServiceModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const currentLevel = user?.vipLevel || 1;
  const currentTier = vipTiers.find(t => t.level === currentLevel) || vipTiers[0];
  const validCount = user?.validDirectMembersCount || 0;
  const requiredCount = currentTier.minDirectMembers || 3;

  // Personal income (total accumulated earnings from tickets + checkin)
  const personalIncome = (user?.totalEarnedIncome || 0).toFixed(2);
  // Available Balance (ready for withdrawal / ticket buy)
  const availableBalance = (user?.balance || 0).toFixed(2);

  return (
    <div id="mine-view-container" className="pb-28 space-y-4 pt-1 font-sans">
      {/* 1. TOP BAR: VIP Level & Invite progress + Avatar (Clean without JamBase brand logo) */}
      <div className="flex items-center justify-between px-1 py-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-white tracking-wide">
            VIP {currentLevel}
          </span>
          <span className="text-xs text-neutral-400 font-medium">
            Next level: {validCount}/{requiredCount} (Invite friends)
          </span>
        </div>

        {/* Music / Profile Group Badge */}
        <div
          onClick={() => setShowMembershipModal(true)}
          className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-[#00D26A] via-teal-400 to-emerald-600 shadow-md shadow-[#00D26A]/30 cursor-pointer overflow-hidden flex items-center justify-center shrink-0"
        >
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80'}
            alt="VIP Member"
            className="w-full h-full rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {/* 2. STATS SECTION: Personal Income & Available Balance (Exact 2-Column Look from Screenshot) */}
      <div className="grid grid-cols-2 gap-4 py-4 px-2">
        {/* Left: Personal Income */}
        <div className="text-center">
          <div className="text-3xl font-black text-[#00D26A] tracking-tight">
            {personalIncome}
          </div>
          <div className="text-xs text-neutral-300 font-medium mt-1">
            {t('mine.personalIncome', 'Personal income')}
          </div>
        </div>

        {/* Right: Available Balance */}
        <div className="text-center">
          <div className="text-3xl font-black text-[#00D26A] tracking-tight">
            {availableBalance}
          </div>
          <div className="text-xs text-neutral-300 font-medium mt-1">
            {t('income.availableBalance', 'Available Balance')}
          </div>
        </div>
      </div>

      {/* 3. MEMBERSHIP LEVEL CARD (Matching Screenshot with "More" Pill Button) */}
      <div className="p-4 rounded-2xl bg-[#111317] border border-neutral-850 flex items-center justify-between shadow-lg">
        <span className="text-sm font-extrabold text-white">
          {t('mine.membershipLevel', 'Membership level')}
        </span>
        <button
          onClick={() => setShowMembershipModal(true)}
          className="px-5 py-1.5 rounded-full bg-[#00D26A] hover:bg-[#00e875] text-black font-extrabold text-xs shadow-md shadow-[#00D26A]/20 transition-transform active:scale-95"
        >
          {t('income.more', 'More')}
        </button>
      </div>

      {/* 4. ACTION BUTTONS: Recharge & Withdraw */}
      <div className="grid grid-cols-2 gap-3.5 pt-1">
        <button
          onClick={() => onNavigateTab('finance')}
          className="py-3 rounded-full border border-neutral-700 bg-transparent hover:border-[#00D26A] hover:text-[#00D26A] text-white font-extrabold text-sm transition-all shadow-md text-center active:scale-98"
        >
          {t('home.quickDeposit', 'Recharge')}
        </button>

        <button
          onClick={() => onNavigateTab('finance')}
          className="py-3 rounded-full border border-neutral-700 bg-transparent hover:border-[#00D26A] hover:text-[#00D26A] text-white font-extrabold text-sm transition-all shadow-md text-center active:scale-98"
        >
          {t('home.quickWithdraw', 'Withdraw')}
        </button>
      </div>

      {/* 5. MENU ITEMS LIST */}
      <div className="space-y-2.5 pt-2">
        {/* 1. welfare center */}
        <div
          onClick={() => setShowWelfareModal(true)}
          className="p-4 rounded-2xl bg-[#111317] border border-neutral-850 hover:border-neutral-700 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] group shadow-md"
        >
          <div className="flex items-center gap-3.5">
            <span className="w-8 h-8 rounded-full bg-[#00D26A] text-black flex items-center justify-center font-black shrink-0 shadow-sm">
              <CircleDot size={18} className="text-black" />
            </span>
            <span className="text-sm font-semibold text-white group-hover:text-[#00D26A] transition-colors">
              {t('mine.welfareCenter', 'Welfare center')}
            </span>
          </div>
          <ChevronRight size={18} className="text-neutral-500 group-hover:text-white transition-colors" />
        </div>

        {/* 2. Team's income */}
        <div
          onClick={() => setShowTeamModal(true)}
          className="p-4 rounded-2xl bg-[#111317] border border-neutral-850 hover:border-neutral-700 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] group shadow-md"
        >
          <div className="flex items-center gap-3.5">
            <span className="w-8 h-8 rounded-full bg-[#00D26A] text-black flex items-center justify-center font-black shrink-0 shadow-sm">
              <Users size={16} className="text-black" />
            </span>
            <span className="text-sm font-semibold text-white group-hover:text-[#00D26A] transition-colors">
              {t('mine.teamReport', "Team's income")}
            </span>
          </div>
          <ChevronRight size={18} className="text-neutral-500 group-hover:text-white transition-colors" />
        </div>

        {/* 3. Account change record */}
        <div
          onClick={() => setShowAccountChangeModal(true)}
          className="p-4 rounded-2xl bg-[#111317] border border-neutral-850 hover:border-neutral-700 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] group shadow-md"
        >
          <div className="flex items-center gap-3.5">
            <span className="w-8 h-8 rounded-full bg-[#00D26A] text-black flex items-center justify-center font-black shrink-0 shadow-sm">
              <Clock size={16} className="text-black" />
            </span>
            <span className="text-sm font-semibold text-white group-hover:text-[#00D26A] transition-colors">
              {t('mine.accountChange', 'Account change record')}
            </span>
          </div>
          <ChevronRight size={18} className="text-neutral-500 group-hover:text-white transition-colors" />
        </div>

        {/* 4. Company Profile */}
        <div
          onClick={() => setShowCompanyModal(true)}
          className="p-4 rounded-2xl bg-[#111317] border border-neutral-850 hover:border-neutral-700 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] group shadow-md"
        >
          <div className="flex items-center gap-3.5">
            <span className="w-8 h-8 rounded-full bg-[#00D26A] text-black flex items-center justify-center font-black shrink-0 shadow-sm">
              <Building2 size={16} className="text-black" />
            </span>
            <span className="text-sm font-semibold text-white group-hover:text-[#00D26A] transition-colors">
              {t('mine.companyProfile', 'Company Profile')}
            </span>
          </div>
          <ChevronRight size={18} className="text-neutral-500 group-hover:text-white transition-colors" />
        </div>

        {/* 5. Customer service */}
        <div
          onClick={() => setShowCustomerServiceModal(true)}
          className="p-4 rounded-2xl bg-[#111317] border border-neutral-850 hover:border-neutral-700 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] group shadow-md"
        >
          <div className="flex items-center gap-3.5">
            <span className="w-8 h-8 rounded-full bg-[#00D26A] text-black flex items-center justify-center font-black shrink-0 shadow-sm">
              <Headphones size={16} className="text-black" />
            </span>
            <span className="text-sm font-semibold text-white group-hover:text-[#00D26A] transition-colors">
              {t('mine.customerService', 'Customer service')}
            </span>
          </div>
          <ChevronRight size={18} className="text-neutral-500 group-hover:text-white transition-colors" />
        </div>

        {/* 6. Invite friends */}
        <div
          onClick={() => setShowInviteModal(true)}
          className="p-4 rounded-2xl bg-[#111317] border border-neutral-850 hover:border-neutral-700 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] group shadow-md"
        >
          <div className="flex items-center gap-3.5">
            <span className="w-8 h-8 rounded-full bg-[#00D26A] text-black flex items-center justify-center font-black shrink-0 shadow-sm">
              <UserPlus size={16} className="text-black" />
            </span>
            <span className="text-sm font-semibold text-white group-hover:text-[#00D26A] transition-colors">
              {t('mine.inviteFriends', 'Invite friends')}
            </span>
          </div>
          <ChevronRight size={18} className="text-neutral-500 group-hover:text-white transition-colors" />
        </div>

        {/* 7. Language Switcher Row */}
        <div
          onClick={() => setShowLanguageModal(true)}
          className="p-4 rounded-2xl bg-[#111317] border border-neutral-850 hover:border-neutral-700 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] group shadow-md"
        >
          <div className="flex items-center gap-3.5">
            <span className="w-8 h-8 rounded-full bg-[#00D26A] text-black flex items-center justify-center font-black shrink-0 shadow-sm">
              <Globe size={16} className="text-black" />
            </span>
            <div>
              <span className="text-sm font-semibold text-white group-hover:text-[#00D26A] transition-colors block">
                {t('mine.changeLanguage', 'Change Language')}
              </span>
              <span className="text-[11px] text-neutral-400">
                {currentLanguageOption.flag} {currentLanguageOption.nativeName} ({currentLanguageOption.name})
              </span>
            </div>
          </div>
          <ChevronRight size={18} className="text-neutral-500 group-hover:text-white transition-colors" />
        </div>
      </div>

      {/* 8. SIGN OUT BUTTON (Matching Screenshot centered clean white button) */}
      <div className="pt-6 pb-2 text-center">
        <button
          onClick={() => {
            if (onOpenAuthModal) {
              onOpenAuthModal('login');
            } else {
              setShowAuthModal(true);
            }
          }}
          className="text-sm font-bold text-neutral-300 hover:text-white transition-colors py-2 px-6 rounded-xl hover:bg-neutral-900"
        >
          {t('mine.logout', 'Sign out')}
        </button>
      </div>

      {/* ALL ATTACHED MODALS */}
      <WelfareCenterModal
        isOpen={showWelfareModal}
        onClose={() => setShowWelfareModal(false)}
        user={user}
        onRefresh={onRefresh}
      />

      <TeamReportModal
        isOpen={showTeamModal}
        onClose={() => setShowTeamModal(false)}
        teamData={teamData}
        user={user}
        onRefresh={onRefresh}
      />

      <TransactionHistoryModal
        isOpen={showAccountChangeModal}
        onClose={() => setShowAccountChangeModal(false)}
        transactions={financeData?.transactions || []}
      />

      <CompanyProfileModal
        isOpen={showCompanyModal}
        onClose={() => setShowCompanyModal(false)}
      />

      <SupportModal
        isOpen={showCustomerServiceModal}
        onClose={() => setShowCustomerServiceModal(false)}
        type="contact"
        modalType="contact"
        notices={notices}
      />

      <InviteFriendsModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        user={user}
      />

      <MembershipLevelModal
        isOpen={showMembershipModal}
        onClose={() => setShowMembershipModal(false)}
        user={user}
        vipTiers={vipTiers}
        onNavigateTab={onNavigateTab}
      />

      <LanguageSelectorModal
        isOpen={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          onRefresh();
        }}
        initialMode="register"
      />
    </div>
  );
};
