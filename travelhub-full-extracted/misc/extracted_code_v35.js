// ... existing imports
const { startCommissionApprovalJob } = require('./jobs/approveCommissions');

// ... existing code

// Запустить cron jobs
if (process.env.NODE_ENV === 'production') {
  startCommissionApprovalJob();
}
