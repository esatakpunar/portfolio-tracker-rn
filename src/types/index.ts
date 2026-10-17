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

export interface Wallet {
  id: string;
  name: string;
  createdAt: number;
}

export interface PortfolioItem {
  id: string;
  type: AssetType;
  amount: number;
  description?: string;
  date: string;
  /** Defaults to `default` when missing (legacy data). */
  walletId?: string;
}

export type PortfolioGoalKind = 'asset_amount' | 'portfolio_value_tl';

export type PortfolioGoalMode = 'absolute' | 'increment';

export interface PortfolioGoal {
  kind: PortfolioGoalKind;
  target: number;
  assetType?: AssetType;
  /** `increment`: progress = growth since baseline; `absolute`: progress toward total target */
  mode?: PortfolioGoalMode;
  /** Snapshot at goal creation when mode is `increment` */
  baseline?: number;
}

/** Per-wallet goals persisted in app settings */
export type PortfolioGoalsByWallet = Record<string, PortfolioGoal>;

/** Optional fields when adding or increasing holdings */
export interface LotEntryOptions {
  transactionDate?: string;
  unitBuyPrice?: number | null;
  priceAtTime?: number | null;
  useExplicitTotalCost?: boolean;
}

export interface HistoryItem {
  id: string;
  type: 'add' | 'remove' | 'update';
  item: PortfolioItem;
  date: string;
  description?: string;
  previousAmount?: number;
  priceAtTime?: number | null; // Price of the asset at the time of transaction (in TL)
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

export interface BuyPrices {
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
  Markets: undefined;
  AppSettings: undefined;
};
