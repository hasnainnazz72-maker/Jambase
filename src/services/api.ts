import {
  User,
  Ticket,
  Category,
  Artist,
  VIPTier,
  TicketPurchase,
  IncomeRecord,
  Transaction,
  WithdrawalRequest,
  DepositRequest,
  TaskItem,
  ReferralMember,
  PlatformNotice,
  BackupSnapshot,
  DatabaseIntegrityReport,
  AdminMemberSummary,
  AdminMemberDetail
} from '../types';

export interface IncomeResponse {
  user: User;
  records: IncomeRecord[];
  summary: {
    totalAssets: number;
    availableBalance: number;
    frozenAssets: number;
    todayTicketIncome: number;
    todayConcertIncome: number;
    todayFinancialIncome: number;
    totalIncome: number;
    recordExpenditure: number;
    concertExpenditure: number;
    financialExpenditure: number;
    isIncomePaused: boolean;
    incomePauseReason?: string;
  };
}

export interface FinanceResponse {
  user: User;
  transactions: Transaction[];
  withdrawals: WithdrawalRequest[];
  deposits: DepositRequest[];
}

export interface TeamResponse {
  user: User;
  referrals: ReferralMember[];
  commissionRates: {
    tier1: number;
    tier2: number;
    tier3: number;
  };
  summary: {
    directValidCount: number;
    directTotalCount: number;
    level2Count: number;
    level3Count: number;
    totalTeamDeposit: number;
  };
}

export interface AdminOverviewResponse {
  totalUsers: number;
  totalTickets: number;
  activeTickets: number;
  totalWithdrawals: number;
  pendingWithdrawals: number;
  totalReferrals: number;
  validReferrals: number;
  withdrawalsList: WithdrawalRequest[];
  referralsList: ReferralMember[];
  ticketsList: Ticket[];
}

let adminAuthToken: string = (typeof window !== 'undefined' && sessionStorage.getItem('jambase_admin_token')) || '';

export const setAdminToken = (token: string) => {
  adminAuthToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      sessionStorage.setItem('jambase_admin_token', token);
    } else {
      sessionStorage.removeItem('jambase_admin_token');
    }
  }
};

export const getAdminToken = () => adminAuthToken;

const getAdminHeaders = (extra: Record<string, string> = {}) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extra
  };
  const token = getAdminToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['X-Admin-Token'] = token;
  }
  return headers;
};

export const api = {
  // Admin Auth APIs
  async adminLogin(credentials: { username: string; password: string }): Promise<{ success: boolean; token: string; message: string; admin: any }> {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Admin login failed');
    if (data.token) {
      setAdminToken(data.token);
    }
    return data;
  },

  async adminVerify(): Promise<{ success: boolean; authenticated: boolean; username: string }> {
    const res = await fetch('/api/admin/verify', {
      headers: getAdminHeaders()
    });
    if (!res.ok) throw new Error('Admin unauthorized');
    return res.json();
  },

  async adminLogout(): Promise<{ success: boolean }> {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        headers: getAdminHeaders()
      });
    } catch {}
    setAdminToken('');
    return { success: true };
  },

  async getUser(): Promise<User> {
    const res = await fetch('/api/user');
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json();
  },

  async getVIPTiers(): Promise<VIPTier[]> {
    const res = await fetch('/api/vip-tiers');
    if (!res.ok) throw new Error('Failed to fetch VIP tiers');
    return res.json();
  },

  async getTickets(category?: string, search?: string): Promise<Ticket[]> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    const res = await fetch(`/api/tickets?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch tickets');
    return res.json();
  },

  async getCategories(): Promise<Category[]> {
    const res = await fetch('/api/categories');
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },

  async getArtists(): Promise<Artist[]> {
    const res = await fetch('/api/artists');
    if (!res.ok) throw new Error('Failed to fetch artists');
    return res.json();
  },

  async getNotices(): Promise<PlatformNotice[]> {
    const res = await fetch('/api/notices');
    if (!res.ok) throw new Error('Failed to fetch notices');
    return res.json();
  },

  async purchaseTicket(ticketId: string, quantity: number): Promise<{ success: boolean; message: string; purchase: TicketPurchase; newBalance: number; totalAssets: number }> {
    const res = await fetch('/api/tickets/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketId, quantity })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Purchase failed');
    return data;
  },

  async getPurchases(): Promise<TicketPurchase[]> {
    const res = await fetch('/api/purchases');
    if (!res.ok) throw new Error('Failed to fetch purchases');
    return res.json();
  },

  async getIncome(): Promise<IncomeResponse> {
    const res = await fetch('/api/income');
    if (!res.ok) throw new Error('Failed to fetch income summary');
    return res.json();
  },

  async calculateDailyIncome(): Promise<{ success: boolean; message: string; record: IncomeRecord; user: User }> {
    const res = await fetch('/api/income/claim-daily-vip', {
      method: 'POST'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to claim daily profit');
    return data;
  },

  async claimDailyVipIncome(): Promise<{ success: boolean; message: string; totalCredited: number; totalProfit: number; baseBalance: number; appliedRate: number; vipLevel: number; newBalance: number; user: User }> {
    const res = await fetch('/api/income/claim-daily-vip', {
      method: 'POST'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to claim daily VIP income');
    return data;
  },

  async claimDailyTicketProfit(): Promise<{ success: boolean; message: string; totalCredited: number; totalProfit: number; baseBalance?: number; totalPrincipal?: number; user: User }> {
    const res = await fetch('/api/income/claim-daily-vip', {
      method: 'POST'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to claim daily profit');
    return data;
  },

  async settleTickets(): Promise<{ success: boolean; settled: boolean; user: User; purchases: TicketPurchase[] }> {
    const res = await fetch('/api/tickets/settle', {
      method: 'POST'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to settle tickets');
    return data;
  },

  async getTelegramSupport(): Promise<{ success: boolean; telegram: { username: string; link: string; channelUsername: string; channelLink: string } }> {
    const res = await fetch('/api/support/telegram');
    if (!res.ok) throw new Error('Failed to fetch support info');
    return res.json();
  },

  async getFinance(): Promise<FinanceResponse> {
    const res = await fetch('/api/finance');
    if (!res.ok) throw new Error('Failed to fetch finance data');
    return res.json();
  },

  async deposit(amount: number, network = 'TRC20', txHash?: string): Promise<{ success: boolean; message: string; deposit: DepositRequest; user: User }> {
    const res = await fetch('/api/finance/deposit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, network, txHash })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Deposit failed');
    return data;
  },

  async withdraw(amount: number, walletAddress: string, network = 'TRC20'): Promise<{ success: boolean; message: string; withdrawal: WithdrawalRequest; user: User }> {
    const res = await fetch('/api/finance/withdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, walletAddress, network })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Withdrawal failed');
    return data;
  },

  async getTeam(): Promise<TeamResponse> {
    const res = await fetch('/api/team');
    if (!res.ok) throw new Error('Failed to fetch team data');
    return res.json();
  },

  async getTasks(): Promise<TaskItem[]> {
    const res = await fetch('/api/tasks');
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
  },

  async claimTask(taskId: string): Promise<{ success: boolean; message: string; task: TaskItem; user: User }> {
    const res = await fetch('/api/tasks/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Claim task failed');
    return data;
  },

  // Admin APIs
  async getAdminOverview(): Promise<AdminOverviewResponse> {
    const res = await fetch('/api/admin/overview', {
      headers: getAdminHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch admin overview');
    return res.json();
  },

  async processWithdrawal(id: string, action: 'Approve' | 'Reject' | 'Complete', rejectReason?: string) {
    const res = await fetch(`/api/admin/withdrawals/${id}/action`, {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({ action, rejectReason })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to process withdrawal');
    return data;
  },

  async toggleReferralValid(id: string, reason?: string) {
    const res = await fetch(`/api/admin/referrals/${id}/toggle-valid`, {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({ reason })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update referral status');
    return data;
  },

  async createTicket(ticketData: Partial<Ticket>) {
    const res = await fetch('/api/admin/tickets', {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify(ticketData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create ticket');
    return data;
  },

  async updateTicket(id: string, ticketData: Partial<Ticket>) {
    const res = await fetch(`/api/admin/tickets/${id}`, {
      method: 'PUT',
      headers: getAdminHeaders(),
      body: JSON.stringify(ticketData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update ticket');
    return data;
  },

  async deleteTicket(id: string) {
    const res = await fetch(`/api/admin/tickets/${id}`, {
      method: 'DELETE',
      headers: getAdminHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete ticket');
    return data;
  },

  async createCategory(name: string) {
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({ name })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create category');
    return data;
  },

  async updateAnnouncement(title: string, content?: string) {
    const res = await fetch('/api/admin/notices', {
      method: 'PUT',
      headers: getAdminHeaders(),
      body: JSON.stringify({ title, content })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update announcement');
    return data;
  },

  async updateAdminTelegram(username: string, channelUsername?: string) {
    const res = await fetch('/api/admin/telegram', {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({ username, channelUsername })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update telegram support');
    return data;
  },

  async updateProfile(profileData: Partial<User>) {
    const res = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update profile');
    return data;
  },

  async updateSecurity(securityData: { autoCompound?: boolean }) {
    const res = await fetch('/api/user/security', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(securityData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update security');
    return data;
  },

  async claimAttendance(): Promise<{ success: boolean; message: string; rewardAmount: number; attendanceStreak: number; user: User }> {
    const res = await fetch('/api/welfare/attendance', {
      method: 'POST'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to claim daily attendance');
    return data;
  },

  async registerUser(regData: { username: string; countryCode: string; phone: string; password: string; referralCode?: string }): Promise<{ success: boolean; message: string; user: User }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(regData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data;
  },

  async loginUser(loginData: { username: string; password: string }): Promise<{ success: boolean; message: string; user: User }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  },

  // VIP Data Protection & Disaster Recovery APIs
  async getBackups(): Promise<{ success: boolean; backups: BackupSnapshot[]; count: number }> {
    const res = await fetch('/api/admin/backups', {
      headers: getAdminHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch backups');
    return data;
  },

  async createBackup(reason?: string): Promise<{ success: boolean; snapshot: BackupSnapshot; message: string }> {
    const res = await fetch('/api/admin/backups/create', {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({ reason })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create backup snapshot');
    return data;
  },

  async restoreBackup(snapshotId: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/admin/backups/restore', {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({ snapshotId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to restore database from backup');
    return data;
  },

  async getDatabaseIntegrity(): Promise<DatabaseIntegrityReport> {
    const res = await fetch('/api/admin/backups/verify-integrity', {
      headers: getAdminHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to run integrity audit');
    return data;
  },

  async exportDatabase(): Promise<any> {
    const res = await fetch('/api/admin/backups/export', {
      headers: getAdminHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to export database');
    return data;
  },

  async importDatabase(importedData: any): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/admin/backups/import', {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({ data: importedData })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to import database backup');
    return data;
  },

  // ==========================================
  // MEMBER MANAGEMENT ADMIN APIs
  // ==========================================

  async getAdminMembers(): Promise<{ success: boolean; summary: AdminMemberSummary; members: User[] }> {
    const res = await fetch('/api/admin/members', {
      headers: getAdminHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch members list');
    return data;
  },

  async getAdminMemberDetail(userId: string): Promise<AdminMemberDetail> {
    const res = await fetch(`/api/admin/members/${userId}`, {
      headers: getAdminHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch member details');
    return data;
  },

  async adjustMemberBalance(
    userId: string,
    params: { action: 'add' | 'deduct'; amount: number; reason?: string; type?: string; adminOperator?: string }
  ): Promise<{ success: boolean; message: string; user: User; transaction: Transaction }> {
    const res = await fetch(`/api/admin/members/${userId}/balance`, {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to adjust member balance');
    return data;
  },

  async resetMemberPassword(
    userId: string,
    params: { newPassword: string; adminReason?: string }
  ): Promise<{ success: boolean; message: string; newPassword: string; user: User }> {
    const res = await fetch(`/api/admin/members/${userId}/reset-password`, {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to reset member password');
    return data;
  },

  async updateMemberStatus(
    userId: string,
    params: {
      status?: 'active' | 'suspended' | 'frozen';
      isIncomePaused?: boolean;
      incomePauseReason?: string;
      vipLevel?: number;
      walletAddress?: string;
      phone?: string;
      adminNotes?: string;
    }
  ): Promise<{ success: boolean; message: string; user: User }> {
    const res = await fetch(`/api/admin/members/${userId}/status`, {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update member status');
    return data;
  },

  async createAdminMember(memberData: {
    username: string;
    email?: string;
    phone?: string;
    password?: string;
    initialBalance?: number;
    vipLevel?: number;
    walletAddress?: string;
    referralCode?: string;
    referredBy?: string;
    adminNotes?: string;
  }): Promise<{ success: boolean; message: string; user: User; generatedPassword?: string }> {
    const res = await fetch('/api/admin/members/create', {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify(memberData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create member');
    return data;
  }
};
