export interface User {
  id: number;
  username: string;
  created_at: string;
  last_login?: string;
}

export interface ExchangeRate {
  id: number;
  currency: string;
  buy_rate: number;
  sell_rate: number;
  updated_at: string;
  updated_by?: number;
}

export interface RateHistory {
  id: number;
  currency: string;
  buy_rate: number;
  sell_rate: number;
  changed_at: string;
  changed_by?: number;
}

export interface Transaction {
  id: number;
  serial_key: string;
  transaction_type: 'BUY' | 'SELL' | 'SELL_MKD' | 'MULTI';
  transaction_date: string;
  user_id?: number;
  total_mkd: number;
  details?: TransactionDetail[];
}

export interface TransactionDetail {
  id: number;
  transaction_id: number;
  currency: string;
  amount: number;
  rate: number;
  mkd_equivalent: number;
}

export interface AppSettings {
  officeName: string;
  address: string;
  phone: string;
}