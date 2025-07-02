// 🔷 Tipos e Interfaces para Gomanage API

export interface Customer {
  id: string;
  gomanageId?: string;
  name: string;
  businessName: string;
  vatNumber?: string;
  email: string;
  phone?: string;
  city?: string;
  province?: string;
  syncStatus: 'synced' | 'pending' | 'error' | 'never';
  lastSync?: string;
  totalOrders?: number;
  totalAmount?: number;
}

export interface Product {
  id: string;
  gomanageId?: string;
  productId: string;
  brandName: string;
  reference: string;
  descriptionShort: string;
  basePrice: number;
  stockReal: number;
  stockReserved: number;
  category: string;
  syncStatus: 'synced' | 'pending' | 'error' | 'never';
  lastSync?: string;
}

export interface Order {
  id: string;
  gomanageId?: string;
  orderNumber: string;
  reference: string;
  date: string;
  status: 'draft' | 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  customerName: string;
  amount: number;
  totalAmount: number;
  syncStatus: 'synced' | 'pending' | 'error' | 'never';
  lastSync?: string;
}

export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  recordsSuccess: number;
  recordsError: number;
  errorMessage?: string;
  duration: string;
}

export interface GomanageConnection {
  isConnected: boolean;
  proxyUrl: string;
  lastPing: Date | null;
  sessionId: string | null;
}

export interface LoginResult {
  success: boolean;
  sessionId?: string;
  message: string;
}

export interface ConnectionResult {
  connected: boolean;
  message: string;
  url: string;
}