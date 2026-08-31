import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeView } from './components/views/HomeView';
import { IncomeView } from './components/views/IncomeView';
import { TaskView } from './components/views/TaskView';
import { FinanceView } from './components/views/FinanceView';
import { MineView } from './components/views/MineView';
import { TicketDetailModal } from './components/TicketDetailModal';
import { AudioPlayerBar } from './components/AudioPlayerBar';
import { NotificationModal } from './components/NotificationModal';
import { SupportModal } from './components/mine/SupportModals';
import { LanguageSelectorModal } from './components/LanguageSelectorModal';
import { AdminPortal } from './components/admin/AdminPortal';
import {
  TabType,
  User,
  Ticket,
  Artist,
  Category,
  VIPTier,
  PlatformNotice,
  TicketPurchase,
  TaskItem
} from './types';
import { api, IncomeResponse, FinanceResponse, TeamResponse } from './services/api';

export default function App() {
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    return path.startsWith('/admin') || hash.startsWith('#/admin') || hash === '#admin';
  });

  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [user, setUser] = useState<User | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [notices, setNotices] = useState<PlatformNotice[]>([]);
  const [vipTiers, setVipTiers] = useState<VIPTier[]>([]);
  const [purchases, setPurchases] = useState<TicketPurchase[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);

  const [incomeData, setIncomeData] = useState<IncomeResponse | null>(null);
  const [financeData, setFinanceData] = useState<FinanceResponse | null>(null);
  const [teamData, setTeamData] = useState<TeamResponse | null>(null);

  // Modals & player state
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Ticket | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCustomerServiceModal, setShowCustomerServiceModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync URL route changes (e.g. /admin vs /)
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      setIsAdminRoute(path.startsWith('/admin') || hash.startsWith('#/admin') || hash === '#admin');
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Primary data fetcher for public member site
  const loadAllData = useCallback(async () => {
    try {
      const [
        userData,
        ticketsData,
        artistsData,
        categoriesData,
        noticesData,
        tiersData,
        purchasesData,
        tasksData,
        incomeRes,
        financeRes,
        teamRes
      ] = await Promise.all([
        api.getUser(),
        api.getTickets(),
        api.getArtists(),
        api.getCategories(),
        api.getNotices(),
        api.getVIPTiers(),
        api.getPurchases(),
        api.getTasks(),
        api.getIncome(),
        api.getFinance(),
        api.getTeam()
      ]);

      setUser(userData || null);
      setTickets(ticketsData || []);
      setArtists(artistsData || []);
      setCategories(categoriesData || []);
      setNotices(noticesData || []);
      setVipTiers(tiersData || []);
      setPurchases(purchasesData || []);
      setTasks(tasksData || []);
      setIncomeData(incomeRes || null);
      setFinanceData(financeRes || null);
      setTeamData(teamRes || null);
    } catch (err) {
      console.error('Failed to load initial data from server', err);
    }
  }, []);

  useEffect(() => {
    if (!isAdminRoute) {
      loadAllData();
    }
  }, [loadAllData, isAdminRoute]);

  // If visiting the dedicated private Admin route (/admin or #/admin)
  if (isAdminRoute) {
    return (
      <AdminPortal
        onBackToWebsite={() => {
          if (window.history.pushState) {
            window.history.pushState(null, '', '/');
          } else {
            window.location.hash = '';
          }
          setIsAdminRoute(false);
          loadAllData();
        }}
      />
    );
  }

  // Handler when a ticket is successfully purchased
  const handlePurchaseSuccess = (updatedUser: User, purchaseMsg: string) => {
    setUser(updatedUser);
    showToast(purchaseMsg);
    loadAllData();
  };

  const pendingTasksCount = (tasks || []).filter(t => t.isCompleted && !t.isClaimed).length;

  return (
    <div className="min-h-screen bg-[#0b0c10] text-neutral-100 flex justify-center selection:bg-[#00D26A] selection:text-black">
      {/* Mobile viewport wrapper (max-w-md matching real smartphone screens) */}
      <div className="w-full max-w-md min-h-screen flex flex-col relative bg-[#0d0e12] border-x border-neutral-800/40 shadow-2xl">
        {/* Top Header */}
        <Header
          user={user}
          currentTab={currentTab}
          onOpenNotifications={() => setShowNotifications(true)}
          onOpenVIPModal={() => setCurrentTab('mine')}
          onOpenLanguageModal={() => setShowLanguageModal(true)}
          onOpenCustomerService={() => setShowCustomerServiceModal(true)}
        />

        {/* Global Toast Notification */}
        {toastMessage && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#00D26A] text-black font-extrabold text-xs shadow-xl shadow-[#00D26A]/30 animate-in fade-in zoom-in-95">
            {toastMessage}
          </div>
        )}

        {/* Main Dynamic View Outlet */}
        <main className="flex-1 px-4 pt-3">
          {currentTab === 'home' && (
            <HomeView
              tickets={tickets}
              artists={artists}
              categories={categories}
              notices={notices}
              user={user}
              onSelectTicket={(ticket) => setSelectedTicket(ticket)}
              onPlayTrack={(ticket) => setCurrentTrack(ticket)}
              onNavigateTab={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'income' && (
            <IncomeView
              incomeData={incomeData}
              purchases={purchases}
              onRefresh={loadAllData}
              onNavigateTab={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'task' && (
            <TaskView
              tasks={tasks}
              user={user}
              onRefresh={loadAllData}
              onNavigateTab={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'finance' && (
            <FinanceView
              financeData={financeData}
              onRefresh={loadAllData}
            />
          )}

          {currentTab === 'mine' && (
            <MineView
              user={user}
              teamData={teamData}
              financeData={financeData}
              incomeData={incomeData}
              vipTiers={vipTiers}
              notices={notices}
              onRefresh={loadAllData}
              onNavigateTab={(tab) => setCurrentTab(tab)}
            />
          )}
        </main>

        {/* Floating Mini Audio Player */}
        <AudioPlayerBar
          currentTrack={currentTrack}
          onClose={() => setCurrentTrack(null)}
        />

        {/* Bottom Navigation */}
        <BottomNav
          currentTab={currentTab}
          onChangeTab={(tab) => {
            setCurrentTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          pendingTasksCount={pendingTasksCount}
        />

        {/* Modals */}
        <TicketDetailModal
          ticket={selectedTicket}
          user={user}
          onClose={() => setSelectedTicket(null)}
          onPurchaseSuccess={handlePurchaseSuccess}
          onPlayTrack={(ticket) => setCurrentTrack(ticket)}
          onNavigateTab={(tab) => setCurrentTab(tab)}
        />

        <NotificationModal
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
          notices={notices}
        />

        <SupportModal
          isOpen={showCustomerServiceModal}
          onClose={() => setShowCustomerServiceModal(false)}
          type="contact"
          modalType="contact"
          notices={notices}
        />

        <LanguageSelectorModal
          isOpen={showLanguageModal}
          onClose={() => setShowLanguageModal(false)}
        />
      </div>
    </div>
  );
}
