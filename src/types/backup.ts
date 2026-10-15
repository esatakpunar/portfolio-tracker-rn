import { HistoryItem, PortfolioItem } from './index';

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
