export type AssetType = 
  | '22_ayar' 
  | '24_ayar' 
  | 'ceyrek' 
  | 'tam' 
  | 'usd' 
  | 'eur' 
  | 'tl' 
  | 'gumus';

export type CurrencyType = 'TL' | 'USD' | 'EUR' | 'ALTIN';

export interface PortfolioItem {
  id: string;
  type: AssetType;
  amount: number;
  description?: string;
  date: string;
}

export interface HistoryItem {
  type: 'add' | 'remove' | 'update';
  item: PortfolioItem;
  date: string;
  description?: string;
  previousAmount?: number;
}

export interface Prices {
  '22_ayar': number;
  '24_ayar': number;
  ceyrek: number;
  tam: number;
  usd: number;
  eur: number;
  tl: number;
  gumus: number;
}

export interface PortfolioState {
  items: PortfolioItem[];
  prices: Prices;
  history: HistoryItem[];
  currentLanguage: string;
}

export type RootStackParamList = {
  Home: undefined;
  Portfolio: undefined;
  History: undefined;
  Settings: undefined;
};
