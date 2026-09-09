import { createPreDeploymentSnapshot, verifyPostDeployment } from '../src/server/deployGuard';

const command = process.argv[2];

if (command === 'pre-deploy') {
  console.log('[DeployGuard CLI] Executing Pre-Deployment Backup and Verification...');
  const manifest = createPreDeploymentSnapshot('Automated Pre-Deployment Live Financial Backup');
  if (!manifest) {
    console.error('[DeployGuard CLI] Pre-deployment backup failed!');
    process.exit(1);
  }
  console.log('[DeployGuard CLI] Pre-deployment backup verified and manifest sealed.');
  process.exit(0);
} else if (command === 'post-deploy') {
  console.log('[DeployGuard CLI] Executing Post-Deployment Database Integrity Verification...');
  const report = verifyPostDeployment();
  if (report.status === 'FAILED') {
    console.error('[DeployGuard CLI] Post-deployment verification failed!', report.discrepancies);
    process.exit(1);
  }
  if (report.status === 'ROLLED_BACK') {
    console.warn('[DeployGuard CLI] Post-deployment verification triggered automated rollback to verified backup!');
  } else {
    console.log('[DeployGuard CLI] Post-deployment verification SUCCESSFUL.');
  }
  process.exit(0);
} else {
  console.log('Usage: tsx scripts/deploy-guard.ts [pre-deploy|post-deploy]');
  process.exit(0);
}
