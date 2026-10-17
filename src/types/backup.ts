import { HistoryItem, PortfolioItem, Wallet } from './index';

export interface PortfolioBackupV1 {
  format: 'portfolio-tracker-backup';
  version: 1;
  exportedAt: string;
  appVersion: string;
  data: {
    items: PortfolioItem[];
    history: HistoryItem[];
  };
}

export interface PortfolioBackupV2 {
  format: 'portfolio-tracker-backup';
  version: 2;
  exportedAt: string;
  appVersion: string;
  data: {
    items: PortfolioItem[];
    history: HistoryItem[];
    wallets: Wallet[];
    activeWalletId?: string;
  };
}

export type PortfolioBackup = PortfolioBackupV1 | PortfolioBackupV2;
