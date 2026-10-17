/** Reminder interval for optional auto-backup (7 days). */
export const AUTO_BACKUP_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

export function shouldPromptAutoBackup(
  enabled: boolean,
  lastBackupAt: number | null,
  now: number = Date.now()
): boolean {
  if (!enabled) {
    return false;
  }
  if (lastBackupAt == null || !isFinite(lastBackupAt)) {
    return true;
  }
  return now - lastBackupAt >= AUTO_BACKUP_INTERVAL_MS;
}
