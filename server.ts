import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import {
  VIP_TIERS,
  INITIAL_CATEGORIES,
  INITIAL_ARTISTS,
  INITIAL_TICKETS,
  INITIAL_TASKS,
  INITIAL_NOTICES
} from './src/data/seedData';
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
  ReferralMember
} from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json());

// ==========================================
// PERSISTENT DATABASE ENGINE (Server Authoritative & Protected)
// ==========================================
import { dbManager } from './src/server/dbEngine';

const PRIMARY_USER_ID = 'usr-main-777';

let db = dbManager.getDb();
let categories = db.categories;
let tickets = db.tickets;
let artists = db.artists;
let notices = db.notices;
let users = db.users;
let referrals = db.referrals;
let purchases = db.purchases;
let incomeRecords = db.incomeRecords;
let transactions = db.transactions;
let withdrawals = db.withdrawals;
let deposits = db.deposits;
let userTasks = db.userTasks;
let telegramSupportConfig = db.telegramSupportConfig;

/**
 * Resync pointers in memory after a snapshot restore or database import
 */
function syncMemoryPointers() {
  db = dbManager.getDb();
  categories = db.categories;
  tickets = db.tickets;
  artists = db.artists;
  notices = db.notices;
  users = db.users;
  referrals = db.referrals;
  purchases = db.purchases;
  incomeRecords = db.incomeRecords;
  transactions = db.transactions;
  withdrawals = db.withdrawals;
  deposits = db.deposits;
  userTasks = db.userTasks;
  telegramSupportConfig = db.telegramSupportConfig;
}

/**
 * Safely persists database state to disk with optional automatic backup snapshot
 */
function persistDb(reason?: string, triggerBackup: boolean = false) {
  db.categories = categories;
  db.tickets = tickets;
  db.artists = artists;
  db.notices = notices;
  db.users = users;
  db.referrals = referrals;
  db.purchases = purchases;
  db.incomeRecords = incomeRecords;
  db.transactions = transactions;
  db.withdrawals = withdrawals;
  db.deposits = deposits;
  db.userTasks = userTasks;
  db.telegramSupportConfig = telegramSupportConfig;
  dbManager.save(reason, triggerBackup);
}

const OFFICIAL_PAYMENT_ADDRESSES = {
  TRC20: 'TQn9Y2khEsLJW1ChV8L5H09ZNmC9aJbmSe',
  BEP20: '0x71C836069919E3aF2dfA13EBEfDDE0c3065a7828'
};

// Set of processed date-strings for idempotent income scheduler
let processedIncomeDays = new Set<string>();

/**
 * Helper to credit and record Team Commission into completely separate ledger entries
 * Strictly additive, unique collision-free transaction ID, never overwriting existing balances or history!
 */
function creditTeamCommission(
  userId: string,
  sourceMemberId: string,
  sourceMemberName: string,
  tierLevel: 1 | 2 | 3,
  baseYieldAmount: number,
  notes?: string
) {
  const user = users[userId];
  if (!user) return null;

  // Multi-tier commission rates: Tier 1 = 16% (0.16), Tier 2 = 8% (0.08), Tier 3 = 4% (0.04)
  const rateMap: Record<number, number> = { 1: 0.16, 2: 0.08, 3: 0.04 };
  const commissionRate = rateMap[tierLevel] || 0.16;
  const commissionAmount = Number((baseYieldAmount * commissionRate).toFixed(2));

  if (commissionAmount <= 0) return null;

  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  const txId = `TXN-COMM-${Date.now()}-${randomSuffix}`;
  const incId = `INC-COMM-${Date.now()}-${randomSuffix}`;
  const prevBalance = user.balance;

  // Strictly Additive Balance & Cumulative Commission Updates
  user.balance = Number((user.balance + commissionAmount).toFixed(2));
  user.totalTeamCommission = Number(((user.totalTeamCommission || 0) + commissionAmount).toFixed(2));
  user.todayTeamCommission = Number(((user.todayTeamCommission || 0) + commissionAmount).toFixed(2));
  user.totalEarnedIncome = Number(((user.totalEarnedIncome || 0) + commissionAmount).toFixed(2));
  user.totalAssets = Number((user.balance + user.frozenBalance).toFixed(2));

  const tierLabel = tierLevel === 1 ? 'Tier 1 (Direct A - 16%)' : tierLevel === 2 ? 'Tier 2 (Sub-tier B - 8%)' : 'Tier 3 (Sub-tier C - 4%)';

  // 1. Separate Income Record for Team Commission Ledger
  const incRecord: IncomeRecord = {
    id: incId,
    userId: user.id,
    ticketName: `Team Rebate: ${sourceMemberName} (${tierLabel})`,
    categoryType: 'team_commission',
    previousBalance: prevBalance,
    incomeAmount: commissionAmount,
    vipLevel: user.vipLevel,
    dailyRate: commissionRate,
    newBalance: user.balance,
    timestamp: new Date().toISOString(),
    status: 'credited',
    transactionId: txId,
    commissionTier: tierLevel,
    sourceMemberName,
    sourceMemberId,
    notes: notes || `Earned +$${commissionAmount.toFixed(2)} USDT commission (${(commissionRate * 100).toFixed(0)}%) from ${sourceMemberName}'s activity.`
  };
  incomeRecords.unshift(incRecord);

  // 2. Separate Transaction Record for General / Commission Ledger
  const txRecord: Transaction = {
    id: txId,
    userId: user.id,
    type: 'team_commission',
    category: 'team_commission',
    amount: commissionAmount,
    status: 'completed',
    title: `Team Commission: ${tierLabel}`,
    description: `+$${commissionAmount.toFixed(2)} USDT commission from ${sourceMemberName} (Rate: ${(commissionRate * 100).toFixed(0)}%)`,
    commissionTier: tierLevel,
    appliedRate: commissionRate,
    sourceMemberName,
    createdAt: new Date().toISOString()
  };
  transactions.unshift(txRecord);

  persistDb(`Team Commission Credited: +$${commissionAmount.toFixed(2)} from ${sourceMemberName}`);
  return { commissionAmount, txId, incId, incRecord, txRecord };
}

/**
 * Distribute multi-level team commission ONLY from member's daily ticket profit/income.
 * - A Level (Direct Inviter): 16% (0.16)
 * - B Level (Tier 2 Inviter): 8% (0.08)
 * - C Level (Tier 3 Inviter): 4% (0.04)
 * Rules:
 * 1. Strictly calculated from ticket income/profit only.
 * 2. NO commissions calculated from deposits/recharges.
 * 3. NO automatic first-deposit rewards to member or inviter.
 */
function distributeTicketProfitTeamCommissions(sourceUserId: string, ticketProfit: number, ticketName?: string) {
  if (!ticketProfit || ticketProfit <= 0) return;
  const sourceUser = users[sourceUserId];
  if (!sourceUser) return;

  // Level A (Direct inviter - 16%)
  const uplineAId = sourceUser.inviterId || (sourceUserId !== PRIMARY_USER_ID ? PRIMARY_USER_ID : undefined);
  if (uplineAId && users[uplineAId] && uplineAId !== sourceUserId) {
    creditTeamCommission(
      uplineAId,
      sourceUser.id,
      sourceUser.username,
      1,
      ticketProfit,
      `A-Level 16% Team Commission from ${sourceUser.username}'s ticket profit (${ticketName || 'Daily Ticket Yield'})`
    );

    // Level B (Tier 2 inviter - 8%)
    const uplineA = users[uplineAId];
    const uplineBId = uplineA.inviterId;
    if (uplineBId && users[uplineBId] && uplineBId !== uplineAId && uplineBId !== sourceUserId) {
      creditTeamCommission(
        uplineBId,
        sourceUser.id,
        sourceUser.username,
        2,
        ticketProfit,
        `B-Level 8% Team Commission from ${sourceUser.username}'s ticket profit (${ticketName || 'Daily Ticket Yield'})`
      );

      // Level C (Tier 3 inviter - 4%)
      const uplineB = users[uplineBId];
      const uplineCId = uplineB.inviterId;
      if (uplineCId && users[uplineCId] && uplineCId !== uplineBId && uplineCId !== uplineAId && uplineCId !== sourceUserId) {
        creditTeamCommission(
          uplineCId,
          sourceUser.id,
          sourceUser.username,
          3,
          ticketProfit,
          `C-Level 4% Team Commission from ${sourceUser.username}'s ticket profit (${ticketName || 'Daily Ticket Yield'})`
        );
      }
    }
  }
}

/**
 * Check and auto-settle tickets whose 1-minute (60s) period has elapsed.
 * When 1 minute completes:
 * 1. Both Principal Investment AND Configured Ticket Profit return directly to Available Balance!
 * 2. Frozen balance is released.
 * 3. Dedicated VIP Profit income record and transaction log are created with unique IDs.
 * 4. Separate ledger entries are maintained without overwriting any existing balance or history.
 * 5. Strict idempotency prevents any double settlement or duplicate credits.
 * 6. Team commissions (A: 16%, B: 8%, C: 4%) are credited ONLY from ticket profit.
 */
function checkAndSettleFrozenTickets(userId: string) {
  const user = users[userId];
  if (!user) return false;
  const nowMs = Date.now();
  let changed = false;

  for (const p of purchases) {
    if (p.userId === userId && (p.status === 'frozen' || p.status === 'active') && p.frozenUntil) {
      const unfreezeTime = new Date(p.frozenUntil).getTime();
      if (nowMs >= unfreezeTime) {
        // Mark as completed (strictly idempotent transition)
        p.status = 'completed';
        p.settledAt = new Date().toISOString();

        const principal = p.totalAmount || 0;
        const profit = p.profitAmount || 0;
        const totalCredited = Number((principal + profit).toFixed(2));
        const appliedRate = p.vipRateAtPurchase || 0.019;
        const vipLevel = p.vipLevelAtPurchase || user.vipLevel || 1;

        // Release principal from frozenBalance
        user.frozenBalance = Number(Math.max(0, (user.frozenBalance || 0) - principal).toFixed(2));

        // Strictly Additive Balance & Cumulative VIP Profit updates: Principal + Profit returned to Available Balance
        user.balance = Number((user.balance + totalCredited).toFixed(2));
        user.totalVipProfit = Number(((user.totalVipProfit || 0) + profit).toFixed(2));
        user.todayVipProfit = Number(((user.todayVipProfit || 0) + profit).toFixed(2));
        user.todayTicketIncome = Number(((user.todayTicketIncome || 0) + profit).toFixed(2));
        user.totalEarnedIncome = Number(((user.totalEarnedIncome || 0) + profit).toFixed(2));
        user.lastIncomeCalculatedAt = new Date().toISOString();

        const todayKey = new Date().toISOString().slice(0, 10);
        const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
        const recordId = `INC-VIP-${todayKey}-${randomSuffix}`;
        const txId = `TXN-VIP-${Date.now()}-${randomSuffix}`;

        // 1. Add Dedicated VIP Profit Income Record in Separate VIP Ledger
        incomeRecords.unshift({
          id: recordId,
          userId: user.id,
          ticketName: `${p.ticketName} (1-Min Yield Settlement)`,
          categoryType: 'vip_profit',
          previousBalance: Number((user.balance - totalCredited).toFixed(2)),
          incomeAmount: profit,
          vipLevel: vipLevel,
          dailyRate: appliedRate,
          newBalance: user.balance,
          timestamp: new Date().toISOString(),
          status: 'credited',
          transactionId: txId,
          notes: `1-Minute Ticket Auto-Settled: Principal $${principal.toFixed(2)} returned + VIP profit +$${profit.toFixed(2)} (${(appliedRate * 100).toFixed(1)}%) credited to Available Balance.`
        });

        // 2. Add Dedicated VIP Profit Settlement Transaction in Ledger
        transactions.unshift({
          id: txId,
          userId: user.id,
          type: 'vip_profit',
          category: 'vip_profit',
          amount: totalCredited,
          vipLevel: vipLevel,
          appliedRate: appliedRate,
          status: 'completed',
          title: `Ticket Settlement: ${p.ticketName}`,
          description: `Principal $${principal.toFixed(2)} + Profit +$${profit.toFixed(2)} USDT returned to Available Balance (Total: +$${totalCredited.toFixed(2)} USDT)`,
          createdAt: new Date().toISOString()
        });

        // 3. Distribute Team Commission strictly from ticket profit (A: 16%, B: 8%, C: 4%)
        distributeTicketProfitTeamCommissions(user.id, profit, p.ticketName);

        changed = true;
      }
    }
  }

  if (changed) {
    user.totalAssets = Number((user.balance + (user.frozenBalance || 0)).toFixed(2));
    persistDb('Ticket Settlement Completed');
  }
  return changed;
}

/**
 * Safely resolves the active user ID from HTTP headers (X-User-Id) or query params,
 * falling back to PRIMARY_USER_ID. Validates that the user exists in memory.
 */
function resolveUserId(req: express.Request): string {
  const headerUserId = req.headers['x-user-id'] as string;
  if (headerUserId && users[headerUserId]) return headerUserId;
  const queryUserId = req.query.userId as string;
  if (queryUserId && users[queryUserId]) return queryUserId;
  return PRIMARY_USER_ID;
}

/**
 * Recalculate user's VIP level, valid direct members count, daily ticket balance cycle, and income pause state
 * VIP 1: $30–$499, 0 direct members, 1.9%
 * VIP 2: $500–$1,999, min 3 direct members, 2.5%
 * VIP 3: $2,000–$4,999, min 5 direct members, 3.0%
 * VIP 4: $5,000–$20,000, min 10 direct members, 4.0%
 * VIP 5: $20,000–$50,000, min 20 direct members, 5.0%
 * VIP 6: $50,000–$500,000, min 50 direct members, 6.0%
 * 
 * NOTE: User balance, accumulated VIP profits, accumulated team commission, income records,
 * and transaction history are NEVER overwritten or reset!
 */
function recalculateUserState(userId: string = PRIMARY_USER_ID) {
  checkAndSettleFrozenTickets(userId);

  const user = users[userId];
  if (!user) return null;

  // Initialize separated ledger cumulative metrics safely if not yet set
  if (user.totalVipProfit === undefined || user.totalVipProfit === null) {
    const vipSum = incomeRecords
      .filter(r => r.userId === user.id && (r.categoryType === 'vip_profit' || r.categoryType === 'ticket'))
      .reduce((sum, r) => sum + (r.incomeAmount || 0), 0);
    user.totalVipProfit = Number(vipSum.toFixed(2)) || (user.id === PRIMARY_USER_ID ? 54.50 : 0.0);
  }

  if (user.totalTeamCommission === undefined || user.totalTeamCommission === null) {
    const commSum = incomeRecords
      .filter(r => r.userId === user.id && r.categoryType === 'team_commission')
      .reduce((sum, r) => sum + (r.incomeAmount || 0), 0);
    user.totalTeamCommission = Number(commSum.toFixed(2)) || (user.id === PRIMARY_USER_ID ? 30.00 : 0.0);
  }

  if (user.todayVipProfit === undefined || user.todayVipProfit === null) {
    user.todayVipProfit = user.todayTicketIncome || 0;
  }

  if (user.todayTeamCommission === undefined || user.todayTeamCommission === null) {
    user.todayTeamCommission = 0;
  }

  const todayUtc = new Date().toISOString().slice(0, 10);

  // UTC Daily Ticket Balance Cycle initialization / reset
  if (!user.dailyTicketDate || user.dailyTicketDate !== todayUtc) {
    user.dailyTicketDate = todayUtc;
    // On each new UTC day, the daily ticket starting balance resets to the member's available balance
    user.dailyTicketStartingBalance = user.balance;
    user.dailyTicketSpent = 0;
    user.todayTicketIncome = 0;
    user.todayVipProfit = 0;
    user.todayTeamCommission = 0;
  }

  // Ensure dailyTicketStartingBalance accommodates any deposits or balances
  const effectiveCurrentPotential = Number((user.balance + (user.dailyTicketSpent || 0)).toFixed(2));
  if (user.dailyTicketStartingBalance === undefined || user.dailyTicketStartingBalance === null || effectiveCurrentPotential > user.dailyTicketStartingBalance) {
    user.dailyTicketStartingBalance = effectiveCurrentPotential;
  }
  if (user.dailyTicketSpent === undefined || user.dailyTicketSpent === null) {
    user.dailyTicketSpent = 0;
  }

  // Calculate valid direct members (must have minimum $30 deposit/balance)
  const validDirectMembers = referrals.filter(r => (r.userId === user.id || (!r.userId && user.id === PRIMARY_USER_ID)) && r.level === 1 && r.isValid && (r.totalDeposit >= 30 || r.balance >= 30)).length;
  user.validDirectMembersCount = validDirectMembers;

  user.totalAssets = Number((user.balance + user.frozenBalance).toFixed(2));

  // Determine VIP level based on balance AND valid direct members
  const totalFunds = user.totalAssets;
  let computedVIP = 1;

  if (totalFunds >= 50000 && validDirectMembers >= 50) {
    computedVIP = 6;
  } else if (totalFunds >= 20000 && validDirectMembers >= 20) {
    computedVIP = 5;
  } else if (totalFunds >= 5000 && validDirectMembers >= 10) {
    computedVIP = 4;
  } else if (totalFunds >= 2000 && validDirectMembers >= 5) {
    computedVIP = 3;
  } else if (totalFunds >= 500 && validDirectMembers >= 3) {
    computedVIP = 2;
  } else if (totalFunds >= 30) {
    computedVIP = 1;
  } else {
    computedVIP = 1;
  }

  user.vipLevel = computedVIP;

  // MINIMUM BALANCE REQUIREMENT: $30
  // If totalAssets < 30, income must pause and ticket purchases must be blocked
  if (user.totalAssets < 30) {
    user.isIncomePaused = true;
    user.incomePauseReason = 'Minimum $30.00 Account Balance Required to Work and Earn VIP Yield';
  } else {
    user.isIncomePaused = false;
    user.incomePauseReason = undefined;
  }

  return user;
}

// ==========================================
// API ROUTES
// ==========================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), platform: 'JAMBASE' });
});

// GET Current User Profile & Synchronized State
app.get('/api/user', (req, res) => {
  const targetId = resolveUserId(req);
  const user = recalculateUserState(targetId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// GET VIP Tiers Info
app.get('/api/vip-tiers', (req, res) => {
  res.json(VIP_TIERS);
});

// GET Tickets (with optional category filter)
app.get('/api/tickets', (req, res) => {
  const { category, search } = req.query;
  let filtered = [...tickets];

  if (category && category !== 'all') {
    filtered = filtered.filter(t => t.category.toLowerCase() === String(category).toLowerCase());
  }

  if (search) {
    const q = String(search).toLowerCase();
    filtered = filtered.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      t.venue.toLowerCase().includes(q) ||
      t.location.toLowerCase().includes(q)
    );
  }

  res.json(filtered);
});

// GET Categories
app.get('/api/categories', (req, res) => {
  res.json(categories);
});

// GET Artists
app.get('/api/artists', (req, res) => {
  res.json(artists);
});

// GET Notices
app.get('/api/notices', (req, res) => {
  res.json(notices);
});

// POST Purchase Ticket(s)
// TICKET PURCHASE & BALANCE RULES:
// 1. Immediately after purchase, exactly the ticket total is deducted from Available Balance (e.g. $100 - $10 = $90).
// 2. The ticket enters an active/processing state.
// 3. After exactly 1 minute (60s), the ticket is automatically settled.
// 4. At settlement, Principal + Profit defined by the ticket rate is credited back to Available Balance.
// 5. The member is NOT restricted to one ticket per day.
// 6. The remaining Available Balance remains usable immediately to purchase more tickets anytime.
// 7. Any ticket denomination allowed by the system can be purchased without VIP level restrictions.
// 8. Available Balance is validated before every purchase.
app.post('/api/tickets/purchase', (req, res) => {
  const { ticketId, quantity } = req.body;
  const targetId = resolveUserId(req);
  const user = recalculateUserState(targetId);

  if (!user) return res.status(404).json({ error: 'User not found' });

  // STRICT REQUIREMENT: Member must maintain minimum $30.00 total account assets to work
  if ((user.totalAssets || 0) < 30 && (user.balance || 0) < 30) {
    return res.status(400).json({
      error: 'Insufficient Balance — Your available balance is below $30. Please recharge your account to purchase tickets.'
    });
  }

  const qty = parseInt(quantity, 10);
  if (isNaN(qty) || qty < 1 || qty > 100) {
    return res.status(400).json({ error: 'Invalid quantity (must be between 1 and 100)' });
  }

  const ticket = tickets.find(t => t.id === ticketId);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  if (!ticket.isActive) {
    return res.status(400).json({ error: 'This ticket event is currently inactive' });
  }

  // Authoritative server-side price calculation
  const totalAmount = Number((ticket.price * qty).toFixed(2));

  // Validate Available Balance before purchase: Must have enough available wallet balance
  if (user.balance < totalAmount) {
    return res.status(400).json({
      error: `Insufficient available balance ($${user.balance.toFixed(2)}). Required: $${totalAmount.toFixed(2)}. Please recharge or select a lower ticket denomination.`
    });
  }

  // Determine VIP Tier and daily rate
  const tier = VIP_TIERS.find(t => t.level === user.vipLevel) || VIP_TIERS[0];
  const rate = tier.dailyRate; // e.g. VIP 1 = 1.9%, VIP 2 = 2.5%, VIP 3 = 3.0%, etc.

  // STRICT RULE: Profit is generated ONLY on the purchased ticket amount
  const profitAmount = Number((totalAmount * rate).toFixed(2));

  // Exactly deduct purchase amount from available balance into frozen state
  const prevAvailableBalance = user.balance;
  user.balance = Number((user.balance - totalAmount).toFixed(2));
  user.frozenBalance = Number(((user.frozenBalance || 0) + totalAmount).toFixed(2));
  user.recordExpenditure = Number(((user.recordExpenditure || 0) + totalAmount).toFixed(2));
  user.dailyTicketSpent = Number(((user.dailyTicketSpent || 0) + totalAmount).toFixed(2));

  // Update ticket sold count
  ticket.soldCount += qty;

  const now = new Date();
  // EXACTLY 1 MINUTE (60 SECONDS) CYCLE
  const frozenUntil = new Date(Date.now() + 1 * 60 * 1000).toISOString();

  // Record Purchase with unique ID as frozen/processing (auto-settles in 1 minute)
  const uniquePurchaseId = `PUR-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const newPurchase: TicketPurchase = {
    id: uniquePurchaseId,
    userId: user.id,
    ticketId: ticket.id,
    ticketName: ticket.name,
    artist: ticket.artist,
    image: ticket.image,
    unitPrice: ticket.price,
    quantity: qty,
    totalAmount,
    vipLevelAtPurchase: user.vipLevel,
    vipRateAtPurchase: rate,
    profitAmount,
    frozenUntil,
    createdAt: now.toISOString(),
    status: 'frozen'
  };
  purchases.unshift(newPurchase);

  // Add Purchase Transaction record with unique ID and category in member ledger
  const txId = `TXN-PUR-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const newTx: Transaction = {
    id: txId,
    userId: user.id,
    type: 'ticket_purchase',
    category: 'ticket_purchase',
    amount: totalAmount,
    previousBalance: prevAvailableBalance,
    newBalance: user.balance,
    vipLevel: user.vipLevel,
    appliedRate: rate,
    status: 'completed',
    title: `Purchased ${qty}x ${ticket.name}`,
    description: `Ticket purchase of $${totalAmount.toFixed(2)}. In 1 minute, Principal ($${totalAmount.toFixed(2)}) and Profit (+$${profitAmount.toFixed(2)} USDT) will automatically return to your Available Balance.`,
    createdAt: now.toISOString()
  };
  transactions.unshift(newTx);

  recalculateUserState(user.id);
  persistDb(`Ticket Purchased: ${ticket.name} (1-Min Cycle)`);

  res.json({
    success: true,
    message: `Ticket #${uniquePurchaseId} purchased successfully! $${totalAmount.toFixed(2)} deducted from Available Balance (Remaining Available: $${user.balance.toFixed(2)}). In exactly 1 minute, your ticket will auto-settle, returning your $${totalAmount.toFixed(2)} principal + $${profitAmount.toFixed(2)} USDT profit back to your Available Balance.`,
    purchase: newPurchase,
    newBalance: user.balance,
    frozenBalance: user.frozenBalance,
    totalAssets: user.totalAssets,
    user
  });
});

// POST Claim Daily 24-Hour UTC Profit
// STRICT USER RULES:
// 1. Member can earn income ONCE A DAY (24-hour UTC reset).
// 2. Everyone earns profit strictly according to their VIP level rate (VIP1: 1.9%, VIP2: 2.5%, VIP3: 3.0%, VIP4: 4.0%, VIP5: 5.0%, VIP6: 6.0%).
// 3. Profit is calculated on AVAILABLE BALANCE, NOT on isolated investment amounts.
// 4. Compounding Profit: Every day as balance increases with profit/recharges, the daily profit grows automatically on the larger balance.
// 5. Minimum $30 balance required.
const handleDailyProfitClaim = (req: express.Request, res: express.Response) => {
  const targetId = resolveUserId(req);
  const user = recalculateUserState(targetId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const todayUtc = new Date().toISOString().slice(0, 10);
  if (user.lastProfitClaimDate === todayUtc) {
    return res.status(400).json({
      error: `Daily income can be earned only once a day. You have already claimed your VIP profit for UTC ${todayUtc}. Next daily profit unlocks at 00:00 UTC.`
    });
  }

  // Minimum balance verification ($30)
  if (user.balance < 30) {
    return res.status(400).json({
      error: 'Minimum $30.00 Available Balance is required to earn daily VIP compound profit. Please recharge your account.'
    });
  }

  // Find VIP tier and rate
  const tier = VIP_TIERS.find(t => t.level === user.vipLevel) || VIP_TIERS[0];
  const appliedRate = tier.dailyRate; // e.g. 0.019 (1.9%) for VIP1

  // PROFIT ONLY ON AVAILABLE BALANCE with Daily Compounding:
  const baseAvailableBalance = Number(user.balance.toFixed(2));
  const dailyProfit = Number((baseAvailableBalance * appliedRate).toFixed(2));

  if (dailyProfit <= 0) {
    return res.status(400).json({
      error: 'Available balance is insufficient to generate profit.'
    });
  }

  const prevBalance = user.balance;
  // Compounding balance credit: profit is directly added to available balance
  user.balance = Number((user.balance + dailyProfit).toFixed(2));
  user.totalVipProfit = Number(((user.totalVipProfit || 0) + dailyProfit).toFixed(2));
  user.todayVipProfit = dailyProfit;
  user.todayTicketIncome = dailyProfit;
  user.totalEarnedIncome = Number(((user.totalEarnedIncome || 0) + dailyProfit).toFixed(2));
  user.lastProfitClaimDate = todayUtc;
  user.lastDailyIncomeDate = todayUtc;
  user.lastIncomeCalculatedAt = new Date().toISOString();

  // If there were any active purchases, mark them settled as part of daily cycle
  const activePurchases = purchases.filter(p => p.userId === user.id && (p.status === 'active' || p.status === 'frozen'));
  activePurchases.forEach(p => {
    p.status = 'completed';
    p.settledAt = new Date().toISOString();
  });

  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  const txId = `TXN-VIP-${Date.now()}-${randomSuffix}`;
  const incId = `INC-VIP-${todayUtc}-${randomSuffix}`;

  // 1. Add Dedicated VIP Profit Income Record
  incomeRecords.unshift({
    id: incId,
    userId: user.id,
    ticketName: `Daily VIP ${user.vipLevel} Compound Yield (${(appliedRate * 100).toFixed(1)}%)`,
    categoryType: 'vip_profit',
    previousBalance: prevBalance,
    incomeAmount: dailyProfit,
    vipLevel: user.vipLevel,
    dailyRate: appliedRate,
    newBalance: user.balance,
    timestamp: new Date().toISOString(),
    status: 'credited',
    transactionId: txId,
    notes: `Daily VIP ${user.vipLevel} Profit (${(appliedRate * 100).toFixed(1)}%) earned on $${baseAvailableBalance.toFixed(2)} available balance. Compounded to new balance: $${user.balance.toFixed(2)}.`
  });

  // 2. Add Dedicated VIP Profit Transaction in Ledger
  transactions.unshift({
    id: txId,
    userId: user.id,
    type: 'vip_profit',
    category: 'vip_profit',
    amount: dailyProfit,
    vipLevel: user.vipLevel,
    appliedRate: appliedRate,
    status: 'completed',
    title: `Daily VIP ${user.vipLevel} Compound Profit (UTC ${todayUtc})`,
    description: `+$${dailyProfit.toFixed(2)} USDT earned (${(appliedRate * 100).toFixed(1)}% on $${baseAvailableBalance.toFixed(2)} balance). Balance compounded to $${user.balance.toFixed(2)}.`,
    createdAt: new Date().toISOString()
  });

  // Distribute Team Commission strictly from daily ticket profit (A: 16%, B: 8%, C: 4%)
  distributeTicketProfitTeamCommissions(user.id, dailyProfit, `Daily VIP ${user.vipLevel} Yield`);

  recalculateUserState(user.id);
  persistDb(`Daily VIP Profit Claimed: +$${dailyProfit.toFixed(2)}`);

  res.json({
    success: true,
    message: `Successfully earned +$${dailyProfit.toFixed(2)} USDT daily VIP ${user.vipLevel} profit on your $${baseAvailableBalance.toFixed(2)} balance! Your new compounded balance is $${user.balance.toFixed(2)} USDT.`,
    totalCredited: dailyProfit,
    totalProfit: dailyProfit,
    baseBalance: baseAvailableBalance,
    appliedRate,
    vipLevel: user.vipLevel,
    newBalance: user.balance,
    user
  });
};

app.post('/api/tickets/claim-profit', handleDailyProfitClaim);
app.post('/api/income/claim-daily', handleDailyProfitClaim);
app.post('/api/income/claim-daily-vip', handleDailyProfitClaim);

// GET Separate Ledger Breakdown API
// Completely separates VIP Profit ledger from Team Commission ledger!
app.get('/api/ledger/breakdown', (req, res) => {
  const targetId = resolveUserId(req);
  const user = recalculateUserState(targetId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const userRecords = incomeRecords.filter(r => r.userId === user.id);
  const userTx = transactions.filter(t => t.userId === user.id);

  // 1. Completely Separate VIP Profit Ledger
  const vipProfitIncome = userRecords.filter(r => r.categoryType === 'vip_profit' || r.categoryType === 'ticket');
  const vipProfitTransactions = userTx.filter(t => t.type === 'vip_profit' || t.category === 'vip_profit' || t.type === 'daily_income');

  // 2. Completely Separate Team Commission Ledger
  const teamCommissionIncome = userRecords.filter(r => r.categoryType === 'team_commission');
  const teamCommissionTransactions = userTx.filter(t => t.type === 'team_commission' || t.category === 'team_commission' || t.type === 'referral_commission');

  // 3. Other Specific Ledgers
  const depositTransactions = userTx.filter(t => t.type === 'deposit' || t.category === 'deposit');
  const withdrawalTransactions = userTx.filter(t => t.type === 'withdrawal' || t.category === 'withdrawal');
  const purchaseTransactions = userTx.filter(t => t.type === 'ticket_purchase' || t.category === 'ticket_purchase');
  const taskRewardTransactions = userTx.filter(t => t.type === 'task_reward' || t.category === 'task_reward');

  const vipTier = VIP_TIERS.find(t => t.level === user.vipLevel) || VIP_TIERS[0];

  res.json({
    summary: {
      availableBalance: user.balance,
      frozenBalance: user.frozenBalance,
      totalAssets: user.totalAssets,
      vipLevel: user.vipLevel,
      vipDailyRate: vipTier.dailyRate,
      vipDailyRatePercent: `${(vipTier.dailyRate * 100).toFixed(1)}%`,
      totalVipProfit: user.totalVipProfit || 0,
      todayVipProfit: user.todayVipProfit || 0,
      totalTeamCommission: user.totalTeamCommission || 0,
      todayTeamCommission: user.todayTeamCommission || 0,
      totalEarnedIncome: user.totalEarnedIncome || 0,
      commissionRates: {
        tier1: '16.0%',
        tier2: '8.0%',
        tier3: '4.0%'
      }
    },
    vipProfitLedger: {
      totalVipProfit: user.totalVipProfit || 0,
      todayVipProfit: user.todayVipProfit || 0,
      records: vipProfitIncome,
      transactions: vipProfitTransactions
    },
    teamCommissionLedger: {
      totalTeamCommission: user.totalTeamCommission || 0,
      todayTeamCommission: user.todayTeamCommission || 0,
      records: teamCommissionIncome,
      transactions: teamCommissionTransactions
    },
    otherLedgers: {
      deposits: depositTransactions,
      withdrawals: withdrawalTransactions,
      ticketPurchases: purchaseTransactions,
      taskRewards: taskRewardTransactions
    },
    allTransactions: userTx,
    allIncomeRecords: userRecords
  });
});

// POST Claim or Distribute Team Rebate / Commission (16% / 8% / 4%)
app.post('/api/team/claim-commission', (req, res) => {
  const targetId = resolveUserId(req);
  const user = recalculateUserState(targetId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Example automated rebate generation from active direct referrals
  const validDirects = referrals.filter(r => r.level === 1 && r.isValid);
  if (validDirects.length === 0) {
    return res.status(400).json({ error: 'No active direct team members available for rebate claim.' });
  }

  // Credit a realistic rebate reward from the first active referral for testing/claiming
  const ref = validDirects[0];
  const yieldSimulated = 50.0; // base yield activity
  const result = creditTeamCommission(
    user.id,
    ref.id,
    ref.username,
    1, // Tier 1 Direct (16%)
    yieldSimulated,
    `Direct Level A 16.0% commission from ${ref.username}'s daily concert yield ($${yieldSimulated.toFixed(2)})`
  );

  if (!result) {
    return res.status(400).json({ error: 'Failed to process team commission' });
  }

  recalculateUserState(user.id);

  res.json({
    success: true,
    message: `Successfully credited +$${result.commissionAmount.toFixed(2)} USDT team commission (Tier 1 - 16%) into your dedicated Team Commission ledger!`,
    commissionAmount: result.commissionAmount,
    txId: result.txId,
    user
  });
});

// POST Admin Distribute Multi-Tier Referral Commission (16% Level A / 8% Level B / 4% Level C)
app.post('/api/admin/distribute-team-commission', (req, res) => {
  const { targetUserId, sourceMemberId, sourceMemberName, tierLevel, baseAmount, notes } = req.body;
  const userToCredit = targetUserId || PRIMARY_USER_ID;
  const tier = (parseInt(tierLevel, 10) || 1) as 1 | 2 | 3;
  const base = parseFloat(baseAmount) || 100.0;

  const result = creditTeamCommission(
    userToCredit,
    sourceMemberId || 'ref-admin-sim',
    sourceMemberName || 'Team_Member',
    tier,
    base,
    notes
  );

  if (!result) {
    return res.status(400).json({ error: 'Could not credit team commission. Amount must be positive.' });
  }

  const updatedUser = recalculateUserState(userToCredit);

  res.json({
    success: true,
    message: `Credited +$${result.commissionAmount.toFixed(2)} USDT commission (Tier ${tier}) to ${updatedUser?.username || userToCredit}`,
    result,
    user: updatedUser
  });
});

// POST Settle Ticket Purchases (Check and unfreeze/credit 2-min tickets)
app.post('/api/tickets/settle', (req, res) => {
  const targetId = resolveUserId(req);
  const settled = checkAndSettleFrozenTickets(targetId);
  const user = recalculateUserState(targetId);
  const userPurchases = purchases.filter(p => p.userId === targetId);
  
  res.json({
    success: true,
    settled,
    user,
    purchases: userPurchases
  });
});

// GET User Purchases
app.get('/api/purchases', (req, res) => {
  const targetId = resolveUserId(req);
  const userPurchases = purchases.filter(p => p.userId === targetId);
  res.json(userPurchases);
});

// GET Income Summary & Records
app.get('/api/income', (req, res) => {
  const targetId = resolveUserId(req);
  const user = recalculateUserState(targetId);
  const records = incomeRecords.filter(r => r.userId === targetId);
  const userPurchases = purchases.filter(p => p.userId === targetId);
  const activePurchases = userPurchases.filter(p => p.status === 'active' || p.status === 'frozen');
  
  const todayUtc = new Date().toISOString().slice(0, 10);
  const isClaimedToday = user?.lastProfitClaimDate === todayUtc;
  const todayPurchasedTotal = Number(activePurchases.reduce((sum, p) => sum + p.totalAmount, 0).toFixed(2));
  const todayPendingProfit = Number(activePurchases.reduce((sum, p) => sum + (p.profitAmount || 0), 0).toFixed(2));
  const startingBalance = user?.dailyTicketStartingBalance ?? (user?.balance || 0);
  const spentToday = user?.dailyTicketSpent ?? 0;
  const remainingDailyTicketBalance = Math.max(0, Number((startingBalance - spentToday).toFixed(2)));

  res.json({
    user,
    records,
    activePurchases,
    todayPurchasedTotal,
    todayPendingProfit,
    isClaimedToday,
    currentUtcDate: todayUtc,
    dailyTicketStartingBalance: startingBalance,
    dailyTicketSpent: spentToday,
    remainingDailyTicketBalance,
    summary: {
      totalAssets: user?.totalAssets || 0,
      availableBalance: user?.balance || 0,
      frozenAssets: user?.frozenBalance || 0,
      todayTicketIncome: user?.todayTicketIncome || 0,
      todayConcertIncome: user?.todayConcertIncome || 0,
      todayFinancialIncome: user?.todayFinancialIncome || 0,
      totalIncome: user?.totalEarnedIncome || 0,
      recordExpenditure: user?.recordExpenditure || 0,
      concertExpenditure: user?.concertExpenditure || 0,
      financialExpenditure: user?.financialExpenditure || 0,
      isIncomePaused: user?.isIncomePaused || false,
      incomePauseReason: user?.incomePauseReason
    }
  });
});

// POST Trigger Daily Income Calculation - Redirects to Ticket Profit Claim
app.post('/api/income/calculate-daily', (req, res) => {
  res.redirect(307, '/api/tickets/claim-profit');
});

// GET Finance Dashboard (Balances, History, Withdrawals, Deposits)
app.get('/api/finance', (req, res) => {
  const targetId = resolveUserId(req);
  const user = recalculateUserState(targetId);
  const userTx = transactions.filter(t => t.userId === targetId);
  const userWd = withdrawals.filter(w => w.userId === targetId);
  const userDep = deposits.filter(d => d.userId === targetId);

  res.json({
    user,
    transactions: userTx,
    withdrawals: userWd,
    deposits: userDep
  });
});

// POST Create Deposit / Recharge Request (Strictly Pending until Admin Manual Approval)
app.post('/api/finance/deposit', (req, res) => {
  const { amount, network, txHash, txUid, walletAddress } = req.body;
  const targetId = resolveUserId(req);
  const user = users[targetId] || users[PRIMARY_USER_ID];
  if (!user) return res.status(404).json({ error: 'User not found' });

  const depAmount = parseFloat(amount);
  if (isNaN(depAmount) || depAmount < 10) {
    return res.status(400).json({ error: 'Minimum deposit amount is $10.00' });
  }

  const cleanNetwork = network === 'BEP20' ? 'BEP20' : 'TRC20';
  const targetWallet = walletAddress?.trim() || user.walletAddress || (cleanNetwork === 'BEP20' ? OFFICIAL_PAYMENT_ADDRESSES.BEP20 : OFFICIAL_PAYMENT_ADDRESSES.TRC20);
  const rawTx = (txHash || txUid || '')?.trim();
  const cleanTxHash = rawTx ? rawTx : `TXID-${Date.now().toString().slice(-8)}`;

  const newDeposit: DepositRequest = {
    id: `DEP-${Date.now().toString().slice(-6)}`,
    userId: user.id,
    username: user.username,
    userEmail: user.email,
    userPhone: user.phone,
    userBalanceAtRequest: user.balance,
    currentUserBalance: user.balance,
    amount: depAmount,
    network: cleanNetwork,
    walletAddress: targetWallet,
    txHash: cleanTxHash,
    txUid: cleanTxHash,
    status: 'Pending', // STRICTLY PENDING: Must be manually approved by Admin in Admin Panel
    createdAt: new Date().toISOString()
  };

  deposits.unshift(newDeposit);

  // Record pending transaction in member ledger (Balance is NOT credited until Admin manual approval)
  transactions.unshift({
    id: `TXN-DEP-${Date.now()}`,
    userId: user.id,
    type: 'deposit',
    category: 'deposit',
    amount: depAmount,
    previousBalance: user.balance,
    newBalance: user.balance,
    status: 'pending', // STRICTLY PENDING
    title: `USDT Recharge Request (${cleanNetwork})`,
    description: `Recharge request of $${depAmount.toFixed(2)} USDT submitted (TXID/UID: ${cleanTxHash}). Pending manual Admin review and approval.`,
    txHash: newDeposit.txHash,
    createdAt: new Date().toISOString()
  });

  recalculateUserState(user.id);
  persistDb(`Recharge Request Submitted (Pending Admin Approval): $${depAmount} by ${user.username}`);

  res.json({
    success: true,
    message: `Recharge request of $${depAmount.toFixed(2)} USDT submitted successfully! Status is Pending manual Admin review and approval.`,
    deposit: newDeposit,
    user
  });
});

// POST Create Withdrawal Request
// Checks available balance, reserves/freezes requested amount while strictly Pending Admin approval
app.post('/api/finance/withdraw', (req, res) => {
  const { amount, walletAddress, network } = req.body;
  const targetId = resolveUserId(req);
  const user = users[targetId] || users[PRIMARY_USER_ID];
  if (!user) return res.status(404).json({ error: 'User not found' });

  const wdAmount = parseFloat(amount);
  if (isNaN(wdAmount) || wdAmount < 10) {
    return res.status(400).json({ error: 'Minimum withdrawal amount is $10.00' });
  }

  if (user.balance < wdAmount) {
    return res.status(400).json({
      error: `Insufficient available balance ($${user.balance.toFixed(2)}). Cannot withdraw $${wdAmount.toFixed(2)}.`
    });
  }

  // 5% platform service fee calculation
  const fee = Number((wdAmount * 0.05).toFixed(2));
  const netAmount = Number((wdAmount - fee).toFixed(2));
  const cleanNetwork = network === 'BEP20' ? 'BEP20' : 'TRC20';
  const targetWallet = walletAddress?.trim() || user.walletAddress || (cleanNetwork === 'BEP20' ? OFFICIAL_PAYMENT_ADDRESSES.BEP20 : OFFICIAL_PAYMENT_ADDRESSES.TRC20);

  // Reserve/Freeze funds safely from available balance
  const previousBalance = user.balance;
  user.balance = Number((user.balance - wdAmount).toFixed(2));
  user.frozenBalance = Number(((user.frozenBalance || 0) + wdAmount).toFixed(2));

  const txId = `WD-${Math.floor(1000 + Math.random() * 9000)}`;

  const newWd: WithdrawalRequest = {
    id: txId,
    userId: user.id,
    username: user.username,
    userEmail: user.email || `${user.username.toLowerCase()}@member.jambase.vip`,
    userPhone: user.phone || '+1 (555) 839-2041',
    userBalanceAtRequest: previousBalance,
    currentUserBalance: user.balance,
    amount: wdAmount,
    fee,
    netAmount,
    walletAddress: targetWallet,
    network: cleanNetwork,
    status: 'Pending', // STRICTLY PENDING: Must be manually approved or rejected by Admin
    createdAt: new Date().toISOString(),
    txId: `${txId}-USDT`
  };

  withdrawals.unshift(newWd);

  transactions.unshift({
    id: `TXN-WD-${Date.now()}`,
    userId: user.id,
    type: 'withdrawal',
    category: 'withdrawal',
    amount: wdAmount,
    fee,
    previousBalance,
    newBalance: user.balance,
    status: 'pending', // STRICTLY PENDING
    title: `Withdrawal Request (${cleanNetwork})`,
    description: `Net payout: $${netAmount.toFixed(2)} USDT (Fee: $${fee.toFixed(2)} [5%]). Reserved in frozen balance pending Admin review.`,
    createdAt: new Date().toISOString()
  });

  recalculateUserState(user.id);
  persistDb(`Withdrawal Requested (Pending Admin Approval): $${wdAmount} by ${user.username}`);

  res.json({
    success: true,
    message: `Withdrawal request for $${wdAmount.toFixed(2)} USDT submitted successfully. Funds held in frozen balance pending Admin review.`,
    withdrawal: newWd,
    user
  });
});

// GET Team & Referrals (Commission tiers 16% / 8% / 4%)
app.get('/api/team', (req, res) => {
  const targetId = resolveUserId(req);
  const user = recalculateUserState(targetId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  const userReferrals = referrals.filter(r => (r as any).uplineId === user.id || (!(r as any).uplineId && user.id === PRIMARY_USER_ID));
  res.json({
    user,
    referrals: userReferrals,
    commissionRates: {
      tier1: 0.16, // 16% Level A direct
      tier2: 0.08, // 8% Level B
      tier3: 0.04  // 4% Level C
    },
    summary: {
      directValidCount: userReferrals.filter(r => r.level === 1 && r.isValid).length,
      directTotalCount: userReferrals.filter(r => r.level === 1).length,
      level2Count: userReferrals.filter(r => r.level === 2).length,
      level3Count: userReferrals.filter(r => r.level === 3).length,
      totalTeamDeposit: userReferrals.reduce((sum, r) => sum + r.totalDeposit, 0)
    }
  });
});

// GET Tasks (Strictly the 4 Referral & Activation Milestone Tasks)
app.get('/api/tasks', (req, res) => {
  const targetId = resolveUserId(req);
  const user = recalculateUserState(targetId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const userReferrals = referrals.filter(r => (r as any).uplineId === user.id || (!(r as any).uplineId && user.id === PRIMARY_USER_ID));
  const validDirectCount = userReferrals.filter(r => r.level === 1 && r.isValid).length;
  const claimedIds = user.claimedTaskIds || [];

  const dynamicTasks: TaskItem[] = [
    {
      id: 'task-invite-5',
      title: 'Invite 5 valid A-level direct members',
      description: 'Invite 5 valid A-level direct members to claim $15 reward',
      rewardAmount: 15.0,
      rewardType: 'balance',
      progress: Math.min(5, validDirectCount),
      maxProgress: 5,
      isCompleted: validDirectCount >= 5,
      isClaimed: claimedIds.includes('task-invite-5'),
      icon: 'Users',
      category: 'growth'
    },
    {
      id: 'task-activate-10',
      title: 'Activate 10 valid A-level direct members',
      description: 'Activate 10 valid A-level direct members to claim $30 reward',
      rewardAmount: 30.0,
      rewardType: 'balance',
      progress: Math.min(10, validDirectCount),
      maxProgress: 10,
      isCompleted: validDirectCount >= 10,
      isClaimed: claimedIds.includes('task-activate-10'),
      icon: 'Users',
      category: 'growth'
    },
    {
      id: 'task-activate-20',
      title: 'Activate 20 valid A-level direct members',
      description: 'Activate 20 valid A-level direct members to claim $100 reward',
      rewardAmount: 100.0,
      rewardType: 'balance',
      progress: Math.min(20, validDirectCount),
      maxProgress: 20,
      isCompleted: validDirectCount >= 20,
      isClaimed: claimedIds.includes('task-activate-20'),
      icon: 'Users',
      category: 'growth'
    },
    {
      id: 'task-activate-50',
      title: 'Activate 50 valid direct members',
      description: 'Activate 50 valid direct members to claim $500 reward',
      rewardAmount: 500.0,
      rewardType: 'balance',
      progress: Math.min(50, validDirectCount),
      maxProgress: 50,
      isCompleted: validDirectCount >= 50,
      isClaimed: claimedIds.includes('task-activate-50'),
      icon: 'Users',
      category: 'growth'
    }
  ];

  res.json(dynamicTasks);
});

// POST Task Claim - Claim $15 / $30 / $100 / $500 reward when condition is completed
app.post('/api/tasks/claim', (req, res) => {
  const { taskId } = req.body;
  const targetId = resolveUserId(req);
  const user = users[targetId] || users[PRIMARY_USER_ID];
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (!user.claimedTaskIds) {
    user.claimedTaskIds = [];
  }

  if (user.claimedTaskIds.includes(taskId)) {
    return res.status(400).json({ error: 'This task reward has already been claimed!' });
  }

  const userReferrals = referrals.filter(r => (r as any).uplineId === user.id || (!(r as any).uplineId && user.id === PRIMARY_USER_ID));
  const validDirectCount = userReferrals.filter(r => r.level === 1 && r.isValid).length;

  let rewardAmount = 0;
  let requiredMembers = 0;
  let taskTitle = '';

  if (taskId === 'task-invite-5') {
    requiredMembers = 5;
    rewardAmount = 15;
    taskTitle = 'Invite 5 valid A-level direct members';
  } else if (taskId === 'task-activate-10') {
    requiredMembers = 10;
    rewardAmount = 30;
    taskTitle = 'Activate 10 valid A-level direct members';
  } else if (taskId === 'task-activate-20') {
    requiredMembers = 20;
    rewardAmount = 100;
    taskTitle = 'Activate 20 valid A-level direct members';
  } else if (taskId === 'task-activate-50') {
    requiredMembers = 50;
    rewardAmount = 500;
    taskTitle = 'Activate 50 valid direct members';
  } else {
    return res.status(400).json({ error: 'Invalid task ID' });
  }

  if (validDirectCount < requiredMembers) {
    return res.status(400).json({
      error: `Required condition not yet met! You have ${validDirectCount} / ${requiredMembers} valid direct members. Condition requires ${requiredMembers} active direct members.`
    });
  }

  // Grant reward to available balance
  user.claimedTaskIds.push(taskId);
  user.balance = Number((user.balance + rewardAmount).toFixed(2));
  user.totalEarnedIncome = Number(((user.totalEarnedIncome || 0) + rewardAmount).toFixed(2));

  // Add transaction
  transactions.unshift({
    id: `TXN-TASK-${Date.now()}`,
    userId: user.id,
    type: 'task_reward',
    amount: rewardAmount,
    status: 'completed',
    title: `Task Reward: ${taskTitle}`,
    description: `Claimed +$${rewardAmount.toFixed(2)} USDT directly to available balance`,
    createdAt: new Date().toISOString()
  });

  // Add Income record
  incomeRecords.unshift({
    id: `INC-TASK-${Date.now().toString().slice(-6)}`,
    userId: user.id,
    ticketName: taskTitle,
    categoryType: 'ticket',
    previousBalance: Number((user.balance - rewardAmount).toFixed(2)),
    incomeAmount: rewardAmount,
    vipLevel: user.vipLevel,
    dailyRate: 0,
    newBalance: user.balance,
    timestamp: new Date().toISOString(),
    status: 'credited',
    transactionId: `TXN-TASK-${Date.now()}`,
    notes: `Task Milestone Reward: ${taskTitle} (+$${rewardAmount.toFixed(2)})`
  });

  recalculateUserState(user.id);
  persistDb(`Task Claimed: ${taskTitle}`);

  res.json({
    success: true,
    message: `Congratulations! Successfully claimed $${rewardAmount.toFixed(2)} USDT reward for ${taskTitle}!`,
    rewardAmount,
    user
  });
});

// POST Daily Attendance Check-in (Welfare Center: Claim $0.10 USDT once daily)
app.post('/api/welfare/attendance', (req, res) => {
  const targetId = resolveUserId(req);
  const user = users[targetId] || users[PRIMARY_USER_ID];
  if (!user) return res.status(404).json({ error: 'User not found' });

  const todayStr = new Date().toISOString().slice(0, 10);
  if (user.lastAttendanceClaimDate === todayStr) {
    return res.status(400).json({ 
      error: 'Today\'s daily attendance reward ($0.10 USDT) has already been claimed. Please come back tomorrow!' 
    });
  }

  user.lastAttendanceClaimDate = todayStr;
  user.attendanceStreak = (user.attendanceStreak || 0) + 1;
  const rewardAmount = 0.10;
  user.balance = Number((user.balance + rewardAmount).toFixed(2));
  user.totalEarnedIncome = Number(((user.totalEarnedIncome || 0) + rewardAmount).toFixed(2));

  transactions.unshift({
    id: `TXN-ATTEND-${Date.now()}`,
    userId: user.id,
    type: 'deposit',
    amount: rewardAmount,
    status: 'completed',
    title: 'Daily Attendance Reward',
    description: `Claimed +$0.10 USDT daily check-in bonus (Streak Day ${user.attendanceStreak})`,
    createdAt: new Date().toISOString()
  });

  recalculateUserState(user.id);
  persistDb('Daily Attendance Check-in Claimed');

  res.json({
    success: true,
    message: 'Successfully claimed $0.10 USDT Daily Attendance Reward!',
    rewardAmount: 0.10,
    attendanceStreak: user.attendanceStreak,
    user
  });
});

// POST Auth Register with Country Code, Phone/User, Password, and Captcha
// When a new member registers, their account is initialized with unique user ID and stored in the database.
app.post('/api/auth/register', (req, res) => {
  const { username, countryCode, phone, password, referralCode } = req.body;
  if (!username || !phone || !password) {
    return res.status(400).json({ error: 'Username, phone number, and password are required' });
  }

  const cleanUsername = username.trim();
  const cleanPhone = `${countryCode || '+92'} ${phone.trim()}`;

  // Check if username or phone already exists
  const existingUser = Object.values(users).find(
    u => u.username.toLowerCase() === cleanUsername.toLowerCase() ||
         (u.phone && u.phone === cleanPhone)
  );
  if (existingUser) {
    return res.status(400).json({ error: `An account with username "${cleanUsername}" or this phone number already exists.` });
  }

  // Generate unique User ID
  const cleanUserId = `usr-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;

  // Check inviter if referralCode provided
  let uplineId: string | undefined = undefined;
  if (referralCode && referralCode.trim()) {
    const inviter = Object.values(users).find(
      u => u.referralCode && u.referralCode.toLowerCase() === referralCode.trim().toLowerCase()
    );
    if (inviter) {
      uplineId = inviter.id;
    }
  }

  // Create clean fresh slate user record
  const newUser: User & { password?: string; inviterId?: string } = {
    id: cleanUserId,
    username: cleanUsername,
    password: password.trim(),
    email: `${cleanUsername.toLowerCase().replace(/[^a-z0-9]/g, '')}@jambase.vip`,
    avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80`,
    phone: cleanPhone,
    walletAddress: '',
    balance: 0.0,
    frozenBalance: 0.0,
    totalAssets: 0.0,
    vipLevel: 1,
    referralCode: `JB${Math.floor(100000 + Math.random() * 900000)}`,
    referredBy: referralCode ? referralCode.trim() : undefined,
    inviterId: uplineId,
    validDirectMembersCount: 0,
    totalTeamMembersCount: 0,
    totalTeamDeposit: 0.0,
    isIncomePaused: true,
    incomePauseReason: 'Minimum $30.00 Account Balance Required to Work and Earn VIP Yield',
    autoCompound: true,
    totalEarnedIncome: 0.0,
    todayTicketIncome: 0.0,
    todayConcertIncome: 0.0,
    todayFinancialIncome: 0.0,
    recordExpenditure: 0.0,
    concertExpenditure: 0.0,
    financialExpenditure: 0.0,
    createdAt: new Date().toISOString(),
    isAdmin: false
  };

  users[cleanUserId] = newUser;

  // If referred by another user, add to referrals list for the upline
  if (uplineId && users[uplineId]) {
    referrals.push({
      id: `ref-${Date.now().toString(36)}-${crypto.randomBytes(2).toString('hex')}`,
      userId: uplineId,
      uplineId: uplineId,
      username: newUser.username,
      email: newUser.email,
      avatar: newUser.avatar,
      registeredAt: newUser.createdAt,
      totalDeposit: 0,
      totalPurchases: 0,
      balance: 0,
      isValid: false,
      disqualifiedReason: 'Pending initial deposit of $30+',
      level: 1
    } as any);
  }

  recalculateUserState(cleanUserId);
  if (uplineId) {
    recalculateUserState(uplineId);
  }
  
  persistDb(`New Member Registered: ${cleanUsername} (ID: ${cleanUserId})`, true);

  res.json({
    success: true,
    message: 'Account registered successfully! Welcome to JAMBASE. Please deposit at least $30 to activate your account and start earning VIP yields.',
    user: users[cleanUserId],
    token: `jwt-${cleanUserId}-${Date.now()}`
  });
});

// GET Telegram Customer Service Configuration & Support Info
app.get('/api/support/telegram', (req, res) => {
  res.json({
    success: true,
    telegram: telegramSupportConfig
  });
});

// ==========================================
// ADMIN CREDENTIALS & TOKEN SESSIONS
// ==========================================
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'JamBase#VIP2026!Adm99x$Secure';
const activeAdminSessions = new Set<string>();

/**
 * Middleware: Enforce Admin Session Authentication
 */
function requireAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers['authorization'] || '';
  const customHeader = (req.headers['x-admin-token'] as string) || '';
  let token = customHeader;
  if (!token && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  }

  if (!token || !activeAdminSessions.has(token)) {
    return res.status(401).json({
      error: 'Unauthorized: Valid VIP Admin authentication token is required to access administrative controls.'
    });
  }
  next();
}

// POST Admin Login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Admin username and password are required' });
  }

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid admin credentials. Access denied.' });
  }

  const token = `adm_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  activeAdminSessions.add(token);

  res.json({
    success: true,
    message: 'Admin authenticated successfully',
    token,
    admin: {
      username: ADMIN_USERNAME,
      role: 'VIP_SUPER_ADMIN',
      loginTime: new Date().toISOString()
    }
  });
});

// GET Admin Verify Token
app.get('/api/admin/verify', requireAdminAuth, (req, res) => {
  res.json({
    success: true,
    authenticated: true,
    username: ADMIN_USERNAME
  });
});

// POST Admin Logout
app.post('/api/admin/logout', (req, res) => {
  const authHeader = req.headers['authorization'] || '';
  const customHeader = (req.headers['x-admin-token'] as string) || '';
  let token = customHeader;
  if (!token && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  }
  if (token) {
    activeAdminSessions.delete(token);
  }
  res.json({ success: true, message: 'Admin logged out successfully' });
});

// POST Admin Update Telegram Support Username
app.post('/api/admin/telegram', requireAdminAuth, (req, res) => {
  const { username, channelUsername } = req.body;
  if (username) {
    const cleanUser = username.startsWith('@') ? username : `@${username}`;
    telegramSupportConfig.username = cleanUser;
    telegramSupportConfig.link = `https://t.me/${cleanUser.replace('@', '')}`;
  }
  if (channelUsername) {
    const cleanChan = channelUsername.startsWith('@') ? channelUsername : `@${channelUsername}`;
    telegramSupportConfig.channelUsername = cleanChan;
    telegramSupportConfig.channelLink = `https://t.me/${cleanChan.replace('@', '')}`;
  }

  persistDb(`Admin Updated Telegram Support: ${telegramSupportConfig.username}`);

  res.json({
    success: true,
    message: 'Telegram customer support settings updated',
    telegram: telegramSupportConfig
  });
});

// POST Auth Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username/phone and password are required' });
  }

  const cleanUserQuery = username.trim().toLowerCase();
  const allUsers = Object.values(users);
  
  // Find matching user by username, phone or email
  const matchedUser = allUsers.find(u => 
    u.username.toLowerCase() === cleanUserQuery ||
    (u.phone && (u.phone.toLowerCase() === cleanUserQuery || u.phone.replace(/[^0-9]/g, '') === cleanUserQuery.replace(/[^0-9]/g, ''))) ||
    (u.email && u.email.toLowerCase() === cleanUserQuery)
  );

  if (!matchedUser) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  // If password exists, check it
  if ((matchedUser as any).password && (matchedUser as any).password !== password.trim()) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  // Recalculate user state
  const refreshedUser = recalculateUserState(matchedUser.id) || matchedUser;

  res.json({
    success: true,
    message: 'Logged in successfully!',
    user: refreshedUser,
    token: `jwt-${refreshedUser.id}-${Date.now()}`
  });
});

// ==========================================
// ADMIN CONTROL APIs
// ==========================================

// GET Admin Dashboard overview
app.get('/api/admin/overview', requireAdminAuth, (req, res) => {
  const allUsersList = Object.values(users);
  const activeMembers = allUsersList.filter(u => u.status !== 'suspended' && (u.balance > 0 || (u.totalDeposit && u.totalDeposit > 0) || !u.isIncomePaused));

  const pendingWithdrawalsCount = withdrawals.filter(w => w.status === 'Pending').length;
  const approvedWithdrawalsCount = withdrawals.filter(w => w.status === 'Approved' || w.status === 'Completed').length;
  const rejectedWithdrawalsCount = withdrawals.filter(w => w.status === 'Rejected').length;

  const pendingDepositsCount = deposits.filter(d => d.status === 'Pending').length;
  const approvedDepositsCount = deposits.filter(d => d.status === 'Approved' || d.status === 'Completed').length;
  const rejectedDepositsCount = deposits.filter(d => d.status === 'Rejected').length;

  const enrichedWithdrawals = withdrawals.map(w => {
    const user = users[w.userId] || Object.values(users).find(u => u.username === w.username);
    return {
      ...w,
      userEmail: w.userEmail || user?.email || `${(w.username || 'member').toLowerCase()}@member.jambase.vip`,
      userPhone: w.userPhone || user?.phone || '+1 (555) 839-2041',
      userBalanceAtRequest: w.userBalanceAtRequest ?? user?.balance ?? 0,
      currentUserBalance: user?.balance ?? 0,
      txId: w.txId || `${w.id}-USDT`,
      txHash: w.txHash || `0x${crypto.createHash('sha256').update(w.id + (w.walletAddress || '')).digest('hex').slice(0, 32)}`
    };
  });

  const enrichedDeposits = deposits.map(d => {
    const user = users[d.userId] || Object.values(users).find(u => u.username === d.username);
    const tx = d.txHash || d.txUid || `0x${crypto.createHash('sha256').update(d.id + (d.walletAddress || '')).digest('hex').slice(0, 32)}`;
    return {
      ...d,
      userEmail: d.userEmail || user?.email || `${(d.username || 'member').toLowerCase()}@member.jambase.vip`,
      userPhone: d.userPhone || user?.phone || '+1 (555) 839-2041',
      userBalanceAtRequest: d.userBalanceAtRequest ?? user?.balance ?? 0,
      currentUserBalance: user?.balance ?? 0,
      txHash: tx,
      txUid: d.txUid || tx
    };
  });

  res.json({
    totalUsers: allUsersList.length,
    totalRegisteredMembers: allUsersList.length,
    totalActiveMembers: activeMembers.length,
    totalTickets: tickets.length,
    activeTickets: tickets.filter(t => t.isActive).length,
    totalWithdrawals: withdrawals.length,
    pendingWithdrawals: pendingWithdrawalsCount,
    approvedWithdrawals: approvedWithdrawalsCount,
    rejectedWithdrawals: rejectedWithdrawalsCount,
    totalDeposits: deposits.length,
    pendingDeposits: pendingDepositsCount,
    approvedDeposits: approvedDepositsCount,
    rejectedDeposits: rejectedDepositsCount,
    totalReferrals: referrals.length,
    validReferrals: referrals.filter(r => r.isValid).length,
    totalPlatformBalance: Number(allUsersList.reduce((sum, u) => sum + (u.balance || 0), 0).toFixed(2)),
    totalPlatformAssets: Number(allUsersList.reduce((sum, u) => sum + (u.totalAssets || (u.balance + (u.frozenBalance || 0)) || 0), 0).toFixed(2)),
    withdrawalsList: enrichedWithdrawals,
    depositsList: enrichedDeposits,
    referralsList: referrals,
    ticketsList: tickets,
    membersList: allUsersList
  });
});

// GET All Recharge / Deposit Requests (Admin View with Summaries)
app.get('/api/admin/deposits', requireAdminAuth, (req, res) => {
  const pending = deposits.filter(d => d.status === 'Pending').length;
  const approved = deposits.filter(d => d.status === 'Approved' || d.status === 'Completed').length;
  const rejected = deposits.filter(d => d.status === 'Rejected').length;

  const enrichedDeposits = deposits.map(d => {
    const user = users[d.userId] || Object.values(users).find(u => u.username === d.username);
    const tx = d.txHash || d.txUid || `0x${crypto.createHash('sha256').update(d.id + (d.walletAddress || '')).digest('hex').slice(0, 32)}`;
    return {
      ...d,
      userEmail: d.userEmail || user?.email || `${(d.username || 'member').toLowerCase()}@member.jambase.vip`,
      userPhone: d.userPhone || user?.phone || '+1 (555) 839-2041',
      userBalanceAtRequest: d.userBalanceAtRequest ?? user?.balance ?? 0,
      currentUserBalance: user?.balance ?? 0,
      txHash: tx,
      txUid: d.txUid || tx
    };
  });

  res.json({
    success: true,
    deposits: enrichedDeposits,
    summary: {
      total: deposits.length,
      pending,
      approved,
      rejected
    }
  });
});

// GET All Withdrawal Requests (Admin View with Summaries)
app.get('/api/admin/withdrawals', requireAdminAuth, (req, res) => {
  const enrichedWithdrawals = withdrawals.map(w => {
    const user = users[w.userId] || Object.values(users).find(u => u.username === w.username);
    return {
      ...w,
      userEmail: w.userEmail || user?.email || `${(w.username || 'member').toLowerCase()}@member.jambase.vip`,
      userPhone: w.userPhone || user?.phone || '+1 (555) 839-2041',
      userBalanceAtRequest: w.userBalanceAtRequest ?? user?.balance ?? 0,
      currentUserBalance: user?.balance ?? 0,
      txId: w.txId || `${w.id}-USDT`,
      txHash: w.txHash || `0x${crypto.createHash('sha256').update(w.id + (w.walletAddress || '')).digest('hex').slice(0, 32)}`
    };
  });

  const pending = enrichedWithdrawals.filter(w => w.status === 'Pending').length;
  const approved = enrichedWithdrawals.filter(w => w.status === 'Approved' || w.status === 'Completed').length;
  const rejected = enrichedWithdrawals.filter(w => w.status === 'Rejected').length;

  res.json({
    success: true,
    withdrawals: enrichedWithdrawals,
    summary: {
      total: enrichedWithdrawals.length,
      pending,
      approved,
      rejected
    }
  });
});

// ==========================================
// MEMBER MANAGEMENT APIs (Admin Control)
// ==========================================

// GET All Registered Members with Summary Statistics & Filtering
app.get('/api/admin/members', requireAdminAuth, (req, res) => {
  const allUsersList = Object.values(users);
  
  // Calculate dynamic summary metrics
  const activeCount = allUsersList.filter(u => u.status !== 'suspended' && (u.balance > 0 || (u.totalDeposit && u.totalDeposit > 0) || !u.isIncomePaused)).length;
  const suspendedCount = allUsersList.filter(u => u.status === 'suspended').length;
  const frozenCount = allUsersList.filter(u => u.status === 'frozen' || (u.frozenBalance && u.frozenBalance > 0)).length;
  const incomePausedCount = allUsersList.filter(u => u.isIncomePaused).length;

  const vipCounts = {
    vip1: allUsersList.filter(u => (u.vipLevel || 1) === 1).length,
    vip2: allUsersList.filter(u => u.vipLevel === 2).length,
    vip3: allUsersList.filter(u => u.vipLevel === 3).length,
    vip4: allUsersList.filter(u => u.vipLevel === 4).length,
    vip5: allUsersList.filter(u => u.vipLevel === 5).length,
    vip6: allUsersList.filter(u => u.vipLevel === 6).length
  };

  const totalPlatformBalance = Number(allUsersList.reduce((sum, u) => sum + (u.balance || 0), 0).toFixed(2));
  const totalPlatformFrozen = Number(allUsersList.reduce((sum, u) => sum + (u.frozenBalance || 0), 0).toFixed(2));
  const totalPlatformAssets = Number((totalPlatformBalance + totalPlatformFrozen).toFixed(2));

  // Compute calculated metrics for each individual member
  const enrichedMembers = allUsersList.map(u => {
    const userTx = transactions.filter(t => t.userId === u.id);
    const userDeposits = deposits.filter(d => d.userId === u.id || d.username === u.username);
    const userWds = withdrawals.filter(w => w.userId === u.id || w.username === u.username);
    const userPurchases = purchases.filter(p => p.userId === u.id);

    const calculatedTotalDeposit = userDeposits.filter(d => d.status === 'Completed').reduce((sum, d) => sum + d.amount, 0) || u.totalDeposit || 0;
    const calculatedTotalWd = userWds.filter(w => w.status === 'Completed').reduce((sum, w) => sum + w.amount, 0) || u.totalWithdrawal || 0;
    const calculatedPurchases = userPurchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0) || u.totalPurchases || 0;

    return {
      ...u,
      status: u.status || 'active',
      totalAssets: Number(((u.balance || 0) + (u.frozenBalance || 0)).toFixed(2)),
      totalDeposit: Number(calculatedTotalDeposit.toFixed(2)),
      totalWithdrawal: Number(calculatedTotalWd.toFixed(2)),
      totalPurchases: Number(calculatedPurchases.toFixed(2)),
      transactionCount: userTx.length
    };
  });

  res.json({
    success: true,
    summary: {
      totalMembers: allUsersList.length,
      totalRegistered: allUsersList.length,
      totalActive: activeCount,
      totalSuspended: suspendedCount,
      totalFrozen: frozenCount,
      totalIncomePaused: incomePausedCount,
      totalPlatformBalance,
      totalPlatformFrozen,
      totalPlatformAssets,
      vipDistribution: vipCounts
    },
    members: enrichedMembers
  });
});

// GET Single Member Details & Complete Audit Trail
app.get('/api/admin/members/:id', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const user = users[id];
  if (!user) return res.status(404).json({ error: 'Member not found' });

  const userTransactions = transactions.filter(t => t.userId === user.id);
  const userIncomeRecords = incomeRecords.filter(r => r.userId === user.id);
  const userPurchases = purchases.filter(p => p.userId === user.id);
  const userWithdrawals = withdrawals.filter(w => w.userId === user.id || w.username === user.username);
  const userDeposits = deposits.filter(d => d.userId === user.id || d.username === user.username);
  const userReferrals = referrals.filter(r => r.id === user.id || (user.referralCode && r.username.includes(user.referralCode)));

  res.json({
    success: true,
    user: {
      ...user,
      status: user.status || 'active',
      totalAssets: Number(((user.balance || 0) + (user.frozenBalance || 0)).toFixed(2))
    },
    transactions: userTransactions,
    incomeRecords: userIncomeRecords,
    purchases: userPurchases,
    withdrawals: userWithdrawals,
    deposits: userDeposits,
    referrals: userReferrals
  });
});

// POST Admin Adjust Member Balance (Add / Deduct Funds with Full Ledger Transparency)
app.post('/api/admin/members/:id/balance', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const { action, amount, type, reason, adminOperator } = req.body;
  const user = users[id];

  if (!user) return res.status(404).json({ error: 'Member not found' });

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: 'Please enter a valid balance adjustment amount greater than 0.' });
  }

  const previousBalance = user.balance || 0;
  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  const operatorName = adminOperator || 'SuperAdmin';
  const actionReason = reason?.trim() || (action === 'add' ? 'Admin Balance Credit' : 'Admin Balance Debit');
  const nowIso = new Date().toISOString();

  let transaction: Transaction;

  if (action === 'add') {
    user.balance = Number((user.balance + numAmount).toFixed(2));
    user.totalAssets = Number((user.balance + (user.frozenBalance || 0)).toFixed(2));

    // If account was paused due to low balance and balance is now >= $30, unpause automatically
    if (user.isIncomePaused && user.totalAssets >= 30) {
      user.isIncomePaused = false;
      user.incomePauseReason = undefined;
    }

    const txId = `TXN-ADM-CR-${Date.now()}-${randomSuffix}`;
    transaction = {
      id: txId,
      userId: user.id,
      type: 'deposit',
      category: 'admin_credit',
      amount: numAmount,
      previousBalance,
      newBalance: user.balance,
      status: 'completed',
      title: `Admin Balance Credit: +$${numAmount.toFixed(2)} USDT`,
      description: `+$${numAmount.toFixed(2)} USDT credited to Available Balance by ${operatorName}. Reason: ${actionReason}`,
      adminAction: 'credit',
      adminReason: actionReason,
      adminOperator: operatorName,
      actionType: type || 'admin_recharge_bonus',
      createdAt: nowIso
    };

    transactions.unshift(transaction);
    persistDb(`Admin Balance Credit: +$${numAmount.toFixed(2)} to ${user.username} (#${txId})`);

    return res.json({
      success: true,
      message: `Successfully credited +$${numAmount.toFixed(2)} USDT to ${user.username}'s available balance.`,
      user,
      transaction
    });
  } else if (action === 'deduct') {
    if (numAmount > user.balance) {
      return res.status(400).json({
        error: `Insufficient available balance! User ${user.username} has $${user.balance.toFixed(2)} USDT available, cannot deduct $${numAmount.toFixed(2)} USDT.`
      });
    }

    user.balance = Number((user.balance - numAmount).toFixed(2));
    user.totalAssets = Number((user.balance + (user.frozenBalance || 0)).toFixed(2));

    // If total assets drop below $30, pause income automatically
    if (user.totalAssets < 30) {
      user.isIncomePaused = true;
      user.incomePauseReason = 'Minimum $30.00 Account Balance Required to Work and Earn VIP Yield';
    }

    const txId = `TXN-ADM-DR-${Date.now()}-${randomSuffix}`;
    transaction = {
      id: txId,
      userId: user.id,
      type: 'withdrawal',
      category: 'admin_debit',
      amount: numAmount,
      previousBalance,
      newBalance: user.balance,
      status: 'completed',
      title: `Admin Balance Deduction: -$${numAmount.toFixed(2)} USDT`,
      description: `-$${numAmount.toFixed(2)} USDT debited from Available Balance by ${operatorName}. Reason: ${actionReason}`,
      adminAction: 'debit',
      adminReason: actionReason,
      adminOperator: operatorName,
      actionType: type || 'admin_manual_correction',
      createdAt: nowIso
    };

    transactions.unshift(transaction);
    persistDb(`Admin Balance Deduction: -$${numAmount.toFixed(2)} from ${user.username} (#${txId})`);

    return res.json({
      success: true,
      message: `Successfully deducted -$${numAmount.toFixed(2)} USDT from ${user.username}'s available balance.`,
      user,
      transaction
    });
  } else {
    return res.status(400).json({ error: 'Invalid action. Action must be "add" or "deduct".' });
  }
});

// POST Admin Reset Member Password
app.post('/api/admin/members/:id/reset-password', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const { newPassword, adminReason } = req.body;
  const user = users[id];

  if (!user) return res.status(404).json({ error: 'Member not found' });

  if (!newPassword || newPassword.trim().length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  const cleanPass = newPassword.trim();
  user.passwordHint = cleanPass;

  persistDb(`Admin Reset Password for Member: ${user.username}`);

  res.json({
    success: true,
    message: `Password for member "${user.username}" has been securely updated.`,
    username: user.username,
    newPassword: cleanPass,
    user
  });
});

// POST Admin Update Member Account Status & Settings
app.post('/api/admin/members/:id/status', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const { status, isIncomePaused, incomePauseReason, vipLevel, walletAddress, phone, adminNotes } = req.body;
  const user = users[id];

  if (!user) return res.status(404).json({ error: 'Member not found' });

  if (status !== undefined) {
    if (['active', 'suspended', 'frozen'].includes(status)) {
      user.status = status;
    }
  }

  if (isIncomePaused !== undefined) {
    user.isIncomePaused = Boolean(isIncomePaused);
    if (incomePauseReason) {
      user.incomePauseReason = incomePauseReason;
    } else if (!user.isIncomePaused) {
      user.incomePauseReason = undefined;
    }
  }

  if (vipLevel !== undefined) {
    const numLevel = parseInt(vipLevel, 10);
    if (numLevel >= 1 && numLevel <= 6) {
      user.vipLevel = numLevel;
    }
  }

  if (walletAddress !== undefined) {
    user.walletAddress = walletAddress.trim();
  }

  if (phone !== undefined) {
    user.phone = phone.trim();
  }

  if (adminNotes !== undefined) {
    user.adminNotes = adminNotes.trim();
  }

  recalculateUserState(user.id);
  persistDb(`Admin Updated Status for Member: ${user.username} (Status: ${user.status}, VIP: ${user.vipLevel})`);

  res.json({
    success: true,
    message: `Account settings and status for ${user.username} updated successfully.`,
    user
  });
});

// POST Admin Create New Member Account
app.post('/api/admin/members/create', requireAdminAuth, (req, res) => {
  const { username, email, phone, password, initialBalance, vipLevel, walletAddress, referralCode, referredBy, adminNotes } = req.body;

  if (!username || !username.trim()) {
    return res.status(400).json({ error: 'Username is required' });
  }

  const cleanUser = username.trim();
  const existing = Object.values(users).find(u => u.username.toLowerCase() === cleanUser.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: `Member with username "${cleanUser}" already exists.` });
  }

  const newId = `usr-${Date.now().toString(36)}-${Math.floor(1000 + Math.random() * 9000)}`;
  const initBal = Math.max(0, parseFloat(initialBalance) || 0);
  const vLevel = Math.min(6, Math.max(1, parseInt(vipLevel, 10) || 1));
  const cleanPass = password?.trim() || `Vip#${Math.floor(100000 + Math.random() * 900000)}`;

  const newUser: User = {
    id: newId,
    username: cleanUser,
    email: email?.trim() || `${cleanUser.toLowerCase().replace(/[^a-z0-9]/g, '')}@jambase.vip`,
    avatar: `https://images.unsplash.com/photo-${1535713875002 + Math.floor(Math.random() * 1000)}?w=400&auto=format&fit=crop&q=80`,
    phone: phone?.trim() || '+1 (555) 000-0000',
    walletAddress: walletAddress?.trim() || '',
    network: 'TRC20',
    balance: initBal,
    frozenBalance: 0.0,
    totalAssets: initBal,
    vipLevel: vLevel,
    referralCode: referralCode?.trim() || `JB${Math.floor(100000 + Math.random() * 900000)}`,
    referredBy: referredBy?.trim() || 'JAM888',
    status: 'active',
    validDirectMembersCount: 0,
    totalTeamMembersCount: 0,
    totalTeamDeposit: 0.0,
    isIncomePaused: initBal < 30,
    incomePauseReason: initBal < 30 ? 'Minimum $30.00 Account Balance Required to Work and Earn VIP Yield' : undefined,
    autoCompound: true,
    totalEarnedIncome: 0.0,
    totalVipProfit: 0.0,
    totalTeamCommission: 0.0,
    todayVipProfit: 0.0,
    todayTeamCommission: 0.0,
    todayTicketIncome: 0.0,
    todayConcertIncome: 0.0,
    todayFinancialIncome: 0.0,
    recordExpenditure: 0.0,
    concertExpenditure: 0.0,
    financialExpenditure: 0.0,
    passwordHint: cleanPass,
    adminNotes: adminNotes?.trim() || 'Created directly by Administrator.',
    createdAt: new Date().toISOString(),
    isAdmin: false
  };

  users[newId] = newUser;

  if (initBal > 0) {
    transactions.unshift({
      id: `TXN-ADM-INIT-${Date.now()}`,
      userId: newId,
      type: 'deposit',
      category: 'admin_credit',
      amount: initBal,
      previousBalance: 0,
      newBalance: initBal,
      status: 'completed',
      title: 'Initial Deposit Credit',
      description: `Initial funding of +$${initBal.toFixed(2)} USDT credited upon member creation.`,
      adminAction: 'credit',
      adminReason: 'Initial Account Provisioning',
      createdAt: new Date().toISOString()
    });
  }

  persistDb(`Admin Created New Member: ${cleanUser} (#${newId})`);

  res.json({
    success: true,
    message: `New member "${cleanUser}" created successfully with initial balance $${initBal.toFixed(2)} USDT (VIP ${vLevel}).`,
    user: newUser,
    generatedPassword: cleanPass
  });
});

// ==========================================
// RECHARGE & WITHDRAWAL MANUAL APPROVAL APIs
// ==========================================

// Admin: Process Recharge / Deposit Request (Approve or Reject)
// Under NO circumstances are deposits auto-approved. Admin manual approval is mandatory.
app.post('/api/admin/deposits/:id/action', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const { action, rejectReason, adminNotes, adminOperator } = req.body; // 'Approve' | 'Reject'
  const operatorName = adminOperator || 'SuperAdmin';

  const dep = deposits.find(d => d.id === id);
  if (!dep) {
    return res.status(404).json({ error: `Recharge request "${id}" not found in the platform database.` });
  }

  // Strict Idempotency Check: Prevent duplicate approvals, duplicate balance credits, or double processing
  if (dep.status !== 'Pending') {
    return res.status(400).json({
      error: `Duplicate action rejected: Recharge request #${dep.id} has already been ${dep.status.toLowerCase()} on ${dep.processedAt ? new Date(dep.processedAt).toLocaleString() : 'a previous action'}.`
    });
  }

  const user = users[dep.userId] || Object.values(users).find(u => u.username === dep.username);
  if (!user) {
    return res.status(404).json({ error: `Associated member account for recharge #${dep.id} was not found.` });
  }

  if (action === 'Approve') {
    dep.status = 'Approved';
    dep.processedAt = new Date().toISOString();
    dep.approvedBy = operatorName;
    dep.adminNotes = adminNotes || `Approved by ${operatorName}`;

    // Credit available balance NOW upon authorized Admin manual approval
    const prevBalance = user.balance;
    user.balance = Number((user.balance + dep.amount).toFixed(2));
    user.totalDeposit = Number(((user.totalDeposit || 0) + dep.amount).toFixed(2));

    // If account income was paused due to low balance (< $30) and now reaches $30+, restore active income status
    if (user.isIncomePaused && (user.balance + (user.frozenBalance || 0)) >= 30) {
      user.isIncomePaused = false;
      user.incomePauseReason = undefined;
    }

    // Update matching pending transaction or create a completed transaction record
    const tx = transactions.find(t => (t.id.includes(dep.id) || (t.type === 'deposit' && t.status === 'pending' && t.amount === dep.amount && t.userId === user.id)));
    if (tx) {
      tx.status = 'completed';
      tx.previousBalance = prevBalance;
      tx.newBalance = user.balance;
      tx.adminAction = 'credit';
      tx.adminReason = `Recharge Approved by Admin (${operatorName})`;
      tx.adminOperator = operatorName;
    } else {
      transactions.unshift({
        id: `TXN-DEP-APP-${Date.now()}`,
        userId: user.id,
        type: 'deposit',
        category: 'deposit',
        amount: dep.amount,
        previousBalance: prevBalance,
        newBalance: user.balance,
        status: 'completed',
        title: `USDT Recharge Approved (${dep.network})`,
        description: `Recharge #${dep.id} of +$${dep.amount.toFixed(2)} USDT verified and credited by Admin.`,
        adminAction: 'credit',
        adminOperator: operatorName,
        adminReason: `Manual Approval by ${operatorName}`,
        createdAt: new Date().toISOString()
      });
    }

    recalculateUserState(user.id);
    persistDb(`Admin Approved Recharge: #${dep.id} (+$${dep.amount} USDT) for ${user.username}`);

    return res.json({
      success: true,
      message: `Recharge request #${dep.id} for $${dep.amount.toFixed(2)} USDT has been successfully APPROVED and credited to ${user.username}'s available balance.`,
      deposit: dep,
      user
    });

  } else if (action === 'Reject') {
    dep.status = 'Rejected';
    dep.processedAt = new Date().toISOString();
    dep.rejectedBy = operatorName;
    dep.rejectReason = rejectReason || 'Administrative rejection (Payment verification unconfirmed)';
    dep.adminNotes = adminNotes || `Rejected by ${operatorName}`;

    // Available balance is NOT credited.
    const tx = transactions.find(t => (t.id.includes(dep.id) || (t.type === 'deposit' && t.status === 'pending' && t.amount === dep.amount && t.userId === user.id)));
    if (tx) {
      tx.status = 'rejected';
      tx.adminAction = 'status_change';
      tx.adminReason = dep.rejectReason;
      tx.adminOperator = operatorName;
    }

    recalculateUserState(user.id);
    persistDb(`Admin Rejected Recharge: #${dep.id} ($${dep.amount} USDT) for ${user.username}`);

    return res.json({
      success: true,
      message: `Recharge request #${dep.id} for $${dep.amount.toFixed(2)} USDT has been REJECTED.`,
      deposit: dep,
      user
    });

  } else {
    return res.status(400).json({ error: 'Invalid action. Must be "Approve" or "Reject".' });
  }
});

// Admin: Process Withdrawal (Approve, Complete, or Reject)
// Under NO circumstances are withdrawals auto-approved. Admin manual approval is mandatory.
app.post('/api/admin/withdrawals/:id/action', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const { action, rejectReason, adminNotes, adminOperator } = req.body; // 'Approve' | 'Reject' | 'Complete'
  const operatorName = adminOperator || 'SuperAdmin';

  const wd = withdrawals.find(w => w.id === id);
  if (!wd) {
    return res.status(404).json({ error: `Withdrawal request "${id}" not found in the platform database.` });
  }

  // Strict Idempotency Check: Prevent duplicate approval / double deduction / multiple refunds
  if (wd.status === 'Completed' || wd.status === 'Rejected' || (action === 'Approve' && wd.status === 'Approved')) {
    return res.status(400).json({
      error: `Duplicate action rejected: Withdrawal request #${wd.id} has already been ${wd.status.toLowerCase()} on ${wd.processedAt ? new Date(wd.processedAt).toLocaleString() : 'a previous action'}.`
    });
  }

  const user = users[wd.userId] || Object.values(users).find(u => u.username === wd.username);
  if (!user) {
    return res.status(404).json({ error: `Associated member account for withdrawal #${wd.id} was not found.` });
  }

  if (action === 'Approve' || action === 'Complete') {
    wd.status = 'Approved';
    wd.processedAt = new Date().toISOString();
    wd.approvedBy = operatorName;
    wd.adminNotes = adminNotes || `Approved by ${operatorName}`;

    // Finalize withdrawal deduction from frozen balance permanently
    user.frozenBalance = Number(Math.max(0, (user.frozenBalance || 0) - wd.amount).toFixed(2));
    user.totalWithdrawal = Number(((user.totalWithdrawal || 0) + wd.amount).toFixed(2));

    // Update related pending transaction to completed
    const tx = transactions.find(t => t.id.includes(wd.id) || (t.type === 'withdrawal' && t.status === 'pending' && t.userId === user.id));
    if (tx) {
      tx.status = 'completed';
      tx.adminAction = 'debit';
      tx.adminOperator = operatorName;
      tx.adminReason = `Withdrawal Approved and Payout Dispatched by ${operatorName}`;
    }

    // If remaining total assets fall below $30, automatically pause income
    const totalAssets = Number((user.balance + user.frozenBalance).toFixed(2));
    if (totalAssets < 30) {
      user.isIncomePaused = true;
      user.incomePauseReason = 'Minimum $30.00 Account Balance Required to Work and Earn VIP Yield';
    }

    recalculateUserState(user.id);
    persistDb(`Admin Approved Withdrawal: #${wd.id} ($${wd.amount} USDT) for ${user.username}`);

    return res.json({
      success: true,
      message: `Withdrawal request #${wd.id} for $${wd.amount.toFixed(2)} USDT has been APPROVED and finalized.`,
      withdrawal: wd,
      user
    });

  } else if (action === 'Reject') {
    wd.status = 'Rejected';
    wd.processedAt = new Date().toISOString();
    wd.rejectedBy = operatorName;
    wd.rejectReason = rejectReason || 'Administrative rejection (Invalid destination address or security hold)';
    wd.adminNotes = adminNotes || `Rejected by ${operatorName}`;

    // Restore held/reserved frozen funds back to member's available balance safely
    const prevBalance = user.balance;
    user.frozenBalance = Number(Math.max(0, (user.frozenBalance || 0) - wd.amount).toFixed(2));
    user.balance = Number((user.balance + wd.amount).toFixed(2));

    // If total assets now satisfy minimum $30, unpause income if it was paused
    if (user.isIncomePaused && (user.balance + (user.frozenBalance || 0)) >= 30) {
      user.isIncomePaused = false;
      user.incomePauseReason = undefined;
    }

    // Update matching pending transaction to rejected
    const tx = transactions.find(t => t.id.includes(wd.id) || (t.type === 'withdrawal' && t.status === 'pending' && t.userId === user.id));
    if (tx) {
      tx.status = 'rejected';
      tx.adminAction = 'status_change';
      tx.adminReason = wd.rejectReason;
      tx.adminOperator = operatorName;
    }

    // Create explicit Refund Transaction Record in member ledger
    transactions.unshift({
      id: `TXN-WD-REFUND-${Date.now()}`,
      userId: user.id,
      type: 'deposit',
      category: 'admin_credit',
      amount: wd.amount,
      previousBalance: prevBalance,
      newBalance: user.balance,
      status: 'completed',
      title: `Withdrawal Refund: #${wd.id}`,
      description: `+$${wd.amount.toFixed(2)} USDT restored to available balance. Reason: ${wd.rejectReason}`,
      adminAction: 'credit',
      adminOperator: operatorName,
      adminReason: `Withdrawal Rejected & Refunded: ${wd.rejectReason}`,
      createdAt: new Date().toISOString()
    });

    recalculateUserState(user.id);
    persistDb(`Admin Rejected Withdrawal & Refunded Funds: #${wd.id} ($${wd.amount} USDT) for ${user.username}`);

    return res.json({
      success: true,
      message: `Withdrawal request #${wd.id} for $${wd.amount.toFixed(2)} USDT has been REJECTED. Reserved funds of $${wd.amount.toFixed(2)} USDT have been safely restored to ${user.username}'s available balance.`,
      withdrawal: wd,
      user
    });

  } else {
    return res.status(400).json({ error: 'Invalid action. Must be "Approve" or "Reject".' });
  }
});

// Admin: Toggle / Review Referral Validity
app.post('/api/admin/referrals/:id/toggle-valid', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const ref = referrals.find(r => r.id === id);

  if (!ref) return res.status(404).json({ error: 'Referral member not found' });

  ref.isValid = !ref.isValid;
  if (!ref.isValid) {
    ref.disqualifiedReason = reason || 'Disqualified by administrator during compliance audit.';
  } else {
    ref.disqualifiedReason = undefined;
  }

  recalculateUserState(PRIMARY_USER_ID);
  persistDb(`Admin Referral Validity Toggle: ${ref.username} (Valid: ${ref.isValid})`);

  res.json({
    success: true,
    referral: ref,
    user: users[PRIMARY_USER_ID]
  });
});

// Admin: Create / Edit / Delete Ticket
app.post('/api/admin/tickets', requireAdminAuth, (req, res) => {
  const {
    name, artist, category, price, voucherQty, image, description,
    eventDate, venue, location, vipRequired, purchaseLimit, maxQuantity
  } = req.body;

  if (!name || !artist || !price) {
    return res.status(400).json({ error: 'Name, artist, and price are required' });
  }

  const newTicket: Ticket = {
    id: `tkt-custom-${Date.now()}`,
    name,
    artist,
    category: category || 'Music',
    price: parseFloat(price),
    voucherQty: parseInt(voucherQty, 10) || 1,
    image: image || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
    description: description || 'Exciting live musical showcase.',
    eventDate: eventDate || '2026-11-30',
    venue: venue || 'JAMBASE Arena',
    location: location || 'Global Stream & In-Person',
    vipRequired: parseInt(vipRequired, 10) || 1,
    purchaseLimit: parseInt(purchaseLimit, 10) || 50,
    maxQuantity: parseInt(maxQuantity, 10) || 10,
    soldCount: 0,
    isActive: true,
    isPopular: true
  };

  tickets.unshift(newTicket);
  persistDb(`Admin Created Ticket: ${newTicket.name}`);
  res.json({ success: true, ticket: newTicket });
});

app.put('/api/admin/tickets/:id', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const index = tickets.findIndex(t => t.id === id);
  if (index === -1) return res.status(404).json({ error: 'Ticket not found' });

  tickets[index] = {
    ...tickets[index],
    ...req.body,
    price: req.body.price !== undefined ? parseFloat(req.body.price) : tickets[index].price
  };

  persistDb(`Admin Updated Ticket: ${tickets[index].name}`);
  res.json({ success: true, ticket: tickets[index] });
});

app.delete('/api/admin/tickets/:id', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  tickets = tickets.filter(t => t.id !== id);
  persistDb(`Admin Deleted Ticket: ${id}`);
  res.json({ success: true, message: 'Ticket removed' });
});

// Admin: Create Category
app.post('/api/admin/categories', requireAdminAuth, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Category name is required' });

  const newCat: Category = {
    id: `cat-${Date.now()}`,
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    isActive: true
  };

  categories.push(newCat);
  persistDb(`Admin Created Category: ${newCat.name}`);
  res.json({ success: true, category: newCat });
});

// Admin: Update Announcement / Notices
app.put('/api/admin/notices', requireAdminAuth, (req, res) => {
  const { title, content } = req.body;
  if (!title) return res.status(400).json({ error: 'Announcement title is required' });

  if (notices.length > 0) {
    notices[0].title = title;
    if (content) notices[0].content = content;
    notices[0].date = new Date().toISOString().slice(0, 10);
  } else {
    notices.push({
      id: `n-${Date.now()}`,
      title,
      content: content || title,
      date: new Date().toISOString().slice(0, 10),
      type: 'info'
    });
  }

  persistDb('Update Announcement', true);
  res.json({ success: true, message: 'Announcement updated successfully', notices });
});

// ==========================================
// VIP DATA PROTECTION & DATABASE BACKUP APIs
// ==========================================

// GET List of all database backups and snapshots
app.get('/api/admin/backups', requireAdminAuth, (req, res) => {
  const snapshots = dbManager.listBackupSnapshots();
  res.json({
    success: true,
    backups: snapshots,
    count: snapshots.length
  });
});

// POST Create manual backup snapshot
app.post('/api/admin/backups/create', requireAdminAuth, (req, res) => {
  const { reason } = req.body;
  const snapshot = dbManager.createBackupSnapshot(
    dbManager.getDb(),
    'manual',
    reason || 'Manual Administrator VIP Protection Snapshot'
  );

  if (!snapshot) {
    return res.status(500).json({ error: 'Failed to create backup snapshot' });
  }

  res.json({
    success: true,
    message: `Backup snapshot ${snapshot.filename} created successfully.`,
    snapshot
  });
});

// POST Restore database from a backup snapshot
app.post('/api/admin/backups/restore', requireAdminAuth, (req, res) => {
  const { snapshotId } = req.body;
  if (!snapshotId) {
    return res.status(400).json({ error: 'Snapshot ID is required' });
  }

  const result = dbManager.restoreFromSnapshot(snapshotId);
  if (!result.success) {
    return res.status(500).json({ error: result.message });
  }

  // Refresh active in-memory pointers
  syncMemoryPointers();
  recalculateUserState(PRIMARY_USER_ID);

  res.json({
    success: true,
    message: result.message
  });
});

// GET Database Integrity Audit Report
app.get('/api/admin/backups/verify-integrity', requireAdminAuth, (req, res) => {
  const report = dbManager.verifyIntegrity();
  res.json(report);
});

// GET Export entire database JSON
app.get('/api/admin/backups/export', requireAdminAuth, (req, res) => {
  const fullDb = dbManager.exportData();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=jambase_backup_${new Date().toISOString().slice(0, 10)}.json`);
  res.json(fullDb);
});

// POST Import database JSON with pre-validation and safety latch
app.post('/api/admin/backups/import', requireAdminAuth, (req, res) => {
  const { data } = req.body;
  if (!data) {
    return res.status(400).json({ error: 'No database payload provided' });
  }

  const result = dbManager.importData(data);
  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }

  // Refresh active in-memory pointers
  syncMemoryPointers();
  recalculateUserState(PRIMARY_USER_ID);

  res.json({
    success: true,
    message: result.message
  });
});

// User: Update Profile
app.put('/api/user/profile', (req, res) => {
  const targetId = resolveUserId(req);
  const user = users[targetId] || users[PRIMARY_USER_ID];
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { username, email, phone, walletAddress, avatar } = req.body;
  if (username) user.username = username;
  if (email) user.email = email;
  if (phone) user.phone = phone;
  if (walletAddress) user.walletAddress = walletAddress;
  if (avatar) user.avatar = avatar;

  recalculateUserState(user.id);
  persistDb(`User Profile Updated: ${user.username}`);
  res.json({ success: true, message: 'Profile updated successfully', user });
});

// User: Update Security & Preferences
app.put('/api/user/security', (req, res) => {
  const targetId = resolveUserId(req);
  const user = users[targetId] || users[PRIMARY_USER_ID];
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { autoCompound } = req.body;
  if (autoCompound !== undefined) user.autoCompound = Boolean(autoCompound);

  persistDb(`User Security Updated: ${user.username}`);
  res.json({ success: true, message: 'Security preferences updated', user });
});

// ==========================================
// VITE MIDDLEWARE / SPA FALLBACK
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`JAMBASE server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
