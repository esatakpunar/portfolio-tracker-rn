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
  '22_ayar': number | null;
  '24_ayar': number | null;
  ceyrek: number | null;
  tam: number | null;
  usd: number | null;
  eur: number | null;
  tl: number | null;
  gumus: number | null;
}

export interface PriceChanges {
  '22_ayar': number | null;
  '24_ayar': number | null;
  ceyrek: number | null;
  tam: number | null;
  usd: number | null;
  eur: number | null;
  tl: number | null;
  gumus: number | null;
}

export interface PortfolioState {
  items: PortfolioItem[];
  prices: Prices;
  priceChanges: PriceChanges;
  history: HistoryItem[];
  currentLanguage: string;
}

export type RootStackParamList = {
  Home: undefined;
  Portfolio: undefined;
  History: undefined;
  Settings: undefined;
};
