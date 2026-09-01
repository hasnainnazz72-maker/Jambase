import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Lock,
  User,
  Key,
  LogOut,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  DollarSign,
  Ticket as TicketIcon,
  Users,
  MessageSquare,
  Sparkles,
  RefreshCw,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Building2,
  Check,
  Send,
  Database,
  HardDrive,
  Download,
  Upload,
  FileCheck,
  Activity,
  Save,
  History,
  AlertTriangle,
  FileCode,
  ArrowDownLeft
} from 'lucide-react';
import { api, AdminOverviewResponse } from '../../services/api';
import { Ticket, ReferralMember, WithdrawalRequest, DepositRequest, BackupSnapshot, DatabaseIntegrityReport } from '../../types';
import { MemberManagementView } from './MemberManagementView';
import { WithdrawalApprovalQueue } from './WithdrawalApprovalQueue';
import { RechargeApprovalQueue } from './RechargeApprovalQueue';

interface AdminPortalProps {
  onBackToWebsite: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ onBackToWebsite }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Admin Dashboard state
  const [activeTab, setActiveTab] = useState<'members' | 'recharges' | 'withdrawals' | 'referrals' | 'tickets' | 'notices' | 'telegram' | 'metrics' | 'backups'>('members');
  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  // VIP Data Protection & Backups state
  const [backups, setBackups] = useState<BackupSnapshot[]>([]);
  const [integrityReport, setIntegrityReport] = useState<DatabaseIntegrityReport | null>(null);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [runningAudit, setRunningAudit] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [restoringSnapshotId, setRestoringSnapshotId] = useState<string | null>(null);
  const [backupReason, setBackupReason] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importingData, setImportingData] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Notice form
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');

  // Telegram support form
  const [telegramUsername, setTelegramUsername] = useState('@Camila85260');

  // Ticket create form
  const [showAddTicket, setShowAddTicket] = useState(false);
  const [newTicket, setNewTicket] = useState({
    name: '',
    artist: '',
    category: 'VIP Concert',
    price: '25',
    voucherQty: '2',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
    description: 'Premier live concert ticket with VIP tier yield return.',
    eventDate: '2026-12-30',
    venue: 'Grand VIP Arena',
    location: 'Global Stadium & Live Stream',
    vipRequired: '0',
    maxQuantity: '10'
  });

  // Verify session on mount
  useEffect(() => {
    const verifySession = async () => {
      try {
        await api.adminVerify();
        setIsAuthenticated(true);
        loadDashboardData();
      } catch {
        setIsAuthenticated(false);
      } finally {
        setCheckingAuth(false);
      }
    };
    verifySession();
  }, []);

  const loadDashboardData = async () => {
    setDataLoading(true);
    try {
      const res = await api.getAdminOverview();
      setOverview(res);

      const notices = await api.getNotices();
      if (notices && notices.length > 0) {
        setNoticeTitle(notices[0].title);
        setNoticeContent(notices[0].content || '');
      }

      const tg = await api.getTelegramSupport();
      if (tg?.telegram?.username) {
        setTelegramUsername(tg.telegram.username);
      }
    } catch (err: any) {
      console.error('Failed to load admin overview', err);
    } finally {
      setDataLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    try {
      await api.adminLogin({ username, password });
      setIsAuthenticated(true);
      loadDashboardData();
    } catch (err: any) {
      setLoginError(err.message || 'Invalid admin credentials');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.adminLogout();
    } finally {
      setIsAuthenticated(false);
      setUsername('');
      setPassword('');
    }
  };

  const handleWithdrawalAction = async (id: string, action: 'Approve' | 'Reject' | 'Complete', reason?: string) => {
    try {
      await api.processWithdrawal(id, action, reason);
      setActionMsg({ text: `Withdrawal ${id} marked as ${action}` });
      loadDashboardData();
      setTimeout(() => setActionMsg(null), 3500);
    } catch (err: any) {
      setActionMsg({ text: err.message || 'Action failed', isError: true });
    }
  };

  const handleToggleReferral = async (id: string, reason?: string) => {
    try {
      await api.toggleReferralValid(id, reason);
      setActionMsg({ text: `Referral status updated successfully` });
      loadDashboardData();
      setTimeout(() => setActionMsg(null), 3500);
    } catch (err: any) {
      setActionMsg({ text: err.message || 'Failed to update referral', isError: true });
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createTicket(newTicket);
      setActionMsg({ text: `New ticket "${newTicket.name}" created successfully!` });
      setShowAddTicket(false);
      setNewTicket({
        name: '',
        artist: '',
        category: 'VIP Concert',
        price: '25',
        voucherQty: '2',
        image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
        description: 'Premier live concert ticket with VIP tier yield return.',
        eventDate: '2026-12-30',
        venue: 'Grand VIP Arena',
        location: 'Global Stadium & Live Stream',
        vipRequired: '1',
        maxQuantity: '10'
      });
      loadDashboardData();
      setTimeout(() => setActionMsg(null), 3500);
    } catch (err: any) {
      setActionMsg({ text: err.message || 'Failed to create ticket', isError: true });
    }
  };

  const handleDeleteTicket = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this ticket from the marketplace?')) return;
    try {
      await api.deleteTicket(id);
      setActionMsg({ text: 'Ticket removed from marketplace' });
      loadDashboardData();
      setTimeout(() => setActionMsg(null), 3500);
    } catch (err: any) {
      setActionMsg({ text: err.message || 'Failed to delete ticket', isError: true });
    }
  };

  const handleUpdateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateAnnouncement(noticeTitle, noticeContent);
      setActionMsg({ text: 'Official 24-hour announcement updated and broadcasted!' });
      loadDashboardData();
      setTimeout(() => setActionMsg(null), 3500);
    } catch (err: any) {
      setActionMsg({ text: err.message || 'Failed to update notice', isError: true });
    }
  };

  const handleUpdateTelegram = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateAdminTelegram(telegramUsername);
      setActionMsg({ text: `Official Customer Service Telegram updated to ${telegramUsername}` });
      loadDashboardData();
      setTimeout(() => setActionMsg(null), 3500);
    } catch (err: any) {
      setActionMsg({ text: err.message || 'Failed to update Telegram contact', isError: true });
    }
  };

  const loadBackupsAndIntegrity = async () => {
    setLoadingBackups(true);
    try {
      const [backupsRes, integrityRes] = await Promise.all([
        api.getBackups().catch(() => ({ backups: [] })),
        api.getDatabaseIntegrity().catch(() => null)
      ]);
      setBackups(backupsRes.backups || []);
      if (integrityRes) {
        setIntegrityReport(integrityRes);
      }
    } catch (err: any) {
      console.error('Failed to load backup data', err);
    } finally {
      setLoadingBackups(false);
    }
  };

  const handleCreateBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingBackup(true);
    try {
      const res = await api.createBackup(backupReason || 'Manual Administrator Snapshot');
      setActionMsg({ text: res.message || 'VIP Snapshot created successfully!' });
      setBackupReason('');
      await loadBackupsAndIntegrity();
      setTimeout(() => setActionMsg(null), 3500);
    } catch (err: any) {
      setActionMsg({ text: err.message || 'Failed to create backup snapshot', isError: true });
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleRestoreBackup = async (snapshot: BackupSnapshot) => {
    const confirmText = `Are you sure you want to restore the database to backup snapshot "${snapshot.filename}" (${new Date(snapshot.createdAt).toLocaleString()})?\n\nA safety snapshot of the current database state will be created automatically before restoring.`;
    if (!window.confirm(confirmText)) return;

    setRestoringSnapshotId(snapshot.id);
    try {
      const res = await api.restoreBackup(snapshot.id);
      setActionMsg({ text: res.message || 'Database restored successfully!' });
      await loadBackupsAndIntegrity();
      await loadDashboardData();
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err: any) {
      setActionMsg({ text: err.message || 'Failed to restore database from backup', isError: true });
    } finally {
      setRestoringSnapshotId(null);
    }
  };

  const handleRunIntegrityAudit = async () => {
    setRunningAudit(true);
    try {
      const report = await api.getDatabaseIntegrity();
      setIntegrityReport(report);
      setActionMsg({ text: `Database Integrity Audit completed: ${report.status.toUpperCase()} (${report.integrityChecks.filter(c => c.passed).length}/${report.integrityChecks.length} checks passed)` });
      setTimeout(() => setActionMsg(null), 3500);
    } catch (err: any) {
      setActionMsg({ text: err.message || 'Failed to run integrity audit', isError: true });
    } finally {
      setRunningAudit(false);
    }
  };

  const handleExportDatabase = async () => {
    try {
      const dbData = await api.exportDatabase();
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dbData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `jambase_vip_database_backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setActionMsg({ text: 'VIP Database JSON exported and downloaded safely to your device!' });
      setTimeout(() => setActionMsg(null), 3500);
    } catch (err: any) {
      setActionMsg({ text: err.message || 'Failed to export database', isError: true });
    }
  };

  const handleImportDatabase = async () => {
    if (!importJsonText.trim()) {
      setActionMsg({ text: 'Please paste valid JSON database data or upload a JSON backup file.', isError: true });
      return;
    }

    try {
      const parsedData = JSON.parse(importJsonText);
      if (!window.confirm('WARNING: Importing this database backup will overwrite the current active dataset. A pre-import safety snapshot will be created automatically. Proceed?')) {
        return;
      }

      setImportingData(true);
      const res = await api.importDatabase(parsedData);
      setActionMsg({ text: res.message || 'Database imported and restored successfully!' });
      setShowImportModal(false);
      setImportJsonText('');
      await loadBackupsAndIntegrity();
      await loadDashboardData();
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err: any) {
      setActionMsg({ text: `Import failed: ${err.message || 'Invalid JSON format or corrupted schema'}`, isError: true });
    } finally {
      setImportingData(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportJsonText(content);
    };
    reader.readAsText(file);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#07080a] text-neutral-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="animate-spin text-[#00D26A]" size={32} />
          <span className="text-xs text-neutral-400 font-mono tracking-wider">Verifying Admin Access...</span>
        </div>
      </div>
    );
  }

  // 1. DEDICATED ADMIN LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#07080a] text-neutral-100 flex flex-col justify-center items-center p-4 relative selection:bg-[#00D26A] selection:text-black">
        {/* Background Grid Accent */}
        <div className="absolute inset-0 bg-[radial-gradient(#00D26A_1px,transparent_1px)] [background-size:24px_24px] opacity-5 pointer-events-none" />

        <div className="w-full max-w-md bg-[#0f1117] border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10">
          {/* Header & Logo */}
          <div className="text-center space-y-3 mb-6">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-[#00D26A] to-emerald-400 flex items-center justify-center text-black font-black text-2xl shadow-xl shadow-[#00D26A]/20">
              <ShieldCheck size={32} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-wide text-white">JAMBASE VIP ADMIN</h1>
              <p className="text-xs text-neutral-400 font-mono mt-1">Dedicated Administration Portal</p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-semibold text-[#00D26A]">
              <Lock size={12} />
              <span>Restricted Access & End-to-End Token Authorization</span>
            </div>
          </div>

          {loginError && (
            <div className="mb-5 p-3.5 rounded-2xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs flex items-center gap-2.5">
              <AlertCircle size={16} className="shrink-0 text-red-400" />
              <span>{loginError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-neutral-300 mb-1.5 block">Admin Username</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-3.5 text-neutral-500" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter admin username"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-neutral-900/90 border border-neutral-800 text-white placeholder-neutral-500 text-xs focus:outline-none focus:border-[#00D26A] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-300 mb-1.5 block">Admin Password</label>
              <div className="relative">
                <Key size={16} className="absolute left-3.5 top-3.5 text-neutral-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter secure admin password"
                  className="w-full pl-10 pr-10 py-3 rounded-2xl bg-neutral-900/90 border border-neutral-800 text-white placeholder-neutral-500 text-xs focus:outline-none focus:border-[#00D26A] transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-neutral-500 hover:text-white"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full mt-2 py-3.5 rounded-2xl bg-[#00D26A] hover:bg-[#00e875] text-black font-extrabold text-xs tracking-wide shadow-lg shadow-[#00D26A]/20 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
            >
              {loginLoading ? <RefreshCw className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
              <span>{loginLoading ? 'Authenticating...' : 'Sign In to Admin Portal'}</span>
            </button>
          </form>

          {/* Footer link to public website */}
          <div className="mt-6 pt-5 border-t border-neutral-800/80 text-center">
            <button
              onClick={onBackToWebsite}
              className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors font-semibold"
            >
              <ArrowLeft size={14} />
              <span>Return to Public Member Website</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. DEDICATED AUTHENTICATED ADMIN CONSOLE
  return (
    <div className="min-h-screen bg-[#08090d] text-neutral-100 flex flex-col selection:bg-[#00D26A] selection:text-black">
      {/* Top Admin Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#0d0f15]/95 backdrop-blur-md border-b border-neutral-800/80 px-4 sm:px-6 py-3.5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#00D26A] to-emerald-400 flex items-center justify-center text-black font-black text-lg shadow-md shadow-[#00D26A]/20">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-sm text-white tracking-wide">JAMBASE VIP ADMIN CONSOLE</h1>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-[#00D26A] border border-emerald-500/30 text-[10px] font-mono font-bold">
                  AUTH: SUPER_ADMIN
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">Restricted Management & Financial Operations</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={loadDashboardData}
              title="Refresh Data"
              className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white transition-colors"
            >
              <RefreshCw size={15} className={dataLoading ? 'animate-spin' : ''} />
            </button>

            <button
              onClick={onBackToWebsite}
              className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-xs font-semibold text-neutral-300 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft size={14} />
              <span>Member Site</span>
            </button>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl bg-red-950/40 border border-red-500/30 hover:bg-red-900/60 text-xs font-semibold text-red-300 transition-colors flex items-center gap-1.5"
            >
              <LogOut size={14} />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto w-full p-4 sm:p-6 space-y-6 flex-1">
        {/* Action notification toast */}
        {actionMsg && (
          <div
            className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between transition-all ${
              actionMsg.isError
                ? 'bg-red-950/70 border-red-500 text-red-200'
                : 'bg-emerald-950/70 border-[#00D26A] text-emerald-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {actionMsg.isError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
              <span>{actionMsg.text}</span>
            </div>
            <button onClick={() => setActionMsg(null)} className="text-xs opacity-70 hover:opacity-100">
              Dismiss
            </button>
          </div>
        )}

        {/* Top KPI Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
          <div className="p-4 rounded-2xl bg-[#11131a] border border-neutral-800/80">
            <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold">
              <span>Total Members</span>
              <Users size={16} className="text-[#00D26A]" />
            </div>
            <div className="text-2xl font-black text-white mt-1.5">{overview?.totalUsers || 1}</div>
            <span className="text-[10px] text-neutral-500 font-mono">Platform registered</span>
          </div>

          <div
            onClick={() => setActiveTab('recharges')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              (overview?.pendingDeposits || 0) > 0
                ? 'bg-amber-500/10 border-amber-500/40 hover:bg-amber-500/15'
                : 'bg-[#11131a] border-neutral-800/80 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold">
              <span className="flex items-center gap-1 text-amber-300">
                {(overview?.pendingDeposits || 0) > 0 && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />}
                Pending Recharge
              </span>
              <ArrowDownLeft size={16} className="text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400 mt-1.5">{overview?.pendingDeposits || 0}</div>
            <span className="text-[10px] text-neutral-500 font-mono">Recharge queue</span>
          </div>

          <div
            onClick={() => setActiveTab('withdrawals')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              (overview?.pendingWithdrawals || 0) > 0
                ? 'bg-amber-500/10 border-amber-500/40 hover:bg-amber-500/15'
                : 'bg-[#11131a] border-neutral-800/80 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold">
              <span>Pending Withdrawals</span>
              <Clock size={16} className="text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400 mt-1.5">{overview?.pendingWithdrawals || 0}</div>
            <span className="text-[10px] text-neutral-500 font-mono">Requires review</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#11131a] border border-neutral-800/80">
            <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold">
              <span>Marketplace Tickets</span>
              <TicketIcon size={16} className="text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white mt-1.5">{overview?.totalTickets || 0}</div>
            <span className="text-[10px] text-neutral-500 font-mono">{overview?.activeTickets || 0} active</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#11131a] border border-neutral-800/80">
            <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold">
              <span>Valid Referrals</span>
              <ShieldCheck size={16} className="text-purple-400" />
            </div>
            <div className="text-2xl font-black text-purple-300 mt-1.5">
              {overview?.validReferrals || 0}/{overview?.totalReferrals || 0}
            </div>
            <span className="text-[10px] text-neutral-500 font-mono">Qualified VIP accounts</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 border-b border-neutral-800 pb-3">
          {[
            { id: 'members', label: 'Member Management', count: overview?.totalRegisteredMembers || overview?.totalUsers, highlight: true },
            { id: 'recharges', label: 'Pending Recharge', count: overview?.pendingDeposits, isPendingHighlight: (overview?.pendingDeposits || 0) > 0 },
            { id: 'withdrawals', label: 'Withdrawal Approvals', count: overview?.pendingWithdrawals, isPendingHighlight: (overview?.pendingWithdrawals || 0) > 0 },
            { id: 'referrals', label: 'Referral Compliance', count: overview?.totalReferrals },
            { id: 'tickets', label: 'Concert & Ticket Hub', count: overview?.totalTickets },
            { id: 'notices', label: '24h Announcements' },
            { id: 'telegram', label: 'Telegram CS Settings' },
            { id: 'metrics', label: 'VIP Engine Metrics' },
            { id: 'backups', label: 'Data Protection & Backups', count: backups.length || undefined, highlight: false }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                if (tab.id === 'backups') {
                  loadBackupsAndIntegrity();
                }
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? tab.highlight 
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                    : tab.isPendingHighlight
                    ? 'bg-amber-400 text-black shadow-md shadow-amber-500/20 font-black'
                    : 'bg-[#00D26A] text-black shadow-md shadow-[#00D26A]/20'
                  : tab.isPendingHighlight
                    ? 'bg-amber-950/40 text-amber-300 border border-amber-500/40 hover:bg-amber-900/60'
                    : tab.highlight
                    ? 'bg-neutral-900 text-amber-300 border border-amber-500/30 hover:bg-neutral-850'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              {tab.id === 'members' && <Users size={13} />}
              {tab.id === 'recharges' && <ArrowDownLeft size={13} />}
              {tab.id === 'withdrawals' && <Clock size={13} />}
              {tab.id === 'backups' && <Database size={13} />}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    activeTab === tab.id
                      ? 'bg-black/30 text-black'
                      : tab.isPendingHighlight
                      ? 'bg-amber-500/30 text-amber-200 border border-amber-500/40'
                      : 'bg-neutral-800 text-neutral-300'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* TAB 0: MEMBER MANAGEMENT */}
        {activeTab === 'members' && (
          <MemberManagementView onRefreshOverview={loadDashboardData} />
        )}

        {/* TAB 1: PENDING RECHARGES / DEPOSITS */}
        {activeTab === 'recharges' && (
          <RechargeApprovalQueue
            deposits={overview?.depositsList || []}
            onRefresh={loadDashboardData}
            onSetActionMsg={setActionMsg}
          />
        )}

        {/* TAB 2: WITHDRAWALS */}
        {activeTab === 'withdrawals' && (
          <WithdrawalApprovalQueue
            withdrawals={overview?.withdrawalsList || []}
            onRefresh={loadDashboardData}
            onSetActionMsg={setActionMsg}
          />
        )}

        {/* TAB 2: REFERRALS */}
        {activeTab === 'referrals' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-extrabold text-white">Referral Member Qualification Audit</h2>
              <p className="text-xs text-neutral-400">Toggle qualification compliance or disqualify suspicious multi-accounts</p>
            </div>

            {(!overview?.referralsList || overview.referralsList.length === 0) ? (
              <div className="p-8 text-center rounded-2xl bg-neutral-900/50 border border-neutral-800 text-neutral-400 text-xs">
                No referral accounts in the current cycle.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {overview.referralsList.map((ref) => (
                  <div key={ref.id} className="p-4 rounded-2xl bg-[#11131a] border border-neutral-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-bold text-white">{ref.name}</div>
                        <div className="text-[11px] text-neutral-400 font-mono">{ref.phone}</div>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                          ref.isValid
                            ? 'bg-emerald-500/20 text-[#00D26A] border border-emerald-500/30'
                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}
                      >
                        {ref.isValid ? '✓ Qualified (Valid)' : '✗ Disqualified'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-black/40 p-2.5 rounded-xl border border-neutral-850 font-mono text-neutral-300">
                      <div>Deposit: <strong className="text-white">${ref.depositAmount}</strong></div>
                      <div>VIP Level: <strong className="text-white">VIP {ref.vipLevel}</strong></div>
                      <div className="col-span-2">Joined: {new Date(ref.joinDate).toLocaleDateString()}</div>
                      {ref.disqualifiedReason && (
                        <div className="col-span-2 text-red-400">Reason: {ref.disqualifiedReason}</div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        const reason = !ref.isValid ? undefined : (window.prompt('Enter reason for disqualifying referral member:') || undefined);
                        handleToggleReferral(ref.id, reason);
                      }}
                      className={`w-full py-2 rounded-xl text-xs font-bold transition-colors ${
                        ref.isValid
                          ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                          : 'bg-[#00D26A] hover:bg-[#00e875] text-black font-extrabold'
                      }`}
                    >
                      {ref.isValid ? 'Disqualify Member' : 'Re-qualify Referral'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: TICKETS */}
        {activeTab === 'tickets' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-white">Concert Marketplace Catalog</h2>
                <p className="text-xs text-neutral-400">Publish new concert events, adjust price tiers, or delete tickets</p>
              </div>
              <button
                onClick={() => setShowAddTicket(!showAddTicket)}
                className="px-3.5 py-2 rounded-xl bg-[#00D26A] hover:bg-[#00e875] text-black font-extrabold text-xs flex items-center gap-1.5"
              >
                <Plus size={14} />
                <span>{showAddTicket ? 'Close Form' : 'Publish New Ticket'}</span>
              </button>
            </div>

            {/* Add ticket form modal / section */}
            {showAddTicket && (
              <form onSubmit={handleCreateTicket} className="p-5 rounded-2xl bg-neutral-900 border border-neutral-700 space-y-4">
                <h3 className="text-sm font-bold text-white">Create & Publish Concert Ticket</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-neutral-400 block mb-1">Event / Concert Title</label>
                    <input
                      type="text"
                      required
                      value={newTicket.name}
                      onChange={(e) => setNewTicket({ ...newTicket, name: e.target.value })}
                      placeholder="e.g. World Tour Live 2026"
                      className="w-full px-3 py-2 rounded-xl bg-black border border-neutral-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-neutral-400 block mb-1">Performing Artist</label>
                    <input
                      type="text"
                      required
                      value={newTicket.artist}
                      onChange={(e) => setNewTicket({ ...newTicket, artist: e.target.value })}
                      placeholder="e.g. Taylor Swift / The Weeknd"
                      className="w-full px-3 py-2 rounded-xl bg-black border border-neutral-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-neutral-400 block mb-1">Price (USDT)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={newTicket.price}
                      onChange={(e) => setNewTicket({ ...newTicket, price: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-black border border-neutral-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-neutral-400 block mb-1">Voucher Quantity (Slots)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={newTicket.voucherQty}
                      onChange={(e) => setNewTicket({ ...newTicket, voucherQty: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-black border border-neutral-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-neutral-400 block mb-1">Venue</label>
                    <input
                      type="text"
                      value={newTicket.venue}
                      onChange={(e) => setNewTicket({ ...newTicket, venue: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-black border border-neutral-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-neutral-400 block mb-1">VIP Tier Required (0 = All VIPs / Open)</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={newTicket.vipRequired}
                      onChange={(e) => setNewTicket({ ...newTicket, vipRequired: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-black border border-neutral-800 text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddTicket(false)}
                    className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#00D26A] text-black font-extrabold text-xs"
                  >
                    Publish to Marketplace
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(overview?.ticketsList || []).map((tkt) => (
                <div key={tkt.id} className="p-4 rounded-2xl bg-[#11131a] border border-neutral-800 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="h-28 rounded-xl overflow-hidden mb-2 bg-neutral-900">
                      <img src={tkt.image} alt={tkt.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="text-sm font-bold text-white truncate">{tkt.name}</div>
                    <div className="text-xs text-neutral-400">{tkt.artist}</div>
                    <div className="flex items-center justify-between mt-2 text-xs font-mono">
                      <span className="text-[#00D26A] font-bold">${tkt.price.toFixed(2)}</span>
                      <span className="text-neutral-400">VIP {tkt.vipRequired} Req.</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteTicket(tkt.id)}
                    className="w-full py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 text-xs font-bold flex items-center justify-center gap-1"
                  >
                    <Trash2 size={13} />
                    <span>Delete Ticket</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: 24H NOTICES */}
        {activeTab === 'notices' && (
          <div className="p-5 rounded-2xl bg-[#11131a] border border-neutral-800 space-y-4 max-w-2xl">
            <div>
              <h2 className="text-base font-extrabold text-white">Broadcast 24-Hour Announcement</h2>
              <p className="text-xs text-neutral-400">Update the scrolling news marquee shown to all platform members</p>
            </div>

            <form onSubmit={handleUpdateNotice} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Headline Marquee Text</label>
                <input
                  type="text"
                  required
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  placeholder="e.g. JAMBASE VIP daily yields calculated at 00:00 UTC."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-neutral-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Detailed Content (Optional)</label>
                <textarea
                  rows={3}
                  value={noticeContent}
                  onChange={(e) => setNoticeContent(e.target.value)}
                  placeholder="Extended announcement details..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-neutral-800 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                className="py-2.5 px-5 rounded-xl bg-[#00D26A] hover:bg-[#00e875] text-black font-extrabold text-xs flex items-center gap-1.5"
              >
                <Send size={14} />
                <span>Broadcast Announcement Now</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 5: TELEGRAM SETTINGS */}
        {activeTab === 'telegram' && (
          <div className="p-5 rounded-2xl bg-[#11131a] border border-neutral-800 space-y-4 max-w-2xl">
            <div>
              <h2 className="text-base font-extrabold text-white">Official Telegram Customer Service</h2>
              <p className="text-xs text-neutral-400">Configure the customer support handle displayed across all member screens</p>
            </div>

            <form onSubmit={handleUpdateTelegram} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Telegram Support Username</label>
                <input
                  type="text"
                  required
                  value={telegramUsername}
                  onChange={(e) => setTelegramUsername(e.target.value)}
                  placeholder="@Camila85260"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-neutral-800 text-xs text-white font-mono"
                />
              </div>

              <div className="p-3 rounded-xl bg-black/60 border border-neutral-850 text-xs text-neutral-400">
                Direct Contact URL: <strong className="text-[#00D26A] font-mono">https://t.me/{telegramUsername.replace('@', '')}</strong>
              </div>

              <button
                type="submit"
                className="py-2.5 px-5 rounded-xl bg-[#00D26A] hover:bg-[#00e875] text-black font-extrabold text-xs flex items-center gap-1.5"
              >
                <Check size={14} />
                <span>Save Telegram Configuration</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 6: VIP ENGINE METRICS */}
        {activeTab === 'metrics' && (
          <div className="p-5 rounded-2xl bg-[#11131a] border border-neutral-800 space-y-4">
            <div>
              <h2 className="text-base font-extrabold text-white">VIP Financial Engine Specifications</h2>
              <p className="text-xs text-neutral-400">System parameters and security protocols</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
              <div className="p-4 rounded-xl bg-black/50 border border-neutral-850 space-y-1">
                <div className="text-neutral-400 font-medium">Daily VIP Schedule</div>
                <div className="text-white font-bold">00:00:00 UTC Auto-Calculation</div>
              </div>
              <div className="p-4 rounded-xl bg-black/50 border border-neutral-850 space-y-1">
                <div className="text-neutral-400 font-medium">Ticket Unfreeze Period</div>
                <div className="text-white font-bold">180s (3 Minutes) Principal + Yield Return</div>
              </div>
              <div className="p-4 rounded-xl bg-black/50 border border-neutral-850 space-y-1">
                <div className="text-neutral-400 font-medium">Minimum Active Yield Threshold</div>
                <div className="text-white font-bold">$30.00 Total Assets (Rule 4)</div>
              </div>
              <div className="p-4 rounded-xl bg-black/50 border border-neutral-850 space-y-1">
                <div className="text-neutral-400 font-medium">Minimum Withdrawal Limit</div>
                <div className="text-white font-bold">$8.00 USDT (TRC20 & BEP20)</div>
              </div>
              <div className="p-4 rounded-xl bg-black/50 border border-neutral-850 space-y-1">
                <div className="text-neutral-400 font-medium">3-Tier Team Rebates</div>
                <div className="text-white font-bold">16% Level 1 / 8% Level 2 / 4% Level 3</div>
              </div>
              <div className="p-4 rounded-xl bg-black/50 border border-neutral-850 space-y-1">
                <div className="text-neutral-400 font-medium">Official Deposit Networks</div>
                <div className="text-white font-bold">TRC20 (TRON) & BEP20 (BSC)</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: VIP DATA PROTECTION & DISASTER RECOVERY */}
        {activeTab === 'backups' && (
          <div className="space-y-6">
            {/* Header & Quick Action Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-[#11131a] to-[#11131a] border border-emerald-500/30">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[#00D26A]/20 text-[#00D26A]">
                    <ShieldCheck size={22} />
                  </div>
                  <h2 className="text-lg font-black text-white">VIP Data Protection & Disaster Recovery</h2>
                </div>
                <p className="text-xs text-neutral-400 max-w-2xl">
                  Enterprise-grade atomic storage engine protecting all member balances, transactions, tickets, yields, deposits, withdrawals, and referral records with continuous automated backups and instant rollback.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleRunIntegrityAudit}
                  disabled={runningAudit}
                  className="px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 hover:border-emerald-500 text-xs font-bold text-neutral-200 hover:text-white transition-all flex items-center gap-1.5 active:scale-98 disabled:opacity-50"
                >
                  <Activity size={14} className={runningAudit ? 'animate-spin text-emerald-400' : 'text-emerald-400'} />
                  <span>{runningAudit ? 'Auditing...' : 'Run Integrity Audit'}</span>
                </button>

                <button
                  onClick={handleExportDatabase}
                  className="px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 hover:border-neutral-500 text-xs font-bold text-neutral-200 hover:text-white transition-all flex items-center gap-1.5 active:scale-98"
                >
                  <Download size={14} className="text-blue-400" />
                  <span>Export Offline JSON</span>
                </button>

                <button
                  onClick={() => setShowImportModal(true)}
                  className="px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 hover:border-amber-500 text-xs font-bold text-neutral-200 hover:text-white transition-all flex items-center gap-1.5 active:scale-98"
                >
                  <Upload size={14} className="text-amber-400" />
                  <span>Import / Restore</span>
                </button>
              </div>
            </div>

            {/* LIVE INTEGRITY AUDIT REPORT */}
            {integrityReport && (
              <div className="p-5 rounded-3xl bg-[#11131a] border border-neutral-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-3 h-3 rounded-full ${
                      integrityReport.status === 'healthy' ? 'bg-emerald-500 shadow-md shadow-emerald-500/50 animate-pulse' : 'bg-amber-500'
                    }`} />
                    <span className="text-sm font-extrabold text-white">System Integrity & Balance Audit</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black uppercase ${
                      integrityReport.status === 'healthy' 
                        ? 'bg-emerald-500/20 text-[#00D26A] border border-emerald-500/30' 
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {integrityReport.status}
                    </span>
                  </div>
                  <span className="text-[11px] text-neutral-500 font-mono">
                    Audited at: {new Date(integrityReport.timestamp).toLocaleTimeString()} UTC
                  </span>
                </div>

                {/* Audit Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="p-3 rounded-2xl bg-neutral-900/60 border border-neutral-850">
                    <div className="text-[11px] text-neutral-400 font-medium">Total Balance</div>
                    <div className="text-sm font-black text-emerald-400 mt-1">${integrityReport.stats.totalAvailableBalance.toFixed(2)}</div>
                    <div className="text-[10px] text-neutral-500 font-mono">Liquid funds</div>
                  </div>

                  <div className="p-3 rounded-2xl bg-neutral-900/60 border border-neutral-850">
                    <div className="text-[11px] text-neutral-400 font-medium">Frozen Assets</div>
                    <div className="text-sm font-black text-blue-400 mt-1">${integrityReport.stats.totalFrozenBalance.toFixed(2)}</div>
                    <div className="text-[10px] text-neutral-500 font-mono">In tickets/withdrawals</div>
                  </div>

                  <div className="p-3 rounded-2xl bg-neutral-900/60 border border-neutral-850">
                    <div className="text-[11px] text-neutral-400 font-medium">Transactions</div>
                    <div className="text-sm font-black text-white mt-1">{integrityReport.stats.transactionsCount}</div>
                    <div className="text-[10px] text-neutral-500 font-mono">Immutable logs</div>
                  </div>

                  <div className="p-3 rounded-2xl bg-neutral-900/60 border border-neutral-850">
                    <div className="text-[11px] text-neutral-400 font-medium">Ticket Orders</div>
                    <div className="text-sm font-black text-white mt-1">{integrityReport.stats.purchasesCount}</div>
                    <div className="text-[10px] text-neutral-500 font-mono">Active & completed</div>
                  </div>

                  <div className="p-3 rounded-2xl bg-neutral-900/60 border border-neutral-850">
                    <div className="text-[11px] text-neutral-400 font-medium">Withdrawals</div>
                    <div className="text-sm font-black text-white mt-1">{integrityReport.stats.withdrawalsCount}</div>
                    <div className="text-[10px] text-neutral-500 font-mono">Audited records</div>
                  </div>

                  <div className="p-3 rounded-2xl bg-neutral-900/60 border border-neutral-850">
                    <div className="text-[11px] text-neutral-400 font-medium">SHA-256 Checksum</div>
                    <div className="text-xs font-mono font-bold text-neutral-300 truncate mt-1" title={integrityReport.checksum}>
                      {integrityReport.checksum.slice(0, 10)}...
                    </div>
                    <div className="text-[10px] text-neutral-500 font-mono">Verified integrity</div>
                  </div>
                </div>

                {/* Checkpoint list */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                  {integrityReport.integrityChecks.map((chk, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                        chk.passed
                          ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300'
                          : 'bg-red-950/30 border-red-500/30 text-red-300'
                      }`}
                    >
                      {chk.passed ? (
                        <CheckCircle2 size={16} className="text-[#00D26A] shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="font-bold text-white">{chk.name}</div>
                        <div className="text-[11px] opacity-80 mt-0.5">{chk.details}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CREATE INSTANT BACKUP SNAPSHOT */}
            <div className="p-5 rounded-3xl bg-[#11131a] border border-neutral-800 space-y-4">
              <div className="flex items-center gap-2">
                <Save size={18} className="text-[#00D26A]" />
                <h3 className="text-sm font-extrabold text-white">Create Manual VIP Safety Snapshot</h3>
              </div>
              <p className="text-xs text-neutral-400">
                Trigger a cryptographic database snapshot before deploying major code modifications, server maintenance, or database schema changes.
              </p>

              <form onSubmit={handleCreateBackup} className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  value={backupReason}
                  onChange={(e) => setBackupReason(e.target.value)}
                  placeholder="Snapshot description (e.g., Pre-deployment checkpoint, Member balance verification audit)"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-black border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#00D26A]"
                />
                <button
                  type="submit"
                  disabled={creatingBackup}
                  className="px-5 py-2.5 rounded-xl bg-[#00D26A] hover:bg-[#00e875] text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#00D26A]/20 transition-all active:scale-98 disabled:opacity-50 shrink-0"
                >
                  {creatingBackup ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                  <span>{creatingBackup ? 'Creating Snapshot...' : 'Save Snapshot Now'}</span>
                </button>
              </form>
            </div>

            {/* BACKUPS LIST & RECOVERY PANEL */}
            <div className="p-5 rounded-3xl bg-[#11131a] border border-neutral-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <History size={18} className="text-emerald-400" />
                  <h3 className="text-sm font-extrabold text-white">Continuous Automated & Manual Snapshots</h3>
                  <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 text-[10px] font-mono">
                    {backups.length} stored
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <Clock size={13} className="text-emerald-400" />
                  <span>Auto-backup daemon active (every 5 mins)</span>
                </div>
              </div>

              {loadingBackups ? (
                <div className="p-8 text-center text-neutral-400 text-xs flex items-center justify-center gap-2">
                  <RefreshCw className="animate-spin text-[#00D26A]" size={16} />
                  <span>Loading backup catalog...</span>
                </div>
              ) : backups.length === 0 ? (
                <div className="p-8 text-center text-neutral-400 text-xs rounded-2xl bg-black/40 border border-neutral-850">
                  No snapshots recorded yet. Click &quot;Save Snapshot Now&quot; to initialize your first checkpoint.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {backups.map((b) => (
                    <div
                      key={b.id}
                      className="p-4 rounded-2xl bg-black/50 border border-neutral-850 hover:border-neutral-700 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-white text-xs">{b.filename}</span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold font-mono uppercase ${
                              b.type === 'manual'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : b.type === 'pre-restore'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-emerald-500/20 text-[#00D26A] border border-emerald-500/30'
                            }`}
                          >
                            {b.type}
                          </span>
                          <span className="text-[11px] text-neutral-400 font-mono">
                            {(b.sizeBytes / 1024).toFixed(1)} KB
                          </span>
                        </div>

                        <div className="text-neutral-300 font-medium text-[11px]">{b.reason}</div>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-neutral-500 font-mono">
                          <span>Users: {b.recordCounts.users}</span>
                          <span>Txns: {b.recordCounts.transactions}</span>
                          <span>Purchases: {b.recordCounts.purchases}</span>
                          <span>Withdrawals: {b.recordCounts.withdrawals}</span>
                          <span>Checksum: {b.checksum.slice(0, 8)}...</span>
                          <span>Created: {new Date(b.createdAt).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                        <button
                          onClick={() => handleRestoreBackup(b)}
                          disabled={restoringSnapshotId === b.id}
                          className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 active:scale-98"
                        >
                          <RefreshCw size={13} className={restoringSnapshotId === b.id ? 'animate-spin' : ''} />
                          <span>{restoringSnapshotId === b.id ? 'Restoring...' : 'Restore State'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ZERO DATA LOSS GUARANTEE POLICY */}
            <div className="p-5 rounded-3xl bg-neutral-900/40 border border-neutral-800 space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                <ShieldCheck size={16} />
                <span>VIP Zero Data Loss Guarantee & Architectural Safeguards</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                All member actions (ticket purchases, unfreeze yield credits, deposits, payouts, referral joins) are written atomically to disk with SHA-256 integrity hashing and automatic pre-restore checkpoints. Even in the event of unexpected server reboots or system updates, member balances and transaction logs remain permanently intact.
              </p>
            </div>
          </div>
        )}

        {/* IMPORT DATABASE MODAL */}
        {showImportModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-[#0f1117] border border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <div className="flex items-center gap-2">
                  <Upload size={18} className="text-amber-400" />
                  <h3 className="text-base font-extrabold text-white">Import / Restore VIP Database JSON</h3>
                </div>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-white"
                >
                  <XCircle size={20} />
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5">
                <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Safety Notice:</strong> Importing will replace current active memory state. An automatic pre-restore backup snapshot will be recorded to preserve current data safely.
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1.5">Upload JSON Backup File</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileUpload}
                    className="w-full text-xs text-neutral-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-neutral-800 file:text-neutral-200 hover:file:bg-neutral-700 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1.5">Or Paste JSON Data Directly</label>
                  <textarea
                    rows={8}
                    value={importJsonText}
                    onChange={(e) => setImportJsonText(e.target.value)}
                    placeholder="Paste database JSON payload here..."
                    className="w-full p-3 rounded-2xl bg-black border border-neutral-800 text-xs text-white font-mono placeholder-neutral-600 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-800">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-neutral-900 text-neutral-300 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportDatabase}
                  disabled={importingData || !importJsonText.trim()}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {importingData ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
                  <span>{importingData ? 'Validating & Restoring...' : 'Validate & Import Database'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
