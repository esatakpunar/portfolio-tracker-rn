import { HistoryItem } from '../types';

export function createHistoryId(): string {
  return `hist-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function ensureHistoryIds(history: HistoryItem[]): HistoryItem[] {
  return history.map((entry, index) => ({
    ...entry,
    id: entry.id || `hist-legacy-${index}-${entry.date}`,
  }));
}
