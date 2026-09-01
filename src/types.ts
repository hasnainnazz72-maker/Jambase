export type TabType = 'home' | 'income' | 'task' | 'finance' | 'mine';

export interface VIPTier {
  level: number;
  name: string;
  minBalance: number;
  maxBalance: number;
  minDirectMembers: number;
  dailyRate: number; // e.g. 0.019 for 1.9%
  description: string;
  color: string;
  badge: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  phone?: string;
  walletAddress?: string;
  network?: string; // 'TRC20' | 'BEP20'
  balance: number; // Available balance
  frozenBalance: number; // In pending withdrawals or active locks
  totalAssets: number; // balance + frozenBalance
  vipLevel: number;
  referralCode: string;
  referredBy?: string;
  status?: 'active' | 'suspended' | 'frozen';
  validDirectMembersCount: number;
  totalTeamMembersCount: number;
  totalTeamDeposit: number;
  isIncomePaused: boolean;
  incomePauseReason?: string;
  autoCompound: boolean;
  totalEarnedIncome: number;
  totalVipProfit?: number; // All-time accumulated VIP profit
  totalTeamCommission?: number; // All-time accumulated team commission
  todayVipProfit?: number; // Today's VIP profit
  todayTeamCommission?: number; // Today's team commission
  todayTicketIncome: number;
  todayConcertIncome: number;
  todayFinancialIncome: number;
  totalDeposit?: number;
  totalWithdrawal?: number;
  totalPurchases?: number;
  recordExpenditure: number;
  concertExpenditure: number;
  financialExpenditure: number;
  lastIncomeCalculatedAt?: string;
  lastAttendanceClaimDate?: string;
  lastProfitClaimDate?: string;
  lastDailyIncomeDate?: string;
  lastLoginAt?: string;
  lastActiveAt?: string;
  passwordHint?: string;
  adminNotes?: string;
  claimedTaskIds?: string[];
  attendanceStreak?: number;
  dailyTicketDate?: string; // Current UTC date for ticket cycle e.g. "2026-08-31"
  dailyTicketStartingBalance?: number; // Starting available balance quota for current UTC day e.g. 300.00
  dailyTicketSpent?: number; // Total ticket amount purchased on current UTC day e.g. 10.00 -> 30.00
  createdAt: string;
  isAdmin?: boolean;
}

export interface Ticket {
  id: string;
  name: string;
  artist: string;
  category: string;
  price: number;
  voucherQty: number;
  image: string;
  audioPreviewUrl?: string;
  description: string;
  eventDate: string;
  venue: string;
  location: string;
  vipRequired: number; // 0 for any, 1, 2, 3, etc.
  purchaseLimit: number;
  maxQuantity: number;
  soldCount: number;
  isActive: boolean;
  isPopular?: boolean;
  isFeatured?: boolean;
  dailyYieldEst?: number; // Estimated daily ticket return rate
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  iconName?: string;
  isActive: boolean;
}

export interface Artist {
  id: string;
  name: string;
  genre: string;
  avatar: string;
  followers: string;
  bio: string;
}

export interface TicketPurchase {
  id: string;
  userId: string;
  ticketId: string;
  ticketName: string;
  artist: string;
  image: string;
  unitPrice: number;
  quantity: number;
  totalAmount: number;
  vipLevelAtPurchase: number;
  vipRateAtPurchase?: number;
  profitAmount?: number;
  frozenUntil?: string;
  settledAt?: string;
  createdAt: string;
  status: 'frozen' | 'active' | 'completed' | 'expired';
}

export interface IncomeRecord {
  id: string;
  userId: string;
  ticketName: string;
  categoryType: 'ticket' | 'vip_profit' | 'team_commission' | 'concert' | 'financial' | 'task_reward';
  previousBalance: number;
  incomeAmount: number;
  vipLevel: number;
  dailyRate: number; // VIP profit rate or commission rate (e.g. 0.025 for 2.5%, 0.16 for 16%)
  newBalance: number;
  timestamp: string; // UTC ISO string
  status: 'credited' | 'pending' | 'paused';
  transactionId: string;
  commissionTier?: 1 | 2 | 3;
  sourceMemberName?: string;
  sourceMemberId?: string;
  notes?: string;
}

export type TransactionType =
  | 'deposit'
  | 'withdrawal'
  | 'ticket_purchase'
  | 'daily_income'
  | 'vip_profit'
  | 'referral_commission'
  | 'team_commission'
  | 'task_reward';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  category?: 'vip_profit' | 'team_commission' | 'deposit' | 'withdrawal' | 'ticket_purchase' | 'task_reward' | 'admin_credit' | 'admin_debit';
  amount: number;
  fee?: number;
  status: 'pending' | 'completed' | 'rejected' | 'failed';
  title: string;
  description: string;
  vipLevel?: number;
  appliedRate?: number;
  commissionTier?: 1 | 2 | 3;
  sourceMemberName?: string;
  txHash?: string;
  adminAction?: 'credit' | 'debit' | 'adjustment' | 'bonus' | 'status_change';
  adminReason?: string;
  adminOperator?: string;
  actionType?: string;
  previousBalance?: number;
  newBalance?: number;
  createdAt: string;
}

export interface AdminMemberSummary {
  totalRegistered: number;
  totalActive: number;
  totalSuspended: number;
  totalFrozen: number;
  totalIncomePaused: number;
  totalPlatformBalance: number;
  totalPlatformFrozen: number;
  totalPlatformAssets: number;
  vipDistribution: {
    vip1: number;
    vip2: number;
    vip3: number;
    vip4: number;
    vip5: number;
    vip6: number;
  };
}

export interface AdminMemberDetail {
  user: User;
  transactions: Transaction[];
  incomeRecords: IncomeRecord[];
  purchases: TicketPurchase[];
  referrals: ReferralMember[];
  withdrawals: WithdrawalRequest[];
  deposits: DepositRequest[];
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  username: string;
  userEmail?: string;
  userPhone?: string;
  userBalanceAtRequest?: number;
  currentUserBalance?: number;
  amount: number;
  fee: number; // 8% service fee
  netAmount: number;
  walletAddress: string;
  network: string; // 'TRC20' | 'BEP20'
  status: 'Pending' | 'Approved' | 'Completed' | 'Rejected' | 'Cancelled';
  createdAt: string;
  processedAt?: string;
  approvedBy?: string;
  rejectedBy?: string;
  rejectReason?: string;
  adminNotes?: string;
  txId: string;
  txHash?: string;
}

export interface DepositRequest {
  id: string;
  userId: string;
  username: string;
  amount: number;
  network: string; // 'TRC20' | 'BEP20'
  walletAddress: string;
  txHash?: string;
  status: 'Pending' | 'Approved' | 'Completed' | 'Rejected' | 'Cancelled';
  createdAt: string;
  processedAt?: string;
  approvedBy?: string;
  rejectedBy?: string;
  rejectReason?: string;
  adminNotes?: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  rewardAmount: number;
  rewardType: 'balance' | 'voucher' | 'exp';
  progress: number;
  maxProgress: number;
  isCompleted: boolean;
  isClaimed: boolean;
  icon: string;
  category: 'daily' | 'growth' | 'vip';
}

export interface ReferralMember {
  id: string;
  username: string;
  email: string;
  avatar: string;
  registeredAt: string;
  totalDeposit: number;
  totalPurchases: number;
  balance: number;
  isValid: boolean; // qualifying criteria met: registered via link, active account, deposit/purchase >= $30, not fake
  disqualifiedReason?: string;
  level: 1 | 2 | 3;
}

export interface PlatformNotice {
  id: string;
  title: string;
  content: string;
  date: string;
  type: 'info' | 'reward' | 'upgrade' | 'system';
}

export interface BackupSnapshot {
  id: string;
  filename: string;
  createdAt: string;
  type: 'automatic' | 'manual' | 'pre_restore_safety' | 'pre_migration';
  reason: string;
  fileSizeBytes: number;
  checksum: string;
  metadata: {
    totalUsers: number;
    totalBalances: number;
    totalFrozenBalances: number;
    totalTransactions: number;
    totalTickets: number;
    totalPurchases: number;
    totalIncomeRecords: number;
    totalWithdrawals: number;
    totalDeposits: number;
    totalReferrals: number;
  };
}

export interface DatabaseIntegrityReport {
  timestamp: string;
  status: 'healthy' | 'warning' | 'critical';
  totalUsers: number;
  totalBalances: number;
  totalFrozen: number;
  totalAssets: number;
  transactionCount: number;
  purchaseCount: number;
  withdrawalCount: number;
  depositCount: number;
  referralCount: number;
  ticketCount: number;
  integrityChecks: {
    name: string;
    passed: boolean;
    details: string;
  }[];
  lastBackupTime?: string;
  backupCount: number;
}
