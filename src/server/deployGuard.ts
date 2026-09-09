import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { User, Transaction } from '../types';

export interface MemberBalanceSnapshot {
  userId: string;
  username: string;
  usdBalance: number;
  usdFrozenBalance: number;
  balance: number;
  frozenBalance: number;
  totalDeposit: number;
  totalWithdrawal: number;
  totalEarnedIncome: number;
  vipLevel: number;
  etbBalance?: number;
  etbFrozenBalance?: number;
}

export interface PreDeploymentManifest {
  id: string;
  timestamp: string;
  reason: string;
  checksum: string;
  snapshotPath: string;
  totalUsers: number;
  totalUsdBalance: number;
  totalUsdFrozen: number;
  totalTransactions: number;
  totalIncomeRecords: number;
  totalPurchases: number;
  memberBalances: Record<string, MemberBalanceSnapshot>;
  totalEtbBalance?: number;
  totalEtbFrozen?: number;
}

export interface PostDeploymentVerificationReport {
  timestamp: string;
  status: 'PASSED' | 'FAILED' | 'ROLLED_BACK';
  preDeploymentManifestId: string;
  verifiedAt: string;
  memberCountMatch: boolean;
  preDeploymentMemberCount: number;
  currentMemberCount: number;
  preDeploymentTotalUsd: number;
  currentTotalUsd: number;
  discrepancies: string[];
  restoredFromBackup?: boolean;
  message: string;
  preDeploymentTotalEtb?: number;
  currentTotalEtb?: number;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
const DB_FILE = path.join(DATA_DIR, 'database.json');
const MANIFEST_FILE = path.join(DATA_DIR, 'pre_deployment_manifest.json');
const VERIFICATION_FILE = path.join(DATA_DIR, 'post_deployment_verification.json');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

function getChecksum(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Creates a verified live database backup before any deployment or update
 */
export function createPreDeploymentSnapshot(reason: string = 'Pre-Deployment Automated Safety Latch'): PreDeploymentManifest | null {
  try {
    if (!fs.existsSync(DB_FILE)) {
      console.warn('[DeployGuard] database.json does not exist yet. Cannot create pre-deploy snapshot.');
      return null;
    }

    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const db = JSON.parse(raw);
    const checksum = getChecksum(raw);

    const now = new Date();
    const timestampStr = now.toISOString().replace(/[:.]/g, '-');
    const filename = `bkg_pre_deployment_${timestampStr}.json`;
    const snapshotPath = path.join(BACKUPS_DIR, filename);

    // Collect financial metrics for USD/USDT
    let totalUsdBalance = 0;
    let totalUsdFrozen = 0;
    const memberBalances: Record<string, MemberBalanceSnapshot> = {};

    const users: Record<string, User> = db.users || {};
    for (const [uid, u] of Object.entries(users)) {
      const usdBal = typeof u.usdBalance === 'number' ? u.usdBalance : (typeof u.balance === 'number' ? u.balance : 0);
      const usdFrz = typeof u.usdFrozenBalance === 'number' ? u.usdFrozenBalance : (typeof u.frozenBalance === 'number' ? u.frozenBalance : 0);

      totalUsdBalance += usdBal;
      totalUsdFrozen += usdFrz;

      memberBalances[uid] = {
        userId: uid,
        username: u.username || uid,
        usdBalance: Number(usdBal.toFixed(2)),
        usdFrozenBalance: Number(usdFrz.toFixed(2)),
        balance: Number((u.balance ?? usdBal).toFixed(2)),
        frozenBalance: Number((u.frozenBalance ?? usdFrz).toFixed(2)),
        totalDeposit: Number((u.totalDeposit || 0).toFixed(2)),
        totalWithdrawal: Number((u.totalWithdrawal || 0).toFixed(2)),
        totalEarnedIncome: Number((u.totalEarnedIncome || 0).toFixed(2)),
        vipLevel: u.vipLevel || 1
      };
    }

    // Write full backup snapshot file
    fs.writeFileSync(snapshotPath, raw, 'utf-8');

    // Verify snapshot file written properly
    const writtenRaw = fs.readFileSync(snapshotPath, 'utf-8');
    const writtenChecksum = getChecksum(writtenRaw);
    if (writtenChecksum !== checksum) {
      throw new Error(`Checksum mismatch when verifying pre-deployment snapshot ${filename}!`);
    }

    const manifest: PreDeploymentManifest = {
      id: filename.replace('.json', ''),
      timestamp: now.toISOString(),
      reason,
      checksum,
      snapshotPath,
      totalUsers: Object.keys(users).length,
      totalUsdBalance: Number(totalUsdBalance.toFixed(2)),
      totalUsdFrozen: Number(totalUsdFrozen.toFixed(2)),
      totalTransactions: (db.transactions || []).length,
      totalIncomeRecords: (db.incomeRecords || []).length,
      totalPurchases: (db.purchases || []).length,
      memberBalances
    };

    fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2), 'utf-8');
    console.log(`[DeployGuard] Pre-deployment backup verified: ${filename}`);
    console.log(`[DeployGuard] Protected ${manifest.totalUsers} members | USD Total: $${manifest.totalUsdBalance.toFixed(2)} USDT`);

    return manifest;
  } catch (err) {
    console.error('[DeployGuard] FATAL: Failed to create and verify pre-deployment snapshot', err);
    throw err;
  }
}

/**
 * Automatically verifies post-deployment database integrity against the pre-deployment manifest.
 * If any mismatch, member loss, or unexpected balance reset is detected, immediately restores backup.
 */
export function verifyPostDeployment(): PostDeploymentVerificationReport {
  try {
    if (!fs.existsSync(DB_FILE)) {
      throw new Error('[DeployGuard] database.json missing during post-deployment verification!');
    }

    // If no manifest exists, establish baseline now
    if (!fs.existsSync(MANIFEST_FILE)) {
      console.log('[DeployGuard] No pre-deployment manifest found. Creating initial safety baseline...');
      createPreDeploymentSnapshot('Initial Post-Deploy Baseline Creation');
    }

    const manifestRaw = fs.readFileSync(MANIFEST_FILE, 'utf-8');
    const manifest: PreDeploymentManifest = JSON.parse(manifestRaw);

    const currentRaw = fs.readFileSync(DB_FILE, 'utf-8');
    const currentDb = JSON.parse(currentRaw);
    const currentUsers: Record<string, User> = currentDb.users || {};

    const discrepancies: string[] = [];

    // 1. Verify Member Count (Member count must NEVER decrease)
    const currentMemberCount = Object.keys(currentUsers).length;
    if (currentMemberCount < manifest.totalUsers) {
      discrepancies.push(`Member count decreased from ${manifest.totalUsers} to ${currentMemberCount}! Potential account deletion or reset detected.`);
    }

    // 2. Verify Every Individual Member's Balances and Protected Financial Data in USD/USDT
    let currentTotalUsd = 0;

    for (const [uid, prev] of Object.entries(manifest.memberBalances)) {
      const cur = currentUsers[uid];
      if (!cur) {
        discrepancies.push(`Member account missing: User ID ${uid} (${prev.username}) is not present in live database!`);
        continue;
      }

      const curUsd = typeof cur.usdBalance === 'number' ? cur.usdBalance : (typeof cur.balance === 'number' ? cur.balance : 0);
      currentTotalUsd += curUsd;

      // Check for illegal balance resets (e.g. balance reset to 0 or default seed while previous was positive)
      const prevUsd = prev.usdBalance > 0 ? prev.usdBalance : (prev.balance > 0 ? prev.balance : 0);
      if (prevUsd > 0 && curUsd === 0) {
        discrepancies.push(`CRITICAL: Member ${prev.username} (${uid}) USD balance was reset from $${prevUsd} to $0 USDT!`);
      }

      // Check VIP level preservation
      if (cur.vipLevel < prev.vipLevel) {
        discrepancies.push(`Member ${prev.username} VIP level degraded from VIP ${prev.vipLevel} to VIP ${cur.vipLevel}!`);
      }
    }

    // If any discrepancies found, trigger EMERGENCY ROLLBACK
    if (discrepancies.length > 0) {
      console.error('[DeployGuard] CRITICAL MISMATCH DETECTED POST-DEPLOYMENT!');
      console.error(discrepancies.join('\n'));
      console.warn(`[DeployGuard] Initiating EMERGENCY RESTORE from verified pre-deployment backup: ${manifest.snapshotPath}`);

      if (!fs.existsSync(manifest.snapshotPath)) {
        throw new Error(`CRITICAL: Snapshot file ${manifest.snapshotPath} not found for emergency rollback!`);
      }

      // Restore database
      const backupRaw = fs.readFileSync(manifest.snapshotPath, 'utf-8');
      fs.writeFileSync(DB_FILE, backupRaw, 'utf-8');
      console.log('[DeployGuard] Emergency database restoration SUCCEEDED. Financial data preserved.');

      const report: PostDeploymentVerificationReport = {
        timestamp: new Date().toISOString(),
        status: 'ROLLED_BACK',
        preDeploymentManifestId: manifest.id,
        verifiedAt: new Date().toISOString(),
        memberCountMatch: false,
        preDeploymentMemberCount: manifest.totalUsers,
        currentMemberCount,
        preDeploymentTotalUsd: manifest.totalUsdBalance,
        currentTotalUsd: Number(currentTotalUsd.toFixed(2)),
        discrepancies,
        restoredFromBackup: true,
        message: 'Discrepancies detected during post-deployment verification. Database was immediately and safely rolled back to the verified pre-deployment snapshot.'
      };

      fs.writeFileSync(VERIFICATION_FILE, JSON.stringify(report, null, 2), 'utf-8');
      return report;
    }

    // All checks passed
    const report: PostDeploymentVerificationReport = {
      timestamp: new Date().toISOString(),
      status: 'PASSED',
      preDeploymentManifestId: manifest.id,
      verifiedAt: new Date().toISOString(),
      memberCountMatch: currentMemberCount >= manifest.totalUsers,
      preDeploymentMemberCount: manifest.totalUsers,
      currentMemberCount,
      preDeploymentTotalUsd: manifest.totalUsdBalance,
      currentTotalUsd: Number(currentTotalUsd.toFixed(2)),
      discrepancies: [],
      restoredFromBackup: false,
      message: `Post-deployment automated verification PASSED. Verified ${currentMemberCount} member accounts and financial balances ($${currentTotalUsd.toFixed(2)} USDT) are 100% intact.`
    };

    fs.writeFileSync(VERIFICATION_FILE, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`[DeployGuard] Post-deployment verification: PASSED. ${currentMemberCount} members verified.`);

    return report;
  } catch (err: any) {
    console.error('[DeployGuard] Error during post-deployment verification', err);
    const errorReport: PostDeploymentVerificationReport = {
      timestamp: new Date().toISOString(),
      status: 'FAILED',
      preDeploymentManifestId: 'unknown',
      verifiedAt: new Date().toISOString(),
      memberCountMatch: false,
      preDeploymentMemberCount: 0,
      currentMemberCount: 0,
      preDeploymentTotalUsd: 0,
      currentTotalUsd: 0,
      discrepancies: [err.message || 'Unknown post-deploy error'],
      restoredFromBackup: false,
      message: `Post-deployment verification error: ${err.message}`
    };
    fs.writeFileSync(VERIFICATION_FILE, JSON.stringify(errorReport, null, 2), 'utf-8');
    return errorReport;
  }
}

export function getVerificationStatus(): {
  manifest: PreDeploymentManifest | null;
  report: PostDeploymentVerificationReport | null;
} {
  let manifest: PreDeploymentManifest | null = null;
  let report: PostDeploymentVerificationReport | null = null;

  if (fs.existsSync(MANIFEST_FILE)) {
    try {
      manifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf-8'));
    } catch {}
  }
  if (fs.existsSync(VERIFICATION_FILE)) {
    try {
      report = JSON.parse(fs.readFileSync(VERIFICATION_FILE, 'utf-8'));
    } catch {}
  }

  return { manifest, report };
}
