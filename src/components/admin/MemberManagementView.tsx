import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  UserCheck,
  UserX,
  ShieldAlert,
  DollarSign,
  Key,
  Edit3,
  Plus,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  Check,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Wallet,
  Phone,
  Mail,
  Award,
  AlertTriangle,
  FileText,
  Sliders,
  ChevronRight,
  TrendingUp,
  Percent,
  CheckCircle2,
  XCircle,
  Lock,
  Unlock,
  Coins,
  History,
  X
} from 'lucide-react';
import { api } from '../../services/api';
import { User, Transaction, IncomeRecord, TicketPurchase, ReferralMember, AdminMemberSummary, AdminMemberDetail } from '../../types';

interface MemberManagementViewProps {
  onRefreshOverview?: () => void;
}

export const MemberManagementView: React.FC<MemberManagementViewProps> = ({ onRefreshOverview }) => {
  const [members, setMembers] = useState<User[]>([]);
  const [summary, setSummary] = useState<AdminMemberSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ text: string; isError?: boolean } | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'frozen' | 'paused'>('all');
  const [vipFilter, setVipFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'balance_desc' | 'balance_asc' | 'created_desc' | 'created_asc' | 'vip_desc' | 'name_asc'>('balance_desc');

  // Modals & Drawers
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<AdminMemberDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [detailTab, setDetailTab] = useState<'overview' | 'transactions' | 'income' | 'tickets' | 'referrals'>('overview');

  // Balance Adjustment Modal
  const [showBalanceModal, setShowBalanceModal] = useState<boolean>(false);
  const [balanceTargetUser, setBalanceTargetUser] = useState<User | null>(null);
  const [balanceAction, setBalanceAction] = useState<'add' | 'deduct'>('add');
  const [balanceAmount, setBalanceAmount] = useState<string>('');
  const [balanceType, setBalanceType] = useState<string>('admin_recharge');
  const [balanceReason, setBalanceReason] = useState<string>('');
  const [balanceSubmitting, setBalanceSubmitting] = useState<boolean>(false);

  // Reset Password Modal
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [passwordTargetUser, setPasswordTargetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState<string>('');
  const [passwordCopied, setPasswordCopied] = useState<boolean>(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState<boolean>(false);
  const [showPlainPassword, setShowPlainPassword] = useState<boolean>(true);

  // Status & Settings Modal
  const [showStatusModal, setShowStatusModal] = useState<boolean>(false);
  const [statusTargetUser, setStatusTargetUser] = useState<User | null>(null);
  const [statusValue, setStatusValue] = useState<'active' | 'suspended' | 'frozen'>('active');
  const [isIncomePausedValue, setIsIncomePausedValue] = useState<boolean>(false);
  const [incomePauseReasonValue, setIncomePauseReasonValue] = useState<string>('');
  const [vipLevelValue, setVipLevelValue] = useState<number>(1);
  const [walletAddressValue, setWalletAddressValue] = useState<string>('');
  const [phoneValue, setPhoneValue] = useState<string>('');
  const [adminNotesValue, setAdminNotesValue] = useState<string>('');
  const [statusSubmitting, setStatusSubmitting] = useState<boolean>(false);

  // Create Member Modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newUsername, setNewUsername] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [newPhone, setNewPhone] = useState<string>('');
  const [newPass, setNewPass] = useState<string>('');
  const [newInitialBalance, setNewInitialBalance] = useState<string>('100');
  const [newVipLevel, setNewVipLevel] = useState<number>(1);
  const [newWalletAddress, setNewWalletAddress] = useState<string>('');
  const [newReferralCode, setNewReferralCode] = useState<string>('');
  const [newReferredBy, setNewReferredBy] = useState<string>('JAM888');
  const [newAdminNotes, setNewAdminNotes] = useState<string>('');
  const [createSubmitting, setCreateSubmitting] = useState<boolean>(false);

  // Copy helper
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const showToast = (text: string, isError = false) => {
    setNotification({ text, isError });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAdminMembers();
      setMembers(res.members || []);
      setSummary(res.summary || null);
    } catch (err: any) {
      setError(err.message || 'Failed to load member database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const openMemberDetail = async (user: User) => {
    setSelectedMemberId(user.id);
    setDetailLoading(true);
    setDetailTab('overview');
    try {
      const detail = await api.getAdminMemberDetail(user.id);
      setDetailData(detail);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch member details', true);
    } finally {
      setDetailLoading(false);
    }
  };

  const refreshMemberDetail = async (userId: string) => {
    try {
      const detail = await api.getAdminMemberDetail(userId);
      setDetailData(detail);
    } catch (err) {
      console.error(err);
    }
  };

  // Open Balance Modal
  const openBalanceModal = (user: User, defaultAction: 'add' | 'deduct' = 'add') => {
    setBalanceTargetUser(user);
    setBalanceAction(defaultAction);
    setBalanceAmount('');
    setBalanceType(defaultAction === 'add' ? 'admin_recharge' : 'admin_deduction');
    setBalanceReason(defaultAction === 'add' ? 'VIP Platform Bonus / Administrative Credit' : 'Administrative Correction / Audit Deduction');
    setShowBalanceModal(true);
  };

  // Handle Balance Adjustment
  const handleBalanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!balanceTargetUser) return;
    const amount = parseFloat(balanceAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast('Please enter a valid amount greater than 0', true);
      return;
    }

    if (balanceAction === 'deduct' && amount > balanceTargetUser.balance) {
      showToast(`User only has $${balanceTargetUser.balance.toFixed(2)} available. Cannot deduct $${amount.toFixed(2)}`, true);
      return;
    }

    setBalanceSubmitting(true);
    try {
      const res = await api.adjustMemberBalance(balanceTargetUser.id, {
        action: balanceAction,
        amount,
        type: balanceType,
        reason: balanceReason,
        adminOperator: 'SuperAdmin'
      });

      showToast(res.message);
      setShowBalanceModal(false);
      loadMembers();
      if (selectedMemberId === balanceTargetUser.id) {
        refreshMemberDetail(balanceTargetUser.id);
      }
      if (onRefreshOverview) onRefreshOverview();
    } catch (err: any) {
      showToast(err.message || 'Failed to adjust balance', true);
    } finally {
      setBalanceSubmitting(false);
    }
  };

  // Open Reset Password Modal
  const openPasswordModal = (user: User) => {
    setPasswordTargetUser(user);
    const suggestedPass = `${user.username}#${Math.floor(1000 + Math.random() * 9000)}!`;
    setNewPassword(suggestedPass);
    setShowPasswordModal(true);
    setPasswordCopied(false);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordTargetUser) return;
    if (!newPassword || newPassword.trim().length < 6) {
      showToast('Password must be at least 6 characters long', true);
      return;
    }

    setPasswordSubmitting(true);
    try {
      const res = await api.resetMemberPassword(passwordTargetUser.id, {
        newPassword: newPassword.trim()
      });
      showToast(res.message);
      setShowPasswordModal(false);
      loadMembers();
      if (selectedMemberId === passwordTargetUser.id) {
        refreshMemberDetail(passwordTargetUser.id);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to reset password', true);
    } finally {
      setPasswordSubmitting(false);
    }
  };

  // Open Status Modal
  const openStatusModal = (user: User) => {
    setStatusTargetUser(user);
    setStatusValue(user.status || 'active');
    setIsIncomePausedValue(Boolean(user.isIncomePaused));
    setIncomePauseReasonValue(user.incomePauseReason || 'Minimum $30.00 Account Balance Required to Work and Earn VIP Yield');
    setVipLevelValue(user.vipLevel || 1);
    setWalletAddressValue(user.walletAddress || '');
    setPhoneValue(user.phone || '');
    setAdminNotesValue(user.adminNotes || '');
    setShowStatusModal(true);
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusTargetUser) return;

    setStatusSubmitting(true);
    try {
      const res = await api.updateMemberStatus(statusTargetUser.id, {
        status: statusValue,
        isIncomePaused: isIncomePausedValue,
        incomePauseReason: isIncomePausedValue ? incomePauseReasonValue : undefined,
        vipLevel: vipLevelValue,
        walletAddress: walletAddressValue,
        phone: phoneValue,
        adminNotes: adminNotesValue
      });

      showToast(res.message);
      setShowStatusModal(false);
      loadMembers();
      if (selectedMemberId === statusTargetUser.id) {
        refreshMemberDetail(statusTargetUser.id);
      }
      if (onRefreshOverview) onRefreshOverview();
    } catch (err: any) {
      showToast(err.message || 'Failed to update member settings', true);
    } finally {
      setStatusSubmitting(false);
    }
  };

  // Open Create Member Modal
  const openCreateModal = () => {
    setNewUsername('');
    setNewEmail('');
    setNewPhone('');
    setNewPass(`Vip#${Math.floor(100000 + Math.random() * 900000)}`);
    setNewInitialBalance('100');
    setNewVipLevel(1);
    setNewWalletAddress('');
    setNewReferralCode(`JB${Math.floor(100000 + Math.random() * 900000)}`);
    setNewReferredBy('JAM888');
    setNewAdminNotes('');
    setShowCreateModal(true);
  };

  const handleCreateMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) {
      showToast('Please enter a username', true);
      return;
    }

    setCreateSubmitting(true);
    try {
      const res = await api.createAdminMember({
        username: newUsername.trim(),
        email: newEmail.trim() || undefined,
        phone: newPhone.trim() || undefined,
        password: newPass.trim(),
        initialBalance: parseFloat(newInitialBalance) || 0,
        vipLevel: newVipLevel,
        walletAddress: newWalletAddress.trim() || undefined,
        referralCode: newReferralCode.trim() || undefined,
        referredBy: newReferredBy.trim() || undefined,
        adminNotes: newAdminNotes.trim() || undefined
      });

      showToast(res.message);
      setShowCreateModal(false);
      loadMembers();
      if (onRefreshOverview) onRefreshOverview();
    } catch (err: any) {
      showToast(err.message || 'Failed to create member', true);
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Filter and sort members
  const filteredMembers = members.filter(m => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = m.username?.toLowerCase().includes(q);
      const matchEmail = m.email?.toLowerCase().includes(q);
      const matchId = m.id?.toLowerCase().includes(q);
      const matchPhone = m.phone?.toLowerCase().includes(q);
      const matchWallet = m.walletAddress?.toLowerCase().includes(q);
      const matchRef = m.referralCode?.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchId && !matchPhone && !matchWallet && !matchRef) {
        return false;
      }
    }

    // Status filter
    if (statusFilter === 'active') {
      if (m.status === 'suspended' || m.status === 'frozen') return false;
    } else if (statusFilter === 'suspended') {
      if (m.status !== 'suspended') return false;
    } else if (statusFilter === 'frozen') {
      if (m.status !== 'frozen' && (m.frozenBalance || 0) <= 0) return false;
    } else if (statusFilter === 'paused') {
      if (!m.isIncomePaused) return false;
    }

    // VIP filter
    if (vipFilter !== 'all') {
      if (String(m.vipLevel || 1) !== vipFilter) return false;
    }

    return true;
  });

  // Sort
  filteredMembers.sort((a, b) => {
    if (sortBy === 'balance_desc') return (b.balance || 0) - (a.balance || 0);
    if (sortBy === 'balance_asc') return (a.balance || 0) - (b.balance || 0);
    if (sortBy === 'created_desc') return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    if (sortBy === 'created_asc') return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    if (sortBy === 'vip_desc') return (b.vipLevel || 1) - (a.vipLevel || 1);
    if (sortBy === 'name_asc') return (a.username || '').localeCompare(b.username || '');
    return 0;
  });

  return (
    <div className="space-y-6" id="member-management-view">
      {/* Toast Notification */}
      {notification && (
        <div
          id="member-toast-notification"
          className={`p-4 rounded-xl flex items-center justify-between text-sm shadow-xl border animate-in fade-in slide-in-from-top-2 duration-200 ${
            notification.isError
              ? 'bg-rose-950/90 border-rose-600/50 text-rose-200'
              : 'bg-emerald-950/90 border-emerald-600/50 text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {notification.isError ? <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
            <span className="font-medium">{notification.text}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-white transition-colors ml-4 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header & Key Metrics */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-7 h-7 text-amber-400" />
            <h2 className="text-2xl font-bold text-white tracking-tight">Member Management System</h2>
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs px-2.5 py-0.5 rounded-full font-medium">
              Multi-Account Control
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Individually manage registered members, inspect balances & activity, execute secure password resets, and adjust funds with full transparent ledger tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="btn-refresh-members"
            onClick={loadMembers}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            id="btn-add-new-member"
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-sm font-semibold transition-all shadow-md shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Create Member</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="member-summary-kpis">
        {/* Total Registered Members */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users className="w-16 h-16 text-blue-400" />
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Registered</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
              {summary?.totalRegistered ?? members.length}
            </span>
            <span className="text-xs text-blue-400 font-medium">Individual Accounts</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Full database registered users</p>
        </div>

        {/* Total Active Members */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <UserCheck className="w-16 h-16 text-emerald-400" />
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Members</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl lg:text-3xl font-bold text-emerald-400 tracking-tight">
              {summary?.totalActive ?? members.filter(m => m.status !== 'suspended' && (m.balance > 0 || !m.isIncomePaused)).length}
            </span>
            <div className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Working</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1">Earning VIP yields & active</p>
        </div>

        {/* Total Platform Balance */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign className="w-16 h-16 text-amber-400" />
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Platform Available Funds</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl lg:text-3xl font-bold text-amber-400 tracking-tight">
              {(summary?.totalPlatformBalance ?? members.reduce((sum, m) => sum + (m.balance || 0), 0)).toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 font-medium">ETB</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Cumulative member balances</p>
        </div>

        {/* Total Platform Total Assets */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Wallet className="w-16 h-16 text-purple-400" />
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Platform Assets</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl lg:text-3xl font-bold text-purple-400 tracking-tight">
              {(summary?.totalPlatformAssets ?? members.reduce((sum, m) => sum + (m.totalAssets || (m.balance + m.frozenBalance) || 0), 0)).toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 font-medium">ETB</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Including ticket locks & pending</p>
        </div>
      </div>

      {/* VIP Tier Badges Distribution */}
      {summary?.vipDistribution && (
        <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-2xl flex flex-wrap items-center gap-3 text-xs">
          <span className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-400" />
            VIP Tier Distribution:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-slate-800/90 text-slate-200 border border-slate-700 px-2.5 py-1 rounded-lg">
              VIP 1: <strong className="text-amber-400 font-bold ml-1">{summary.vipDistribution.vip1}</strong>
            </span>
            <span className="bg-slate-800/90 text-slate-200 border border-slate-700 px-2.5 py-1 rounded-lg">
              VIP 2: <strong className="text-amber-400 font-bold ml-1">{summary.vipDistribution.vip2}</strong>
            </span>
            <span className="bg-slate-800/90 text-slate-200 border border-slate-700 px-2.5 py-1 rounded-lg">
              VIP 3: <strong className="text-amber-400 font-bold ml-1">{summary.vipDistribution.vip3}</strong>
            </span>
            <span className="bg-slate-800/90 text-slate-200 border border-slate-700 px-2.5 py-1 rounded-lg">
              VIP 4: <strong className="text-amber-400 font-bold ml-1">{summary.vipDistribution.vip4}</strong>
            </span>
            <span className="bg-slate-800/90 text-slate-200 border border-slate-700 px-2.5 py-1 rounded-lg">
              VIP 5: <strong className="text-amber-400 font-bold ml-1">{summary.vipDistribution.vip5}</strong>
            </span>
            {summary.vipDistribution.vip6 > 0 && (
              <span className="bg-slate-800/90 text-slate-200 border border-slate-700 px-2.5 py-1 rounded-lg">
                VIP 6: <strong className="text-amber-400 font-bold ml-1">{summary.vipDistribution.vip6}</strong>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Search, Filter & Controls Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between shadow-sm">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="member-search-input"
            type="text"
            placeholder="Search by username, email, phone, user ID, wallet, or referral code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status filter */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-700 px-3 py-1.5 rounded-xl text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              id="member-filter-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-white">All Statuses</option>
              <option value="active" className="bg-slate-900 text-white">Active Only</option>
              <option value="paused" className="bg-slate-900 text-white">Income Paused (&lt;2,000 ETB)</option>
              <option value="suspended" className="bg-slate-900 text-white">Suspended</option>
              <option value="frozen" className="bg-slate-900 text-white">Frozen</option>
            </select>
          </div>

          {/* VIP filter */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-700 px-3 py-1.5 rounded-xl text-xs">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <select
              id="member-filter-vip"
              value={vipFilter}
              onChange={(e) => setVipFilter(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-white">All VIP Tiers</option>
              <option value="1" className="bg-slate-900 text-white">VIP 1</option>
              <option value="2" className="bg-slate-900 text-white">VIP 2</option>
              <option value="3" className="bg-slate-900 text-white">VIP 3</option>
              <option value="4" className="bg-slate-900 text-white">VIP 4</option>
              <option value="5" className="bg-slate-900 text-white">VIP 5</option>
              <option value="6" className="bg-slate-900 text-white">VIP 6</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-700 px-3 py-1.5 rounded-xl text-xs">
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <select
              id="member-sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="balance_desc" className="bg-slate-900 text-white">Balance: High to Low</option>
              <option value="balance_asc" className="bg-slate-900 text-white">Balance: Low to High</option>
              <option value="created_desc" className="bg-slate-900 text-white">Registered: Newest First</option>
              <option value="created_asc" className="bg-slate-900 text-white">Registered: Oldest First</option>
              <option value="vip_desc" className="bg-slate-900 text-white">VIP Tier: Highest First</option>
              <option value="name_asc" className="bg-slate-900 text-white">Username: A-Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Individual Members Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-sm" id="members-list-table-container">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white text-sm">Individual Member Roster</span>
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
              Showing {filteredMembers.length} of {members.length} members
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-400 mb-3" />
            <p className="text-sm">Loading member accounts and live state...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <UserX className="w-12 h-12 mx-auto text-slate-600 mb-3" />
            <h4 className="text-base font-semibold text-slate-200">No Members Found</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No registered members match your active search and filter criteria. Try clearing search filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Member / ID</th>
                  <th className="py-3 px-4">VIP Level</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4 text-right">Available Balance</th>
                  <th className="py-3 px-4 text-right">Total Assets</th>
                  <th className="py-3 px-4">Referrals / Team</th>
                  <th className="py-3 px-4">Last Activity</th>
                  <th className="py-3 px-4 text-center">Management Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredMembers.map((member) => {
                  const isSuspended = member.status === 'suspended';
                  const isFrozen = member.status === 'frozen';
                  const isPaused = member.isIncomePaused;

                  return (
                    <tr
                      key={member.id}
                      id={`member-row-${member.id}`}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Member Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={member.avatar || 'https://images.unsplash.com/photo-1535713875002?w=400&auto=format&fit=crop&q=80'}
                            alt={member.username}
                            className="w-9 h-9 rounded-full object-cover border border-slate-700 bg-slate-800 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-white text-sm group-hover:text-amber-400 transition-colors">
                                {member.username}
                              </span>
                              {member.isAdmin && (
                                <span className="bg-amber-500/20 text-amber-300 text-[10px] px-1.5 py-0.5 rounded font-mono">
                                  ADMIN
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-slate-400 text-[11px] mt-0.5 font-mono">
                              <span>{member.id}</span>
                              <span>•</span>
                              <span>{member.phone || member.email || 'No contact'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* VIP Level */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded-lg text-xs font-semibold">
                          <Award className="w-3 h-3 text-amber-400" />
                          VIP {member.vipLevel || 1}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {isSuspended ? (
                            <span className="inline-flex items-center gap-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                              <XCircle className="w-3 h-3" />
                              Suspended
                            </span>
                          ) : isFrozen ? (
                            <span className="inline-flex items-center gap-1 bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                              <Lock className="w-3 h-3" />
                              Frozen
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Active
                            </span>
                          )}

                          {isPaused && (
                            <div className="flex items-center gap-1 text-[10px] text-amber-400 font-normal">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              <span>Income Paused (&lt;$30)</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Available Balance */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-bold text-sm text-emerald-400 font-mono">
                          ${(member.balance || 0).toFixed(2)}
                        </div>
                        {(member.frozenBalance || 0) > 0 && (
                          <div className="text-[10px] text-purple-400 font-mono">
                            +{member.frozenBalance.toLocaleString()} ETB lock
                          </div>
                        )}
                      </td>

                      {/* Total Assets */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-bold text-sm text-white font-mono">
                          {(member.totalAssets ?? ((member.balance || 0) + (member.frozenBalance || 0))).toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          ETB
                        </div>
                      </td>

                      {/* Referral / Team */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-300">
                          <span className="font-mono text-amber-300 font-semibold">{member.referralCode || 'N/A'}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Direct: <strong className="text-slate-200">{member.validDirectMembersCount || 0}</strong> • Team: <strong className="text-slate-200">{member.totalTeamMembersCount || 0}</strong>
                        </div>
                      </td>

                      {/* Last Activity */}
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        <div>{member.lastActiveAt ? new Date(member.lastActiveAt).toLocaleDateString() : 'Recent'}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Reg: {new Date(member.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      {/* Management Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* View Detail Drawer */}
                          <button
                            id={`btn-view-member-${member.id}`}
                            onClick={() => openMemberDetail(member)}
                            title="Inspect Member Details & History"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 border border-slate-700 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Add / Deduct Balance */}
                          <button
                            id={`btn-adjust-balance-${member.id}`}
                            onClick={() => openBalanceModal(member, 'add')}
                            title="Adjust Balance (Add or Deduct Funds)"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 border border-slate-700 transition-colors"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                          </button>

                          {/* Reset Password */}
                          <button
                            id={`btn-reset-password-${member.id}`}
                            onClick={() => openPasswordModal(member)}
                            title="Reset Member Password"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 border border-slate-700 transition-colors"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>

                          {/* Manage Status */}
                          <button
                            id={`btn-manage-status-${member.id}`}
                            onClick={() => openStatusModal(member)}
                            title="Manage Account Status & VIP Tier"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-400 hover:text-purple-300 border border-slate-700 transition-colors"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MEMBER DETAIL DRAWER / MODAL WITH FULL LEDGER HISTORY & AUDIT */}
      {/* ========================================================================= */}
      {selectedMemberId && detailData && (
        <div
          id="member-detail-modal-overlay"
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
        >
          <div
            id="member-detail-modal-content"
            className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
              <div className="flex items-center gap-3">
                <img
                  src={detailData.user.avatar || 'https://images.unsplash.com/photo-1535713875002?w=400&auto=format&fit=crop&q=80'}
                  alt={detailData.user.username}
                  className="w-12 h-12 rounded-full object-cover border border-amber-500/40 bg-slate-800"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">{detailData.user.username}</h3>
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs px-2 py-0.5 rounded-full font-semibold">
                      VIP {detailData.user.vipLevel || 1}
                    </span>
                    {detailData.user.status === 'suspended' ? (
                      <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs px-2 py-0.5 rounded-full">
                        Suspended
                      </span>
                    ) : (
                      <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    User ID: {detailData.user.id} • Ref Code: <strong className="text-amber-400">{detailData.user.referralCode}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openBalanceModal(detailData.user, 'add')}
                  className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-semibold hover:bg-emerald-500/30 transition-colors flex items-center gap-1"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Adjust Funds</span>
                </button>
                <button
                  onClick={() => openPasswordModal(detailData.user)}
                  className="px-3 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-semibold hover:bg-amber-500/30 transition-colors flex items-center gap-1"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Reset Pass</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedMemberId(null);
                    setDetailData(null);
                  }}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Sub Navigation Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-950/40 px-4 gap-2 text-xs font-semibold shrink-0">
              <button
                onClick={() => setDetailTab('overview')}
                className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                  detailTab === 'overview'
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Account Overview</span>
              </button>
              <button
                onClick={() => setDetailTab('transactions')}
                className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                  detailTab === 'transactions'
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Transaction & Audit Ledger ({detailData.transactions.length})</span>
              </button>
              <button
                onClick={() => setDetailTab('income')}
                className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                  detailTab === 'income'
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>VIP Yield Records ({detailData.incomeRecords.length})</span>
              </button>
              <button
                onClick={() => setDetailTab('tickets')}
                className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                  detailTab === 'tickets'
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Ticket Orders ({detailData.purchases.length})</span>
              </button>
              <button
                onClick={() => setDetailTab('referrals')}
                className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                  detailTab === 'referrals'
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Team Subordinates ({detailData.referrals.length})</span>
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
              {detailTab === 'overview' && (
                <div className="space-y-6">
                  {/* Financial Balance Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl">
                      <p className="text-[11px] text-slate-400 uppercase font-semibold">Available Balance</p>
                      <p className="text-xl font-bold text-emerald-400 font-mono mt-1">
                        ${(detailData.user.balance || 0).toFixed(2)}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Ready for trading & withdrawal</p>
                    </div>

                    <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl">
                      <p className="text-[11px] text-slate-400 uppercase font-semibold">Frozen Balance</p>
                      <p className="text-xl font-bold text-purple-400 font-mono mt-1">
                        ${(detailData.user.frozenBalance || 0).toFixed(2)}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">In 2-min tickets or pending wd</p>
                    </div>

                    <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl">
                      <p className="text-[11px] text-slate-400 uppercase font-semibold">Total Assets</p>
                      <p className="text-xl font-bold text-white font-mono mt-1">
                        ${((detailData.user.balance || 0) + (detailData.user.frozenBalance || 0)).toFixed(2)}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Cumulative account worth</p>
                    </div>

                    <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl">
                      <p className="text-[11px] text-slate-400 uppercase font-semibold">All-Time VIP Profit</p>
                      <p className="text-xl font-bold text-amber-400 font-mono mt-1">
                        +${(detailData.user.totalVipProfit || 0).toFixed(2)}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Cumulative VIP yields earned</p>
                    </div>
                  </div>

                  {/* Account Information Table */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                    <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                      Profile & Credentials Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Email Address:</span>
                        <span className="font-medium text-white">{detailData.user.email || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Phone Number:</span>
                        <span className="font-medium text-white">{detailData.user.phone || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Bank Account / Details:</span>
                        <span className="font-mono text-amber-300 font-medium truncate max-w-[200px]" title={detailData.user.walletAddress}>
                          {detailData.user.walletAddress || 'Commercial Bank of Ethiopia'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Currency:</span>
                        <span className="font-medium text-emerald-400 font-bold">ETB (Ethiopian Birr)</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Current Password (Admin Reference):</span>
                        <span className="font-mono text-emerald-400 font-bold">
                          {detailData.user.passwordHint || 'Encrypted / Managed'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Referred By Code:</span>
                        <span className="font-mono text-slate-200">{detailData.user.referredBy || 'None (Direct Platform)'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Income Pause Status:</span>
                        <span className={detailData.user.isIncomePaused ? 'text-amber-400 font-semibold' : 'text-emerald-400'}>
                          {detailData.user.isIncomePaused ? 'PAUSED' : 'ACTIVE'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Registered On:</span>
                        <span className="text-slate-300">{new Date(detailData.user.createdAt).toLocaleString()}</span>
                      </div>
                    </div>

                    {detailData.user.adminNotes && (
                      <div className="mt-4 p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs">
                        <span className="text-slate-400 font-semibold block mb-1">Admin Audit Notes:</span>
                        <p className="text-slate-300 italic">{detailData.user.adminNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Transactions Ledger */}
              {detailTab === 'transactions' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Showing transparent financial transactions for {detailData.user.username}</span>
                    <span className="font-mono">{detailData.transactions.length} Total Records</span>
                  </div>

                  {detailData.transactions.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">
                      No transaction history found for this member.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
                      {detailData.transactions.map((tx) => {
                        const isAdminAction = tx.adminAction || tx.category === 'admin_credit' || tx.category === 'admin_debit' || tx.id.includes('TXN-ADM');
                        const isCredit = tx.type === 'deposit' || tx.type === 'vip_profit' || tx.type === 'team_commission' || tx.adminAction === 'credit';

                        return (
                          <div
                            key={tx.id}
                            className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              isAdminAction
                                ? isCredit
                                  ? 'bg-emerald-950/30 border-emerald-800/50'
                                  : 'bg-rose-950/30 border-rose-800/50'
                                : 'bg-slate-950/60 border-slate-800'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                                  isCredit ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                                }`}
                              >
                                {isCredit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-white">{tx.title}</span>
                                  {isAdminAction && (
                                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] px-1.5 py-0.2 rounded font-semibold">
                                      ADMIN ACTION
                                    </span>
                                  )}
                                  <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-mono">
                                    {tx.category || tx.type}
                                  </span>
                                </div>
                                <p className="text-slate-400 text-[11px] mt-0.5">{tx.description}</p>
                                <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono mt-1">
                                  <span>ID: {tx.id}</span>
                                  <span>•</span>
                                  <span>{new Date(tx.createdAt).toLocaleString()}</span>
                                  {tx.adminOperator && <span>• Admin: {tx.adminOperator}</span>}
                                </div>
                              </div>
                            </div>

                            <div className="text-right sm:shrink-0">
                              <div
                                className={`font-bold font-mono text-sm ${
                                  isCredit ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                {isCredit ? '+' : '-'}{tx.amount.toLocaleString()} ETB
                              </div>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                                  tx.status === 'completed'
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : tx.status === 'pending'
                                    ? 'bg-amber-500/20 text-amber-300'
                                    : 'bg-rose-500/20 text-rose-300'
                                }`}
                              >
                                {tx.status}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* VIP Yield Records */}
              {detailTab === 'income' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>VIP Yield & Profit Ledger for {detailData.user.username}</span>
                    <span className="font-mono">{detailData.incomeRecords.length} Records</span>
                  </div>

                  {detailData.incomeRecords.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">
                      No VIP profit records accumulated yet.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
                      {detailData.incomeRecords.map((inc) => (
                        <div
                          key={inc.id}
                          className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs flex items-center justify-between"
                        >
                          <div>
                            <div className="font-semibold text-white flex items-center gap-2">
                              <span>{inc.ticketName}</span>
                              <span className="bg-amber-500/20 text-amber-300 text-[10px] px-1.5 py-0.2 rounded font-mono">
                                VIP {inc.vipLevel} ({(inc.dailyRate * 100).toFixed(1)}%)
                              </span>
                            </div>
                            <p className="text-slate-400 text-[11px] mt-0.5">{inc.notes || 'VIP Yield credited'}</p>
                            <p className="text-[10px] text-slate-500 font-mono mt-1">
                              TX: {inc.transactionId} • {new Date(inc.timestamp).toLocaleString()}
                            </p>
                          </div>

                          <div className="text-right">
                            <div className="font-bold text-amber-400 font-mono text-sm">
                              +{inc.incomeAmount.toLocaleString()} ETB
                            </div>
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-semibold uppercase">
                              {inc.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tickets Purchased */}
              {detailTab === 'tickets' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Ticket Purchases & Active Locks for {detailData.user.username}</span>
                    <span className="font-mono">{detailData.purchases.length} Orders</span>
                  </div>

                  {detailData.purchases.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">
                      No ticket purchase records found.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
                      {detailData.purchases.map((p) => (
                        <div
                          key={p.id}
                          className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs flex items-center justify-between"
                        >
                          <div>
                            <div className="font-semibold text-white flex items-center gap-2">
                              <span>{p.ticketName}</span>
                              <span className="text-slate-400">x{p.quantity}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              Principal: <strong>${p.totalAmount.toFixed(2)}</strong> • Profit Yield: <strong className="text-amber-400">+${p.profitAmount.toFixed(2)}</strong>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono mt-1">
                              Order #{p.id} • Purchased: {new Date(p.purchasedAt).toLocaleString()}
                            </div>
                          </div>

                          <div className="text-right">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                                p.status === 'completed'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : p.status === 'frozen'
                                  ? 'bg-purple-500/20 text-purple-300'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {p.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Referrals */}
              {detailTab === 'referrals' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Direct and subordinate members referred by {detailData.user.username}</span>
                    <span className="font-mono">{detailData.referrals.length} Subordinates</span>
                  </div>

                  {detailData.referrals.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">
                      No referred subordinates registered under this member's link yet.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
                      {detailData.referrals.map((r) => (
                        <div
                          key={r.id}
                          className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={r.avatar || 'https://images.unsplash.com/photo-1535713875002?w=400&auto=format&fit=crop&q=80'}
                              alt={r.username}
                              className="w-8 h-8 rounded-full object-cover border border-slate-700 bg-slate-800"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <div className="font-semibold text-white flex items-center gap-1.5">
                                <span>{r.username}</span>
                                <span className="bg-blue-500/20 text-blue-300 text-[10px] px-1.5 py-0.2 rounded font-mono">
                                  Tier {r.level}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400">{r.email}</p>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="font-mono text-emerald-400 font-semibold">
                              {r.balance.toLocaleString()} ETB
                            </div>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                r.isValid ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                              }`}
                            >
                              {r.isValid ? 'Valid Member' : 'Pending Min Deposit'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500">
                All admin modifications are logged with permanent timestamp verification.
              </span>
              <button
                onClick={() => {
                  setSelectedMemberId(null);
                  setDetailData(null);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BALANCE ADJUSTMENT MODAL (Add / Deduct Funds with Full Ledger Transparency) */}
      {/* ========================================================================= */}
      {showBalanceModal && balanceTargetUser && (
        <div
          id="balance-adjustment-modal"
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-xl ${
                    balanceAction === 'add' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Adjust Member Balance</h3>
                  <p className="text-xs text-slate-400">Target: <strong className="text-amber-400">{balanceTargetUser.username}</strong></p>
                </div>
              </div>
              <button
                onClick={() => setShowBalanceModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBalanceSubmit} className="p-5 space-y-4 text-xs">
              {/* Action Toggle (Add vs Deduct) */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Action Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setBalanceAction('add');
                      setBalanceType('admin_recharge');
                    }}
                    className={`py-2.5 px-3 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      balanceAction === 'add'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 border border-emerald-500'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Credit / Add Balance</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setBalanceAction('deduct');
                      setBalanceType('admin_deduction');
                    }}
                    className={`py-2.5 px-3 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      balanceAction === 'deduct'
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 border border-rose-500'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>Debit / Deduct Balance</span>
                  </button>
                </div>
              </div>

              {/* Current Balances Reference */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[11px]">Current Available Balance</span>
                  <span className="text-emerald-400 font-bold text-sm font-mono">
                    {(balanceTargetUser.balance || 0).toLocaleString()} ETB
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[11px]">Total Assets</span>
                  <span className="text-white font-bold text-sm font-mono">
                    {(balanceTargetUser.totalAssets ?? (balanceTargetUser.balance + balanceTargetUser.frozenBalance)).toLocaleString()} ETB
                  </span>
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Adjustment Amount (ETB)</label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="e.g. 50.00"
                    value={balanceAmount}
                    onChange={(e) => setBalanceAmount(e.target.value)}
                    required
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-slate-500 text-[10px]">Presets:</span>
                  {[10, 30, 50, 100, 500].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setBalanceAmount(String(amt))}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-mono text-[10px]"
                    >
                      +${amt}
                    </button>
                  ))}
                  {balanceAction === 'deduct' && (
                    <button
                      type="button"
                      onClick={() => setBalanceAmount(String(balanceTargetUser.balance))}
                      className="px-2 py-0.5 bg-rose-900/50 hover:bg-rose-800 text-rose-300 rounded font-mono text-[10px]"
                    >
                      Max Available
                    </button>
                  )}
                </div>
              </div>

              {/* Category / Adjustment Type */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Adjustment Category</label>
                <select
                  value={balanceType}
                  onChange={(e) => setBalanceType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  {balanceAction === 'add' ? (
                    <>
                      <option value="admin_recharge">Manual Recharge Credit (Verified External Payment)</option>
                      <option value="bonus">VIP Promotional / Signup Bonus</option>
                      <option value="compensation">System Maintenance Compensation</option>
                      <option value="promoter_incentive">Top Team Promoter Incentive</option>
                    </>
                  ) : (
                    <>
                      <option value="admin_deduction">Administrative Balance Correction</option>
                      <option value="penalty">Rule Violation / Reversal Debit</option>
                      <option value="duplicate_refund">Duplicate Transaction Reversal</option>
                    </>
                  )}
                </select>
              </div>

              {/* Audit Reason */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Audit Reason / Description (Saved to Member's Transparent Ledger)
                </label>
                <textarea
                  rows={2}
                  value={balanceReason}
                  onChange={(e) => setBalanceReason(e.target.value)}
                  placeholder="Explain why this balance adjustment was authorized..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Projected Result Preview */}
              {parseFloat(balanceAmount) > 0 && (
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Projected New Balance:</span>
                    <span className="font-bold text-amber-400 font-mono">
                      {balanceAction === 'add'
                        ? (balanceTargetUser.balance + parseFloat(balanceAmount)).toLocaleString()
                        : Math.max(0, balanceTargetUser.balance - parseFloat(balanceAmount)).toLocaleString()}{' '}
                      ETB
                    </span>
                  </div>
                  <p className="text-slate-500 text-[10px]">
                    This action will immediately insert a new transaction into the member's history ledger.
                  </p>
                </div>
              )}

              {/* Form Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowBalanceModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={balanceSubmitting}
                  className={`px-5 py-2 rounded-xl font-semibold text-slate-950 shadow-md transition-all ${
                    balanceAction === 'add'
                      ? 'bg-emerald-400 hover:bg-emerald-300 shadow-emerald-500/20'
                      : 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
                  }`}
                >
                  {balanceSubmitting ? 'Recording Ledger...' : `Confirm ${balanceAction === 'add' ? 'Credit' : 'Debit'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RESET PASSWORD MODAL */}
      {/* ========================================================================= */}
      {showPasswordModal && passwordTargetUser && (
        <div
          id="reset-password-modal"
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Reset Member Password</h3>
                  <p className="text-xs text-slate-400">Member: <strong className="text-amber-400">{passwordTargetUser.username}</strong></p>
                </div>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="p-5 space-y-4 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-400 text-[11px]">Current Password (Reference):</span>
                  <span className="font-mono text-slate-200 font-bold">
                    {passwordTargetUser.passwordHint || 'N/A'}
                  </span>
                </div>
                <p className="text-slate-500 text-[10px]">
                  Admin can securely overwrite member password in real-time.
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    type={showPlainPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full pl-3 pr-20 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-amber-300 font-mono text-sm focus:outline-none focus:border-amber-500"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowPlainPassword(!showPlainPassword)}
                      className="p-1.5 text-slate-400 hover:text-slate-200"
                    >
                      {showPlainPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(newPassword);
                        setPasswordCopied(true);
                        setTimeout(() => setPasswordCopied(false), 2000);
                      }}
                      className="p-1.5 text-slate-400 hover:text-amber-400"
                      title="Copy new password"
                    >
                      {passwordCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const gen = `${passwordTargetUser.username}#${Math.floor(100000 + Math.random() * 900000)}!`;
                      setNewPassword(gen);
                    }}
                    className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Generate Strong Password</span>
                  </button>
                  {passwordCopied && <span className="text-[10px] text-emerald-400">Copied to clipboard!</span>}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordSubmitting}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-semibold shadow-md shadow-amber-500/20"
                >
                  {passwordSubmitting ? 'Saving...' : 'Apply Password Reset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MANAGE STATUS & SETTINGS MODAL */}
      {/* ========================================================================= */}
      {showStatusModal && statusTargetUser && (
        <div
          id="manage-status-modal"
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Manage Member Account Status</h3>
                  <p className="text-xs text-slate-400">Target: <strong className="text-amber-400">{statusTargetUser.username}</strong></p>
                </div>
              </div>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStatusSubmit} className="p-5 space-y-4 text-xs">
              {/* Account Status Select */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Account Status</label>
                <select
                  value={statusValue}
                  onChange={(e) => setStatusValue(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="active">Active (Normal Access, Allowed to login & claim earnings)</option>
                  <option value="suspended">Suspended (Login blocked, all functions restricted)</option>
                  <option value="frozen">Frozen (Account locked for security / audit review)</option>
                </select>
              </div>

              {/* VIP Level Override */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">VIP Tier Level</label>
                <select
                  value={vipLevelValue}
                  onChange={(e) => setVipLevelValue(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-amber-300 font-semibold focus:outline-none focus:border-amber-500"
                >
                  <option value="1">VIP 1 (1.90% Daily Profit, 2,000 – 49,999 ETB)</option>
                  <option value="2">VIP 2 (2.20% Daily Profit, 50,000 – 199,999 ETB, 3 Direct)</option>
                  <option value="3">VIP 3 (3.00% Daily Profit, 200,000 – 499,999 ETB, 10 Direct)</option>
                  <option value="4">VIP 4 (4.00% Daily Profit, 500,000 – 1,999,999 ETB, 20 Direct)</option>
                  <option value="5">VIP 5 (5.00% Daily Profit, 2,000,000 – 5,000,000 ETB, 50 Direct)</option>
                </select>
              </div>

              {/* Income Pause Switch */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-200 block">Daily Yield Generation</span>
                    <span className="text-[11px] text-slate-400">Control if member can work tasks & earn VIP profits</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsIncomePausedValue(!isIncomePausedValue)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                      isIncomePausedValue
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {isIncomePausedValue ? 'INCOME PAUSED' : 'INCOME ACTIVE'}
                  </button>
                </div>

                {isIncomePausedValue && (
                  <div>
                    <label className="block text-slate-400 text-[10px] font-medium mb-1">Reason for Pause:</label>
                    <input
                      type="text"
                      value={incomePauseReasonValue}
                      onChange={(e) => setIncomePauseReasonValue(e.target.value)}
                      placeholder="Minimum $30.00 Account Balance Required..."
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Contact & Bank Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Bank Account / Details</label>
                  <input
                    type="text"
                    value={walletAddressValue}
                    onChange={(e) => setWalletAddressValue(e.target.value)}
                    placeholder="e.g. CBE 1000..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phoneValue}
                    onChange={(e) => setPhoneValue(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-xs"
                  />
                </div>
              </div>

              {/* Admin Internal Notes */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Admin Internal Notes</label>
                <textarea
                  rows={2}
                  value={adminNotesValue}
                  onChange={(e) => setAdminNotesValue(e.target.value)}
                  placeholder="Record operational details, special VIP approvals, or verification status..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={statusSubmitting}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold shadow-md shadow-purple-600/20"
                >
                  {statusSubmitting ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CREATE NEW MEMBER MODAL */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div
          id="create-member-modal"
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Create Registered Member Account</h3>
                  <p className="text-xs text-slate-400">Direct database account provisioning with custom initial balance</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMemberSubmit} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="e.g. VIP_Investor_Dan"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Initial Password *</label>
                  <input
                    type="text"
                    required
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-amber-300 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="dan@vipinvestor.org"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+1 (555) 998-1122"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Initial Deposit / Balance (ETB)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={newInitialBalance}
                    onChange={(e) => setNewInitialBalance(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-emerald-400 font-bold font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">VIP Tier Level</label>
                  <select
                    value={newVipLevel}
                    onChange={(e) => setNewVipLevel(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-amber-300 font-semibold text-xs"
                  >
                    <option value="1">VIP 1 (1.90% Daily Yield, 2,000 ETB min)</option>
                    <option value="2">VIP 2 (2.20% Daily Yield, 50,000 ETB min)</option>
                    <option value="3">VIP 3 (3.00% Daily Yield, 200,000 ETB min)</option>
                    <option value="4">VIP 4 (4.00% Daily Yield, 500,000 ETB min)</option>
                    <option value="5">VIP 5 (5.00% Daily Yield, 2,000,000 ETB min)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Referral Code</label>
                  <input
                    type="text"
                    value={newReferralCode}
                    onChange={(e) => setNewReferralCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Referred By (Inviter Code)</label>
                  <input
                    type="text"
                    value={newReferredBy}
                    onChange={(e) => setNewReferredBy(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Bank Account Number (CBE)</label>
                <input
                  type="text"
                  value={newWalletAddress}
                  onChange={(e) => setNewWalletAddress(e.target.value)}
                  placeholder="1000..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 font-mono text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-semibold shadow-md shadow-amber-500/20"
                >
                  {createSubmitting ? 'Creating Member...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
