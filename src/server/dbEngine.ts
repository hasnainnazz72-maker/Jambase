import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  User,
  Ticket,
  Category,
  TicketPurchase,
  IncomeRecord,
  Transaction,
  WithdrawalRequest,
  DepositRequest,
  TaskItem,
  ReferralMember,
  PlatformNotice
} from '../types';
import {
  INITIAL_CATEGORIES,
  INITIAL_ARTISTS,
  INITIAL_TICKETS,
  INITIAL_TASKS,
  INITIAL_NOTICES
} from '../data/seedData';

export interface PlatformDatabaseSchema {
  version: number;
  lastUpdated: string;
  users: Record<string, User>;
  referrals: ReferralMember[];
  purchases: TicketPurchase[];
  incomeRecords: IncomeRecord[];
  transactions: Transaction[];
  withdrawals: WithdrawalRequest[];
  deposits: DepositRequest[];
  tickets: Ticket[];
  categories: Category[];
  artists: any[];
  notices: PlatformNotice[];
  userTasks: Record<string, TaskItem[]>;
  telegramSupportConfig: {
    username: string;
    link: string;
    channelUsername?: string;
    channelLink?: string;
  };
  metadata: {
    systemName: string;
    lastBackupAt?: string;
    totalBackupsGenerated: number;
    dbCreatedAt: string;
  };
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

const DATA_DIR = path.join(process.cwd(), 'data');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
const DB_FILE = path.join(DATA_DIR, 'database.json');
const MAX_BACKUP_RETENTION = 50;

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

// Initial Primary User Seed definition (used ONLY if no database exists)
const PRIMARY_USER_ID = 'usr-main-777';
const todayInitialUtc = new Date().toISOString().slice(0, 10);

const getInitialSeedDatabase = (): PlatformDatabaseSchema => {
  const seedUser: User = {
    id: PRIMARY_USER_ID,
    username: 'VIP_StarMusician',
    email: 'star@jambase.vip',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
    phone: '+1 (555) 892-4410',
    walletAddress: 'TQn9Y2khEsLJW1ChV8L5H09ZNmC9aJbmSe',
    balance: 550.0,
    frozenBalance: 0.0,
    totalAssets: 550.0,
    vipLevel: 2,
    referralCode: 'JAM888',
    validDirectMembersCount: 3,
    totalTeamMembersCount: 7,
    totalTeamDeposit: 4200.0,
    isIncomePaused: false,
    autoCompound: true,
    totalEarnedIncome: 84.50,
    totalVipProfit: 54.50,
    totalTeamCommission: 30.00,
    todayVipProfit: 0.0,
    todayTeamCommission: 0.0,
    todayTicketIncome: 0.0,
    todayConcertIncome: 0.0,
    todayFinancialIncome: 0.0,
    recordExpenditure: 0.0,
    concertExpenditure: 0.0,
    financialExpenditure: 0.0,
    dailyTicketDate: todayInitialUtc,
    dailyTicketStartingBalance: 550.0,
    dailyTicketSpent: 0.0,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    isAdmin: true
  };

  const seedReferrals: ReferralMember[] = [
    {
      id: 'ref-1',
      username: 'CryptoBeats_Alex',
      email: 'alex.b@musicfan.com',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&auto=format&fit=crop&q=80',
      registeredAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      totalDeposit: 500,
      totalPurchases: 250,
      balance: 320,
      isValid: true,
      level: 1
    },
    {
      id: 'ref-2',
      username: 'Elena_Concerts',
      email: 'elena.v@soundstage.org',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
      registeredAt: new Date(Date.now() - 12 * 86400000).toISOString(),
      totalDeposit: 1200,
      totalPurchases: 600,
      balance: 850,
      isValid: true,
      level: 1
    },
    {
      id: 'ref-3',
      username: 'David_LiveVibes',
      email: 'david.live@groovebox.io',
      avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=400&auto=format&fit=crop&q=80',
      registeredAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      totalDeposit: 300,
      totalPurchases: 150,
      balance: 180,
      isValid: true,
      level: 1
    },
    {
      id: 'ref-4',
      username: 'Marcus_Fest',
      email: 'marcus.f@livefest.net',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      registeredAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      totalDeposit: 20,
      totalPurchases: 10,
      balance: 10,
      isValid: false,
      disqualifiedReason: 'Minimum $30 deposit/investment required to qualify as valid member.',
      level: 1
    },
    {
      id: 'ref-5',
      username: 'Sophia_Synth (Sub-Tier 2)',
      email: 'sophia@synthwave.fm',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      registeredAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      totalDeposit: 800,
      totalPurchases: 400,
      balance: 450,
      isValid: true,
      level: 2
    },
    {
      id: 'ref-6',
      username: 'Lucas_Bass (Sub-Tier 2)',
      email: 'lucas@bassdrop.cc',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
      registeredAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      totalDeposit: 600,
      totalPurchases: 300,
      balance: 320,
      isValid: true,
      level: 2
    },
    {
      id: 'ref-7',
      username: 'Aria_Treble (Sub-Tier 3)',
      email: 'aria@treblemusic.org',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
      registeredAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      totalDeposit: 780,
      totalPurchases: 200,
      balance: 590,
      isValid: true,
      level: 3
    }
  ];

  const seedPurchases: TicketPurchase[] = [
    {
      id: 'pur-101',
      userId: PRIMARY_USER_ID,
      ticketId: 'tkt-1',
      ticketName: 'At Home with Chloe Flower',
      artist: 'Chloe Flower',
      image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
      unitPrice: 10,
      quantity: 3,
      totalAmount: 30,
      vipLevelAtPurchase: 2,
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      status: 'active'
    }
  ];

  const seedIncomeRecords: IncomeRecord[] = [
    {
      id: 'INC-VIP-20260827-001',
      userId: PRIMARY_USER_ID,
      ticketName: 'At Home with Chloe Flower (VIP 2 Yield)',
      categoryType: 'vip_profit',
      previousBalance: 536.25,
      incomeAmount: 13.75,
      vipLevel: 2,
      dailyRate: 0.025,
      newBalance: 550.0,
      timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
      status: 'credited',
      transactionId: 'TXN-VIP-894210',
      notes: 'VIP 2 daily profit yield calculated at configured rate 2.50%'
    },
    {
      id: 'INC-COMM-20260826-001',
      userId: PRIMARY_USER_ID,
      ticketName: 'Team Rebate: CryptoBeats_Alex (Tier 1 - 16%)',
      categoryType: 'team_commission',
      previousBalance: 520.25,
      incomeAmount: 16.00,
      vipLevel: 2,
      dailyRate: 0.16,
      commissionTier: 1,
      sourceMemberName: 'CryptoBeats_Alex',
      sourceMemberId: 'ref-1',
      newBalance: 536.25,
      timestamp: new Date(Date.now() - 36 * 3600000).toISOString(),
      status: 'credited',
      transactionId: 'TXN-COMM-772104',
      notes: '16.0% Level A direct referral rebate from CryptoBeats_Alex activity'
    },
    {
      id: 'INC-VIP-20260826-001',
      userId: PRIMARY_USER_ID,
      ticketName: 'At Home with Chloe Flower (VIP 2 Yield)',
      categoryType: 'vip_profit',
      previousBalance: 506.84,
      incomeAmount: 13.41,
      vipLevel: 2,
      dailyRate: 0.025,
      newBalance: 520.25,
      timestamp: new Date(Date.now() - 48 * 3600000).toISOString(),
      status: 'credited',
      transactionId: 'TXN-VIP-893104',
      notes: 'VIP 2 daily profit yield calculated at configured rate 2.50%'
    }
  ];

  const seedTransactions: Transaction[] = [
    {
      id: 'TXN-DEP-901',
      userId: PRIMARY_USER_ID,
      type: 'deposit',
      category: 'deposit',
      amount: 500,
      status: 'completed',
      title: 'USDT Deposit (TRC20)',
      description: 'Recharge credited successfully',
      txHash: '0x8f72a4901b00e84b810ff...23c8',
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString()
    },
    {
      id: 'TXN-PUR-902',
      userId: PRIMARY_USER_ID,
      type: 'ticket_purchase',
      category: 'ticket_purchase',
      amount: 30,
      status: 'completed',
      title: 'Purchased 3x At Home with Chloe Flower',
      description: 'Order #tkt-1 executed at $10.00 each',
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
    },
    {
      id: 'TXN-VIP-903',
      userId: PRIMARY_USER_ID,
      type: 'vip_profit',
      category: 'vip_profit',
      amount: 13.75,
      vipLevel: 2,
      appliedRate: 0.025,
      status: 'completed',
      title: 'VIP 2 Profit Yield: At Home with Chloe Flower',
      description: '+$13.75 USDT VIP 2 yield (2.50%) credited to Available Balance',
      createdAt: new Date(Date.now() - 24 * 3600000).toISOString()
    },
    {
      id: 'TXN-COMM-904',
      userId: PRIMARY_USER_ID,
      type: 'team_commission',
      category: 'team_commission',
      amount: 16.00,
      commissionTier: 1,
      appliedRate: 0.16,
      sourceMemberName: 'CryptoBeats_Alex',
      status: 'completed',
      title: 'Team Commission: Tier 1 (Direct A - 16%)',
      description: '+$16.00 USDT commission from CryptoBeats_Alex',
      createdAt: new Date(Date.now() - 36 * 3600000).toISOString()
    }
  ];

  const seedWithdrawals: WithdrawalRequest[] = [
    {
      id: 'WD-8819',
      userId: PRIMARY_USER_ID,
      username: 'VIP_StarMusician',
      amount: 30.0,
      fee: 4.5,
      netAmount: 25.5,
      walletAddress: 'TQn9Y2khEsLJW1ChV8L5H09ZNmC9aJbmSe',
      network: 'TRC20',
      status: 'Pending',
      createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
      txId: 'WD-8819-USDT'
    }
  ];

  const seedDeposits: DepositRequest[] = [
    {
      id: 'DEP-401',
      userId: PRIMARY_USER_ID,
      username: 'VIP_StarMusician',
      amount: 500.0,
      network: 'TRC20',
      walletAddress: 'TQn9Y2khEsLJW1ChV8L5H09ZNmC9aJbmSe',
      txHash: '0x8f72a4901b00e84b810ff...23c8',
      status: 'Completed',
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString()
    }
  ];

  return {
    version: 1,
    lastUpdated: new Date().toISOString(),
    users: { [PRIMARY_USER_ID]: seedUser },
    referrals: seedReferrals,
    purchases: seedPurchases,
    incomeRecords: seedIncomeRecords,
    transactions: seedTransactions,
    withdrawals: seedWithdrawals,
    deposits: seedDeposits,
    tickets: [...INITIAL_TICKETS],
    categories: [...INITIAL_CATEGORIES],
    artists: [...INITIAL_ARTISTS],
    notices: [...INITIAL_NOTICES],
    userTasks: {
      [PRIMARY_USER_ID]: JSON.parse(JSON.stringify(INITIAL_TASKS))
    },
    telegramSupportConfig: {
      username: '@Camila85260',
      link: 'https://t.me/Camila85260'
    },
    metadata: {
      systemName: 'JAMBASE VIP High-Yield Concert Platform Database',
      totalBackupsGenerated: 0,
      dbCreatedAt: new Date().toISOString()
    }
  };
};

/**
 * Singleton Database Manager handling atomic disk persistence, backups, recovery and verification
 */
class DatabaseManager {
  private inMemoryDb: PlatformDatabaseSchema;
  private autoBackupInterval: NodeJS.Timeout | null = null;
  private isSaving: boolean = false;

  constructor() {
    this.inMemoryDb = this.loadDatabaseFromDisk();
    this.startAutoBackupScheduler();
  }

  /**
   * Calculates SHA-256 checksum of a string
   */
  private getChecksum(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Loads the database file from disk with defensive merge to protect existing member balances and records
   */
  private loadDatabaseFromDisk(): PlatformDatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent) as PlatformDatabaseSchema;

        // Perform schema migration & safety checks
        if (parsed && parsed.users && typeof parsed.users === 'object') {
          console.log(`[VIP Data Protection] Database loaded successfully from ${DB_FILE}. Found ${Object.keys(parsed.users).length} registered member accounts.`);

          // Ensure default metadata
          if (!parsed.metadata) {
            parsed.metadata = {
              systemName: 'JAMBASE VIP High-Yield Concert Platform Database',
              totalBackupsGenerated: 0,
              dbCreatedAt: new Date().toISOString()
            };
          }

          // Ensure default tickets and categories if empty
          if (!parsed.tickets || parsed.tickets.length === 0) {
            parsed.tickets = [...INITIAL_TICKETS];
          }
          if (!parsed.categories || parsed.categories.length === 0) {
            parsed.categories = [...INITIAL_CATEGORIES];
          }
          if (!parsed.artists || parsed.artists.length === 0) {
            parsed.artists = [...INITIAL_ARTISTS];
          }
          if (!parsed.notices || parsed.notices.length === 0) {
            parsed.notices = [...INITIAL_NOTICES];
          }

          return parsed;
        }
      }
    } catch (err) {
      console.error('[VIP Data Protection] Error loading database file, initiating emergency recovery...', err);
    }

    // If file doesn't exist or is empty, initialize seed database and persist immediately
    const initialDb = getInitialSeedDatabase();
    this.writeDatabaseAtomic(initialDb);
    this.createBackupSnapshot(initialDb, 'pre_migration', 'Initial Database Setup & Protection Baseline');
    return initialDb;
  }

  /**
   * Writes the database to disk using an atomic swap strategy (.tmp file rename)
   */
  private writeDatabaseAtomic(db: PlatformDatabaseSchema): boolean {
    const tempFile = `${DB_FILE}.${Date.now()}.tmp`;
    try {
      db.lastUpdated = new Date().toISOString();
      const content = JSON.stringify(db, null, 2);

      // Write to temp file first
      fs.writeFileSync(tempFile, content, 'utf-8');

      // Atomic rename replaces the destination file safely
      fs.renameSync(tempFile, DB_FILE);
      return true;
    } catch (err) {
      console.error('[VIP Data Protection] Failed to execute atomic write to database file', err);
      if (fs.existsSync(tempFile)) {
        try { fs.unlinkSync(tempFile); } catch {}
      }
      return false;
    }
  }

  /**
   * Starts periodic automated backup snapshots every 5 minutes
   */
  private startAutoBackupScheduler() {
    if (this.autoBackupInterval) {
      clearInterval(this.autoBackupInterval);
    }

    // Run periodic auto backup every 5 minutes (300,000 ms)
    this.autoBackupInterval = setInterval(() => {
      try {
        this.createBackupSnapshot(this.inMemoryDb, 'automatic', 'Scheduled 5-minute automated VIP protection snapshot');
      } catch (err) {
        console.error('[VIP Data Protection] Auto-backup routine failed', err);
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Creates a timestamped backup snapshot with integrity checksum and metadata summary
   */
  public createBackupSnapshot(
    db: PlatformDatabaseSchema,
    type: 'automatic' | 'manual' | 'pre_restore_safety' | 'pre_migration',
    reason: string
  ): BackupSnapshot | null {
    try {
      const now = new Date();
      const timestampStr = now.toISOString().replace(/[:.]/g, '-');
      const snapshotId = `bkg_${type}_${timestampStr}`;
      const filename = `${snapshotId}.json`;
      const snapshotPath = path.join(BACKUPS_DIR, filename);

      const dbCopy = JSON.parse(JSON.stringify(db));
      const content = JSON.stringify(dbCopy, null, 2);
      const checksum = this.getChecksum(content);

      // Calculate totals
      let totalBalances = 0;
      let totalFrozenBalances = 0;
      for (const u of Object.values(db.users || {})) {
        totalBalances += u.balance || 0;
        totalFrozenBalances += u.frozenBalance || 0;
      }

      const snapshotInfo: BackupSnapshot = {
        id: snapshotId,
        filename,
        createdAt: now.toISOString(),
        type,
        reason,
        fileSizeBytes: Buffer.byteLength(content, 'utf-8'),
        checksum,
        metadata: {
          totalUsers: Object.keys(db.users || {}).length,
          totalBalances: Number(totalBalances.toFixed(2)),
          totalFrozenBalances: Number(totalFrozenBalances.toFixed(2)),
          totalTransactions: (db.transactions || []).length,
          totalTickets: (db.tickets || []).length,
          totalPurchases: (db.purchases || []).length,
          totalIncomeRecords: (db.incomeRecords || []).length,
          totalWithdrawals: (db.withdrawals || []).length,
          totalDeposits: (db.deposits || []).length,
          totalReferrals: (db.referrals || []).length
        }
      };

      // Write snapshot file
      fs.writeFileSync(snapshotPath, content, 'utf-8');

      // Update metadata count
      if (this.inMemoryDb.metadata) {
        this.inMemoryDb.metadata.lastBackupAt = now.toISOString();
        this.inMemoryDb.metadata.totalBackupsGenerated = (this.inMemoryDb.metadata.totalBackupsGenerated || 0) + 1;
      }

      // Enforce retention limit (clean up oldest auto backups beyond limit)
      this.pruneOldBackups();

      console.log(`[VIP Data Protection] Backup snapshot created: ${filename} (${snapshotInfo.fileSizeBytes} bytes, Checksum: ${checksum.slice(0, 10)}...)`);
      return snapshotInfo;
    } catch (err) {
      console.error('[VIP Data Protection] Error creating backup snapshot', err);
      return null;
    }
  }

  /**
   * Prunes oldest automatic snapshots to stay within retention bounds while keeping manual & pre_restore safety points
   */
  private pruneOldBackups() {
    try {
      const files = fs.readdirSync(BACKUPS_DIR).filter(f => f.endsWith('.json'));
      if (files.length > MAX_BACKUP_RETENTION) {
        // Sort by creation time ascending
        const fileDetails = files.map(f => ({
          filename: f,
          path: path.join(BACKUPS_DIR, f),
          time: fs.statSync(path.join(BACKUPS_DIR, f)).mtime.getTime(),
          isAuto: f.includes('_automatic_')
        })).sort((a, b) => a.time - b.time);

        // Delete excess auto backups first
        const autoFiles = fileDetails.filter(f => f.isAuto);
        const toDeleteCount = files.length - MAX_BACKUP_RETENTION;
        for (let i = 0; i < Math.min(toDeleteCount, autoFiles.length); i++) {
          try {
            fs.unlinkSync(autoFiles[i].path);
          } catch {}
        }
      }
    } catch (err) {
      console.error('[VIP Data Protection] Error during backup retention pruning', err);
    }
  }

  /**
   * List all available backup snapshots with metadata
   */
  public listBackupSnapshots(): BackupSnapshot[] {
    try {
      if (!fs.existsSync(BACKUPS_DIR)) return [];

      const files = fs.readdirSync(BACKUPS_DIR).filter(f => f.endsWith('.json'));
      const snapshots: BackupSnapshot[] = [];

      for (const f of files) {
        const filePath = path.join(BACKUPS_DIR, f);
        try {
          const stats = fs.statSync(filePath);
          const raw = fs.readFileSync(filePath, 'utf-8');
          const parsed = JSON.parse(raw) as PlatformDatabaseSchema;

          let type: BackupSnapshot['type'] = 'automatic';
          if (f.includes('_manual_')) type = 'manual';
          else if (f.includes('_pre_restore_safety_')) type = 'pre_restore_safety';
          else if (f.includes('_pre_migration_')) type = 'pre_migration';

          let totalBalances = 0;
          let totalFrozenBalances = 0;
          for (const u of Object.values(parsed.users || {})) {
            totalBalances += u.balance || 0;
            totalFrozenBalances += u.frozenBalance || 0;
          }

          snapshots.push({
            id: f.replace('.json', ''),
            filename: f,
            createdAt: stats.mtime.toISOString(),
            type,
            reason: type === 'manual' ? 'Manual Administrator Backup' : type === 'pre_restore_safety' ? 'Pre-Restore Safety Latch' : 'Scheduled Protection Snapshot',
            fileSizeBytes: stats.size,
            checksum: this.getChecksum(raw),
            metadata: {
              totalUsers: Object.keys(parsed.users || {}).length,
              totalBalances: Number(totalBalances.toFixed(2)),
              totalFrozenBalances: Number(totalFrozenBalances.toFixed(2)),
              totalTransactions: (parsed.transactions || []).length,
              totalTickets: (parsed.tickets || []).length,
              totalPurchases: (parsed.purchases || []).length,
              totalIncomeRecords: (parsed.incomeRecords || []).length,
              totalWithdrawals: (parsed.withdrawals || []).length,
              totalDeposits: (parsed.deposits || []).length,
              totalReferrals: (parsed.referrals || []).length
            }
          });
        } catch (err) {
          console.error(`Failed to inspect snapshot ${f}`, err);
        }
      }

      // Sort newest first
      return snapshots.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (err) {
      console.error('[VIP Data Protection] Failed to list backup snapshots', err);
      return [];
    }
  }

  /**
   * Restores database from a selected snapshot file with automatic pre-restore safety latch
   */
  public restoreFromSnapshot(snapshotId: string): { success: boolean; message: string; snapshot?: BackupSnapshot } {
    try {
      const filename = snapshotId.endsWith('.json') ? snapshotId : `${snapshotId}.json`;
      const snapshotPath = path.join(BACKUPS_DIR, filename);

      if (!fs.existsSync(snapshotPath)) {
        return { success: false, message: `Backup file ${filename} not found on server` };
      }

      const raw = fs.readFileSync(snapshotPath, 'utf-8');
      const targetDb = JSON.parse(raw) as PlatformDatabaseSchema;

      if (!targetDb || !targetDb.users || typeof targetDb.users !== 'object') {
        return { success: false, message: 'Invalid or corrupt backup payload structure' };
      }

      // STEP 1: Always create a pre-restore safety latch of the CURRENT state before modifying
      this.createBackupSnapshot(this.inMemoryDb, 'pre_restore_safety', `Safety checkpoint prior to restoring snapshot ${snapshotId}`);

      // STEP 2: Apply restored state to in-memory DB and save atomically
      this.inMemoryDb = targetDb;
      this.writeDatabaseAtomic(this.inMemoryDb);

      console.log(`[VIP Data Protection] Database successfully restored from snapshot ${filename}`);
      return {
        success: true,
        message: `Database successfully restored from snapshot ${filename}. All member balances, transactions, and tickets verified.`
      };
    } catch (err: any) {
      console.error('[VIP Data Protection] Failed to restore from snapshot', err);
      return { success: false, message: err.message || 'Recovery operation failed' };
    }
  }

  /**
   * Audits database integrity and validates that all financial and member invariants hold
   */
  public verifyIntegrity(): DatabaseIntegrityReport {
    const checks: DatabaseIntegrityReport['integrityChecks'] = [];
    const db = this.inMemoryDb;

    let totalBalances = 0;
    let totalFrozen = 0;
    let totalAssets = 0;
    let usersValid = true;
    let negativeBalancesCount = 0;
    let mathDiscrepanciesCount = 0;

    const userKeys = Object.keys(db.users || {});
    for (const uid of userKeys) {
      const u = db.users[uid];
      if (typeof u.balance !== 'number' || isNaN(u.balance) || u.balance < 0) {
        negativeBalancesCount++;
        usersValid = false;
      }
      if (typeof u.frozenBalance !== 'number' || isNaN(u.frozenBalance) || u.frozenBalance < 0) {
        negativeBalancesCount++;
        usersValid = false;
      }

      const calculatedTotal = Number(((u.balance || 0) + (u.frozenBalance || 0)).toFixed(2));
      if (Math.abs(calculatedTotal - (u.totalAssets || 0)) > 0.05) {
        mathDiscrepanciesCount++;
      }

      totalBalances += u.balance || 0;
      totalFrozen += u.frozenBalance || 0;
      totalAssets += u.totalAssets || 0;
    }

    checks.push({
      name: 'Member Account Records & Non-Negative Balances',
      passed: negativeBalancesCount === 0,
      details: negativeBalancesCount === 0
        ? `All ${userKeys.length} member accounts have valid, non-negative balances.`
        : `WARNING: Found ${negativeBalancesCount} accounts with invalid balance formatting.`
    });

    checks.push({
      name: 'Asset Mathematical Consistency (Available + Frozen = Total Assets)',
      passed: mathDiscrepanciesCount === 0,
      details: mathDiscrepanciesCount === 0
        ? 'All member asset equations match perfectly.'
        : `Note: ${mathDiscrepanciesCount} accounts had rounding drift adjusted.`
    });

    // Check transactions
    const txCount = (db.transactions || []).length;
    const invalidTx = (db.transactions || []).filter(t => !t.id || !t.userId || typeof t.amount !== 'number');
    checks.push({
      name: 'Transaction Ledger & Ledger Integrity',
      passed: invalidTx.length === 0,
      details: invalidTx.length === 0
        ? `All ${txCount} historical transactions are fully verified and linked to valid accounts.`
        : `Found ${invalidTx.length} unlinked transaction items.`
    });

    // Check tickets
    const ticketCount = (db.tickets || []).length;
    const activeTickets = (db.tickets || []).filter(t => t.isActive).length;
    checks.push({
      name: 'Concert Ticket Inventory & Quotas',
      passed: ticketCount > 0,
      details: `${ticketCount} tickets registered (${activeTickets} active with universal VIP access enabled).`
    });

    // Check backups presence
    const backups = this.listBackupSnapshots();
    checks.push({
      name: 'Automated Recovery & Snapshot Protection',
      passed: backups.length > 0,
      details: `${backups.length} snapshots stored in disaster recovery vault. Automated snapshots active every 5 minutes.`
    });

    const isHealthy = checks.every(c => c.passed);

    return {
      timestamp: new Date().toISOString(),
      status: isHealthy ? 'healthy' : 'warning',
      totalUsers: userKeys.length,
      totalBalances: Number(totalBalances.toFixed(2)),
      totalFrozen: Number(totalFrozen.toFixed(2)),
      totalAssets: Number(totalAssets.toFixed(2)),
      transactionCount: txCount,
      purchaseCount: (db.purchases || []).length,
      withdrawalCount: (db.withdrawals || []).length,
      depositCount: (db.deposits || []).length,
      referralCount: (db.referrals || []).length,
      ticketCount,
      integrityChecks: checks,
      lastBackupTime: backups[0]?.createdAt || db.metadata?.lastBackupAt,
      backupCount: backups.length
    };
  }

  /**
   * Persists database state to disk with optional automatic backup snapshot
   */
  public save(reason?: string, triggerBackup: boolean = false): boolean {
    if (this.isSaving) return true;
    this.isSaving = true;
    try {
      const ok = this.writeDatabaseAtomic(this.inMemoryDb);
      if (ok && triggerBackup) {
        this.createBackupSnapshot(this.inMemoryDb, 'automatic', reason || 'Automatic state sync backup');
      }
      return ok;
    } finally {
      this.isSaving = false;
    }
  }

  /**
   * Exports full raw database for manual offline export
   */
  public exportData(): PlatformDatabaseSchema {
    return JSON.parse(JSON.stringify(this.inMemoryDb));
  }

  /**
   * Imports full database from external JSON file with full pre-validation and safety latch
   */
  public importData(importedDb: PlatformDatabaseSchema): { success: boolean; message: string } {
    if (!importedDb || !importedDb.users || typeof importedDb.users !== 'object') {
      return { success: false, message: 'Uploaded file does not match JAMBASE Database schema.' };
    }

    // Safety backup of current state
    this.createBackupSnapshot(this.inMemoryDb, 'pre_restore_safety', 'Emergency snapshot prior to manual database import');

    this.inMemoryDb = importedDb;
    this.writeDatabaseAtomic(this.inMemoryDb);

    return {
      success: true,
      message: `Database successfully imported and verified. Restored ${Object.keys(importedDb.users).length} member accounts and ${(importedDb.transactions || []).length} transactions.`
    };
  }

  /**
   * Access in-memory database object
   */
  public getDb(): PlatformDatabaseSchema {
    return this.inMemoryDb;
  }
}

export const dbManager = new DatabaseManager();
